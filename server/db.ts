import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// Fallback to .env if .env.local didn't work or for other vars
dotenv.config();

const connectionString = process.env.DATABASE_URL || process.env.VITE_DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL is not defined in .env.local');
  process.exit(1);
}

console.log('🔌 Connecting to database...');

export const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false // Required for Neon/many cloud providers
  }
});

// Test connection
pool.on('connect', () => {
  console.log('✅ Database connected successfully');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle client', err);
  process.exit(-1);
});
