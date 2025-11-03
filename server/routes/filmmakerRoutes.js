// /server/routes/filmmakerRoutes.js
import express from 'express';
import { supabase } from '../utils/supabaseServer.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import multer from 'multer';

const router = express.Router();

const storage = multer.memoryStorage();
// Middleware สำหรับหน้า Edit (รับแค่ Poster)
const editUpload = multer({ storage: storage }).single('filmPoster');
// Middleware สำหรับหน้า Upload (รับ VDO และ Poster)
const upload = multer({ storage: storage }).fields([
  { name: 'filmVideo', maxCount: 1 },
  { name: 'filmPoster', maxCount: 1 }
]);

// ---
// GET /api/filmmaker/my-films
// (Filmmaker) ดึงหนังทั้งหมดของตัวเองสำหรับหน้า Creator Studio
// ---
router.get('/my-films', authMiddleware, async (req, res) => {
  const { id: userId } = req.user;
  try {
    const { data, error } = await supabase
      .from('films')
      .select(`
        id, 
        title, 
        status, 
        poster_url,
        is_premium,
        view_count, // ⬅️ เพิ่ม
        live_qas ( id, status, scheduled_at, stream_url )
      `)
      .eq('filmmaker_id', userId)
      .order('id', { ascending: false }); // เรียงจากใหม่ไปเก่า

    if (error) {
        console.error("Error fetching my-films:", error);
        throw error;
    }
    res.json(data);
  } catch (err) {
    console.error("Error fetching user films:", err);
    res.status(500).json({ message: 'Error fetching user films', error: err.message });
  }
});


// ---
// POST /api/filmmaker/upload
// (Filmmaker/Admin) อัปโหลดหนังใหม่
// ---
router.post(
  '/upload',
  authMiddleware,
  upload, // ใช้ multer แบบ .fields()
  async (req, res) => {
    const { id: userId } = req.user;
    const { title, synopsis, genreIds: genreIdsString } = req.body;
    
    // ดึงไฟล์จาก req.files
    const videoFile = req.files['filmVideo']?.[0];
    const posterFile = req.files['filmPoster']?.[0];

    // แปลง genreIds (ที่เป็น JSON string) กลับเป็น Array
    let genreIds = [];
    if (genreIdsString) {
        try {
            genreIds = JSON.parse(genreIdsString);
            if (!Array.isArray(genreIds)) genreIds = [];
        } catch (e) {
            console.warn("Could not parse genreIds:", genreIdsString);
            genreIds = [];
        }
    }

    if (!videoFile) {
      return res.status(400).json({ message: 'No video file provided.' });
    }

    try {
      // เช็กสิทธิ์ (ต้องเป็น Filmmaker หรือ Admin)
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('is_filmmaker, is_admin')
        .eq('id', userId)
        .single();
      if (profileError || (!profile.is_filmmaker && !profile.is_admin)) {
        return res.status(403).json({ message: 'Forbidden. Filmmaker or Admin access required.' });
      }

      // --- อัปโหลด Video ---
      const videoFileName = `${userId}/${Date.now()}_video_${videoFile.originalname}`;
      const { error: videoUploadError } = await supabase.storage
        .from('films')
        .upload(videoFileName, videoFile.buffer, { contentType: videoFile.mimetype, cacheControl: '3600' });
      if (videoUploadError) throw videoUploadError;
      const { data: videoUrlData } = supabase.storage.from('films').getPublicUrl(videoFileName);
      const videoPublicUrl = videoUrlData.publicUrl;

      // --- อัปโหลด Poster (ถ้ามี) ---
      let posterPublicUrl = null;
      if (posterFile) {
        const posterFileName = `${userId}/${Date.now()}_poster_${posterFile.originalname}`;
        const { error: posterUploadError } = await supabase.storage
          .from('films') // ใช้ Bucket เดียวกัน
          .upload(posterFileName, posterFile.buffer, { contentType: posterFile.mimetype, cacheControl: '3600' });
        
        if (posterUploadError) {
             console.error("Error uploading poster:", posterUploadError);
             // (ไม่ throw error, ปล่อยให้ดำเนินการต่อแม้ poster พัง)
        } else {
             const { data: posterUrlData } = supabase.storage.from('films').getPublicUrl(posterFileName);
             posterPublicUrl = posterUrlData.publicUrl;
        }
      }

      // --- บันทึกข้อมูลหนัง (Films table) ---
      const status = profile.is_admin ? 'approved' : 'pending'; // Admin อนุมัติอัตโนมัติ
      const { data: newFilm, error: filmInsertError } = await supabase
        .from('films')
        .insert({
          title: title,
          synopsis: synopsis,
          video_url: videoPublicUrl,
          poster_url: posterPublicUrl,
          filmmaker_id: userId,
          status: status
          // view_count จะใช้ default 0
        })
        .select('id') // เอา ID หนังใหม่กลับมา
        .single();

      if (filmInsertError) throw filmInsertError;
      const newFilmId = newFilm.id;

      // --- บันทึกข้อมูล (film_genres table) ---
      if (genreIds.length > 0) {
        const filmGenreData = genreIds.map(genreId => ({
          film_id: newFilmId,
          genre_id: parseInt(genreId)
        }));
        const { error: genreInsertError } = await supabase
          .from('film_genres')
          .insert(filmGenreData);
        if (genreInsertError) {
             console.error("Error inserting genres for new film:", genreInsertError);
             // (ไม่ throw error, ปล่อยให้หนังถูกสร้าง)
        }
      }

      const message = (status === 'approved')
        ? 'Film uploaded and approved successfully.'
        : 'Film uploaded successfully. Pending approval.';
      res.status(201).json({ message: message });

    } catch (err) {
      console.error('Upload Error:', err);
      // (ควรมี Logic ลบไฟล์ที่อัปโหลดไปแล้ว ถ้า DB พัง)
      res.status(500).json({ message: 'Error uploading film', error: err.message });
    }
  }
);

