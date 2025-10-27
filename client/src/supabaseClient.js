// /client/src/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// สร้าง Client สำหรับ Frontend (ใช้ Anon Key)
export const supabase = createClient(supabaseUrl, supabaseKey);