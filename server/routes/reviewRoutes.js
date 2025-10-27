// /server/routes/reviewRoutes.js
import express from 'express';
import { supabase } from '../utils/supabaseServer.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { adminMiddleware } from '../middleware/adminMiddleware.js'; // (สำหรับ Admin ลบรีวิว)

const router = express.Router();

// ---
// GET /api/reviews/:filmId
// (Public) ดึงรีวิวทั้งหมดของหนังเรื่องนั้น
// ---
router.get('/:filmId', async (req, res) => {
  const { filmId } = req.params;

  try {
    // เราจะดึงรีวิว (reviews) และข้อมูลคนเขียน (profiles) มาพร้อมกัน
    const { data, error } = await supabase
      .from('reviews')
      .select(`
        id,
        comment,
        rating,
        created_at,
        profiles:user_id ( username )
      `)
      .eq('film_id', filmId)
      .order('created_at', { ascending: false }); // เรียงจากใหม่ไปเก่า

    if (error) {
        console.error("!!! Supabase Error in /reviews/:filmId:", error);
        throw error;
    }
    
    res.json(data);
  } catch (err) {
    console.error("Error fetching reviews:", err);
    res.status(500).json({ message: 'Error fetching reviews', error: err.message });
  }
});

// ---
// POST /api/reviews
// (Protected) สร้างรีวิวใหม่ (ต้อง Login)
// ---
router.post('/', authMiddleware, async (req, res) => {
  const { filmId, rating, comment } = req.body;
  const { id: userId } = req.user; // ได้ user id จาก authMiddleware

  if (!filmId || !rating) {
      return res.status(400).json({ message: 'Film ID and rating are required.' });
  }

  try {
    // RLS Policy (ใน SQL) จะเช็กว่า user นี้ (auth.uid()) 
    // มีสิทธิ์ insert (เพราะเป็น 'authenticated')
    const { data, error } = await supabase
      .from('reviews')
      .insert({
        film_id: parseInt(filmId),
        user_id: userId,
        rating: parseInt(rating),
        comment: comment
      })
      .select() // ส่งข้อมูลที่เพิ่งสร้างกลับไป
      .single();
      
    if (error) {
      // ตรวจจับ Error ที่พบบ่อย (เช่น รีวิวซ้ำ)
      if (error.code === '23505') { // unique_violation (film_id, user_id)
        return res.status(409).json({ message: 'You have already reviewed this film.' });
      }
      console.error("!!! Supabase Error in POST /reviews:", error);
      throw error;
    }
    
    res.status(201).json(data); // 201 = Created
  } catch (err) {
    console.error("Error posting review:", err);
    res.status(500).json({ message: 'Error posting review', error: err.message });
  }
});

// ---
// DELETE /api/reviews/:reviewId
// (Admin only) ลบรีวิวที่ไม่เหมาะสม
// ---
router.delete('/:reviewId', authMiddleware, adminMiddleware, async (req, res) => {
    const { reviewId } = req.params;

    try {
        // (RLS Policy ของเราอนุญาตให้ Admin ลบได้)
        const { error } = await supabase
            .from('reviews')
            .delete()
            .eq('id', reviewId);

        if (error) {
            console.error("!!! Supabase Error in DELETE /reviews:", error);
            throw error;
        }
        
        res.json({ message: 'Review deleted successfully.' });
    } catch (err) {
        console.error("Error deleting review:", err);
        res.status(500).json({ message: 'Error deleting review', error: err.message });
    }
});


export default router;