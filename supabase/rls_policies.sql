-- ---
-- 1. เปิดใช้งาน Row Level Security (RLS)
-- ---
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.films ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_qas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qa_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.genres ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.film_genres ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.filmmaker_applications ENABLE ROW LEVEL SECURITY;


-- ---
-- 2. Policy สำหรับ 'profiles'
-- ---
CREATE POLICY "Users can update their own profile."
ON public.profiles FOR UPDATE USING ( auth.uid() = id )
WITH CHECK ( auth.uid() = id );
-- อนุญาตให้ทุกคนอ่านโปรไฟล์ของคนอื่นได้
CREATE POLICY "Profiles are viewable by everyone."
ON public.profiles FOR SELECT USING ( true );


-- ---
-- 3. Policy สำหรับ 'films'
-- ---
-- ทุกคนสามารถ "อ่าน" หนังที่ 'approved' แล้วได้เท่านั้น
CREATE POLICY "Public can view approved films."
ON public.films FOR SELECT USING ( status = 'approved' );
-- Filmmakers สามารถ "สร้าง" และ "แก้ไข" หนังของตัวเองได้
CREATE POLICY "Filmmakers can create/update their own films."
ON public.films FOR ALL
USING ( auth.uid() = filmmaker_id );
-- อนุญาตให้ Filmmaker ลบหนังของตัวเองได้
CREATE POLICY "Filmmakers can delete their own films."
ON public.films FOR DELETE
USING ( auth.uid() = filmmaker_id );


-- ---
-- 4. Policy สำหรับ 'reviews'
-- ---
CREATE POLICY "Public can view reviews."
ON public.reviews FOR SELECT USING ( true );
-- User ที่ล็อกอินแล้วสามารถ "สร้าง" รีวิวได้
CREATE POLICY "Authenticated users can create reviews."
ON public.reviews FOR INSERT WITH CHECK ( auth.uid() = user_id );
-- User ลบได้เฉพาะรีวิว "ของตัวเอง" (Admin ลบได้เพราะ Service Key Bypass RLS)
CREATE POLICY "Users can delete their own reviews."
ON public.reviews FOR DELETE USING ( auth.uid() = user_id );


-- ---
-- 5. Policy สำหรับ 'filmmaker_applications'
-- ---
-- User ที่ล็อกอินแล้ว "สร้าง" ใบสมัครของตัวเองได้
CREATE POLICY "Users can create their own application."
ON public.filmmaker_applications FOR INSERT 
WITH CHECK ( auth.uid() = user_id );
-- User "อ่าน" ได้เฉพาะใบสมัครของตัวเอง
CREATE POLICY "Users can read their own applications."
ON public.filmmaker_applications FOR SELECT
USING ( auth.uid() = user_id );


-- ---
-- 6. Policy สำหรับ 'Q&A' และ 'Messages'
-- ---
-- ทุกคนอ่านตารางเวลาและข้อมูล Q&A ที่ approved ได้
CREATE POLICY "Public can view approved Q&A sessions."
ON public.live_qas FOR SELECT USING ( status = 'approved' );
-- User ที่ล็อกอินแล้วสามารถสร้างข้อความแชทได้
CREATE POLICY "Authenticated users can send Q&A messages."
ON public.qa_messages FOR INSERT WITH CHECK ( auth.uid() = user_id );
-- ทุกคนอ่านข้อความแชทได้
CREATE POLICY "Public can read Q&A messages."
ON public.qa_messages FOR SELECT USING ( true );
-- อนุญาตให้ Filmmaker ลบ Q&A ของตัวเองได้
CREATE POLICY "Filmmakers can delete their own Q&A sessions."
ON public.live_qas FOR DELETE
USING ( auth.uid() = filmmaker_id );


-- ---
-- 7. Policy สำหรับ 'genres'
-- ---
-- อนุญาตให้ทุกคนอ่าน Genres และ Link ตารางได้
CREATE POLICY "Public can view genres."
ON public.genres FOR SELECT USING ( true );

CREATE POLICY "Public can view film_genres links."
ON public.film_genres FOR SELECT USING ( true );