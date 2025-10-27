// /server/routes/userRoutes.js
import express from 'express';
import jwt from 'jsonwebtoken';
import 'dotenv/config';
import { supabase } from '../utils/supabaseServer.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

/* =========================
   🟩 LOGIN (JWT AUTH)
   POST /api/user/login
   ========================= */
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1️⃣ ดึงข้อมูลผู้ใช้จากตาราง profiles
    const { data: user, error } = await supabase
      .from('profiles')
      .select('id, email, password_hash, is_admin')
      .eq('email', email)
      .single();

    if (error || !user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // 2️⃣ ตรวจสอบรหัสผ่าน (สมมุติว่า password เก็บเป็น plain-text)
    // ❗ หากใช้ bcrypt ให้เปลี่ยนเป็น bcrypt.compare(password, user.password_hash)
    if (user.password_hash !== password) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // 3️⃣ สร้าง JWT token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        is_admin: user.is_admin ?? false,
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' } // อายุ 7 วัน
    );

    // 4️⃣ ส่ง token กลับให้ client
    res.status(200).json({
      message: 'Login successful!',
      token,
      user: {
        id: user.id,
        email: user.email,
        is_admin: user.is_admin ?? false,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/* =====================================================
   🔽 ส่วนอื่น ๆ (mock-subscribe, apply-filmmaker, etc.)
   ===================================================== */

// ---
// POST /api/user/mock-subscribe
// (Protected) Endpoint สำหรับ "จำลอง" การจ่ายเงิน
// ---
router.post('/mock-subscribe', authMiddleware, async (req, res) => {
  const { id: userId } = req.user; // 1. เอา user id จาก token

  try {
    const subscriptionEndDate = new Date();
    subscriptionEndDate.setDate(subscriptionEndDate.getDate() + 30);

    const { data, error } = await supabase
      .from('profiles')
      .update({
        is_subscriber: true,
        subscription_end_date: subscriptionEndDate
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    res.status(200).json({
      message: 'Subscription successful!',
      profile: data
    });

  } catch (err) {
    console.error('Mock subscription error:', err);
    res.status(500).json({ message: 'Error upgrading account', error: err.message });
  }
});

// ---
// POST /api/user/apply-filmmaker
// ---
router.post('/apply-filmmaker', authMiddleware, async (req, res) => {
  const { id: userId } = req.user;
  const { reason } = req.body;
  try {
    const { data: existingApp, error: checkError } = await supabase
      .from('filmmaker_applications')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (checkError) throw checkError;
    if (existingApp) {
      return res.status(409).json({ message: 'You have already submitted an application.' });
    }

    const { error: insertError } = await supabase
      .from('filmmaker_applications')
      .insert({ user_id: userId, reason: reason || '' });

    if (insertError) throw insertError;

    res.status(201).json({ message: 'Application submitted successfully.' });
  } catch (err) {
    console.error("Error in /apply-filmmaker:", err);
    res.status(500).json({ message: 'Error submitting application', error: err.message });
  }
});

// ---
// GET /api/user/my-application
// ---
router.get('/my-application', authMiddleware, async (req, res) => {
  const { id: userId } = req.user;
  try {
    const { data, error } = await supabase
      .from('filmmaker_applications')
      .select('status')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    if (!data) return res.status(404).json({ message: 'No application found.' });
    res.json(data);
  } catch (err) {
    console.error("Error fetching application status:", err);
    res.status(500).json({ message: 'Error fetching application status', error: err.message });
  }
});

// ---
// POST /api/user/request-qa
// ---
router.post('/request-qa', authMiddleware, async (req, res) => {
  const { id: userId } = req.user;
  const { filmId, scheduledAt, streamUrl } = req.body;

  if (!filmId || !scheduledAt) {
    return res.status(400).json({ message: 'Film ID and Scheduled Time are required.' });
  }

  try {
    const { data: film, error: filmError } = await supabase
      .from('films')
      .select('filmmaker_id')
      .eq('id', filmId)
      .single();

    if (filmError || !film) {
      return res.status(404).json({ message: 'Film not found.' });
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', userId)
      .single();

    if (profileError) throw profileError;

    if (film.filmmaker_id !== userId && !profile.is_admin) {
      return res.status(403).json({ message: 'Forbidden: You do not own this film.' });
    }

    const status = (profile.is_admin && streamUrl) ? 'approved' : 'requested';

    const { error: insertError } = await supabase
      .from('live_qas')
      .insert({
        film_id: filmId,
        filmmaker_id: userId,
        scheduled_at: scheduledAt,
        status: status,
        stream_url: (status === 'approved') ? streamUrl : null
      });

    if (insertError) throw insertError;

    res.status(201).json({
      message: (status === 'approved')
        ? 'Live Q&A session posted and approved.'
        : 'Live Q&A session requested successfully.'
    });
  } catch (err) {
    console.error("Error in /request-qa:", err);
    res.status(500).json({ message: 'Error requesting Q&A session', error: err.message });
  }
});

router.get('/profile', authMiddleware, async (req, res) => {
  const userId = req.user.id;

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;

    res.json(data);
  } catch (err) {
    console.error('Error fetching profile:', err);
    res.status(500).json({ message: 'Error fetching profile', error: err.message });
  }
});
export default router;
