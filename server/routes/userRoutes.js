// /server/routes/userRoutes.js
import express from 'express';
import jwt from 'jsonwebtoken';
import 'dotenv/config';
import { supabase } from '../utils/supabaseServer.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

/* =========================
   ❌ (REMOVED) LOGIN (JWT AUTH)
   POST /api/user/login
   (ย้าย Logic ทั้งหมดไปที่ /server/routes/authRoutes.js แล้ว)
   ========================= */

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

// ---
// GET /api/user/profile
// (สำคัญมาก) Endpoint นี้จะใช้โดย AuthContext เพื่อดึงข้อมูล User
// ---
router.get('/profile', authMiddleware, async (req, res) => {
  // req.user มาจาก authMiddleware (payload ของ JWT)
  const userId = req.user.id; 

  try {
    // ดึงข้อมูล "ล่าสุด" จาก DB (เผื่อมีการเปลี่ยนสิทธิ์)
    // (ไม่ควรดึง password_hash กลับไป!)
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, username, created_at, is_admin, is_filmmaker, is_subscriber, subscription_end_date')
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