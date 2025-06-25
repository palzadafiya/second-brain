import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Prisma Client
const prisma = new PrismaClient();

// Initialize Supabase Client with service role key to bypass RLS on the server
const supabaseUrl = process.env.SUPABASE_URL || '';
// Prefer service key when available, otherwise fall back to anon key (read-only)
const supabaseKey =
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.SUPABASE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  '';

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in environment variables');
  process.exit(1);
}

// When using the service role key we must explicitly disable key persistence in localStorage
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false, // never store the service key in the browser by accident
  },
});

export { prisma, supabase }; 