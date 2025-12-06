import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from 'pg';
import nodemailer from 'nodemailer';
import bcrypt from 'bcryptjs';
import { put } from '@vercel/blob';

// Database connection
const getDatabaseUrl = () => {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL environment variable is not set!');
  }
  return url;
};

const pool = new Pool({
  connectionString: getDatabaseUrl(),
  ssl: {
    rejectUnauthorized: false
  }
});

// Email transporter
let transporter: nodemailer.Transporter | null = null;

const createTransporter = async () => {
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return null;
};

const sendEmail = async (to: string, subject: string, html: string) => {
  if (!transporter) {
    transporter = await createTransporter();
  }
  if (!transporter) {
    console.log('No email transporter configured');
    return false;
  }
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || '"DRC Loyalty" <no-reply@drcloyalty.com>',
      to,
      subject,
      html,
    });
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

const sendOtpEmail = async (to: string, otp: string) => {
  const subject = 'Your Verification Code - DRC Loyalty';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Welcome to DRC Loyalty</h2>
      <p>Use the verification code below to complete your signup:</p>
      <div style="background-color: #f3f4f6; padding: 20px; text-align: center; border-radius: 10px;">
        <h1 style="font-size: 32px; letter-spacing: 5px; color: #1f2937; margin: 0;">${otp}</h1>
      </div>
      <p>This code expires in 10 minutes.</p>
    </div>
  `;
  return sendEmail(to, subject, html);
};

const sendWelcomeEmail = async (to: string, name: string) => {
  const subject = 'Welcome to DRC Loyalty!';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Welcome, ${name}!</h2>
      <p>We are thrilled to have you join the DRC Loyalty program.</p>
    </div>
  `;
  return sendEmail(to, subject, html);
};

// Initialize database tables
let dbInitialized = false;

