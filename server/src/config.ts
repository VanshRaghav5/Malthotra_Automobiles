import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  PORT: parseInt(process.env.PORT || '3001', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',

  // Supabase
  SUPABASE_URL: process.env.SUPABASE_URL || '',
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || '',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',

  // Gemini AI
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',

  // Brevo Email
  BREVO_API_KEY: process.env.BREVO_API_KEY || '',
  FROM_EMAIL: process.env.FROM_EMAIL || 'noreply@malhotraautomobiles.com',
  OWNER_EMAIL: process.env.OWNER_EMAIL || 'info@malhotraautomobiles.com',

  // Feature flags
  PRODUCTS_ENABLED: process.env.PRODUCTS_ENABLED === 'false',

  // JWT (for any custom token needs)
  JWT_SECRET: process.env.JWT_SECRET || 'dev-secret-change-in-production',
};

// Validate required config
const required = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'GEMINI_API_KEY', 'BREVO_API_KEY'];
for (const key of required) {
  if (!process.env[key] && config.NODE_ENV === 'production') {
    console.warn(`Warning: ${key} is not set`);
  }
}
