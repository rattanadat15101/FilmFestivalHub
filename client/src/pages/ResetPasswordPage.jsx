// /client/src/pages/ResetPasswordPage.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate, Link } from 'react-router-dom';

function ResetPasswordPage() {
  const { token } = useParams(); // 1. ดึง Token จาก URL
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const res = await axios.post('/api/auth/reset-password', { 
          token: token, 
          newPassword: newPassword 
      });
      setMessage(res.data.message);
      
      // 2. ถ้าสำเร็จ ให้เด้งไปหน้า Login
      setTimeout(() => navigate('/login'), 2000);

    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  // --- Styles (ใช้สไตล์เดียวกับ Login/Register) ---
  const pageStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 'calc(100vh - 100px)',
    padding: '2rem',
  };
  const formContainerStyle = {
    maxWidth: '400px',
    width: '100%',
    padding: '2rem 2.5rem',
    background: '#1c1c1c',
    borderRadius: '8px',
    border: '1px solid #333',
  };
  const inputGroupStyle = { marginBottom: '1rem' };
  const labelStyle = { display: 'block', marginBottom: '5px', color: '#aaa' };
  const inputStyle = {
    width: '100%', boxSizing: 'border-box', background: '#222',
    color: '#fff', border: '1px solid #333', padding: '0.5rem', borderRadius: '4px',
  };
  const buttonStyle = {
    width: '100%', padding: '12px', fontSize: '1rem', fontWeight: 'bold',
    background: '#e5b80b', color: '#141414', border: 'none',
    borderRadius: '4px', cursor: 'pointer', transition: 'background 0.2s',
  };
  const disabledButtonStyle = { ...buttonStyle, background: '#555', color: '#888', cursor: 'not-allowed' };
  const linkStyle = { color: '#e5b80b', fontWeight: 'bold' };

  return (
    <div style={pageStyle}>
      <div style={formContainerStyle}>
        <h2 style={{ color: '#f4f4f4', textAlign: 'center', marginTop: 0, marginBottom: '1.5rem' }}>
          Set New Password
        </h2>
        
        {!token && (
             <p style={{ color: 'red', textAlign: 'center' }}>
                 Invalid or missing reset token. Please request a new link.
             </p>
        )}

        {token && !message && (
          <form onSubmit={handleSubmit}>
            <div style={inputGroupStyle}>
              <label htmlFor="reset-pass" style={labelStyle}>
                New Password (min 6 characters):
              </label>
              <input
                id="reset-pass"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                style={inputStyle}
              />
            </div>
             <div style={inputGroupStyle}>
              <label htmlFor="reset-confirm" style={labelStyle}>
                Confirm New Password:
              </label>
              <input
                id="reset-confirm"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                style={inputStyle}
              />
            </div>
            
            {error && (
              <p style={{ color: 'red', marginTop: '1rem', textAlign: 'center' }}>{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              style={loading ? disabledButtonStyle : buttonStyle}
            >
              {loading ? 'Saving...' : 'Save New Password'}
            </button>
          </form>
        )}
        
        {message && (
             <p style={{ color: 'lightgreen', textAlign: 'center' }}>
                 {message}
             </p>
        )}

        <p style={{ marginTop: '1.5rem', color: '#aaa', textAlign: 'center' }}>
          <Link to="/login" style={linkStyle}>
            Back to Login
          </Link>
        </p>
      </div>
    </div>
  );
}

export default ResetPasswordPage;