const initDb = async () => {
  if (dbInitialized) return;
  
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

    // Partners
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
    await pool.query(`
      CREATE TABLE IF NOT EXISTS partner_supermarkets (
        partner_id INTEGER REFERENCES partners(id) ON DELETE CASCADE,
        supermarket_id UUID,
        PRIMARY KEY (partner_id, supermarket_id)
      );
    `);

    // Email Verifications
    await pool.query(`
      CREATE TABLE IF NOT EXISTS email_verifications (
        email VARCHAR(255) PRIMARY KEY,
        code VARCHAR(6) NOT NULL,
        expires_at TIMESTAMP NOT NULL
      );
    `);

    // Rewards
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

    // Users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        first_name VARCHAR(255),
        last_name VARCHAR(255),
        email VARCHAR(255),
        phone_number VARCHAR(50) UNIQUE,
        pin VARCHAR(10),
        status VARCHAR(50) DEFAULT 'active',
        points_balance INTEGER DEFAULT 0,
        points_expiring INTEGER DEFAULT 0,
        points_expires_at TIMESTAMP,
        total_spent DECIMAL DEFAULT 0,
        joined_date TIMESTAMP DEFAULT NOW(),
        gender VARCHAR(20),
        birthdate DATE,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Supermarkets table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS supermarkets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        address VARCHAR(500),
        active BOOLEAN DEFAULT true,
        logo_url VARCHAR(500),
        business_hours VARCHAR(100),
        latitude DECIMAL,
        longitude DECIMAL,
        avg_basket DECIMAL DEFAULT 0
      );
    `);

    // Receipts table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS receipts (
        id VARCHAR(50) PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        supermarket_name VARCHAR(255),
        amount DECIMAL,
        date TIMESTAMP DEFAULT NOW(),
        status VARCHAR(50) DEFAULT 'pending',
        confidence_score DECIMAL,
        image_url VARCHAR(500)
      );
    `);

    // Receipt items table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS receipt_items (
        id SERIAL PRIMARY KEY,
        receipt_id VARCHAR(50) REFERENCES receipts(id),
        name VARCHAR(255),
        quantity INTEGER,
        unit_price DECIMAL,
        total DECIMAL,
        category VARCHAR(100)
      );
    `);

    // Campaigns table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS campaigns (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        brand VARCHAR(100),
        status VARCHAR(50) DEFAULT 'draft',
        start_date DATE,
        end_date DATE,
        mechanic TEXT,
        min_spend DECIMAL,
        max_redemptions INTEGER,
        conversions INTEGER DEFAULT 0,
        target_audience VARCHAR(50),
        reward_type VARCHAR(50),
        reward_value VARCHAR(255)
      );
    `);

    // Campaign supermarkets
    await pool.query(`
      CREATE TABLE IF NOT EXISTS campaign_supermarkets (
        campaign_id INTEGER REFERENCES campaigns(id) ON DELETE CASCADE,
        supermarket_id UUID,
        PRIMARY KEY (campaign_id, supermarket_id)
      );
    `);

    // Notifications table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        title VARCHAR(255),
        message TEXT,
        date TIMESTAMP DEFAULT NOW(),
        read BOOLEAN DEFAULT false,
        type VARCHAR(50)
      );
    `);

    // Note: No default admin seeding for security - admins must register through the signup flow

    // Seed Rewards if empty
    const rewardsRes = await pool.query('SELECT COUNT(*) FROM rewards');
    if (parseInt(rewardsRes.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO rewards (title, cost, type, brand, image_url) VALUES 
        ('5000 FC Crédit', 500, 'airtime', 'Vodacom', 'https://picsum.photos/id/1/200/200'),
        ('10% de réduction Nido', 200, 'voucher', 'Nestlé', 'https://picsum.photos/id/2/200/200'),
        ('Coca-Cola 33cl Gratuit', 150, 'product', 'Coca-Cola', 'https://picsum.photos/id/3/200/200'),
        ('Billet Cinéma', 1000, 'voucher', 'CineKin', 'https://picsum.photos/id/4/200/200')
      `);
    }

    dbInitialized = true;
  } catch (err) {
    console.error('DB Init Error:', err);
  }
};

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(200).end();
  }

  // Set CORS headers for all responses
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  // Initialize DB
  await initDb();

  const { url, method, query } = req;
  
  // Get path from query parameter (set by Vercel rewrite) or extract from URL
  let path = '/';
  if (query?.path) {
    // Path comes from Vercel rewrite query parameter
    path = '/' + (Array.isArray(query.path) ? query.path.join('/') : query.path);
  } else if (url) {
    // Fallback: extract from URL
    const fullPath = url.split('?')[0] || '/';
    path = fullPath.replace(/^\/api\/index/, '').replace(/^\/api/, '') || '/';
  }
  
  console.log(`[API] ${method} ${path} (original: ${url}, query.path: ${query?.path})`);

  try {
    // ============ HEALTH CHECK ============
    if ((path === '/' || path === '') && method === 'GET') {
      return res.json({ status: 'ok', message: 'DRC Loyalty API is running', timestamp: new Date().toISOString() });
    }

    // ============ FILE UPLOAD ============
    if (path === '/upload' && method === 'POST') {
      console.log('[UPLOAD] Processing file upload...');
      
      // Get the file from the request body (base64 encoded)
      const { filename, contentType, data } = req.body;
      
      if (!filename || !data) {
        return res.status(400).json({ error: 'Filename and data are required' });
      }
      
      try {
        // Convert base64 to buffer
        const buffer = Buffer.from(data, 'base64');
        
        // Upload to Vercel Blob
        const blob = await put(`rewards/${Date.now()}-${filename}`, buffer, {
          access: 'public',
          contentType: contentType || 'image/jpeg'
        });
        
        console.log('[UPLOAD] File uploaded:', blob.url);
        return res.json({ url: blob.url });
      } catch (uploadError: any) {
        console.error('[UPLOAD] Error:', uploadError.message);
        return res.status(500).json({ error: 'Failed to upload file', details: uploadError.message });
      }
    }

    // ============ REWARDS ============
    if (path === '/rewards' && method === 'GET') {
      console.log('[REWARDS] Fetching all rewards...');
      const result = await pool.query('SELECT id, title, cost, type, brand, image_url as "imageUrl", partner_id as "partnerId" FROM rewards');
      console.log('[REWARDS] Found:', result.rows.length, 'rewards');
      return res.json(result.rows);
    }

    if (path === '/rewards' && method === 'POST') {
      console.log('[REWARDS] Creating reward with body:', JSON.stringify(req.body));
      const { title, cost, type, brand, imageUrl, partnerId } = req.body;
      
      if (!title || cost === undefined || !type) {
        console.log('[REWARDS] Missing required fields');
        return res.status(400).json({ error: 'Title, cost, and type are required' });
      }
      
      const result = await pool.query(
        'INSERT INTO rewards (title, cost, type, brand, image_url, partner_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, title, cost, type, brand, image_url as "imageUrl", partner_id as "partnerId"',
        [title, cost, type, brand || '', imageUrl || '', partnerId || null]
      );
      console.log('[REWARDS] Created reward:', result.rows[0]);
      return res.status(201).json(result.rows[0]);
    }

    if (path.match(/^\/rewards\/\d+$/) && method === 'PUT') {
      const id = path.split('/')[2];
      const { title, cost, type, brand, imageUrl, partnerId } = req.body;
      const result = await pool.query(
        'UPDATE rewards SET title = $1, cost = $2, type = $3, brand = $4, image_url = $5, partner_id = $6 WHERE id = $7 RETURNING id, title, cost, type, brand, image_url as "imageUrl", partner_id as "partnerId"',
        [title, cost, type, brand, imageUrl, partnerId || null, id]
      );
      if (result.rows.length === 0) return res.status(404).json({ error: 'Reward not found' });
      return res.json(result.rows[0]);
    }

    if (path.match(/^\/rewards\/\d+$/) && method === 'DELETE') {
      const id = path.split('/')[2];
      const result = await pool.query('DELETE FROM rewards WHERE id = $1 RETURNING id', [id]);
      if (result.rows.length === 0) return res.status(404).json({ error: 'Reward not found' });
      return res.status(204).end();
    }

    // ============ DASHBOARD ============
    if (path === '/dashboard/stats' && method === 'GET') {
      const [usersRes, salesRes, receiptsRes, basketRes] = await Promise.all([
        pool.query('SELECT COUNT(*) FROM users WHERE status = $1', ['active']),
        pool.query('SELECT COALESCE(SUM(total_spent), 0) as sum FROM users'),
        pool.query('SELECT COUNT(*) FROM receipts'),
        pool.query('SELECT COALESCE(AVG(amount), 0) as avg FROM receipts')
      ]);

      const activeUsers = parseInt(usersRes.rows[0].count || '0');
      const totalSales = parseInt(salesRes.rows[0].sum || '0');
      const receiptsProcessed = parseInt(receiptsRes.rows[0].count || '0');
      const avgBasket = parseFloat(basketRes.rows[0].avg || '0');

      return res.json({
        activeUsers: { value: activeUsers.toLocaleString(), trend: "+12% from last month", isPositive: true },
        totalSales: { value: `$${(totalSales / 1000).toFixed(1)}k`, trend: "+4.3% from last month", isPositive: true },
        receiptsProcessed: { value: receiptsProcessed.toLocaleString(), trend: "+5% from last month", isPositive: true },
        avgBasket: { value: `$${avgBasket.toFixed(2)}`, trend: "+1.2% from last month", isPositive: true }
      });
    }

    if (path === '/dashboard/charts' && method === 'GET') {
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
        LEFT JOIN receipts r ON DATE(r.date) = d.date
        GROUP BY d.date
        ORDER BY d.date
      `);

      const brandsRes = await pool.query(`
        SELECT brand as name, COUNT(*) as value
        FROM campaigns 
        WHERE brand IS NOT NULL
        GROUP BY brand 
        ORDER BY value DESC 
        LIMIT 4
      `);

      return res.json({
        salesData: salesRes.rows,
        brandData: brandsRes.rows.length > 0 ? brandsRes.rows : [{ name: 'No Data', value: 0 }]
      });
    }

    // ============ AUTH ============
    if (path === '/auth/admin/login' && method === 'POST') {
      const { email, password } = req.body;
      const result = await pool.query('SELECT * FROM admins WHERE email = $1', [email]);
      
      if (result.rows.length > 0) {
        const admin = result.rows[0];
        // Check if password is hashed (starts with $2) or plain text (legacy)
        const isValidPassword = admin.password.startsWith('$2') 
          ? await bcrypt.compare(password, admin.password)
          : admin.password === password;
        
        if (isValidPassword) {
          return res.json({ success: true, user: { name: admin.name, email: admin.email, role: admin.role || 'admin' } });
        }
      }
      return res.status(401).json({ success: false, error: 'Invalid Credentials' });
    }

    if (path === '/auth/shopper/login' && method === 'POST') {
      const { phone, pin } = req.body;
      const cleanPhone = phone.replace(/\s/g, '');
      
      const result = await pool.query(`
        SELECT 
          id, first_name as "firstName", last_name as "lastName", email,
          phone_number as "phoneNumber", pin, status,
          points_balance as "pointsBalance", points_expiring as "pointsExpiring",
          to_char(points_expires_at, 'YYYY-MM-DD') as "pointsExpiresAt",
          total_spent as "totalSpent", to_char(joined_date, 'YYYY-MM-DD') as "joinedDate",
          gender, to_char(birthdate, 'YYYY-MM-DD') as "birthdate",
          CASE WHEN total_spent > 100000 THEN 'VIP' ELSE 'Regular' END as segment
        FROM users WHERE phone_number = $1
      `, [cleanPhone]);

      if (result.rows.length > 0) {
        const user = result.rows[0];
        // Check if PIN is hashed or plain text (legacy)
        const isValidPin = user.pin.startsWith('$2') 
          ? await bcrypt.compare(pin, user.pin)
          : user.pin === pin;
        
        if (isValidPin) {
          // Don't return PIN in response
          const { pin: _, ...userWithoutPin } = user;
          return res.json({ success: true, user: userWithoutPin });
        }
      }
      return res.status(401).json({ success: false, error: 'Invalid Credentials' });
    }

    if (path === '/auth/send-otp' && method === 'POST') {
      const { email } = req.body;
      if (!email) return res.status(400).json({ error: 'Email required' });

      const code = Math.floor(100000 + Math.random() * 900000).toString();
      
      await pool.query(`
        INSERT INTO email_verifications (email, code, expires_at)
        VALUES ($1, $2, NOW() + INTERVAL '10 minutes')
        ON CONFLICT (email) 
        DO UPDATE SET code = $2, expires_at = NOW() + INTERVAL '10 minutes'
      `, [email, code]);

      await sendOtpEmail(email, code);
      return res.json({ success: true, message: 'OTP sent' });
    }

    if (path === '/auth/shopper/signup' && method === 'POST') {
      const { firstName, lastName, email, phone, pin, gender, birthdate, otp } = req.body;
      const cleanPhone = phone.replace(/\s/g, '');

      if (otp) {
        const otpRes = await pool.query('SELECT * FROM email_verifications WHERE email = $1 AND code = $2 AND expires_at > NOW()', [email, otp]);
        if (otpRes.rows.length === 0) {
          return res.status(400).json({ success: false, error: 'Invalid or expired verification code' });
        }
        await pool.query('DELETE FROM email_verifications WHERE email = $1', [email]);
      }

      const check = await pool.query('SELECT id FROM users WHERE phone_number = $1', [cleanPhone]);
      if (check.rows.length > 0) {
        return res.status(400).json({ success: false, error: 'Phone number already registered' });
      }

      // Hash PIN before storing
      const hashedPin = await bcrypt.hash(pin, 10);

      const result = await pool.query(`
        INSERT INTO users (first_name, last_name, email, phone_number, pin, gender, birthdate, status, points_balance, joined_date)
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'active', 50, NOW())
        RETURNING id, first_name as "firstName", last_name as "lastName", email,
          phone_number as "phoneNumber", status, points_balance as "pointsBalance",
          0 as "pointsExpiring", NULL as "pointsExpiresAt", 0 as "totalSpent",
          to_char(joined_date, 'YYYY-MM-DD') as "joinedDate", gender,
          to_char(birthdate, 'YYYY-MM-DD') as "birthdate", 'New' as segment
      `, [firstName, lastName, email, cleanPhone, hashedPin, gender, birthdate]);

      sendWelcomeEmail(email, firstName).catch(console.error);
      return res.json({ success: true, user: result.rows[0] });
    }

    if (path === '/auth/partner/login' && method === 'POST') {
      const { email, password } = req.body;
      
      const result = await pool.query(`
        SELECT p.id, p.name, p.email, p.password, p.company_name as "companyName", p.phone, p.status,
          to_char(p.created_at, 'YYYY-MM-DD') as "createdAt",
          COALESCE(array_agg(ps.supermarket_id) FILTER (WHERE ps.supermarket_id IS NOT NULL), '{}') as "supermarketIds"
        FROM partners p
        LEFT JOIN partner_supermarkets ps ON p.id = ps.partner_id
        WHERE p.email = $1
        GROUP BY p.id
      `, [email]);

      if (result.rows.length > 0) {
        const partner = result.rows[0];
        // Check if password is hashed or plain text (legacy)
        const isValidPassword = partner.password.startsWith('$2') 
          ? await bcrypt.compare(password, partner.password)
          : partner.password === password;
        
        if (isValidPassword) {
          if (partner.status === 'suspended') {
            return res.status(403).json({ success: false, error: 'Account suspended. Contact support.' });
          }
          if (partner.status === 'pending') {
            return res.status(403).json({ success: false, error: 'Account pending approval.' });
          }
          const { password: _, ...partnerWithoutPassword } = partner;
          return res.json({ success: true, user: { ...partnerWithoutPassword, role: 'partner' } });
        }
      }
      return res.status(401).json({ success: false, error: 'Invalid Credentials' });
    }

    if (path === '/auth/partner/signup' && method === 'POST') {
      const { name, email, password, companyName, phone, otp } = req.body;

      if (!name || !email || !password || !companyName) {
        return res.status(400).json({ success: false, error: 'Name, email, password, and company name are required' });
      }

      if (otp) {
        const otpRes = await pool.query('SELECT * FROM email_verifications WHERE email = $1 AND code = $2 AND expires_at > NOW()', [email, otp]);
        if (otpRes.rows.length === 0) {
          return res.status(400).json({ success: false, error: 'Invalid or expired verification code' });
        }
        await pool.query('DELETE FROM email_verifications WHERE email = $1', [email]);
      }

      const check = await pool.query('SELECT id FROM partners WHERE email = $1', [email]);
      if (check.rows.length > 0) {
        return res.status(400).json({ success: false, error: 'Email already registered' });
      }

      // Hash password before storing
      const hashedPassword = await bcrypt.hash(password, 10);

      const result = await pool.query(`
        INSERT INTO partners (name, email, password, company_name, phone, status)
        VALUES ($1, $2, $3, $4, $5, 'pending')
        RETURNING id, name, email, company_name as "companyName", phone, status, to_char(created_at, 'YYYY-MM-DD') as "createdAt"
      `, [name, email, hashedPassword, companyName, phone]);

      sendWelcomeEmail(email, name).catch(console.error);
      return res.json({ success: true, user: { ...result.rows[0], role: 'partner', supermarketIds: [] }, message: 'Account created! Pending admin approval.' });
    }

    if (path === '/auth/admin/signup' && method === 'POST') {
      const { name, email, password, otp } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({ success: false, error: 'Name, email, and password are required' });
      }

      if (otp) {
        const otpRes = await pool.query('SELECT * FROM email_verifications WHERE email = $1 AND code = $2 AND expires_at > NOW()', [email, otp]);
        if (otpRes.rows.length === 0) {
          return res.status(400).json({ success: false, error: 'Invalid or expired verification code' });
        }
        await pool.query('DELETE FROM email_verifications WHERE email = $1', [email]);
      }

      const check = await pool.query('SELECT id FROM admins WHERE email = $1', [email]);
      if (check.rows.length > 0) {
        return res.status(400).json({ success: false, error: 'Email already registered' });
      }

      const countRes = await pool.query('SELECT COUNT(*) FROM admins');
      const role = parseInt(countRes.rows[0].count) === 0 ? 'super_admin' : 'admin';

      // Hash password before storing
      const hashedPassword = await bcrypt.hash(password, 10);

      const result = await pool.query(`
        INSERT INTO admins (name, email, password, role)
        VALUES ($1, $2, $3, $4)
        RETURNING id, name, email, role
      `, [name, email, hashedPassword, role]);

      sendWelcomeEmail(email, name).catch(console.error);
      return res.json({ success: true, user: result.rows[0] });
    }

    // ============ USERS ============
    if (path === '/users' && method === 'GET') {
      const result = await pool.query(`
        SELECT id, first_name as "firstName", last_name as "lastName", email,
          phone_number as "phoneNumber", status, points_balance as "pointsBalance",
          points_expiring as "pointsExpiring", to_char(points_expires_at, 'YYYY-MM-DD') as "pointsExpiresAt",
          total_spent as "totalSpent", to_char(joined_date, 'YYYY-MM-DD') as "joinedDate",
          gender, to_char(birthdate, 'YYYY-MM-DD') as "birthdate",
          CASE WHEN total_spent > 100000 THEN 'VIP' ELSE 'Regular' END as segment
        FROM users ORDER BY created_at DESC
      `);
      return res.json(result.rows);
    }

    if (path.match(/^\/users\/[\w-]+$/) && method === 'GET') {
      const id = path.split('/')[2];
      const result = await pool.query(`
        SELECT id, first_name as "firstName", last_name as "lastName", email,
          phone_number as "phoneNumber", status, points_balance as "pointsBalance",
          points_expiring as "pointsExpiring", to_char(points_expires_at, 'YYYY-MM-DD') as "pointsExpiresAt",
          total_spent as "totalSpent", to_char(joined_date, 'YYYY-MM-DD') as "joinedDate",
          gender, to_char(birthdate, 'YYYY-MM-DD') as "birthdate",
          CASE WHEN total_spent > 100000 THEN 'VIP' ELSE 'Regular' END as segment
        FROM users WHERE id = $1
      `, [id]);
      if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
      return res.json(result.rows[0]);
    }

    if (path.match(/^\/users\/[\w-]+\/status$/) && method === 'PUT') {
      const id = path.split('/')[2];
      const { status } = req.body;
      await pool.query('UPDATE users SET status = $1 WHERE id = $2', [status, id]);
      return res.json({ success: true });
    }

    // Update user (full update)
    if (path.match(/^\/users\/[\w-]+$/) && method === 'PUT') {
      const id = path.split('/')[2];
      const { firstName, lastName, email, phoneNumber, gender, birthdate, pointsBalance } = req.body;
      
      const result = await pool.query(`
        UPDATE users SET 
          first_name = COALESCE($1, first_name),
          last_name = COALESCE($2, last_name),
          email = COALESCE($3, email),
          phone_number = COALESCE($4, phone_number),
          gender = COALESCE($5, gender),
          birthdate = COALESCE($6, birthdate),
          points_balance = COALESCE($7, points_balance)
        WHERE id = $8
        RETURNING id, first_name as "firstName", last_name as "lastName", email,
          phone_number as "phoneNumber", status, points_balance as "pointsBalance",
          points_expiring as "pointsExpiring", to_char(points_expires_at, 'YYYY-MM-DD') as "pointsExpiresAt",
          total_spent as "totalSpent", to_char(joined_date, 'YYYY-MM-DD') as "joinedDate",
          gender, to_char(birthdate, 'YYYY-MM-DD') as "birthdate",
          CASE WHEN total_spent > 100000 THEN 'VIP' ELSE 'Regular' END as segment
      `, [firstName, lastName, email, phoneNumber, gender, birthdate, pointsBalance, id]);
      
      if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
      return res.json(result.rows[0]);
    }

    // Delete user
    if (path.match(/^\/users\/[\w-]+$/) && method === 'DELETE') {
      const id = path.split('/')[2];
      const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
      if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
      return res.status(204).end();
    }

    // Create user (admin creating a user)
    if (path === '/users' && method === 'POST') {
      const { firstName, lastName, email, phoneNumber, pin, gender, birthdate } = req.body;
      
      if (!firstName || !lastName || !phoneNumber || !pin) {
        return res.status(400).json({ error: 'First name, last name, phone number, and PIN are required' });
      }
      
      const cleanPhone = phoneNumber.replace(/\s/g, '');
      
      // Check if phone already exists
      const check = await pool.query('SELECT id FROM users WHERE phone_number = $1', [cleanPhone]);
      if (check.rows.length > 0) {
        return res.status(400).json({ error: 'Phone number already registered' });
      }
      
      // Hash PIN
      const hashedPin = await bcrypt.hash(pin, 10);
      
      const result = await pool.query(`
        INSERT INTO users (first_name, last_name, email, phone_number, pin, gender, birthdate, status, points_balance, joined_date)
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'active', 0, NOW())
        RETURNING id, first_name as "firstName", last_name as "lastName", email,
          phone_number as "phoneNumber", status, points_balance as "pointsBalance",
          0 as "pointsExpiring", NULL as "pointsExpiresAt", 0 as "totalSpent",
          to_char(joined_date, 'YYYY-MM-DD') as "joinedDate", gender,
          to_char(birthdate, 'YYYY-MM-DD') as "birthdate", 'New' as segment
      `, [firstName, lastName, email || null, cleanPhone, hashedPin, gender || null, birthdate || null]);
      
      return res.status(201).json(result.rows[0]);
    }

    // Adjust user points
    if (path.match(/^\/users\/[\w-]+\/points$/) && method === 'PUT') {
      const id = path.split('/')[2];
      const { adjustment, reason } = req.body;
      
      if (adjustment === undefined) {
        return res.status(400).json({ error: 'Adjustment amount is required' });
      }
      
      const result = await pool.query(`
        UPDATE users SET points_balance = points_balance + $1 WHERE id = $2
        RETURNING id, points_balance as "pointsBalance"
      `, [adjustment, id]);
      
      if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
      return res.json({ success: true, newBalance: result.rows[0].pointsBalance });
    }

    // ============ RECEIPTS ============
    if (path === '/receipts' && method === 'GET') {
      const result = await pool.query(`
        SELECT r.id, r.user_id as "userId", r.supermarket_name as "supermarketName",
          r.amount, to_char(r.date, 'YYYY-MM-DD') as "date", r.status,
          r.confidence_score as "confidenceScore", r.image_url as "imageUrl",
          COALESCE(json_agg(json_build_object('name', ri.name, 'quantity', ri.quantity,
            'unitPrice', ri.unit_price, 'total', ri.total, 'category', ri.category))
            FILTER (WHERE ri.id IS NOT NULL), '[]') as items
        FROM receipts r LEFT JOIN receipt_items ri ON r.id = ri.receipt_id GROUP BY r.id
      `);
      return res.json(result.rows);
    }

    if (path.match(/^\/receipts\/user\/[\w-]+$/) && method === 'GET') {
      const userId = path.split('/')[3];
      const result = await pool.query(`
        SELECT r.id, r.user_id as "userId", r.supermarket_name as "supermarketName",
          r.amount, to_char(r.date, 'YYYY-MM-DD') as "date", r.status,
          r.confidence_score as "confidenceScore", r.image_url as "imageUrl",
          COALESCE(json_agg(json_build_object('name', ri.name, 'quantity', ri.quantity,
            'unitPrice', ri.unit_price, 'total', ri.total, 'category', ri.category))
            FILTER (WHERE ri.id IS NOT NULL), '[]') as items
        FROM receipts r LEFT JOIN receipt_items ri ON r.id = ri.receipt_id
        WHERE r.user_id = $1 GROUP BY r.id
      `, [userId]);
      return res.json(result.rows);
    }

    // ============ SUPERMARKETS ============
    if (path === '/supermarkets' && method === 'GET') {
      const result = await pool.query(`
        SELECT id, name, address, active, logo_url as "logoUrl",
          business_hours as "businessHours", latitude, longitude, avg_basket as "avgBasket"
        FROM supermarkets WHERE active = true
      `);
      return res.json(result.rows);
    }

    if (path === '/supermarkets' && method === 'POST') {
      const { name, address, logoUrl, businessHours, latitude, longitude } = req.body;
      const result = await pool.query(`
        INSERT INTO supermarkets (name, address, logo_url, business_hours, latitude, longitude, active, avg_basket)
        VALUES ($1, $2, $3, $4, $5, $6, true, 0) RETURNING *
      `, [name, address, logoUrl, businessHours, latitude, longitude]);
      return res.json(result.rows[0]);
    }

    if (path.match(/^\/supermarkets\/[^/]+$/) && method === 'PUT') {
      const id = path.split('/')[2];
      const { name, address, logoUrl, businessHours, latitude, longitude, active } = req.body;
      const result = await pool.query(`
        UPDATE supermarkets SET name = $1, address = $2, logo_url = $3, business_hours = $4,
          latitude = $5, longitude = $6, active = COALESCE($7, active) WHERE id = $8 RETURNING *
      `, [name, address, logoUrl, businessHours, latitude, longitude, active, id]);
      return res.json(result.rows[0]);
    }

    if (path.match(/^\/supermarkets\/[^/]+$/) && method === 'DELETE') {
      const id = path.split('/')[2];
      await pool.query('DELETE FROM supermarkets WHERE id = $1', [id]);
      return res.json({ success: true });
    }

    // ============ CAMPAIGNS ============
    if (path === '/campaigns' && method === 'GET') {
      const result = await pool.query(`
        SELECT c.id, c.name, c.brand, c.status, to_char(c.start_date, 'YYYY-MM-DD') as "startDate",
          to_char(c.end_date, 'YYYY-MM-DD') as "endDate", c.mechanic, c.min_spend as "minSpend",
          c.max_redemptions as "maxRedemptions", c.conversions, c.target_audience as "targetAudience",
          c.reward_type as "rewardType", c.reward_value as "rewardValue",
          COALESCE(array_agg(cs.supermarket_id) FILTER (WHERE cs.supermarket_id IS NOT NULL), '{}') as "supermarketIds"
        FROM campaigns c LEFT JOIN campaign_supermarkets cs ON c.id = cs.campaign_id GROUP BY c.id
      `);
      return res.json(result.rows);
    }

    if (path.match(/^\/campaigns\/\d+\/status$/) && method === 'PATCH') {
      const id = path.split('/')[2];
      const { status } = req.body;
      await pool.query('UPDATE campaigns SET status = $1 WHERE id = $2', [status, id]);
      return res.json({ success: true });
    }

    // ============ NOTIFICATIONS ============
    if (path.match(/^\/notifications\/\d+$/) && method === 'GET') {
      const userId = path.split('/')[2];
      const result = await pool.query(`
        SELECT id, user_id as "userId", title, message, to_char(date, 'YYYY-MM-DD') as "date", read, type
        FROM notifications WHERE user_id = $1 ORDER BY date DESC
      `, [userId]);
      return res.json(result.rows);
    }

    // ============ PARTNERS ============
    if (path === '/partners' && method === 'GET') {
      const result = await pool.query(`
        SELECT p.id, p.name, p.email, p.company_name as "companyName", p.phone, p.status,
          to_char(p.created_at, 'YYYY-MM-DD') as "createdAt",
          COALESCE(array_agg(ps.supermarket_id) FILTER (WHERE ps.supermarket_id IS NOT NULL), '{}') as "supermarketIds"
        FROM partners p LEFT JOIN partner_supermarkets ps ON p.id = ps.partner_id
        GROUP BY p.id ORDER BY p.created_at DESC
      `);
      return res.json(result.rows);
    }

    if (path.match(/^\/partners\/\d+\/status$/) && method === 'PUT') {
      const id = path.split('/')[2];
      const { status } = req.body;
      if (!['active', 'pending', 'suspended'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }
      await pool.query('UPDATE partners SET status = $1 WHERE id = $2', [status, id]);
      return res.json({ success: true });
    }

    if (path.match(/^\/partners\/\d+\/supermarkets$/) && method === 'PUT') {
      const id = path.split('/')[2];
      const { supermarketIds } = req.body;
      await pool.query('DELETE FROM partner_supermarkets WHERE partner_id = $1', [id]);
      if (supermarketIds && supermarketIds.length > 0) {
        const values = supermarketIds.map((sid: string) => `(${id}, '${sid}')`).join(',');
        await pool.query(`INSERT INTO partner_supermarkets (partner_id, supermarket_id) VALUES ${values}`);
      }
      return res.json({ success: true });
    }

    // ============ ADMINS ============
    if (path === '/admins' && method === 'GET') {
      const result = await pool.query(`
        SELECT id, name, email, role, to_char(created_at, 'YYYY-MM-DD') as "createdAt"
        FROM admins ORDER BY created_at DESC
      `);
      return res.json(result.rows);
    }

    // 404 for unmatched routes
    return res.status(404).json({ error: 'Not found', path, method });

  } catch (err: any) {
    console.error('API Error:', err);
    return res.status(500).json({ error: 'Internal server error', message: err.message });
  }
}
