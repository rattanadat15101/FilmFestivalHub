// /client/src/pages/SubscriptionPage.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext'; // Path นี้ถูกต้อง
import { useNavigate } from 'react-router-dom';

function SubscriptionPage() {
  const { session, profile, fetchProfile } = useAuth(); // ดึง fetchProfile มาอัปเดตสถานะ
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // --- Styles ---
  const pageStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 'calc(100vh - 100px)',
    padding: '2rem',
  };
  const containerStyle = {
    maxWidth: '600px',
    width: '100%',
    textAlign: 'center',
  };
  const mockCardStyle = {
    border: '1px solid #e5b80b', // กรอบสีทอง
    padding: '2rem 2.5rem', // เพิ่ม Padding
    background: '#1c1c1c', // พื้นหลัง Modal ดำอ่อน
    color: '#f4f4f4', // สีตัวอักษรขาว
    borderRadius: '8px',
    boxShadow: '0 0 10px rgba(229, 184, 11, 0.2)',
  };
  const buttonStyle = {
      padding: '1rem 2rem', 
      fontSize: '1.2rem', 
      background: '#e5b80b', // ปุ่มสีทอง
      color: '#141414',
      fontWeight: 'bold',
      border: 'none',
      transition: 'background 0.2s',
      cursor: 'pointer',
  };
  const disabledButtonStyle = { ...buttonStyle, background: '#555', color: '#888', cursor: 'not-allowed' };
  // --- End Styles ---

  // --- Handler ---
  const handleMockPayment = async () => {
    setLoading(true);
    setError('');
    setSuccess(false);

    if (!session?.access_token) {
        setError('Authentication session not ready. Please try again.');
        setLoading(false);
        return;
    }

    try {
      // 1. เรียก Backend (Node.js)
      await axios.post(
        '/api/user/mock-subscribe',
        {}, // Body ว่าง
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        }
      );

      // 2. ถ้าสำเร็จ
      setSuccess(true);
      
      // 3. (สำคัญ) สั่งให้ AuthContext โหลด profile ใหม่ทันที
      if (fetchProfile) {
         await fetchProfile(); // Navbar จะอัปเดตเป็น (Premium) ทันที
      }

      // 4. รอ 2 วินาที แล้วเด้งกลับหน้าแรก
      setTimeout(() => {
        navigate('/');
      }, 2000);

    } catch (err) {
      setError(err.response?.data?.message || 'Payment simulation failed.');
    } finally {
      setLoading(false); // หยุดโหลดไม่ว่าจะสำเร็จหรือล้มเหลว (ยกเว้นตอน success)
      if (success) setLoading(false); // Ensure loading stops on success
    }
  };

  // --- Render Logic ---

  // ถ้าเป็น Premium แล้ว
  if (profile?.is_subscriber) {
    return (
      <div style={pageStyle}>
        <div style={containerStyle}>
          <div style={mockCardStyle}>
            <h2 style={{ color: '#e5b80b' }}>ตอนนี้บัญชีคุณถูกอัพเกรดเป็น Premium แล้ว</h2>
            <p style={{ color: '#aaa' }}>Thank you for your continued support.</p>
          </div>
        </div>
      </div>
    );
  }

  // ถ้ายังไม่เป็น Premium
  return (
    <div style={pageStyle}>
      <div style={containerStyle}>
        <h2 style={{ color: '#f4f4f4' }}>Upgrade to Premium</h2>
        <p style={{ color: '#aaa', marginBottom: '2rem' }}>Get access to all exclusive short films and live Q&A sessions.</p>
        
        <div style={mockCardStyle}>
          <h3 style={{ color: '#e5b80b', borderBottom: '1px solid #444', paddingBottom: '10px', marginBottom: '20px' }}>จำลอง Payment Gateway</h3>
          <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>$5 / month</p>
          <p style={{ color: '#aaa', marginBottom: '20px' }}>*Test Payment - Your account will be upgraded instantly.</p>
          
          {!success ? (
            <button 
              onClick={handleMockPayment} 
              disabled={loading}
              style={loading ? disabledButtonStyle : buttonStyle}
            >
              {loading ? 'Processing...' : 'Confirm Payment'}
            </button>
          ) : (
            <h3 style={{ color: 'lightgreen' }}>Payment Successful! Redirecting...</h3>
          )}
          
          {error && <p className="error-message" style={{ color: 'red', marginTop: '1rem' }}>{error}</p>}
        </div>
      </div>
    </div>
  );
}

export default SubscriptionPage;