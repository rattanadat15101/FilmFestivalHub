// /client/src/pages/ForgotPasswordPage.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const res = await axios.post('/api/auth/forgot-password', { email });
      setMessage(res.data.message);
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred.');
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
        <h2 style={{ color: '#f4f4f4', textAlign: 'center', marginTop: 0, marginBottom: '1rem' }}>
          Reset Password
        </h2>
        <p style={{color: '#aaa', textAlign: 'center', fontSize: '0.9em', marginBottom: '1.5rem'}}>
            Enter your email to receive a password reset link.
        </p>
        
        {!message ? (
          <form onSubmit={handleSubmit}>
            <div style={inputGroupStyle}>
              <label htmlFor="forgot-email" style={labelStyle}>
                Email:
              </label>
              <input
                id="forgot-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: 'lightgreen', fontSize: '1.1em' }}>{message}</p>
            <p style={{color: '#aaa'}}>
                (Reminder: In this demo, the link is printed in the 
                <strong style={{color: 'white'}}> server console</strong>, 
                not sent via email.)
            </p>
          </div>
        )}

        <p style={{ marginTop: '1.5rem', color: '#aaa', textAlign: 'center' }}>
          Remembered your password?{' '}
          <Link to="/login" style={linkStyle}>
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;