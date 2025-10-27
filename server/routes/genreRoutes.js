// /server/routes/genreRoutes.js
import express from 'express';
import { supabase } from '../utils/supabaseServer.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { adminMiddleware } from '../middleware/adminMiddleware.js'; // Admin เท่านั้นที่จัดการ Genre ได้

const router = express.Router();

// ---
// GET /api/genres (Public)
// ดึง Genre ทั้งหมดสำหรับแสดงผล
// ---
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('genres')
      .select('id, name')
      .order('name', { ascending: true }); // เรียงตามชื่อ

    if (error) {
        console.error("Error fetching genres:", err);
        throw error;
    }
    res.json(data);
  } catch (err) {
    console.error("Error fetching genres:", err);
    res.status(500).json({ message: 'Error fetching genres', error: err.message });
  }
});


// === เส้นทางต่อไปนี้ ต้องเป็น Admin เท่านั้น ===
router.use(authMiddleware);
router.use(adminMiddleware);

// ---
// POST /api/genres (Admin)
// สร้าง Genre ใหม่
// ---
router.post('/', async (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ message: 'Genre name is required.' });
  }
  try {
    const { data, error } = await supabase
      .from('genres')
      .insert({ name: name })
      .select()
      .single();

    if (error) {
       // Handle unique constraint error (genre name already exists)
       if (error.code === '23505') {
            return res.status(409).json({ message: `Genre '${name}' already exists.` });
       }
       console.error("Error creating genre:", error);
       throw error;
    }
    res.status(201).json(data);
  } catch (err) {
    console.error("Error creating genre:", err);
    res.status(500).json({ message: 'Error creating genre', error: err.message });
  }
});

// ---
// PUT /api/genres/:id (Admin)
// แก้ไขชื่อ Genre
// ---
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ message: 'Genre name is required.' });
  }
  try {
    const { data, error } = await supabase
      .from('genres')
      .update({ name: name })
      .eq('id', id)
      .select()
      .single();

    if (error) {
         if (error.code === '23505') { // Handle unique constraint error
            return res.status(409).json({ message: `Genre name '${name}' already exists.` });
        }
        console.error(`Error updating genre ${id}:`, error);
        throw error;
    }
     if (!data) return res.status(404).json({ message: 'Genre not found.' }); // Check if update returned data
    res.json(data);
  } catch (err) {
    console.error(`Error updating genre ${id}:`, err);
    res.status(500).json({ message: 'Error updating genre', error: err.message });
  }
});

// ---
// DELETE /api/genres/:id (Admin)
// ลบ Genre
// ---
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // การลบ Genre จะ Cascade ไปลบใน film_genres ด้วย (ตามที่เราตั้งค่าตอนสร้างตาราง)
    const { error } = await supabase
      .from('genres')
      .delete()
      .eq('id', id);

    if (error) {
        console.error(`Error deleting genre ${id}:`, error);
        throw error;
    }
    res.json({ message: 'Genre deleted successfully.' });
  } catch (err) {
    console.error(`Error deleting genre ${id}:`, err);
    res.status(500).json({ message: 'Error deleting genre', error: err.message });
  }
});


export default router;