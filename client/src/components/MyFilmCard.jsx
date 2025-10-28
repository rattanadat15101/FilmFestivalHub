// /client/src/components/MyFilmCard.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext'; // Path นี้ถูกต้อง
import { Link } from 'react-router-dom';

const getStatusStyle = (status) => {
  if (status === 'approved') return { color: 'lightgreen', fontWeight: 'bold' }; // สีเขียวสว่าง
  if (status === 'pending') return { color: 'orange', fontWeight: 'bold' };
  if (status === 'rejected') return { color: '#E74C3C', fontWeight: 'bold' }; // สีแดงเข้ม
  if (status === 'hidden') return { color: '#888', fontWeight: 'bold' }; // สีเทา
  return { color: '#aaa' }; // สี default
};

function MyFilmCard({ film, onActionComplete }) {
  const { session } = useAuth();
  const [showQAModal, setShowQAModal] = useState(false);
  const [qaTime, setQaTime] = useState('');
  const [message, setMessage] = useState(''); // State สำหรับแสดงข้อความ Feedback
  const [isPremium, setIsPremium] = useState(film.is_premium);

  // --- ฟังก์ชันสลับ Premium ---
  const handleTogglePremium = async () => {
    const newPremiumStatus = !isPremium;
    setMessage('');
    console.log(`[MyFilmCard] Attempting to set premium to: ${newPremiumStatus} for film ${film.id}`);
    if (!session?.access_token) {
        console.error("[MyFilmCard] No access token found for toggle premium.");
        setMessage("Error: Not authenticated.");
        return;
    }
    try {
      const response = await axios.put(
        `/api/filmmaker/film/${film.id}/toggle-premium`,
        { makePremium: newPremiumStatus },
        { headers: { Authorization: `Bearer ${session.access_token}` } }
      );
      console.log("[MyFilmCard] Toggle premium response:", response.data);
      setIsPremium(newPremiumStatus); // อัปเดต State ในหน้าจอ
      setMessage(response.data.message || 'Status updated.'); // แสดงข้อความสำเร็จ
    } catch (err) {
      console.error("[MyFilmCard] Error toggling premium:", err.response || err);
      setMessage(err.response?.data?.message || 'Failed to update premium status.'); // แสดงข้อความ Error
    }
  };

  // --- ฟังก์ชันลบหนัง ---
  const handleDeleteFilm = async () => {
    setMessage('');
    if (!window.confirm('Are you sure you want to PERMANENTLY delete this film? This cannot be undone.')) return;
    console.log(`[MyFilmCard] Attempting to delete film ${film.id}`);
    if (!session?.access_token) {
        console.error("[MyFilmCard] No access token found for delete film.");
         setMessage("Error: Not authenticated.");
        return;
    }
    try {
      await axios.delete(
        `/api/filmmaker/film/${film.id}`,
        { headers: { Authorization: `Bearer ${session.access_token}` } }
      );
      console.log(`[MyFilmCard] Film ${film.id} deleted successfully.`);
      setMessage('Film deleted successfully.'); // แสดงข้อความสำเร็จ
      onActionComplete(); // บอกหน้าแม่ (Studio) ให้โหลดลิสต์ใหม่
    } catch (err) {
      console.error("[MyFilmCard] Error deleting film:", err.response || err);
      setMessage(err.response?.data?.message || 'Failed to delete film.'); // แสดงข้อความ Error
    }
  };

  // --- ฟังก์ชันขอนัด Q&A ---
  const handleRequestQA = async (e) => {
    e.preventDefault();
    setMessage('');
    console.log(`[MyFilmCard] Attempting to request Q&A for film ${film.id} at ${qaTime}`);
    if (!session?.access_token) {
        console.error("[MyFilmCard] No access token found for request Q&A.");
         setMessage("Error: Not authenticated.");
        return;
    }
    try {
      const response = await axios.post(
        '/api/user/request-qa',
        { filmId: film.id, scheduledAt: qaTime },
        { headers: { Authorization: `Bearer ${session.access_token}` } }
      );
      console.log("[MyFilmCard] Request Q&A response:", response.data);
      setMessage(response.data.message || 'Q&A requested.');
      onActionComplete();
      setShowQAModal(false);
    } catch (err) {
      console.error("[MyFilmCard] Error requesting Q&A:", err.response || err);
      setMessage(err.response?.data?.message || 'Failed to request Q&A.');
    }
  };

  const qaStatus = film.live_qas?.[0]; // Safely access Q&A status

  // Button Styles (Final)
  const buttonStyle = {
      background: '#333',
      color: '#f4f4f4',
      border: '1px solid #444',
      padding: '5px 10px',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '0.9em',
      width: '100%', // Make buttons full width in the column
      textAlign: 'center',
      transition: 'background 0.2s',
      marginBottom: '5px', // Add space between buttons
  };
   const deleteButtonStyle = {
      ...buttonStyle,
      background: '#E74C3C', // Red delete button
      color: 'white',
      border: '1px solid #C0392B',
  };
   const linkButtonStyle = {
       ...buttonStyle,
       display: 'block', // Make Link behave like a block for styling
       textDecoration: 'none',
       color: '#e5b80b', // Gold color for links
       background: '#222',
       border: '1px solid #333',
   };

  return (
    <div style={{ display: 'flex', border: '1px solid #333', padding: '1rem', gap: '1rem', flexWrap: 'wrap', background: '#1c1c1c', borderRadius: '4px' }}>
      <img
        src={film.poster_url || 'https://via.placeholder.com/100x150?text=No+Poster'}
        alt={film.title}
        style={{ width: '100px', height: '150px', objectFit: 'cover', borderRadius: '4px' }}
      />

      <div style={{ flex: 1, minWidth: '200px', color: '#ccc' }}>
        <h3 style={{ marginTop: 0, color: '#f4f4f4' }}>{film.title}</h3>
        <p><strong>Status:</strong> <span style={getStatusStyle(film.status)}> {film.status?.toUpperCase() || 'N/A'}</span></p>
        {qaStatus ? (
          <p style={{ color: '#aaa' }}>
            <strong>Q&A:</strong> {qaStatus.status?.toUpperCase() || 'N/A'}
            {qaStatus.status === 'approved' && qaStatus.scheduled_at && ` at ${new Date(qaStatus.scheduled_at).toLocaleString()}`}
          </p>
         ) : ( <p style={{ color: '#aaa' }}>No Q&A requested.</p> )}
        <p><strong>Access:</strong> {isPremium ? <span style={{ color: '#f06', fontWeight: 'bold' }}> Premium</span> : <span> Standard</span>}</p>
        {/* Feedback Message */}
        {message && <p style={{ fontSize: '0.9em', color: message.includes('Failed') || message.includes('Error') ? 'red' : 'lightgreen', marginTop: '0.5rem', fontWeight: 'bold' }}>{message}</p>}
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: '150px' }}>
        <Link to={`/film/${film.id}`} style={linkButtonStyle}>View Film</Link>
        <Link to={`/studio/edit/${film.id}`} style={linkButtonStyle}>Edit Details</Link>
        <button style={buttonStyle} onClick={() => setShowQAModal(!showQAModal)}>
          {qaStatus ? 'Manage Q&A' : 'Request Q&A'}
        </button>
        {/* ปุ่ม Premium */}
        <button style={buttonStyle} onClick={handleTogglePremium}>
          Make {isPremium ? 'Standard' : 'Premium'}
        </button>
        {/* ปุ่ม Delete */}
        <button onClick={handleDeleteFilm} style={deleteButtonStyle}>
          Delete Film
        </button>
      </div>

      {/* Q&A Modal Form */}
      {showQAModal && (
        <div style={{ borderTop: '1px solid #333', marginTop: '1rem', paddingTop: '1rem', width: '100%', color: '#ccc' }}>
          <h4 style={{ color: '#e5b80b', marginTop: 0 }}>Request/Manage Q&A</h4>
          {qaStatus && <p>Current Status: {qaStatus.status?.toUpperCase()}</p>}
          <form onSubmit={handleRequestQA} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <label htmlFor={`qa-time-${film.id}`} style={{ color: '#aaa' }}>Set Time:</label>
            <input
              id={`qa-time-${film.id}`}
              type="datetime-local"
              defaultValue={qaStatus?.scheduled_at ? new Date(new Date(qaStatus.scheduled_at).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''} // Adjust for timezone in default value
              onChange={(e) => setQaTime(e.target.value)}
              required
              style={{ padding: '8px', background: '#333', color: '#f4f4f4', border: '1px solid #444', borderRadius: '4px' }}
            />
            <button type="submit" style={{ background: '#e5b80b', color: '#141414', border: 'none', padding: '10px' }}>Submit Request</button>
          </form>
        </div>
      )}
    </div>
  );
}

export default MyFilmCard;
