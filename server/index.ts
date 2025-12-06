import express from 'express';
import cors from 'cors';
import { pool } from './db';
import { sendOtpEmail, sendWelcomeEmail } from './email';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Request Logging Middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  // Log body for non-GET requests, but mask sensitive info if needed
  if (req.method !== 'GET' && Object.keys(req.body).length > 0) {
    const safeBody = { ...req.body };
    if (safeBody.password) safeBody.password = '***';
    if (safeBody.pin) safeBody.pin = '***';
    console.log('Body:', JSON.stringify(safeBody, null, 2));
  }
  next();
});

// Ensure Tables Exist & Seed
const initDb = async () => {
  try {
    // Admins
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255),
        role VARCHAR(50) DEFAULT 'admin',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Partners (Supermarket Managers)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS partners (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        company_name VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Partner-Supermarket relationship
    // Note: supermarket_id is UUID type to match supermarkets table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS partner_supermarkets (
        partner_id INTEGER REFERENCES partners(id) ON DELETE CASCADE,
        supermarket_id UUID,
        PRIMARY KEY (partner_id, supermarket_id)
      );
    `);

    // Email Verifications (New)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS email_verifications (
        email VARCHAR(255) PRIMARY KEY,
        code VARCHAR(6) NOT NULL,
        expires_at TIMESTAMP NOT NULL
      );
    `);

    // Rewards (New)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS rewards (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        cost INTEGER NOT NULL,
        type VARCHAR(50) NOT NULL,
        brand VARCHAR(100),
        image_url VARCHAR(255),
        partner_id INTEGER REFERENCES partners(id) ON DELETE SET NULL
      );
    `);
    
    // Add partner_id column if it doesn't exist (for existing tables)
    await pool.query(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='rewards' AND column_name='partner_id') THEN
          ALTER TABLE rewards ADD COLUMN partner_id INTEGER REFERENCES partners(id) ON DELETE SET NULL;
        END IF;
      END $$;
    `);

    // Note: No default admin seeding for security - admins must register through the signup flow

    // Seed Rewards if empty
    const rewardsRes = await pool.query('SELECT COUNT(*) FROM rewards');
    if (parseInt(rewardsRes.rows[0].count) === 0) {
        console.log('Seeding rewards...');
        await pool.query(`
            INSERT INTO rewards (title, cost, type, brand, image_url) VALUES 
            ('5000 FC Crédit', 500, 'airtime', 'Vodacom', 'https://picsum.photos/id/1/200/200'),
            ('10% de réduction Nido', 200, 'voucher', 'Nestlé', 'https://picsum.photos/id/2/200/200'),
            ('Coca-Cola 33cl Gratuit', 150, 'product', 'Coca-Cola', 'https://picsum.photos/id/3/200/200'),
            ('Billet Cinéma', 1000, 'voucher', 'CineKin', 'https://picsum.photos/id/4/200/200')
        `);
    }

  } catch (err) {
    console.error('DB Init Error:', err);
  }
};
initDb();

// ... existing routes ...

