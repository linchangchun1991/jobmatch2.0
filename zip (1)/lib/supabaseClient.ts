import { createClient } from '@supabase/supabase-js';

// ============================================================
// ⚠️ 重要：请替换下面的字符串为你自己的 Supabase Project URL 和 Key
// ============================================================

// 1. 在 Supabase 后台 -> Project Settings -> API -> Project URL
const SUPABASE_URL = "https://ysscurevsdenbmsnixpc.supabase.co"; 

// 2. 在 Supabase 后台 -> Project Settings -> API -> anon public key
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlzc2N1cmV2c2RlbmJtc25peHBjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYxNDc2MDEsImV4cCI6MjA4MTcyMzYwMX0.xTuOXCJQXTXdLGmppvyLq8nEh2RsQQZcbqbSuvZlJGc";

// ============================================================

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);