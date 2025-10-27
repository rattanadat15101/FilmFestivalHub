// /client/src/components/ReviewForm.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext'; // ใช้ Path ที่ถูกต้อง
import { Link } from 'react-router-dom'; // สำหรับ Link ไปหน้า Login

function ReviewForm({ filmId, onReviewPosted }) {
  const { session, user } = useAuth(); // ดึง user และ session
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // ตรวจสอบ session ก่อนใช้ access_token
    if (!user || !session?.access_token) {
        setError('Authentication session not ready. Please try again.');
        return;
    }

    setSubmitting(true);
    setError('');

    try {
      await axios.post(
        'http://localhost:4000/api/reviews', // POST ไปยัง Backend
        {
          filmId: filmId,
          rating: parseInt(rating),
          comment: comment
        },
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        }
      );

      // ส่งสำเร็จ
      setComment('');
      setRating(5);
      if (onReviewPosted) {
        onReviewPosted(); // บอกหน้าแม่ให้โหลดรีวิวใหม่
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to post review.');
      console.error("Error posting review:", err.response || err);
    } finally {
      setSubmitting(false);
    }
  };

  // Styles
  const formContainerStyle = { marginTop: '2rem', background: '#222', padding: '1.5rem', borderRadius: '4px' };
  const labelStyle = { marginRight: '10px', color: '#aaa' };
  const selectStyle = { 
      padding: '8px', 
      background: '#333', 
      color: '#f4f4f4', 
      border: '1px solid #444', 
      borderRadius: '4px' 
  };
  const textareaStyle = { width: '100%', marginTop: '5px', boxSizing: 'border-box' };
  const buttonStyle = { 
      background: '#e5b80b', 
      color: '#141414', 
      border: 'none', 
      fontWeight: 'bold', 
      padding: '10px 15px',
      borderRadius: '4px',
      transition: 'background 0.2s',
  };

  return (
    <div className="review-form" style={formContainerStyle}>
      <h4 style={{ marginTop: 0, color: '#e5b80b' }}>Write your review</h4>
      
      {!user && (
        <p style={{ color: '#aaa' }}>Please <Link to="/login" style={{ color: '#e5b80b', fontWeight: 'bold' }}>login</Link> to write a review.</p>
      )}
      
      {user && (
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={labelStyle}>Rating:</label>
            <select value={rating} onChange={(e) => setRating(e.target.value)} style={selectStyle}>
              <option value="5">⭐⭐⭐⭐⭐</option>
              <option value="4">⭐⭐⭐⭐</option>
              <option value="3">⭐⭐⭐</option>
              <option value="2">⭐⭐</option>
              <option value="1">⭐</option>
            </select>
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={labelStyle}>Comment:</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows="4"
              style={textareaStyle}
              placeholder="Share your thoughts..."
              required // บังคับให้กรอกคอมเมนต์
            />
          </div>
          {error && <p style={{ color: 'red' }}>{error}</p>}
          <button type="submit" disabled={submitting || !user} style={buttonStyle}>
            {submitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </form>
      )}
    </div>
  );
}

export default ReviewForm;