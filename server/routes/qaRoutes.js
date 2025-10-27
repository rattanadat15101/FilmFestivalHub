// /server/routes/qaRoutes.js
import express from 'express';
import { supabase } from '../utils/supabaseServer.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// ---
// GET /api/qa/schedule
// (Public) ดึงตาราง Q&A ที่ "อนุมัติแล้ว"
// ---
router.get('/schedule', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('live_qas')
      .select(`
        id, scheduled_at,
        films:film_id ( title, poster_url ),
        profiles:filmmaker_id ( username )
      `) // <-- [FIXED] ใช้ Join แบบชัดเจน
      .eq('status', 'approved') // ดึงเฉพาะที่อนุมัติแล้ว
      .order('scheduled_at', { ascending: true }); // เรียงตามเวลา

    if (error) {
        console.error("!!! Supabase Error in /qa/schedule:", error);
        throw error;
    }
    res.json(data);
  } catch (err) {
    console.error("Error fetching Q&A schedule:", err);
    res.status(500).json({ message: 'Error fetching Q&A schedule', error: err.message });
  }
});

// ---
// GET /api/qa/session/:id
// (Protected) ดึงข้อมูลสำหรับเข้าห้อง Live (เช่น Stream URL)
// ---
router.get('/session/:id', authMiddleware, async (req, res) => {
  const { id: qaId } = req.params;

  try {
    const { data, error } = await supabase
      .from('live_qas')
      .select('*')
      .eq('id', qaId)
      // .eq('status', 'approved') // (เอาสถานะออก ให้เข้าได้เลยเผื่อ Admin จะเทส)
      .single();

    if (error || !data) {
      return res.status(404).json({ message: 'Live Q&A session not found.' });
    }
    
    res.json(data);
  } catch (err) {
    console.error("Error fetching Q&A session:", err);
    res.status(500).json({ message: 'Error fetching Q&A session', error: err.message });
  }
});

// ---
// GET /api/qa/messages/:id
// (Protected) ดึง "แชทเก่า" ทั้งหมดของห้องนี้
// ---
router.get('/messages/:id', authMiddleware, async (req, res) => {
  const { id: qaId } = req.params;

  try {
    const { data, error } = await supabase
      .from('qa_messages')
      .select(`
        id, sent_at, message,
        profiles:user_id ( username )
      `) // <-- [FIXED] ใช้ Join แบบชัดเจน
      .eq('qa_id', qaId)
      .order('sent_at', { ascending: true }); // เรียงจากเก่าไปใหม่

    if (error) {
        console.error("!!! Supabase Error in /qa/messages:", error);
        throw error;
    }
    res.json(data);
  } catch (err) {
    console.error("Error fetching chat messages:", err);
    res.status(500).json({ message: 'Error fetching chat messages', error: err.message });
  }
});


// ---
// POST /api/qa/messages
// (Protected) ส่งข้อความแชทใหม่
// ---
router.post('/messages', authMiddleware, async (req, res) => {
  const { qaId, message } = req.body;
  const { id: userId } = req.user; // ได้ user id จาก token

  if (!qaId || !message) {
    return res.status(400).json({ message: 'Q&A ID and message are required.' });
  }

  try {
    // 1. ส่งแชทเข้า Database (ผ่าน Node.js)
    // RLS Policy ของตาราง qa_messages จะเช็กว่า "Authenticated"
    const { data, error } = await supabase
      .from('qa_messages')
      .insert({
        qa_id: parseInt(qaId), // ตรวจสอบว่าเป็น Integer
        user_id: userId,
        message: message
      })
      .select()
      .single();

    if (error) {
        console.error("!!! Supabase Error in POST /qa/messages:", error);
        throw error;
    }

    // 2. ส่งข้อความที่เพิ่งสร้างกลับไป (Client จะได้เอาไปแสดงผลทันที)
    res.status(201).json(data); 

  } catch (err) {
    console.error("Error sending message:", err);
    res.status(500).json({ message: 'Error sending message', error: err.message });
  }
});


export default router;