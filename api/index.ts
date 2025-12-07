import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from 'pg';
import nodemailer from 'nodemailer';
import bcrypt from 'bcryptjs';
import { put } from '@vercel/blob';
import { GoogleGenAI } from "@google/genai";
import { randomUUID, createHash } from 'crypto';

// ============ IMAGE FINGERPRINTING UTILITY ============
/**
 * Generate a unique fingerprint hash from image data.
 * Uses SHA-256 for strong collision resistance.
 * This prevents the same image from being submitted multiple times.
 */
const generateImageHash = (base64Image: string): string => {
  // Remove data URL prefix if present (e.g., "data:image/jpeg;base64,")
  const cleanBase64 = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;
  return createHash('sha256').update(cleanBase64).digest('hex');
};

/**
 * Normalize receipt data for fuzzy matching.
 * Helps detect receipts that are similar but have slight OCR variations.
 */
const normalizeForComparison = (value: string): string => {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '') // Remove special chars
    .trim();
};

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
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
        id UUID PRIMARY KEY,
        user_id UUID REFERENCES users(id),
        supermarket_name VARCHAR(255),
        amount DECIMAL,
        date TIMESTAMP DEFAULT NOW(),
        status VARCHAR(50) DEFAULT 'pending',
        confidence_score DECIMAL,
        image_url VARCHAR(500),
        receipt_number VARCHAR(255),
        image_hash VARCHAR(64),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    // Ensure columns exist (migrations)
    try {
      await pool.query('ALTER TABLE receipts ADD COLUMN IF NOT EXISTS receipt_number VARCHAR(255)');
      await pool.query('ALTER TABLE receipts ADD COLUMN IF NOT EXISTS image_hash VARCHAR(64)');
      await pool.query('ALTER TABLE receipts ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW()');
      // Create index for faster duplicate lookups
      await pool.query('CREATE INDEX IF NOT EXISTS idx_receipts_image_hash ON receipts(image_hash)');
      await pool.query('CREATE INDEX IF NOT EXISTS idx_receipts_receipt_number ON receipts(receipt_number)');
    } catch (e) { /* ignore migration errors */ }

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

    // Activities table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS activities (
        id SERIAL PRIMARY KEY,
        user_id UUID REFERENCES users(id),
        type VARCHAR(50),
        description VARCHAR(255),
        points INTEGER,
        date TIMESTAMP DEFAULT NOW()
      );
    `);

    // Notifications table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id UUID REFERENCES users(id),
        title VARCHAR(255),
        message TEXT,
        date TIMESTAMP DEFAULT NOW(),
        read BOOLEAN DEFAULT false,
        type VARCHAR(50)
      );
    `);

    // Purchases (Redemptions) table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS purchases (
        id SERIAL PRIMARY KEY,
        user_id UUID REFERENCES users(id),
        reward_id INTEGER REFERENCES rewards(id),
        item_name VARCHAR(255),
        cost INTEGER,
        status VARCHAR(50) DEFAULT 'completed',
        date TIMESTAMP DEFAULT NOW(),
        fulfillment_details JSONB
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
      
      // Check for Blob Token
      if (!process.env.BLOB_READ_WRITE_TOKEN) {
        console.error('[UPLOAD] BLOB_READ_WRITE_TOKEN is missing');
        return res.status(500).json({ error: 'Server configuration error: BLOB_READ_WRITE_TOKEN missing' });
      }

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
        
        console.log('[UPLOAD] File uploaded to Vercel Blob:', blob.url);
        return res.json({ url: blob.url });
      } catch (uploadError: any) {
        console.error('[UPLOAD] Error:', uploadError.message);
        return res.status(500).json({ error: 'Failed to upload file to Blob', details: uploadError.message });
      }
    }

    // ============ REWARDS ============
    if (path === '/rewards' && method === 'GET') {
      console.log('[REWARDS] Fetching all rewards...');
      const result = await pool.query('SELECT id, title, cost, type, brand, image_url as "imageUrl", partner_id as "partnerId" FROM rewards');
      console.log('[REWARDS] Found:', result.rows.length, 'rewards');
      return res.json(result.rows);
    }

    if (path === '/rewards/redeem' && method === 'POST') {
      const { userId, rewardId } = req.body;
      
      try {
        // Get User Points
        const userRes = await pool.query('SELECT points_balance FROM users WHERE id = $1', [userId]);
        if (userRes.rows.length === 0) return res.status(404).json({ error: 'User not found' });
        const userPoints = userRes.rows[0].points_balance;

        // Get Reward Cost
        const rewardRes = await pool.query('SELECT * FROM rewards WHERE id = $1', [rewardId]);
        if (rewardRes.rows.length === 0) return res.status(404).json({ error: 'Reward not found' });
        const reward = rewardRes.rows[0];

        if (userPoints < reward.cost) {
          return res.status(400).json({ error: 'Insufficient points' });
        }

        // Deduct Points
        await pool.query('UPDATE users SET points_balance = points_balance - $1 WHERE id = $2', [reward.cost, userId]);

        // Record Activity
        await pool.query(`
          INSERT INTO activities (user_id, type, description, points, date)
          VALUES ($1, 'redeem', $2, $3, NOW())
        `, [userId, `Redeemed ${reward.title}`, -reward.cost]);

        // Record Purchase
        await pool.query(`
          INSERT INTO purchases (user_id, reward_id, item_name, cost, status, date)
          VALUES ($1, $2, $3, $4, 'completed', NOW())
        `, [userId, reward.id, reward.title, reward.cost]);

        // Create Notification
        await pool.query(`
          INSERT INTO notifications (user_id, title, message, type, date)
          VALUES ($1, 'Reward Redeemed', $2, 'reward', NOW())
        `, [userId, `You successfully redeemed ${reward.title} for ${reward.cost} points.`]);

        const newBalance = userPoints - reward.cost;
        return res.json({ success: true, newBalance });
      } catch (error: any) {
        console.error('Redemption Error:', error);
        return res.status(500).json({ error: 'Redemption failed' });
      }
    }

    // ============ ACTIVITIES ============
    if (path.match(/^\/activities\/[\w-]+$/) && method === 'GET') {
      const userId = path.split('/')[2];
      const result = await pool.query('SELECT id, type, description, points, to_char(date, \'YYYY-MM-DD HH24:MI\') as date FROM activities WHERE user_id = $1 ORDER BY date DESC', [userId]);
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

    // ============ RECEIPT PROCESSING (ADVANCED FRAUD DETECTION) ============
    if (path === '/receipts/process' && method === 'POST') {
      const { userId, scannedData, imageUrl } = req.body;
      const { merchantName, totalAmount, date, receiptNumber, items, confidence } = scannedData;

      // ============ VALIDATION LAYER 1: Basic Input Validation ============
      if (!userId || !merchantName || !totalAmount) {
         return res.status(400).json({ error: 'Missing required data', code: 'INVALID_INPUT' });
      }

      // Validate amount is reasonable (anti-fraud)
      if (totalAmount <= 0) {
         return res.status(400).json({ error: 'Invalid receipt amount', code: 'INVALID_AMOUNT' });
      }

      if (totalAmount > 10000000) { // 10 million CDF limit
         return res.status(400).json({ error: 'Receipt amount exceeds maximum allowed', code: 'AMOUNT_TOO_HIGH' });
      }

      // Validate confidence score (reject very low confidence)
      if (confidence !== undefined && confidence < 0.3) {
         return res.status(400).json({ 
           error: 'Receipt image quality too low. Please take a clearer photo.', 
           code: 'LOW_CONFIDENCE' 
         });
      }

      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        // ============ VALIDATION LAYER 2: Image Fingerprint Check (GLOBAL) ============
        // This is the strongest check - prevents the EXACT same image from being used by ANYONE
        let imageHash: string | null = null;
        if (imageUrl && imageUrl.startsWith('data:')) {
          imageHash = generateImageHash(imageUrl);
          
          const imageHashDup = await client.query(`
            SELECT r.id, r.user_id, u.first_name || ' ' || u.last_name as user_name
            FROM receipts r
            LEFT JOIN users u ON r.user_id = u.id
            WHERE r.image_hash = $1 AND r.status != 'rejected'
          `, [imageHash]);

          if (imageHashDup.rows.length > 0) {
            await client.query('ROLLBACK');
            console.log(`[FRAUD] Duplicate image detected. Hash: ${imageHash}, Original Receipt: ${imageHashDup.rows[0].id}`);
            return res.status(400).json({ 
              error: 'This exact receipt image has already been submitted.', 
              code: 'DUPLICATE_IMAGE' 
            });
          }
        }

        // ============ VALIDATION LAYER 3: Receipt Number Check (GLOBAL) ============
        // If the AI extracted a receipt number, check if it's been used globally
        const cleanReceiptNumber = receiptNumber ? receiptNumber.toString().trim() : null;
        if (cleanReceiptNumber && cleanReceiptNumber.length > 0) {
          const receiptNumDup = await client.query(`
            SELECT r.id, r.user_id, r.supermarket_name, r.amount, to_char(r.date, 'YYYY-MM-DD') as date
            FROM receipts r
            WHERE r.receipt_number = $1 AND r.status != 'rejected'
          `, [cleanReceiptNumber]);

          if (receiptNumDup.rows.length > 0) {
            await client.query('ROLLBACK');
            console.log(`[FRAUD] Duplicate receipt number: ${cleanReceiptNumber}`);
            return res.status(400).json({ 
              error: 'This receipt number has already been processed.', 
              code: 'DUPLICATE_RECEIPT_NUMBER' 
            });
          }
        }

        // ============ VALIDATION LAYER 4: Find Partner/Supermarket ============
        const marketRes = await client.query(
          'SELECT id, name FROM supermarkets WHERE $1 ILIKE \'%\' || name || \'%\' LIMIT 1', 
          [merchantName]
        );
        
        let supermarketId = null;
        let supermarketName = merchantName;

        if (marketRes.rows.length > 0) {
          supermarketId = marketRes.rows[0].id;
          supermarketName = marketRes.rows[0].name;
        }

        // ============ VALIDATION LAYER 5: Fuzzy Duplicate Check (GLOBAL) ============
        // Check if ANYONE has submitted a receipt with same merchant, amount, and date
        // This catches receipts even when image hash or receipt number aren't available
        const receiptDate = date || new Date().toISOString().split('T')[0];
        
        const globalFuzzyDup = await client.query(`
          SELECT r.id, r.user_id, u.first_name || ' ' || u.last_name as user_name
          FROM receipts r
          LEFT JOIN users u ON r.user_id = u.id
          WHERE LOWER(r.supermarket_name) = LOWER($1)
          AND r.amount = $2 
          AND r.date::date = $3::date
          AND r.status != 'rejected'
        `, [supermarketName, totalAmount, receiptDate]);

        if (globalFuzzyDup.rows.length > 0) {
          await client.query('ROLLBACK');
          const isOwnReceipt = globalFuzzyDup.rows[0].user_id === userId;
          console.log(`[FRAUD] Fuzzy duplicate detected. Merchant: ${supermarketName}, Amount: ${totalAmount}, Date: ${receiptDate}`);
          return res.status(400).json({ 
            error: isOwnReceipt 
              ? 'You have already submitted this receipt.' 
              : 'This receipt has already been processed by another user.', 
            code: 'DUPLICATE_RECEIPT' 
          });
        }

        // ============ VALIDATION LAYER 6: Time-based Velocity Check ============
        // Prevent same user from submitting too many receipts in short time (rate limiting)
        const velocityCheck = await client.query(`
          SELECT COUNT(*) as count FROM receipts 
          WHERE user_id = $1 
          AND created_at > NOW() - INTERVAL '1 hour'
        `, [userId]);

        if (parseInt(velocityCheck.rows[0].count) >= 10) {
          await client.query('ROLLBACK');
          console.log(`[FRAUD] Velocity limit exceeded for user: ${userId}`);
          return res.status(429).json({ 
            error: 'Too many receipts submitted. Please wait before submitting more.', 
            code: 'RATE_LIMIT_EXCEEDED' 
          });
        }

        // ============ VALIDATION LAYER 7: Similar Amount Check (GLOBAL) ============
        // Check for very similar receipts within a time window (catches slight OCR variations)
        const amountTolerance = totalAmount * 0.02; // 2% tolerance
        const similarAmountDup = await client.query(`
          SELECT r.id, r.amount, r.supermarket_name
          FROM receipts r
          WHERE LOWER(r.supermarket_name) = LOWER($1)
          AND ABS(r.amount - $2) <= $3
          AND r.date::date = $4::date
          AND r.status != 'rejected'
        `, [supermarketName, totalAmount, amountTolerance, receiptDate]);

        if (similarAmountDup.rows.length > 0) {
          await client.query('ROLLBACK');
          console.log(`[FRAUD] Similar amount duplicate. Amount: ${totalAmount}, Similar: ${similarAmountDup.rows[0].amount}`);
          return res.status(400).json({ 
            error: 'A very similar receipt has already been processed. Please contact support if this is an error.', 
            code: 'SIMILAR_RECEIPT_EXISTS' 
          });
        }

        // ============ ALL CHECKS PASSED - PROCESS RECEIPT ============
        console.log(`[RECEIPT] Processing valid receipt for user ${userId}: ${supermarketName}, ${totalAmount}`);

        // Check Active Campaigns
        let pointsAwarded = 0;
        let campaignApplied = null;

        if (supermarketId) {
            const campaigns = await client.query(`
                SELECT c.* FROM campaigns c
                JOIN campaign_supermarkets cs ON c.id = cs.campaign_id
                WHERE cs.supermarket_id = $1 
                AND c.status = 'active'
                AND (c.end_date IS NULL OR c.end_date >= CURRENT_DATE)
                AND (c.min_spend IS NULL OR c.min_spend <= $2)
            `, [supermarketId, totalAmount]);

            if (campaigns.rows.length > 0) {
                campaignApplied = campaigns.rows[0];
                
                // Standard Rule: 1 point per 1000 currency units
                const basePoints = Math.floor(totalAmount / 1000);
                
                // Bonus from campaign
                let bonusPoints = 0;
                if (campaignApplied.reward_type === 'points' && campaignApplied.reward_value) {
                   if (!isNaN(parseInt(campaignApplied.reward_value))) {
                      bonusPoints = parseInt(campaignApplied.reward_value);
                   }
                }
                
                pointsAwarded = basePoints + bonusPoints;
            }
        }

        // Insert Receipt with image hash
        const rId = randomUUID();
        const status = pointsAwarded > 0 ? 'approved' : 'pending';

        await client.query(`
            INSERT INTO receipts (id, user_id, supermarket_name, amount, date, status, confidence_score, image_url, receipt_number, image_hash, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
        `, [rId, userId, supermarketName, totalAmount, receiptDate, status, confidence, imageUrl || '', cleanReceiptNumber, imageHash]);

        // Items
        if (items && items.length > 0) {
            for (const item of items) {
                // Skip if missing name or price
                if (item.name && item.price) {
                  await client.query(`
                      INSERT INTO receipt_items (receipt_id, name, quantity, unit_price, total, category)
                      VALUES ($1, $2, $3, $4, $5, 'General')
                  `, [rId, item.name, item.quantity || 1, item.price, (item.price * (item.quantity || 1))]);
                }
            }
        }

        // 5. Update User & Activities if approved
        if (status === 'approved' && pointsAwarded > 0) {
            await client.query('UPDATE users SET points_balance = points_balance + $1 WHERE id = $2', [pointsAwarded, userId]);
            
            await client.query(`
                INSERT INTO activities (user_id, type, description, points, date)
                VALUES ($1, 'earn', $2, $3, NOW())
            `, [userId, `Earned points at ${supermarketName} (${campaignApplied ? campaignApplied.name : 'Standard'})`, pointsAwarded]);

            await client.query(`
                INSERT INTO notifications (user_id, title, message, type, date)
                VALUES ($1, 'Points Earned!', $2, 'reward', NOW())
            `, [userId, `You earned ${pointsAwarded} points from your receipt at ${supermarketName}.`]);
            
            if (campaignApplied) {
                 await client.query('UPDATE campaigns SET conversions = conversions + 1 WHERE id = $1', [campaignApplied.id]);
            }
        } else {
             // Notify pending
             await client.query(`
                INSERT INTO notifications (user_id, title, message, type, date)
                VALUES ($1, 'Receipt Submitted', $2, 'system', NOW())
            `, [userId, `Your receipt from ${supermarketName} has been submitted for review.`]);
        }

        await client.query('COMMIT');
        return res.json({ success: true, points: pointsAwarded, status, receiptId: rId, campaign: campaignApplied?.name });

      } catch (e: any) {
          await client.query('ROLLBACK');
          console.error("Processing Error", e);
          return res.status(500).json({ error: e.message });
      } finally {
          client.release();
      }
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
        ORDER BY c.id DESC
      `);
      return res.json(result.rows);
    }

    if (path === '/campaigns' && method === 'POST') {
      const { name, brand, startDate, endDate, mechanic, minSpend, maxRedemptions, targetAudience, rewardType, rewardValue, supermarketIds } = req.body;
      
      const result = await pool.query(`
        INSERT INTO campaigns (name, brand, status, start_date, end_date, mechanic, min_spend, max_redemptions, target_audience, reward_type, reward_value, conversions)
        VALUES ($1, $2, 'active', $3, $4, $5, $6, $7, $8, $9, $10, 0)
        RETURNING id, name, brand, status, to_char(start_date, 'YYYY-MM-DD') as "startDate",
          to_char(end_date, 'YYYY-MM-DD') as "endDate", mechanic, min_spend as "minSpend",
          max_redemptions as "maxRedemptions", conversions, target_audience as "targetAudience",
          reward_type as "rewardType", reward_value as "rewardValue"
      `, [name, brand, startDate, endDate, mechanic, minSpend, maxRedemptions, targetAudience, rewardType, rewardValue]);

      const campaignId = result.rows[0].id;

      if (supermarketIds && supermarketIds.length > 0) {
        await pool.query(
          `INSERT INTO campaign_supermarkets (campaign_id, supermarket_id) 
           SELECT $1, unnest($2::uuid[])`,
          [campaignId, supermarketIds]
        );
      }

      return res.status(201).json({ ...result.rows[0], supermarketIds: supermarketIds || [] });
    }

    if (path.match(/^\/campaigns\/[\w-]+$/) && method === 'PUT') {
      const id = path.split('/')[2];
      const { name, brand, startDate, endDate, mechanic, minSpend, maxRedemptions, targetAudience, rewardType, rewardValue, supermarketIds } = req.body;
      
      const result = await pool.query(`
        UPDATE campaigns SET 
          name = COALESCE($1, name), brand = COALESCE($2, brand), start_date = COALESCE($3, start_date),
          end_date = COALESCE($4, end_date), mechanic = COALESCE($5, mechanic), min_spend = COALESCE($6, min_spend),
          max_redemptions = COALESCE($7, max_redemptions), target_audience = COALESCE($8, target_audience),
          reward_type = COALESCE($9, reward_type), reward_value = COALESCE($10, reward_value)
        WHERE id = $11
        RETURNING id, name, brand, status, to_char(start_date, 'YYYY-MM-DD') as "startDate",
          to_char(end_date, 'YYYY-MM-DD') as "endDate", mechanic, min_spend as "minSpend",
          max_redemptions as "maxRedemptions", conversions, target_audience as "targetAudience",
          reward_type as "rewardType", reward_value as "rewardValue"
      `, [name, brand, startDate, endDate, mechanic, minSpend, maxRedemptions, targetAudience, rewardType, rewardValue, id]);

      if (result.rows.length === 0) return res.status(404).json({ error: 'Campaign not found' });

      if (supermarketIds) {
        await pool.query('DELETE FROM campaign_supermarkets WHERE campaign_id = $1', [id]);
        if (supermarketIds.length > 0) {
          await pool.query(
            `INSERT INTO campaign_supermarkets (campaign_id, supermarket_id) 
             SELECT $1, unnest($2::uuid[])`,
            [id, supermarketIds]
          );
        }
      }

      const updatedSupermarkets = await pool.query('SELECT supermarket_id FROM campaign_supermarkets WHERE campaign_id = $1', [id]);
      const sids = updatedSupermarkets.rows.map(r => r.supermarket_id);

      return res.json({ ...result.rows[0], supermarketIds: sids });
    }

    if (path.match(/^\/campaigns\/[\w-]+$/) && method === 'DELETE') {
      const id = path.split('/')[2];
      const result = await pool.query('DELETE FROM campaigns WHERE id = $1 RETURNING id', [id]);
      if (result.rows.length === 0) return res.status(404).json({ error: 'Campaign not found' });
      return res.status(204).end();
    }

    if (path.match(/^\/campaigns\/[\w-]+\/status$/) && method === 'PATCH') {
      const id = path.split('/')[2];
      const { status } = req.body;
      await pool.query('UPDATE campaigns SET status = $1 WHERE id = $2', [status, id]);
      return res.json({ success: true });
    }

    // ============ NOTIFICATIONS ============
    if (path === '/notifications' && method === 'POST') {
      const { userId, title, message, type } = req.body;
      if (!title || !message) return res.status(400).json({ error: 'Title and message required' });
      
      const result = await pool.query(`
        INSERT INTO notifications (user_id, title, message, type, date, read)
        VALUES ($1, $2, $3, $4, NOW(), false)
        RETURNING id, user_id as "userId", title, message, to_char(date, 'YYYY-MM-DD') as "date", read, type
      `, [userId || null, title, message, type || 'info']);
      
      return res.status(201).json(result.rows[0]);
    }

    if (path.match(/^\/notifications\/[\w-]+$/) && method === 'GET') {
      const userId = path.split('/')[2];
      const result = await pool.query(`
        SELECT id, user_id as "userId", title, message, to_char(date, 'YYYY-MM-DD') as "date", read, type
        FROM notifications WHERE user_id = $1 ORDER BY date DESC
      `, [userId]);
      return res.json(result.rows);
    }
    
    // ============ RECEIPT ACTIONS ============
    if (path.match(/^\/receipts\/[\w-]+\/status$/) && method === 'PUT') {
      const id = path.split('/')[2];
      const { status, points } = req.body;
      
      if (!['approved', 'rejected', 'pending'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }

      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        
        const updateRes = await client.query(
          'UPDATE receipts SET status = $1 WHERE id = $2 RETURNING id, user_id', 
          [status, id]
        );
        
        if (updateRes.rows.length === 0) {
          await client.query('ROLLBACK');
          return res.status(404).json({ error: 'Receipt not found' });
        }

        // If approved and points provided, award points
        if (status === 'approved' && points && points > 0) {
          const userId = updateRes.rows[0].user_id;
          await client.query(
            'UPDATE users SET points_balance = points_balance + $1 WHERE id = $2',
            [points, userId]
          );
          
          // Notify user
          await client.query(`
            INSERT INTO notifications (user_id, title, message, type, date, read)
            VALUES ($1, 'Receipt Approved', $2, 'reward', NOW(), false)
          `, [userId, `Your receipt has been approved! You earned ${points} points.`]);

          // Record Activity
          await client.query(`
            INSERT INTO activities (user_id, type, description, points, date)
            VALUES ($1, 'earn', 'Points earned from receipt', $2, NOW())
          `, [userId, points]);
        }
        
        // If rejected, notify user
        if (status === 'rejected') {
          const userId = updateRes.rows[0].user_id;
          await client.query(`
            INSERT INTO notifications (user_id, title, message, type, date, read)
            VALUES ($1, 'Receipt Rejected', 'Your receipt could not be verified. Please try again.', 'system', NOW(), false)
          `, [userId]);
        }

        await client.query('COMMIT');
        return res.json({ success: true });
      } catch (e) {
        await client.query('ROLLBACK');
        throw e;
      } finally {
        client.release();
      }
    }
    
    if (path.match(/^\/receipts\/[\w-]+$/) && method === 'DELETE') {
      const id = path.split('/')[2];
      // Cascading delete for receipt items handled by FK constraint if set, otherwise manual
      await pool.query('DELETE FROM receipt_items WHERE receipt_id = $1', [id]);
      const result = await pool.query('DELETE FROM receipts WHERE id = $1 RETURNING id', [id]);
      
      if (result.rows.length === 0) return res.status(404).json({ error: 'Receipt not found' });
      return res.status(204).end();
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
        await pool.query(
          `INSERT INTO partner_supermarkets (partner_id, supermarket_id) 
           SELECT $1, unnest($2::uuid[])`,
          [id, supermarketIds]
        );
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

    if (path === '/ai/analyze' && method === 'POST') {
      const { prompt } = req.body;
      if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

      // Gather Context from DB
      const [usersStats, salesStats, campaigns, supermarkets, recentReceipts] = await Promise.all([
        pool.query('SELECT COUNT(*) as total, SUM(CASE WHEN status = \'active\' THEN 1 ELSE 0 END) as active FROM users'),
        pool.query('SELECT SUM(total_spent) as total_revenue, AVG(total_spent) as avg_spend FROM users'),
        pool.query('SELECT name, brand, status, conversions FROM campaigns LIMIT 5'),
        pool.query('SELECT name, avg_basket FROM supermarkets ORDER BY avg_basket DESC LIMIT 5'),
        pool.query('SELECT supermarket_name, amount, date FROM receipts ORDER BY date DESC LIMIT 5')
      ]);

      const context = {
        users: usersStats.rows[0],
        sales: salesStats.rows[0],
        activeCampaigns: campaigns.rows,
        topSupermarkets: supermarkets.rows,
        recentReceipts: recentReceipts.rows
      };

      const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: 'AI Service not configured' });
      }

      try {
        const ai = new GoogleGenAI({ apiKey });
        const model = 'gemini-2.0-flash'; // Using a standard model

        const systemPrompt = `
          You are an expert Data Analyst for DRC Loyalty.
          Analyze the following real-time database context:
          ${JSON.stringify(context, null, 2)}
          
          User Question: ${prompt}
          
          Provide professional, data-driven insights. 
          If the data is 0 or empty, suggest actionable steps to improve (e.g., launch campaigns).
          Keep it concise and format with Markdown.
        `;

        const response = await ai.models.generateContent({
          model,
          contents: systemPrompt,
        });

        return res.json({ result: response.text });
      } catch (error: any) {
        console.error('AI Error:', error);
        return res.status(500).json({ error: 'Failed to generate insight', details: error.message });
      }
    }

    // 404 for unmatched routes
    return res.status(404).json({ error: 'Not found', path, method });

  } catch (err: any) {
    console.error('API Error:', err);
    return res.status(500).json({ error: 'Internal server error', message: err.message });
  }
}
