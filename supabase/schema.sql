-- ---
-- 1. ตารางเก็บข้อมูลโปรไฟล์ผู้ใช้ (เชื่อมกับ auth.users ของ Supabase)
-- ---
CREATE TABLE profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL PRIMARY KEY,
  username TEXT UNIQUE,
  is_admin BOOLEAN DEFAULT FALSE,
  is_filmmaker BOOLEAN DEFAULT FALSE,
  -- Subscription Info
  is_subscriber BOOLEAN DEFAULT FALSE,
  subscription_end_date TIMESTAMPTZ,
  stripe_customer_id TEXT UNIQUE
);

-- ---
-- 2. ตารางเกี่ยวกับหนัง (Films & Genres)
-- ---
CREATE TABLE films (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  synopsis TEXT,
  poster_url TEXT, -- ลิงก์ไปยังไฟล์ใน Supabase Storage
  video_url TEXT,  -- ลิงก์ไปยังไฟล์ใน Supabase Storage
  filmmaker_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending' NOT NULL, -- 'pending', 'approved', 'rejected', 'hidden'
  is_premium BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() -- วันที่สร้าง/อัปโหลด
);

-- ตารางเก็บประเภทหนัง (เช่น Drama, Comedy, Horror)
CREATE TABLE genres (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL
);

-- ตารางเชื่อมแบบ Many-to-Many ระหว่าง 'films' และ 'genres'
CREATE TABLE film_genres (
  film_id INTEGER REFERENCES films(id) ON DELETE CASCADE,
  genre_id INTEGER REFERENCES genres(id) ON DELETE CASCADE,
  PRIMARY KEY (film_id, genre_id)
);

-- ---
-- 3. ตารางเก็บรีวิว (Reviews)
-- ---
CREATE TABLE reviews (
  id SERIAL PRIMARY KEY,
  comment TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  film_id INTEGER REFERENCES films(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(film_id, user_id) -- User คนเดียว รีวิวหนังเรื่องเดียวได้ครั้งเดียว
);

-- ---
-- 4. ตารางเกี่ยวกับ Live Q&A
-- ---
CREATE TABLE live_qas (
  id SERIAL PRIMARY KEY,
  film_id INTEGER REFERENCES films(id) ON DELETE CASCADE,
  filmmaker_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'requested' NOT NULL, -- requested, approved, live, finished
  stream_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ตารางสำหรับเก็บข้อความแชทในระหว่าง Live Q&A
CREATE TABLE qa_messages (
  id SERIAL PRIMARY KEY,
  qa_id INTEGER REFERENCES live_qas(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---
-- 5. ตารางสำหรับใบสมัคร Filmmaker
-- ---
CREATE TABLE filmmaker_applications (
  id SERIAL PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  reason TEXT, -- เหตุผลที่อยากเป็น (Optional)
  status TEXT DEFAULT 'pending' NOT NULL, -- pending, approved, rejected
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id) -- User สมัครได้แค่ครั้งเดียว
);


-- ---
-- 6. Trigger สำหรับสร้าง Profile อัตโนมัติ (สำคัญมาก)
-- ---

-- Function นี้จะทำงานอัตโนมัติ "หลังจาก" มีการสร้าง user ใหม่ใน 'auth.users'
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (
    new.id,
    -- ดึง username จาก metadata ที่ส่งมาตอนสมัคร ถ้าไม่มีให้ใช้ email
    COALESCE(new.raw_user_meta_data ->> 'username', new.email) 
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- สั่งให้ Trigger นี้ทำงานทุกครั้งที่มีการ INSERT ใน 'auth.users'
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();