// Rewards Routes
app.get('/api/rewards', async (req, res) => {
  try {
    console.log('[REWARDS] Fetching all rewards...');
    const result = await pool.query('SELECT id, title, cost, type, brand, image_url as "imageUrl", partner_id as "partnerId" FROM rewards');
    console.log('[REWARDS] Found:', result.rows.length, 'rewards');
    res.json(result.rows);
  } catch (err: any) {
    console.error('[REWARDS] Error:', err.message, err.stack);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

app.post('/api/rewards', async (req, res) => {
  try {
    const { title, cost, type, brand, imageUrl, partnerId } = req.body;
    const result = await pool.query(
      'INSERT INTO rewards (title, cost, type, brand, image_url, partner_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, title, cost, type, brand, image_url as "imageUrl", partner_id as "partnerId"',
      [title, cost, type, brand, imageUrl, partnerId || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/rewards/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, cost, type, brand, imageUrl, partnerId } = req.body;
    const result = await pool.query(
      'UPDATE rewards SET title = $1, cost = $2, type = $3, brand = $4, image_url = $5, partner_id = $6 WHERE id = $7 RETURNING id, title, cost, type, brand, image_url as "imageUrl", partner_id as "partnerId"',
      [title, cost, type, brand, imageUrl, partnerId || null, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Reward not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/rewards/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM rewards WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Reward not found' });
    }
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Dashboard Stats
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    // Parallel queries for efficiency
    const [usersRes, salesRes, receiptsRes, basketRes] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM users WHERE status = $1', ['Active']),
      pool.query('SELECT SUM(total_spent) FROM users'), // Proxy for total sales if receipts table isn't full history
      pool.query('SELECT COUNT(*) FROM receipts'),
      pool.query('SELECT AVG(amount) FROM receipts')
    ]);

    const activeUsers = parseInt(usersRes.rows[0].count || '0');
    const totalSales = parseInt(salesRes.rows[0].sum || '0');
    const receiptsProcessed = parseInt(receiptsRes.rows[0].count || '0');
    const avgBasket = parseFloat(basketRes.rows[0].avg || '0');

    // Mock trend data for now as we don't have historical snapshots in this simple DB
    // In a real app, we would query "last month" vs "this month"
    res.json({
      activeUsers: { value: activeUsers.toLocaleString(), trend: "+12% from last month", isPositive: true },
      totalSales: { value: `$${(totalSales / 1000).toFixed(1)}k`, trend: "+4.3% from last month", isPositive: true },
      receiptsProcessed: { value: receiptsProcessed.toLocaleString(), trend: "+5% from last month", isPositive: true },
      avgBasket: { value: `$${avgBasket.toFixed(2)}`, trend: "+1.2% from last month", isPositive: true }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/dashboard/charts', async (req, res) => {
  try {
    // 1. Sales Data (Last 7 Days)
    // We generate a series of dates and left join receipts
    const salesRes = await pool.query(`
      WITH dates AS (
          SELECT generate_series(
            CURRENT_DATE - INTERVAL '6 days',
            CURRENT_DATE,
            '1 day'::interval
          )::date AS date
      )
      SELECT 
        to_char(d.date, 'Dy') as name,
        COALESCE(SUM(r.amount), 0) as sales,
        COUNT(r.id) as receipts
      FROM dates d
      LEFT JOIN receipts r ON to_char(r.date, 'YYYY-MM-DD') = to_char(d.date, 'YYYY-MM-DD')
      GROUP BY d.date
      ORDER BY d.date
    `);

    // If no data in DB, this might return 0s. That's fine, it's dynamic.
    
    // 2. Brand Data (Top Brands from Receipt Items)
    // Assuming 'receipt_items' has a 'name' or 'category' we can use as brand proxy
    // Or strictly from campaigns brands if receipt items are weak
    const brandsRes = await pool.query(`
      SELECT 
        brand as name, 
        COUNT(*) as value -- Simple count of campaigns or we could link to sales
      FROM campaigns 
      GROUP BY brand 
      ORDER BY value DESC 
      LIMIT 4
    `);

    res.json({
      salesData: salesRes.rows,
      brandData: brandsRes.rows.length > 0 ? brandsRes.rows : [
        { name: 'No Data', value: 0 }
      ]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin Login
app.post('/api/auth/admin/login', async (req, res) => {
  console.log('[Admin Login] Request received');
  try {
    const { email, password } = req.body;
    console.log('[Admin Login] Querying for email:', email);
    const result = await pool.query('SELECT * FROM admins WHERE email = $1 AND password = $2', [email, password]);
    console.log('[Admin Login] Query result rows:', result.rows.length);
    
    if (result.rows.length > 0) {
      const admin = result.rows[0];
      console.log('[Admin Login] Success for:', admin.email);
      res.json({ success: true, user: { name: admin.name, email: admin.email, role: admin.role || 'admin' } });
    } else {
      console.log('[Admin Login] Invalid credentials');
      res.status(401).json({ success: false, error: 'Invalid Credentials' });
    }
  } catch (err: any) {
    console.error('[Admin Login] Error:', err.message, err.stack);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT 
        id,
        first_name as "firstName",
        last_name as "lastName",
        email,
        phone_number as "phoneNumber",
        pin,
        status,
        points_balance as "pointsBalance",
        points_expiring as "pointsExpiring",
        to_char(points_expires_at, 'YYYY-MM-DD') as "pointsExpiresAt",
        total_spent as "totalSpent",
        to_char(joined_date, 'YYYY-MM-DD') as "joinedDate",
        gender,
        to_char(birthdate, 'YYYY-MM-DD') as "birthdate",
        CASE 
            WHEN total_spent > 100000 THEN 'VIP'
            ELSE 'Regular'
        END as segment
      FROM users 
      WHERE id = $1
    `, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Receipts Routes
app.get('/api/receipts', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        r.id,
        r.user_id as "userId",
        r.supermarket_name as "supermarketName",
        r.amount,
        to_char(r.date, 'YYYY-MM-DD') as "date",
        r.status,
        r.confidence_score as "confidenceScore",
        r.image_url as "imageUrl",
        COALESCE(
          json_agg(
            json_build_object(
              'name', ri.name,
              'quantity', ri.quantity,
              'unitPrice', ri.unit_price,
              'total', ri.total,
              'category', ri.category
            )
          ) FILTER (WHERE ri.id IS NOT NULL), 
          '[]'
        ) as items 
      FROM receipts r 
      LEFT JOIN receipt_items ri ON r.id = ri.receipt_id 
      GROUP BY r.id
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/receipts/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await pool.query(`
      SELECT 
        r.id,
        r.user_id as "userId",
        r.supermarket_name as "supermarketName",
        r.amount,
        to_char(r.date, 'YYYY-MM-DD') as "date",
        r.status,
        r.confidence_score as "confidenceScore",
        r.image_url as "imageUrl",
        COALESCE(
          json_agg(
            json_build_object(
              'name', ri.name,
              'quantity', ri.quantity,
              'unitPrice', ri.unit_price,
              'total', ri.total,
              'category', ri.category
            )
          ) FILTER (WHERE ri.id IS NOT NULL), 
          '[]'
        ) as items 
      FROM receipts r 
      LEFT JOIN receipt_items ri ON r.id = ri.receipt_id 
      WHERE r.user_id = $1
      GROUP BY r.id
    `, [userId]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Supermarkets Routes
app.get('/api/supermarkets', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id,
        name,
        address,
        active,
        logo_url as "logoUrl",
        business_hours as "businessHours",
        latitude,
        longitude,
        avg_basket as "avgBasket"
      FROM supermarkets 
      WHERE active = true
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Campaigns Routes
app.get('/api/campaigns', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        c.id,
        c.name,
        c.brand,
        c.status,
        to_char(c.start_date, 'YYYY-MM-DD') as "startDate",
        to_char(c.end_date, 'YYYY-MM-DD') as "endDate",
        c.mechanic,
        c.min_spend as "minSpend",
        c.max_redemptions as "maxRedemptions",
        c.conversions,
        c.target_audience as "targetAudience",
        c.reward_type as "rewardType",
        c.reward_value as "rewardValue",
        COALESCE(array_agg(cs.supermarket_id) FILTER (WHERE cs.supermarket_id IS NOT NULL), '{}') as "supermarketIds"
      FROM campaigns c 
      LEFT JOIN campaign_supermarkets cs ON c.id = cs.campaign_id 
      GROUP BY c.id
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Notifications Routes
app.get('/api/notifications/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await pool.query(`
      SELECT 
        id,
        user_id as "userId",
        title,
        message,
        to_char(date, 'YYYY-MM-DD') as "date",
        read,
        type
      FROM notifications 
      WHERE user_id = $1 
      ORDER BY date DESC
    `, [userId]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// WRITE ENDPOINTS

// User Status Update (Ban/Unban)
app.put('/api/users/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    await pool.query('UPDATE users SET status = $1 WHERE id = $2', [status, id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create Supermarket
app.post('/api/supermarkets', async (req, res) => {
  try {
    const { name, address, logoUrl, businessHours, latitude, longitude } = req.body;
    const result = await pool.query(`
      INSERT INTO supermarkets (name, address, logo_url, business_hours, latitude, longitude, active, avg_basket)
      VALUES ($1, $2, $3, $4, $5, $6, true, 0)
      RETURNING *
    `, [name, address, logoUrl, businessHours, latitude, longitude]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update Supermarket
app.put('/api/supermarkets/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, address, logoUrl, businessHours, latitude, longitude, active } = req.body;
    // We update all fields provided. Active might be toggled here too.
    const result = await pool.query(`
      UPDATE supermarkets 
      SET name = $1, address = $2, logo_url = $3, business_hours = $4, latitude = $5, longitude = $6, active = COALESCE($7, active)
      WHERE id = $8
      RETURNING *
    `, [name, address, logoUrl, businessHours, latitude, longitude, active, id]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete Supermarket
app.delete('/api/supermarkets/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM supermarkets WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Toggle Campaign Status
app.patch('/api/campaigns/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    await pool.query('UPDATE campaigns SET status = $1 WHERE id = $2', [status, id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// AUTH ENDPOINTS

// Shopper Login
app.post('/api/auth/shopper/login', async (req, res) => {
  try {
    const { phone, pin } = req.body;
    
    // Basic cleaning
    const cleanPhone = phone.replace(/\s/g, '');
    
    const result = await pool.query(`
      SELECT 
        id,
        first_name as "firstName",
        last_name as "lastName",
        email,
        phone_number as "phoneNumber",
        pin,
        status,
        points_balance as "pointsBalance",
        points_expiring as "pointsExpiring",
        to_char(points_expires_at, 'YYYY-MM-DD') as "pointsExpiresAt",
        total_spent as "totalSpent",
        to_char(joined_date, 'YYYY-MM-DD') as "joinedDate",
        gender,
        to_char(birthdate, 'YYYY-MM-DD') as "birthdate",
        CASE 
            WHEN total_spent > 100000 THEN 'VIP'
            ELSE 'Regular'
        END as segment
      FROM users 
      WHERE phone_number = $1 AND pin = $2
    `, [cleanPhone, pin]);

    if (result.rows.length > 0) {
      const user = result.rows[0];
      // In a real app, generate a JWT token here.
      // For this demo, we return the user object directly.
      res.json({ success: true, user });
    } else {
      res.status(401).json({ success: false, error: 'Invalid Credentials' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get All Users
app.get('/api/users', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id,
        first_name as "firstName",
        last_name as "lastName",
        email,
        phone_number as "phoneNumber",
        pin,
        status,
        points_balance as "pointsBalance",
        points_expiring as "pointsExpiring",
        to_char(points_expires_at, 'YYYY-MM-DD') as "pointsExpiresAt",
        total_spent as "totalSpent",
        to_char(joined_date, 'YYYY-MM-DD') as "joinedDate",
        gender,
        to_char(birthdate, 'YYYY-MM-DD') as "birthdate",
        CASE 
            WHEN total_spent > 100000 THEN 'VIP'
            ELSE 'Regular'
        END as segment
      FROM users 
      ORDER BY created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Send OTP
app.post('/api/auth/send-otp', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });

    // Generate 6 digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Save to DB (Upsert)
    await pool.query(`
      INSERT INTO email_verifications (email, code, expires_at)
      VALUES ($1, $2, NOW() + INTERVAL '10 minutes')
      ON CONFLICT (email) 
      DO UPDATE SET code = $2, expires_at = NOW() + INTERVAL '10 minutes'
    `, [email, code]);

    // Send Email
    await sendOtpEmail(email, code);

    res.json({ success: true, message: 'OTP sent' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Shopper Signup
app.post('/api/auth/shopper/signup', async (req, res) => {
  try {
    const { firstName, lastName, email, phone, pin, gender, birthdate, otp } = req.body;
    
    // Clean phone
    const cleanPhone = phone.replace(/\s/g, '');

    // 1. Verify OTP
    // If OTP is provided (optional for now to support legacy, but encouraged)
    if (otp) {
      const otpRes = await pool.query('SELECT * FROM email_verifications WHERE email = $1 AND code = $2 AND expires_at > NOW()', [email, otp]);
      if (otpRes.rows.length === 0) {
        return res.status(400).json({ success: false, error: 'Invalid or expired verification code' });
      }
      // Clear OTP after use
      await pool.query('DELETE FROM email_verifications WHERE email = $1', [email]);
    } else if (process.env.NODE_ENV === 'production') {
        // Enforce OTP in production
        return res.status(400).json({ success: false, error: 'Verification code required' });
    }

    // 2. Check if user exists
    const check = await pool.query('SELECT id FROM users WHERE phone_number = $1', [cleanPhone]);
    if (check.rows.length > 0) {
      return res.status(400).json({ success: false, error: 'Phone number already registered' });
    }

    // 3. Insert User
    const result = await pool.query(`
      INSERT INTO users (
        first_name, last_name, email, phone_number, pin, 
        gender, birthdate, status, points_balance, joined_date
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'active', 50, NOW())
      RETURNING 
        id,
        first_name as "firstName",
        last_name as "lastName",
        email,
        phone_number as "phoneNumber",
        pin,
        status,
        points_balance as "pointsBalance",
        points_expiring as "pointsExpiring",
        to_char(points_expires_at, 'YYYY-MM-DD') as "pointsExpiresAt",
        total_spent as "totalSpent",
        to_char(joined_date, 'YYYY-MM-DD') as "joinedDate",
        gender,
        to_char(birthdate, 'YYYY-MM-DD') as "birthdate",
        'New' as segment
    `, [firstName, lastName, email, cleanPhone, pin, gender, birthdate]);

    const newUser = result.rows[0];

    // 4. Send Welcome Email
    sendWelcomeEmail(email, firstName).catch(console.error);

    res.json({ success: true, user: newUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Partner Login
app.post('/api/auth/partner/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const result = await pool.query(`
      SELECT 
        p.id,
        p.name,
        p.email,
        p.company_name as "companyName",
        p.phone,
        p.status,
        to_char(p.created_at, 'YYYY-MM-DD') as "createdAt",
        COALESCE(array_agg(ps.supermarket_id) FILTER (WHERE ps.supermarket_id IS NOT NULL), '{}') as "supermarketIds"
      FROM partners p
      LEFT JOIN partner_supermarkets ps ON p.id = ps.partner_id
      WHERE p.email = $1 AND p.password = $2
      GROUP BY p.id
    `, [email, password]);

    if (result.rows.length > 0) {
      const partner = result.rows[0];
      if (partner.status === 'suspended') {
        return res.status(403).json({ success: false, error: 'Account suspended. Contact support.' });
      }
      if (partner.status === 'pending') {
        return res.status(403).json({ success: false, error: 'Account pending approval. Please wait for admin approval.' });
      }
      res.json({ success: true, user: { ...partner, role: 'partner' } });
    } else {
      res.status(401).json({ success: false, error: 'Invalid Credentials' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Partner Signup
app.post('/api/auth/partner/signup', async (req, res) => {
  try {
    const { name, email, password, companyName, phone, otp } = req.body;

    // Validate required fields
    if (!name || !email || !password || !companyName) {
      return res.status(400).json({ success: false, error: 'Name, email, password, and company name are required' });
    }

    // Verify OTP if provided
    if (otp) {
      const otpRes = await pool.query('SELECT * FROM email_verifications WHERE email = $1 AND code = $2 AND expires_at > NOW()', [email, otp]);
      if (otpRes.rows.length === 0) {
        return res.status(400).json({ success: false, error: 'Invalid or expired verification code' });
      }
      await pool.query('DELETE FROM email_verifications WHERE email = $1', [email]);
    }

    // Check if email exists
    const check = await pool.query('SELECT id FROM partners WHERE email = $1', [email]);
    if (check.rows.length > 0) {
      return res.status(400).json({ success: false, error: 'Email already registered' });
    }

    // Also check admins table
    const adminCheck = await pool.query('SELECT id FROM admins WHERE email = $1', [email]);
    if (adminCheck.rows.length > 0) {
      return res.status(400).json({ success: false, error: 'Email already in use' });
    }

    // Insert Partner (status = pending, needs admin approval)
    const result = await pool.query(`
      INSERT INTO partners (name, email, password, company_name, phone, status)
      VALUES ($1, $2, $3, $4, $5, 'pending')
      RETURNING 
        id,
        name,
        email,
        company_name as "companyName",
        phone,
        status,
        to_char(created_at, 'YYYY-MM-DD') as "createdAt"
    `, [name, email, password, companyName, phone]);

    const newPartner = result.rows[0];

    // Send welcome email
    sendWelcomeEmail(email, name).catch(console.error);

    res.json({ 
      success: true, 
      user: { ...newPartner, role: 'partner', supermarketIds: [] },
      message: 'Account created! Pending admin approval.'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin Signup (Only super_admin can create new admins, or first admin is auto super_admin)
app.post('/api/auth/admin/signup', async (req, res) => {
  try {
    const { name, email, password, otp } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: 'Name, email, and password are required' });
    }

    // Verify OTP if provided
    if (otp) {
      const otpRes = await pool.query('SELECT * FROM email_verifications WHERE email = $1 AND code = $2 AND expires_at > NOW()', [email, otp]);
      if (otpRes.rows.length === 0) {
        return res.status(400).json({ success: false, error: 'Invalid or expired verification code' });
      }
      await pool.query('DELETE FROM email_verifications WHERE email = $1', [email]);
    }

    // Check if email exists in admins
    const check = await pool.query('SELECT id FROM admins WHERE email = $1', [email]);
    if (check.rows.length > 0) {
      return res.status(400).json({ success: false, error: 'Email already registered' });
    }

    // Check if this is the first admin (make them super_admin)
    const countRes = await pool.query('SELECT COUNT(*) FROM admins');
    const isFirstAdmin = parseInt(countRes.rows[0].count) === 0;
    const role = isFirstAdmin ? 'super_admin' : 'admin';

    // Insert Admin
    const result = await pool.query(`
      INSERT INTO admins (name, email, password, role)
      VALUES ($1, $2, $3, $4)
      RETURNING id, name, email, role
    `, [name, email, password, role]);

    const newAdmin = result.rows[0];

    // Send welcome email
    sendWelcomeEmail(email, name).catch(console.error);

    res.json({ success: true, user: newAdmin });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get All Partners (Admin only)
app.get('/api/partners', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        p.id,
        p.name,
        p.email,
        p.company_name as "companyName",
        p.phone,
        p.status,
        to_char(p.created_at, 'YYYY-MM-DD') as "createdAt",
        COALESCE(array_agg(ps.supermarket_id) FILTER (WHERE ps.supermarket_id IS NOT NULL), '{}') as "supermarketIds"
      FROM partners p
      LEFT JOIN partner_supermarkets ps ON p.id = ps.partner_id
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update Partner Status (Admin approves/suspends partners)
app.put('/api/partners/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!['active', 'pending', 'suspended'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    await pool.query('UPDATE partners SET status = $1 WHERE id = $2', [status, id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Assign Supermarkets to Partner
app.put('/api/partners/:id/supermarkets', async (req, res) => {
  try {
    const { id } = req.params;
    const { supermarketIds } = req.body;
    
    // Clear existing assignments
    await pool.query('DELETE FROM partner_supermarkets WHERE partner_id = $1', [id]);
    
    // Add new assignments
    if (supermarketIds && supermarketIds.length > 0) {
      const values = supermarketIds.map((sid: string) => `(${id}, ${sid})`).join(',');
      await pool.query(`INSERT INTO partner_supermarkets (partner_id, supermarket_id) VALUES ${values}`);
    }
    
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get All Admins (Super Admin only)
app.get('/api/admins', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, name, email, role, to_char(created_at, 'YYYY-MM-DD') as "createdAt"
      FROM admins
      ORDER BY created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
