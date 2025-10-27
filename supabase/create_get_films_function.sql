-- ---
-- 1. FUNCTION: get_films_sorted_by_rating
-- ใช้สำหรับหน้า Homepage หลัก (Sorting & Filtering)
-- ---
CREATE OR REPLACE FUNCTION get_films_sorted_by_rating(
    search_term TEXT DEFAULT NULL,
    filter_genre_id INT DEFAULT NULL
)
RETURNS TABLE (
    id INT,
    title TEXT,
    synopsis TEXT,
    poster_url TEXT,
    is_premium BOOLEAN,
    created_at TIMESTAMPTZ,
    filmmaker_username TEXT,
    genres JSONB, -- รวม Genres เป็น Array
    avg_rating NUMERIC -- ค่าเรตติ้งเฉลี่ย (ตัวเลข)
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        f.id,
        f.title,
        f.synopsis,
        f.poster_url,
        f.is_premium,
        f.created_at,
        p.username AS filmmaker_username,
        -- รวม Genres เป็น JSON Array (ถ้าไม่มีให้คืน Array ว่าง)
        COALESCE(
            (SELECT jsonb_agg(jsonb_build_object('id', g.id, 'name', g.name) ORDER BY g.name)
             FROM genres g
             JOIN film_genres fg ON g.id = fg.genre_id
             WHERE fg.film_id = f.id),
            '[]'::jsonb
        ) AS genres,
        -- คำนวณเรตติ้งเฉลี่ย (ปัดเศษ 1 ตำแหน่ง)
        AVG(r.rating)::NUMERIC(2,1) AS avg_rating
    FROM
        films f
        LEFT JOIN profiles p ON f.filmmaker_id = p.id
        LEFT JOIN reviews r ON f.id = r.film_id
        -- Join กับ film_genres เพื่อ Filter (ใช้ LEFT JOIN เพื่อไม่ให้หนังที่ไม่มี Genre หายไป)
        LEFT JOIN film_genres fg_filter ON f.id = fg_filter.film_id
    WHERE
        f.status = 'approved'
        -- Filter ตาม Genre (ถ้ามี)
        AND (filter_genre_id IS NULL OR fg_filter.genre_id = filter_genre_id)
        -- Filter ตาม Search Term (ถ้ามี)
        AND (search_term IS NULL OR f.title ILIKE ('%' || search_term || '%'))
    GROUP BY
        f.id, p.username -- ต้อง Group by ทุกคอลัมน์ที่ไม่ใช่ Aggregate
    -- Filter Genre ซ้ำหลัง Group By (เพื่อให้แน่ใจว่าหนังที่มีหลาย Genre ยังแสดงผล)
    HAVING (filter_genre_id IS NULL OR EXISTS (SELECT 1 FROM film_genres fg_check WHERE fg_check.film_id = f.id AND fg_check.genre_id = filter_genre_id))
    ORDER BY
        avg_rating DESC NULLS LAST, f.id DESC; -- เรียงตามเรตติ้ง, ถ้าเท่ากัน เอา ID ล่าสุดขึ้นก่อน
END;
$$ LANGUAGE plpgsql;


-- ---
-- 2. FUNCTION: get_recommended_films
-- ใช้สำหรับ Advanced SQL (ดึงหนังแนะนำอิงตาม User Preferences)
-- (Endpoint /api/films/recommendations)
-- ---
CREATE OR REPLACE FUNCTION get_recommended_films(
    requesting_user_id uuid
)
RETURNS TABLE (
    id INT,
    title TEXT,
    synopsis TEXT,
    poster_url TEXT,
    is_premium BOOLEAN,
    created_at TIMESTAMPTZ,
    filmmaker_username TEXT,
    genres JSONB,
    avg_rating NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        f.id,
        f.title,
        f.synopsis,
        f.poster_url,
        f.is_premium,
        f.created_at,
        p.username AS filmmaker_username,
        COALESCE(
            (SELECT jsonb_agg(g ORDER BY g.name)
             FROM genres g
             JOIN film_genres fg ON g.id = fg.genre_id
             WHERE fg.film_id = f.id),
            '[]'::jsonb
        ) AS genres,
        AVG(r.rating)::NUMERIC(2,1) AS avg_rating
    FROM
        films f
        LEFT JOIN profiles p ON f.filmmaker_id = p.id
        LEFT JOIN reviews r ON f.id = r.film_id
    WHERE
        f.status = 'approved'
        -- Subquery เพื่อหา Genre ที่ User ชอบ (4 ดาวขึ้นไป)
        AND EXISTS (
            SELECT 1 
            FROM film_genres fg_check
            JOIN reviews r_check ON fg_check.film_id = r_check.film_id
            WHERE fg_check.film_id = f.id AND r_check.user_id = requesting_user_id AND r_check.rating >= 4
        )
        -- ยกเว้นหนังที่ User ดูไปแล้ว
        AND f.id NOT IN (
            SELECT r_watched.film_id
            FROM reviews r_watched
            WHERE r_watched.user_id = requesting_user_id
        )
    GROUP BY
        f.id, p.username
    ORDER BY
        avg_rating DESC NULLS LAST, f.id DESC
    LIMIT 10;
END;
$$ LANGUAGE plpgsql;