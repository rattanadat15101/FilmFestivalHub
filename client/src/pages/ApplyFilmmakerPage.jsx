// /client/src/pages/ApplyFilmmakerPage.jsx
import React, { useState, useEffect } from 'react'; // Added useEffect
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext'; // Path นี้ถูกต้อง
import { useNavigate } from 'react-router-dom';

function ApplyFilmmakerPage() {
  const { session, profile, loading: authLoading } = useAuth(); // ดึง loading state มาด้วย
  const navigate = useNavigate();
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false); // State สำหรับ submitting form
  const [applicationStatus, setApplicationStatus] = useState(null); // State เช็กสถานะใบสมัคร
  const [checkingStatus, setCheckingStatus] = useState(true); // State เช็กสถานะตอนโหลด

  // --- เช็กสถานะใบสมัครตอนโหลดหน้า ---
  useEffect(() => {
    const checkApplicationStatus = async () => {
      if (!session || !profile) return; // รอให้ session และ profile โหลดเสร็จก่อน
      setCheckingStatus(true);
      setError('');
      try {
        // ลองดึงใบสมัครเก่า (Backend จะใช้ RLS เช็กสิทธิ์ให้อ่านเฉพาะของตัวเอง)
        const response = await axios.get(
          '/api/user/my-application', // เราต้องสร้าง Endpoint นี้
          { headers: { Authorization: `Bearer ${session.access_token}` } }
        );
        if (response.data) {
          setApplicationStatus(response.data.status); // เก็บสถานะ (pending, approved, rejected)
        } else {
          setApplicationStatus(null); // ยังไม่เคยสมัคร
        }
      } catch (err) {
        // ถ้า API พัง (404 Not Found แปลว่ายังไม่เคยสมัคร)
        if (err.response && err.response.status === 404) {
             setApplicationStatus(null);
        } else {
            console.error("Failed to check application status", err);
            setError("Could not check your application status. Please try refreshing.");
        }
      } finally {
        setCheckingStatus(false);
      }
    };

    // รอให้ Auth โหลดเสร็จก่อนค่อยเช็ก
    if (!authLoading) {
        checkApplicationStatus();
    }
  }, [session, profile, authLoading]); // Dependency เพิ่ม authLoading


  // --- ฟังก์ชันส่งใบสมัคร ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    if (!session?.access_token) {
        setError('Authentication session not ready.');
        setLoading(false);
        return;
    }
    try {
      const response = await axios.post(
        '/api/user/apply-filmmaker',
        { reason },
        { headers: { Authorization: `Bearer ${session.access_token}` } }
      );
      setMessage(response.data.message);
      setApplicationStatus('pending'); // อัปเดตสถานะในหน้าจอทันที
      // setTimeout(() => navigate('/'), 2000); // ไม่ต้อง redirect แล้ว ให้ user เห็นสถานะ
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit application.');
    } finally {
      setLoading(false);
    }
  };

  // --- Styles ---
  const pageStyle = { maxWidth: '600px', margin: '4rem auto', color: '#f4f4f4' };
  const formStyle = { background: '#222', padding: '2rem', borderRadius: '8px', border: '1px solid #333' };
  const labelStyle = { color: '#aaa', display: 'block', marginBottom: '5px' };
  const textareaStyle = { width: '100%', boxSizing: 'border-box', marginBottom: '1rem' };
  const buttonStyle = { background: '#e5b80b', color: '#141414', border: 'none', fontWeight: 'bold' };
  const statusBoxStyle = { background: '#1c1c1c', padding: '1.5rem', borderRadius: '8px', border: '1px solid #333', textAlign: 'center', color: '#aaa' };


  // --- Render Logic ---

  if (authLoading || checkingStatus) {
      return <div style={pageStyle}>Loading application status...</div>;
  }

  // ถ้าเป็น Filmmaker แล้ว
  if (profile?.is_filmmaker) {
    return (
      <div style={pageStyle}>
        <div style={statusBoxStyle}>
          <h2 style={{ color: 'lightgreen' }}>You are already a Filmmaker!</h2>
          <p>You can now <Link to="/upload" style={{ color: '#e5b80b' }}>upload your films</Link>.</p>
        </div>
      </div>
    );
  }

  // ถ้าเคยสมัครแล้ว กำลังรออนุมัติ
  if (applicationStatus === 'pending') {
      return (
          <div style={pageStyle}>
              <div style={statusBoxStyle}>
                  <h2 style={{ color: 'orange' }}>Application Submitted</h2>
                  <p>Your application to become a filmmaker is currently under review.</p>
              </div>
          </div>
      );
  }

   // ถ้าเคยสมัครแล้ว แต่ถูกปฏิเสธ (ต้องเพิ่ม Logic Reject ใน Admin)
   if (applicationStatus === 'rejected') {
      return (
          <div style={pageStyle}>
              <div style={statusBoxStyle}>
                  <h2 style={{ color: 'red' }}>Application Rejected</h2>
                  <p>Unfortunately, your previous application was not approved. You may submit a new one if you wish.</p>
                  {/* ปุ่มให้สมัครใหม่ */}
                  <button onClick={() => setApplicationStatus(null)} style={{...buttonStyle, background: '#555', color: 'white', marginTop: '1rem' }}>Submit New Application</button>
              </div>
          </div>
      );
  }


  // ถ้ายังไม่เคยสมัคร หรือสมัครใหม่ (applicationStatus === null)
  return (
    <div style={pageStyle}>
      <h2 style={{ color: '#f4f4f4', marginBottom: '1rem' }}>Become a Filmmaker</h2>
      <p style={{ color: '#aaa', marginBottom: '2rem' }}>Submit an application to start uploading your films. Tell us why you'd be a great addition!</p>
      <form onSubmit={handleSubmit} style={formStyle}>
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="reason-textarea" style={labelStyle}>Tell us about yourself (Optional):</label>
          <textarea
            id="reason-textarea"
            rows="5"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            style={textareaStyle}
            placeholder="Why do you want to share your films on our platform?"
          />
        </div>

        {message && <p className="success-message">{message}</p>}
        {error && <p className="error-message">{error}</p>}

        <button type="submit" disabled={loading} style={buttonStyle}>
          {loading ? 'Submitting...' : 'Submit Application'}
        </button>
      </form>
    </div>
  );
}

export default ApplyFilmmakerPage;