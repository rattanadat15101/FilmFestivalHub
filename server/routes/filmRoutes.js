// /server/routes/filmRoutes.js
import express from 'express';
import { supabase } from '../utils/supabaseServer.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// ---
// GET /api/films
// (อัปเดต: เรียกใช้ SQL Function ใหม่ get_films_sorted_by_rating)
// ---
router.get('/', async (req, res) => {
  const searchTerm = req.query.search;
  const genreId = req.query.genre;

  try {
    // เรียกใช้ Function จาก Node.js ผ่าน RPC
    // ฟังก์ชันนี้จะทำการ Join, คำนวณเรตติ้งเฉลี่ย, Filter, Search, และ Sort ให้เสร็จสรรพ
    const { data, error } = await supabase.rpc('get_films_sorted_by_rating', {
        search_term: searchTerm || null,
        // แปลง genreId เป็น Integer หรือ null
        filter_genre_id: genreId ? parseInt(genreId) : null
    });

    if (error) {
        console.error("!!! Supabase RPC Error in /films (get_films_sorted_by_rating):", error);
        throw error;
    }

    // Function คืนค่าข้อมูลที่จัดรูปแบบและเรียงลำดับแล้ว
    res.json(data);

  } catch (err) {
    console.error("Error fetching films:", err);
    res.status(500).json({ message: 'Server error fetching films', error: err.message });
  }
});


// ---
// GET /api/films/:id
// (ดึงข้อมูลหนังเรื่องเดียวสำหรับหน้า Detail)
// ---
router.get('/:id', authMiddleware, async (req, res) => {
  const { id: filmId } = req.params;
  const { id: userId } = req.user;
  try {
    // ดึงข้อมูลหนัง, ผู้สร้าง, และ genres (และ view_count)
    const { data: film, error: filmError } = await supabase
      .from('films')
      .select(`
          *,
          view_count, 
          profiles:filmmaker_id ( username ),
          film_genres ( genres ( id, name ) )
      `)
      .eq('id', filmId)
      .single();

    if (filmError || !film) return res.status(404).json({ message: 'Film not found' });

    // จัดรูปแบบ Genres (ถ้ามี)
    const formattedFilm = {
        ...film,
        genres: film.film_genres ? film.film_genres.map(fg => fg.genres) : []
    };
    delete formattedFilm.film_genres; // ลบ field เดิมออก


    // เช็กสถานะ (Approved, Hidden) และสิทธิ์ (Owner, Admin)
    const { data: profile } = await supabase.from('profiles').select('is_admin, is_subscriber, subscription_end_date').eq('id', userId).maybeSingle();
    if (formattedFilm.status !== 'approved' && formattedFilm.status !== 'hidden') {
        if (formattedFilm.filmmaker_id !== userId && !profile?.is_admin) {
             return res.status(404).json({ message: 'Film not available' });
        }
    }
    
    // เช็ก Premium
    if (formattedFilm.is_premium) {
      const isSubscribed = profile?.is_subscriber && profile.subscription_end_date && new Date(profile.subscription_end_date) > new Date();
      if (!isSubscribed) {
        // ถ้าโดนบล็อก Premium ให้ส่ง 403 พร้อมข้อมูลพื้นฐานกลับไป
        return res.status(403).json({
          message: 'This is premium content. Please subscribe to watch.',
           basicInfo: {
              title: formattedFilm.title,
              synopsis: formattedFilm.synopsis,
              poster_url: formattedFilm.poster_url,
              genres: formattedFilm.genres,
              profiles: formattedFilm.profiles,
              created_at: formattedFilm.created_at,
              is_premium: formattedFilm.is_premium,
              view_count: formattedFilm.view_count // ⬅️ เพิ่ม
          }
        });
      }
    }
    
    // 🛑 (สำคัญ) เราลบ Logic การบวกวิวออกจากตรงนี้
    
    // ถ้าผ่านหมด ส่งข้อมูลหนังกลับไป
    res.json(formattedFilm);
    
  } catch (err) {
    console.error(`Error fetching film ${filmId}:`, err);
    res.status(500).json({ message: 'Server error fetching film details', error: err.message });
  }
});

// ---
// 🔽 (เพิ่มใหม่) Route นี้สำหรับรับการ "กด Play" จาก Client
// POST /api/films/:id/increment-view
// ---
router.post('/:id/increment-view', authMiddleware, async (req, res) => {
  const { id: filmId } = req.params;
  const { id: userId } = req.user;

  try {
    // (ทางเลือก) เช็กก่อนว่าคนดูเป็นเจ้าของหนังหรือไม่
    const { data: film, error: filmError } = await supabase
      .from('films')
      .select('filmmaker_id')
      .eq('id', filmId)
      .single();

    if (filmError || !film) {
      return res.status(404).json({ message: 'Film not found.' });
    }

    // ถ้าคนดูเป็นเจ้าของหนัง... ไม่ต้องนับวิว!
    if (film.filmmaker_id === userId) {
      return res.status(200).json({ message: 'Owner view. Not incremented.' });
    }

    // ถ้าเป็นคนอื่นดู ให้เรียก RPC เพื่อบวกวิว
    const { error: rpcError } = await supabase.rpc('increment_view', { 
      film_id_to_inc: parseInt(filmId) 
    });
    
    if (rpcError) {
      console.error(`[Increment View] RPC Error for film ${filmId}:`, rpcError);
      throw rpcError;
    }

    res.status(200).json({ message: 'View incremented.' });

  } catch (err) {
    console.error(`[Increment View] Server Error for film ${filmId}:`, err);
    res.status(500).json({ message: 'Server error incrementing view.' });
  }
});


// ---
// GET /api/films/recommendations
// (เรียกใช้ Advanced SQL Function ที่ 2)
// ---
router.get('/recommendations', authMiddleware, async (req, res) => {
  const { id: userId } = req.user;
  try {
      const { data, error } = await supabase.rpc('get_recommended_films', { requesting_user_id: userId });
      if (error) {
          console.error("!!! Supabase RPC Error in /recommendations:", error);
          throw error;
      }
      res.json(data);
  } catch(err){
      console.error("Error fetching recommendations:", err);
       res.status(500).json({ message: 'Error fetching recommendations', error: err.message });
  }
});

export default router;