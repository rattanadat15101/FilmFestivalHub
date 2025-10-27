// /server/routes/authRoutes.js
import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import 'dotenv/config';
import { supabase } from '../utils/supabaseServer.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_RESET_EXPIRES_IN = '15m'; // Token รีเซ็ตรหัสผ่านมีอายุ 15 นาที

/* =========================
   🟩 REGISTER (JWT)
   POST /api/auth/register
   ========================= */
router.post('/register', async (req, res) => {
  const { email, password, username } = req.body;

  if (!email || !password || !username) {
    return res.status(400).json({ message: 'Email, password, and username are required.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
  }

  try {
    // 1. ตรวจสอบว่า email หรือ username ซ้ำหรือไม่
    const { data: existingUser, error: checkError } = await supabase
      .from('profiles')
      .select('email, username')
      .or(`email.eq.${email},username.eq.${username}`)
      .maybeSingle();

    if (checkError) throw checkError;
    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(409).json({ message: 'Email already exists.' });
      }
      if (existingUser.username === username) {
        return res.status(409).json({ message: 'Username already exists.' });
      }
    }

    // 2. แฮชรหัสผ่าน
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // 3. (สำคัญ) Insert User ใหม่ลงตาราง 'profiles' โดยตรง
    const { data: newUser, error: insertError } = await supabase
      .from('profiles')
      .insert({
        email: email,
        username: username,
        password_hash: password_hash
      })
      .select('id, email, username, created_at')
      .single();
    
    if (insertError) {
       // RLS อาจจะบล็อกการ insert ถ้าไม่ได้เปิด "anon" role
       console.error("Supabase Insert Error (Check RLS on profiles):", insertError);
       throw insertError;
    }

    res.status(201).json({ message: 'Registration successful! Please login.', user: newUser });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ message: 'Server error during registration', error: err.message });
  }
});

/* =========================
   🟩 LOGIN (JWT)
   POST /api/auth/login
   ========================= */
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }
  
  try {
    // 1. ดึงข้อมูลผู้ใช้จากตาราง profiles (ต้องดึง password_hash มาด้วย)
    const { data: user, error } = await supabase
      .from('profiles')
      .select('id, email, username, password_hash, is_admin, is_filmmaker, is_subscriber') // ดึง field ที่จำเป็น
      .eq('email', email)
      .single();

    if (error || !user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // 2. ตรวจสอบรหัสผ่าน (สำหรับ User ที่ย้ายมา อาจจะยังไม่มีรหัส)
    if (!user.password_hash) {
       return res.status(401).json({ message: 'Account not setup. Please use "Forgot Password" to create a password.' });
    }

    // 3. (สำคัญ) ใช้ bcrypt.compare เพื่อเทียบรหัสผ่าน
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // 4. สร้าง JWT payload
    const payload = {
      id: user.id,
      email: user.email,
      username: user.username,
      is_admin: user.is_admin ?? false,
      is_filmmaker: user.is_filmmaker ?? false,
      is_subscriber: user.is_subscriber ?? false
    };

    // 5. สร้าง JWT token
    const token = jwt.sign(
      payload,
      JWT_SECRET,
      { expiresIn: '7d' } // อายุ 7 วัน
    );
    
    // (ลบ password_hash ออกจาก object ที่จะส่งกลับ)
    delete user.password_hash;

    // 6. ส่ง token และข้อมูล user กลับให้ client
    res.status(200).json({
      message: 'Login successful!',
      token,
      user: user, // ส่งข้อมูล user ที่ clean แล้วกลับไป
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});


/* =========================
   🟨 FORGOT PASSWORD
   POST /api/auth/forgot-password
   ========================= */
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    try {
        const { data: user, error } = await supabase
            .from('profiles')
            .select('id, email')
            .eq('email', email)
            .single();

        if (error || !user) {
            // เราจะไม่บอกว่า "ไม่พบผู้ใช้" เพื่อความปลอดภัย
            return res.status(200).json({ message: 'If an account with this email exists, a reset link will be sent.' });
        }

        // สร้าง Token พิเศษสำหรับ Reset (มีอายุสั้นๆ)
        const resetToken = jwt.sign(
            { id: user.id }, // Payload มีแค่ ID
            JWT_SECRET, // ใช้ Secret เดียวกัน (หรือจะแยกก็ได้)
            { expiresIn: JWT_RESET_EXPIRES_IN }
        );

        // --- (จำลองการส่ง Email) ---
        // ในระบบจริง เราจะส่ง email ที่มี link นี้
        const resetLink = `http://localhost:3000/reset-password/${resetToken}`;
        
        console.log("=====================================================");
        console.log("         📧 SIMULATED EMAIL (FORGOT PASSWORD) 📧     ");
        console.log(`To: ${email}`);
        console.log("Please click the link below to reset your password:");
        console.log(resetLink);
        console.log(`(This link will expire in ${JWT_RESET_EXPIRES_IN})`);
        console.log("=====================================================");
        // --- (จบการจำลอง) ---

        res.json({ message: 'If an account with this email exists, a reset link will be sent.' });
    } catch (err) {
        console.error('Forgot Password error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});


/* =========================
   🟨 RESET PASSWORD
   POST /api/auth/reset-password
   ========================= */
router.post('/reset-password', async (req, res) => {
    const { token, newPassword } = req.body;
    
    if (!token || !newPassword) {
        return res.status(400).json({ message: 'Token and new password are required.' });
    }
     if (newPassword.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }

    try {
        // 1. ตรวจสอบ Token
        let payload;
        try {
            payload = jwt.verify(token, JWT_SECRET);
        } catch (verifyError) {
            return res.status(401).json({ message: 'Invalid or expired token.' });
        }

        const userId = payload.id;
        if (!userId) {
             return res.status(401).json({ message: 'Invalid token payload.' });
        }

        // 2. แฮชรหัสผ่านใหม่
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(newPassword, salt);

        // 3. อัปเดตรหัสผ่านในตาราง profiles
        const { error: updateError } = await supabase
            .from('profiles')
            .update({ password_hash: password_hash })
            .eq('id', userId);

        if (updateError) throw updateError;

        res.json({ message: 'Password has been reset successfully. Please login.' });

    } catch (err) {
         console.error('Reset Password error:', err);
         res.status(500).json({ message: 'Server error', error: err.message });
    }
});


export default router;