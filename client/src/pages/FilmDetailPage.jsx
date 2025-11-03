// /client/src/pages/FilmDetailPage.jsx
import React from 'react';
// 🔽 1. เพิ่ม useState และ useCallback
import { useState, useEffect, useCallback } from 'react'; 
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext'; // Path นี้ถูกต้อง
import axios from 'axios';
import ReactPlayer from 'react-player';

import ReviewList from '../components/ReviewList'; // Path นี้ถูกต้อง
import ReviewForm from '../components/ReviewForm'; // Path นี้ถูกต้อง

function FilmDetailPage() {
  const { id: filmId } = useParams();
  const { session } = useAuth(); // ดึง session มาใช้เช็ก Token

  const [film, setFilm] = useState(null); // เก็บข้อมูลหนัง (อาจจะได้มาบางส่วน)
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // เก็บข้อความ Error
  const [isPremiumBlocked, setIsPremiumBlocked] = useState(false); // เช็กว่าโดนบล็อกเพราะ Premium ไหม
  const [reviewListKey, setReviewListKey] = useState(Date.now()); // Key สำหรับ re-render ReviewList
  
  // 🔽 2. เพิ่ม State สำหรับจำว่าบวกวิวไปหรือยัง
  const [hasIncrementedView, setHasIncrementedView] = useState(false);

  useEffect(() => {
    // รีเซ็ตสถานะเมื่อ filmId เปลี่ยน
    setFilm(null);
    setError(null);
    setIsPremiumBlocked(false);
    setLoading(true);
    
    // 🔽 (สำคัญ) รีเซ็ตตัวนับวิวทุกครั้งที่ ID หนังเปลี่ยน
    setHasIncrementedView(false); 

    if (!session?.access_token) {
        // ถ้าไม่มี session token ให้หยุดโหลด (ProtectedRoute ควรจัดการแล้ว แต่ป้องกันไว้)
        setError("Authentication required.");
        setLoading(false);
        console.error("FilmDetailPage: No access token found in session.");
        return;
    };

    // ฟังก์ชัน async ภายใน useEffect
    const fetchFilmData = async () => {
      try {
        const response = await axios.get(
          `/api/films/${filmId}`,
          {
            headers: { Authorization: `Bearer ${session.access_token}` }
          }
        );
        // ถ้าสำเร็จ (Status 200)
        // (API นี้จะไม่บวกวิวแล้ว)
        setFilm(response.data);
        setIsPremiumBlocked(false);
        setError(null);

      } catch (err) {
        console.error("Error fetching film:", err.response || err); // ดู Error จริงๆ ใน Console
        if (err.response) {
          if (err.response.status === 403) {
            // ถ้าโดนบล็อกเพราะ Premium (403 Forbidden)
            setIsPremiumBlocked(true);
            setError(err.response.data?.message || 'This is premium content.');
            // พยายาม set ข้อมูลพื้นฐานถ้า Backend ส่งมา (basicInfo)
            if (err.response.data?.basicInfo) {
              setFilm(err.response.data.basicInfo); // แสดงข้อมูลพื้นฐานแม้จะดู VDO ไม่ได้
            }
          } else if (err.response.status === 404) {
            setError('Film not found or not available.');
          } else {
            setError('Could not load film details. Please try again later.');
          }
        } else {
             // กรณี Network error หรือ Server ไม่ตอบสนอง
             setError('Could not connect to the server. Please check your connection.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchFilmData(); // เรียกใช้ฟังก์ชัน

  }, [filmId, session]); // Dependency คือ filmId และ session


  // 🔽 3. เพิ่มฟังก์ชันสำหรับยิง API เมื่อกด Play
  const handleIncrementView = useCallback(async () => {
    // ถ้าเคยบวกไปแล้ว หรือ session ยังไม่พร้อม ให้หยุด
    if (hasIncrementedView || !session?.access_token) {
      return;
    }
    
    // ตั้งค่าทันทีว่า "กำลังจะบวก" (กันการกด play/pause รัวๆ)
    setHasIncrementedView(true);
    
    try {
      // ยิง API ใหม่ที่เราสร้างขึ้น (แบบยิงแล้วลืม ไม่ต้องรอ)
      await axios.post(
        `/api/films/${filmId}/increment-view`,
        {}, // body ว่าง
        {
          headers: { Authorization: `Bearer ${session.access_token}` }
        }
      );
      console.log(`[View] Incremented view for film ${filmId}`);
    } catch (err) {
      // ถ้าพัง ก็แค่ log ไว้ ไม่ต้องโชว์ Error ให้ User
      console.error("Failed to increment view:", err.response?.data?.message || err);
      // (ถ้าพัง เราอาจจะยอมให้ลองใหม่รอบหน้าก็ได้)
      // setHasIncrementedView(false); 
    }
  }, [filmId, session, hasIncrementedView]); // ทำงานเมื่อตัวแปรเหล่านี้เปลี่ยน


  // Styles
  const pageStyle = { padding: '2rem', maxWidth: '1000px', margin: '0 auto' }; // กว้างขึ้นเล็กน้อย
  const errorBoxStyle = { border: '2px dashed #E74C3C', padding: '2rem', textAlign: 'center', background: '#2f1a1a', borderRadius: '8px', color: '#f4f4f4' };
  const premiumBoxStyle = { border: '2px dashed #e5b80b', padding: '2rem', textAlign: 'center', background: '#2c2a1f', borderRadius: '8px', color: '#f4f4f4'};
  const playerWrapperStyle = { position: 'relative', paddingTop: '56.25%', marginBottom: '2rem', background: '#000' }; // 16:9 aspect ratio, black background
  const playerStyle = { position: 'absolute', top: 0, left: 0 };
  const titleStyle = { color: '#f4f4f4', marginBottom: '0.5rem' };
  const synopsisStyle = { color: '#aaa', marginBottom: '2rem', lineHeight: '1.7' };
  const premiumButtonStyle = { display: 'inline-block', background: '#e5b80b', color: '#141414', padding: '1rem 2rem', textDecoration: 'none', borderRadius: '5px', marginTop: '1rem', fontWeight: 'bold' };

  if (loading) {
      return <div style={{...pageStyle, textAlign: 'center', color: '#aaa'}}>Loading film...</div>;
  }

  return (
    <div style={pageStyle}>

      {/* --- กรณีโดนบล็อกเพราะ Premium --- */}
      {isPremiumBlocked && (
         <div style={premiumBoxStyle}>
            {/* แสดง Title/Synopsis (ถ้ามีข้อมูล film จาก basicInfo) */}
            {film ? (
                <>
                  <h1 style={{...titleStyle, color: '#e5b80b' }}>{film.title} (Premium)</h1>
                  <p style={synopsisStyle}>{film.synopsis}</p>
                   {/* ⭐️ แสดงยอดวิว (ถ้ามี) ⭐️ */}
                   {film.view_count !== null && typeof film.view_count !== 'undefined' && (
                       <p style={{ color: '#ccc', fontSize: '1.1em' }}>
                           <strong>Views:</strong> {film.view_count.toLocaleString()}
                       </p>
                   )}
                </>
            ) : (
                <h1 style={{...titleStyle, color: '#e5b80b' }}>Premium Content Locked</h1>
            )}
            <p style={{ fontSize: '1.2em', color: '#f4f4f4', fontWeight: 'bold' }}>
              {error} {/* แสดงข้อความ "This is premium content..." */}
            </p>
            <Link to="/subscribe" style={premiumButtonStyle}>
              Upgrade to Premium
            </Link>
         </div>
      )}

      {/* --- กรณี Error อื่นๆ --- */}
      {!loading && error && !isPremiumBlocked && (
        <div style={errorBoxStyle}>
          <h1>Error Loading Film</h1>
          <p>{error}</p>
          <Link to="/" style={{ color: '#e5b80b' }}>Go back to Home</Link>
        </div>
      )}

      {/* --- กรณีโหลดสำเร็จ --- */}
      {!loading && !error && film && (
        <>
          <h1 style={titleStyle}>{film.title}</h1>
          <p style={synopsisStyle}>{film.synopsis}</p>

          {/* 🔽⭐️ แสดงยอดวิว (ถ้ามี) ⭐️🔽 */}
          {film.view_count !== null && typeof film.view_count !== 'undefined' && (
             <div style={{ color: '#ccc', marginBottom: '1.5rem', fontSize: '1.1em', borderBottom: '1px solid #333', paddingBottom: '1.5rem' }}>
                <span style={{ marginRight: '1.5rem' }}>
                    <strong>Views:</strong> {film.view_count.toLocaleString()}
                </span>
             </div>
          )}

          {/* --- Player --- */}
          <div style={playerWrapperStyle}>
            <ReactPlayer
              url={film.video_url}
              controls
              width="100%"
              height="100%"
              style={playerStyle}
              // 🔽 4. (สำคัญ!) เพิ่ม prop onPlay
              onPlay={handleIncrementView}
              // Optional: Add config for specific players if needed
              // config={{ youtube: { playerVars: { showinfo: 1 } } }}
            />
          </div>

          <hr />

          {/* --- Review Section --- */}
          <ReviewForm
            filmId={film.id}
            onReviewPosted={() => setReviewListKey(Date.now())} // Trigger re-render of ReviewList
          />

          <ReviewList filmId={film.id} key={reviewListKey} />
        </>
      )}
    </div>
  );
}

export default FilmDetailPage;