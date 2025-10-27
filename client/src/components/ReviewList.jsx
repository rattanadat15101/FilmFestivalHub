// /client/src/components/ReviewList.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

function ReviewList({ filmId }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(''); // State สำหรับ Error

  useEffect(() => {
    const fetchReviews = async () => {
      setError(''); // เคลียร์ Error เก่า
      setLoading(true);
      try {
        // Endpoint นี้ Public ไม่ต้องใช้ Token
        const response = await axios.get(
          `http://localhost:4000/api/reviews/${filmId}`
        );
        if (Array.isArray(response.data)) {
          setReviews(response.data);
        } else {
          console.error("Reviews API did not return array:", response.data);
          setReviews([]);
          setError("Could not load reviews.");
        }
      } catch (err) {
        console.error('Failed to fetch reviews', err);
        setError("Could not load reviews.");
        setReviews([]); // เคลียร์ reviews ถ้าโหลดไม่สำเร็จ
      } finally {
        setLoading(false);
      }
    };

    if (filmId) { // เช็กก่อนว่ามี filmId
      fetchReviews();
    } else {
      setLoading(false); // ถ้าไม่มี filmId ก็ไม่ต้องโหลด
      setReviews([]);
    }
  }, [filmId]); // จะดึงใหม่ทุกครั้งที่ filmId เปลี่ยน

  if (loading) return <p style={{ color: '#aaa' }}>Loading reviews...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>; // แสดงข้อความ Error

  return (
    <div className="review-list" style={{ marginTop: '2rem' }}>
      <h3 style={{ color: '#e5b80b', borderBottom: '1px solid #333', paddingBottom: '10px' }}>Reviews ({reviews.length})</h3>
      {reviews.length === 0 ? (
        <p style={{ color: '#aaa' }}>No reviews yet. Be the first to review!</p>
      ) : (
        reviews.map(review => (
          <div key={review.id} style={{ borderBottom: '1px solid #333', padding: '1rem 0', marginBottom: '1rem' }}>
            <strong style={{ color: '#f4f4f4' }}>{review.profiles?.username || 'Anonymous User'}</strong> {/* ใช้ Optional Chaining */}
            <p style={{ margin: '5px 0', color: '#e5b80b' }}>Rating: {'⭐'.repeat(review.rating)}</p>
            <p style={{ margin: '5px 0', color: '#ccc' }}>{review.comment}</p>
            <small style={{ color: '#888' }}>{new Date(review.created_at).toLocaleDateString('th-TH')}</small> {/* ใช้ th-TH locale */}
          </div>
        ))
      )}
    </div>
  );
}

export default ReviewList;
