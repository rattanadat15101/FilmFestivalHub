// /server/utils/supabaseServer.js
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config'; // โหลดตัวแปรจากไฟล์ .env

// 1. ดึง URL และ Service Key (Key ลับ) จาก .env
// (Key นี้ใช้สำหรับ Backend เท่านั้น ห้ามเผยแพร่)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

// 2. สร้าง Admin client (สำหรับ Backend เท่านั้น)
// Client นี้ใช้ Service Key และสามารถข้าม RLS (Row Level Security) ได้
export const supabase = createClient(supabaseUrl, supabaseKey);