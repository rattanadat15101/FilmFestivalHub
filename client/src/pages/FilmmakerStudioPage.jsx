// /client/src/pages/FilmmakerStudioPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext'; // Path นี้ถูกต้อง
import { Link } from 'react-router-dom';
import MyFilmCard from '../components/MyFilmCard'; // Import Card component

function FilmmakerStudioPage() {
  const { session } = useAuth();
  const [myFilms, setMyFilms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // --- ฟังก์ชันสำหรับโหลดหนังของ Filmmaker ---
  const fetchMyFilms = useCallback(async () => {
    // เช็ก session ก่อนเริ่ม fetch
    if (!session?.access_token) {
        setError("Authentication needed to load studio.");
        setLoading(false);
        return;
    }
    setLoading(true);
    setError(''); // เคลียร์ Error เก่า
    try {
      const response = await axios.get(
        'http://localhost:4000/api/filmmaker/my-films', // Endpoint ดึงหนังของตัวเอง
        { headers: { Authorization: `Bearer ${session.access_token}` } }
      );
      if (Array.isArray(response.data)) {
          setMyFilms(response.data);
      } else {
          console.error("My Films API did not return array:", response.data);
          setMyFilms([]);
          setError("Received invalid data format for your films.");
      }
    } catch (err) {
      setError('Failed to fetch your films.');
      console.error("Error fetching filmmaker films:", err.response || err);
      setMyFilms([]); // เคลียร์ข้อมูลถ้า Error
    } finally {
      setLoading(false);
    }
  }, [session]); // Dependency คือ session

  // --- เรียกใช้ fetchMyFilms ตอนเปิดหน้า หรือเมื่อ session เปลี่ยน ---
  useEffect(() => {
    fetchMyFilms();
  }, [fetchMyFilms]); // fetchMyFilms เปลี่ยนเมื่อ session เปลี่ยน

  // --- Styles ---
  const pageStyle = { padding: '2rem', maxWidth: '1200px', margin: '0 auto', color: '#f4f4f4' };
  const headerStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #e5b80b', paddingBottom: '1rem', marginBottom: '2rem' };
  const titleStyle = { color: '#f4f4f4', margin: 0 };
  const uploadButtonStyle = { background: '#e5b80b', color: '#141414', padding: '10px 20px', textDecoration: 'none', borderRadius: '4px', fontWeight: 'bold' };
  const sectionTitleStyle = { color: '#e5b80b', borderLeft: '4px solid #e5b80b', paddingLeft: '10px', marginBottom: '1.5rem' };
  const filmListStyle = { display: 'flex', flexDirection: 'column', gap: '1.5rem' }; // ใช้ Flexbox column แสดง Card

  if (loading) return <div style={{...pageStyle, textAlign: 'center', color: '#aaa'}}>Loading Your Studio...</div>;

  return (
    <div style={pageStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <h1 style={titleStyle}>Creator Studio</h1>
        <Link to="/upload" style={uploadButtonStyle}>
          + Upload New Film
        </Link>
      </div>

      {/* Error Display */}
      {error && <p className="error-message" style={{ color: 'red', marginBottom: '1.5rem' }}>{error}</p>}

      {/* My Films Section */}
      <h2 style={sectionTitleStyle}>My Films ({myFilms.length})</h2>

      <div style={filmListStyle}>
        {!loading && !error && myFilms.length === 0 ? (
          <p style={{ color: '#aaa' }}>You haven't uploaded any films yet. Click "Upload New Film" to get started!</p>
        ) : (
          // ใช้ MyFilmCard แสดงผลหนังแต่ละเรื่อง
          myFilms.map(film => (
            <MyFilmCard
              key={film.id}
              film={film}
              onActionComplete={fetchMyFilms} // ส่งฟังก์ชัน fetch ไปให้ Card เรียกเมื่อมีการเปลี่ยนแปลง
            />
          ))
        )}
      </div>
    </div>
  );
}

export default FilmmakerStudioPage;