// ---
// GET /api/filmmaker/film/:filmId/details
// ดึงข้อมูลหนังเรื่องเดียว (สำหรับหน้า Edit)
// ---
router.get('/film/:filmId/details', authMiddleware, async (req, res) => {
    const { id: userId } = req.user;
    const { filmId } = req.params;
    try {
        // ดึงข้อมูลหนัง พร้อม genreIds ที่ผูกอยู่
        const { data: film, error } = await supabase
            .from('films')
            .select(`
                *,
                film_genres ( genre_id )
            `)
            .eq('id', filmId)
            .eq('filmmaker_id', userId) // เช็กเจ้าของ
            .single();

        if (error) throw error;
        if (!film) return res.status(404).json({ message: 'Film not found or you do not own it.' });

        // แปลง genre IDs ให้อยู่ในรูปแบบ Array [1, 2, 3]
        const genreIds = film.film_genres.map(fg => fg.genre_id);
        const filmDetails = { ...film, genreIds }; // เอา genreIds ไปแปะรวม

        res.json(filmDetails);
    } catch (err) {
         console.error(`Error fetching details for film ${filmId}:`, err);
        res.status(500).json({ message: 'Error fetching film details', error: err.message });
    }
});


// ---
// PUT /api/filmmaker/film/:filmId
// (Filmmaker) อัปเดตข้อมูลหนัง (Title, Synopsis, Poster, Genres)
// ---
router.put(
  '/film/:filmId',
  authMiddleware,
  editUpload, // ใช้ multer แบบ .single('filmPoster')
  async (req, res) => {
    const { id: userId } = req.user;
    const { filmId } = req.params;
    const { title, synopsis, genreIds: genreIdsString } = req.body;
    const newPosterFile = req.file; // รับไฟล์ Poster ใหม่ (ถ้ามี)

    // แปลง genreIds
    let genreIds = [];
    if (genreIdsString) {
        try {
            genreIds = JSON.parse(genreIdsString);
            if (!Array.isArray(genreIds)) genreIds = [];
        } catch (e) { genreIds = []; }
    }

    try {
      // 1. ดึงข้อมูลหนังเดิม (เช็กเจ้าของ + เอา URL โปสเตอร์เก่า)
      const { data: existingFilm, error: selectError } = await supabase
        .from('films')
        .select('filmmaker_id, poster_url')
        .eq('id', filmId)
        .single();

      if (selectError) throw selectError;
      if (!existingFilm) return res.status(404).json({ message: 'Film not found.' });
      if (existingFilm.filmmaker_id !== userId) {
        return res.status(403).json({ message: 'Forbidden: You do not own this film.' });
      }

      const updateData = { title, synopsis };
      let oldPosterFileName = null;

      // 2. ถ้ามีการอัปโหลด Poster ใหม่
      if (newPosterFile) {
        // อัปโหลดไฟล์ใหม่
        const posterFileName = `${userId}/${Date.now()}_poster_${newPosterFile.originalname}`;
        const { error: posterUploadError } = await supabase.storage
          .from('films')
          .upload(posterFileName, newPosterFile.buffer, { contentType: newPosterFile.mimetype });
        
        if (posterUploadError) throw posterUploadError;
        
        const { data: posterUrlData } = supabase.storage.from('films').getPublicUrl(posterFileName);
        updateData.poster_url = posterUrlData.publicUrl; // เพิ่ม URL ใหม่ในข้อมูลที่จะอัปเดต

        // เก็บชื่อไฟล์เก่าไว้ (ถ้ามี) เพื่อลบทิ้งทีหลัง
        if (existingFilm.poster_url) {
            oldPosterFileName = existingFilm.poster_url.split('/films/')[1];
        }
      }

      // 3. อัปเดตข้อมูลใน Database (ตาราง films)
      const { error: filmUpdateError } = await supabase
        .from('films')
        .update(updateData)
        .eq('id', filmId);

      if (filmUpdateError) throw filmUpdateError;

      // 4. อัปเดตข้อมูลใน Database (ตาราง film_genres)
      // 4.1 ลบของเก่าทิ้งทั้งหมด
      const { error: deleteGenresError } = await supabase
          .from('film_genres')
          .delete()
          .eq('film_id', filmId);
      if (deleteGenresError) throw deleteGenresError;

      // 4.2 ใส่ของใหม่เข้าไป (ถ้ามี)
      if (genreIds.length > 0) {
          const filmGenreData = genreIds.map(genreId => ({
              film_id: parseInt(filmId),
              genre_id: parseInt(genreId)
          }));
          const { error: genreInsertError } = await supabase
              .from('film_genres')
              .insert(filmGenreData);
          if (genreInsertError) throw genreInsertError;
      }
      
      // 5. (ถ้ามี) ลบ Poster เก่าออกจาก Storage
      if (oldPosterFileName) {
          await supabase.storage.from('films').remove([oldPosterFileName]);
      }

      res.json({ message: 'Film details updated successfully.' });
    } catch (err) {
      console.error(`Error updating film ${filmId}:`, err);
      res.status(500).json({ message: 'Error updating film', error: err.message });
    }
  }
);


