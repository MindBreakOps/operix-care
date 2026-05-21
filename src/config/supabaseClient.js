import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ofdqkdoqxsfuznbaipag.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mZHFrZG9xeHNmdXpuYmFpcGFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5NzA2NzMsImV4cCI6MjA5NDU0NjY3M30.44QYnnYLhm3rvgVu62z-G9w8NLpyWZaTNzJTTklMuI4';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);