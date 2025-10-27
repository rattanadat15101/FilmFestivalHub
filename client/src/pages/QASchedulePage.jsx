// /client/src/pages/QASchedulePage.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext'; // Import useAuth เพื่อเช็กสถานะ Login

function QASchedulePage() {
  const { session } = useAuth(); // ดึง session มาเช็ก
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        setLoading(true);
        setError('');
        // Endpoint นี้ Public ไม่ต้องใช้ Token
        const response = await axios.get('http://localhost:4000/api/qa/schedule');
        
        if (Array.isArray(response.data)) {
            setSchedule(response.data);
        } else {
            console.error("Schedule API did not return array:", response.data);
            setSchedule([]);
            setError("Could not load Q&A schedule data.");
        }
      } catch (err) {
        console.error("Failed to fetch Q&A schedule", err);
        setError('Could not load Q&A schedule.');
      } finally {
        setLoading(false);
      }
    };
    fetchSchedule();
  }, []); // ทำงานครั้งเดียวตอนเปิดหน้า

  // --- Styles ---
  const pageStyle = { padding: '2rem', maxWidth: '1000px', margin: '0 auto', color: '#f4f4f4' };
  const h1Style = { color: '#e5b80b', borderBottom: '1px solid #333', paddingBottom: '10px', marginBottom: '2rem' };
  const cardStyle = { 
      display: 'flex', 
      border: '1px solid #333', 
      marginBottom: '1rem', 
      background: '#1c1c1c', // สีพื้นหลังการ์ด
      borderRadius: '8px', 
      overflow: 'hidden', // ซ่อนขอบรูปที่ล้น
      transition: 'background 0.2s',
  };
  const imgStyle = { width: '120px', height: '180px', objectFit: 'cover' };
  const infoStyle = { padding: '1rem 1.5rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' };
  const titleStyle = { marginTop: 0, marginBottom: '0.5rem', color: '#f4f4f4' };
  const infoTextStyle = { color: '#aaa', margin: '4px 0' };
  const joinButtonStyle = { 
      background: '#e5b80b', 
      color: '#141414', 
      padding: '0.5rem 1rem', 
      textDecoration: 'none', 
      borderRadius: '4px', 
      fontWeight: 'bold',
      display: 'inline-block', // ทำให้ Link เป็นปุ่ม
      marginTop: '10px',
  };

  if (loading) return <div style={{...pageStyle, textAlign: 'center', color: '#aaa'}}>Loading schedule...</div>;
  if (error) return <div style={pageStyle}><p style={{ color: 'red' }}>{error}</p></div>;

  return (
    <div style={pageStyle}>
      <h1 style={h1Style}>Upcoming Live Q&A Sessions</h1>
      {schedule.length === 0 ? (
        <p style={{ color: '#aaa', textAlign: 'center', fontSize: '1.2rem' }}>No upcoming Q&A sessions scheduled at this time.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {schedule.map(qa => (
            <div key={qa.id} style={cardStyle}>
              {/* รูป Poster หนัง */}
              <img 
                src={qa.films?.poster_url || 'https://via.placeholder.com/120x180?text=No+Poster'} 
                alt={qa.films?.title || 'Film Poster'} 
                style={imgStyle} 
              />
              {/* ข้อมูล Q&A */}
              <div style={infoStyle}>
                <h3 style={titleStyle}>{qa.films?.title || 'Unknown Film'}</h3>
                <p style={infoTextStyle}>
                  <strong>With:</strong> <span style={{ color: '#e5b80b' }}>{qa.profiles?.username || 'Filmmaker'}</span>
                </p>
                <p style={infoTextStyle}>
                  <strong>When:</strong> {new Date(qa.scheduled_at).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' })}
                </p>
                {/* ปุ่ม Join (ต้อง Login ก่อน) */}
                <Link 
                  to={session ? `/live/${qa.id}` : '/login'} // ถ้ายังไม่ login ให้ไปหน้า login
                  style={joinButtonStyle}
                >
                  {session ? 'Join Live Session' : 'Login to Join'}
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default QASchedulePage;