// ---
// PUT /api/filmmaker/film/:filmId/toggle-premium
// (Filmmaker) สลับสถานะ Premium
// ---
router.put('/film/:filmId/toggle-premium', authMiddleware, async (req, res) => {
  const { id: userId } = req.user;
  const { filmId } = req.params;
  const { makePremium } = req.body;
  
  console.log(`[Backend] Toggle Premium: Film ${filmId} by User ${userId}`);
  
  try {
    const { data: film, error: selectError } = await supabase
      .from('films')
      .select('filmmaker_id')
      .eq('id', filmId)
      .single();
      
    if (selectError) throw selectError;
    if (!film) return res.status(404).json({ message: 'Film not found.' });
    if (film.filmmaker_id !== userId) {
       console.error(`[Backend] User ${userId} attempted to modify film ${filmId} owned by ${film.filmmaker_id}`);
       return res.status(403).json({ message: 'Forbidden: You do not own this film.' });
    }

    const { error: updateError } = await supabase
      .from('films')
      .update({ is_premium: makePremium })
      .eq('id', filmId);
      
    if (updateError) {
        console.error(`[Backend] Supabase Update Error (Premium):`, updateError);
        throw updateError;
    }
    
    res.json({ message: `Film is now ${makePremium ? 'Premium' : 'Standard'}.` });
  } catch (err) {
    console.error(`Error updating premium status for film ${filmId}:`, err);
    res.status(500).json({ message: 'Error updating premium status', error: err.message });
  }
});


// ---
// DELETE /api/filmmaker/film/:filmId
// (Filmmaker/Admin) ลบหนัง
// ---
router.delete('/film/:filmId', authMiddleware, async (req, res) => {
  const { id: userId } = req.user;
  const { filmId } = req.params;
  
  console.log(`[Backend] Delete Film: Film ${filmId} by User ${userId}`);
  
  try {
    // 1. ดึงข้อมูลหนัง (เช็กเจ้าของ + เอา URL ไฟล์)
    const { data: film, error: selectError } = await supabase.from('films').select('filmmaker_id, video_url, poster_url').eq('id', filmId).single();
    if (selectError) throw selectError;
    if (!film) return res.status(404).json({ message: 'Film not found.' });
    
    // 2. เช็กสิทธิ์ (ต้องเป็นเจ้าของ หรือ Admin)
    if (film.filmmaker_id !== userId) {
      const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', userId).single();
      if (!profile?.is_admin) {
        return res.status(403).json({ message: 'Forbidden: You do not own this film.' });
      }
    }

    // 3. ลบไฟล์ออกจาก Storage
    const filesToRemove = [];
    if (film.video_url) filesToRemove.push(film.video_url.split('/films/')[1]);
    if (film.poster_url) filesToRemove.push(film.poster_url.split('/films/')[1]);
    if (filesToRemove.length > 0) {
        await supabase.storage.from('films').remove(filesToRemove);
    }

    // 4. ลบข้อมูลออกจาก Database
    const { error: deleteError } = await supabase.from('films').delete().eq('id', filmId);
    if (deleteError) {
        console.error(`[Backend] Supabase Delete Error:`, deleteError);
        throw deleteError;
    }
    
    res.json({ message: 'Film deleted successfully.' });
  } catch (err) {
    console.error(`Error deleting film ${filmId}:`, err);
    res.status(500).json({ message: 'Error deleting film', error: err.message });
  }
});


// ---
// DELETE /api/filmmaker/qa/:qaId
// (Filmmaker) ยกเลิกคำขอ Q&A ของตัวเอง
// ---
router.delete('/qa/:qaId', authMiddleware, async (req, res) => {
  const { id: userId } = req.user;
  const { qaId } = req.params;

  try {
    // RLS Policy (ใน SQL) จะช่วยป้องกันการลบของคนอื่น
    const { error } = await supabase
      .from('live_qas')
      .delete()
      .eq('id', qaId)
      .eq('filmmaker_id', userId); // เช็กซ้ำใน API เพื่อความปลอดภัย
    
    if (error) throw error;
    
    res.json({ message: 'Q&A request cancelled successfully.' });
  } catch (err) {
    console.error("Error cancelling Q&A:", err);
    res.status(500).json({ message: 'Error cancelling Q&A session', error: err.message });
  }
});


export default router;