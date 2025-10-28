// /client/src/pages/RegisterPage.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios'; // ⬅️ Import axios
// import { supabase } from '../supabaseClient'; // (ไม่ใช้อีกต่อไป)

function RegisterPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState(''); // State สำหรับ Username
  const [error, setError] = useState('');
  const [message, setMessage] = useState(''); // สำหรับข้อความ Success
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    if (password.length < 6) {
        setError("Password must be at least 6 characters.");
        setLoading(false);
        return;
    }

    try {
      // 1. (สำคัญ) เปลี่ยนมาเรียก API ของเรา (Node.js)
      await axios.post('/api/auth/register', {
        email: email,
        password: password,
        username: username
      });

      // 2. แสดงข้อความสำเร็จ
      setMessage('Registration successful! Please login.');
      setLoading(false);

      // (เคลียร์ฟอร์ม)
      setEmail('');
      setPassword('');
      setUsername('');
      
      // 3. (ทางเลือก) ส่งไปหน้า Login หลังจาก 2 วินาที
      setTimeout(() => navigate('/login'), 2000);

    } catch (err) {
      // 4. (สำคัญ) รับ Error จาก Axios
      setError(err.response?.data?.message || 'Failed to register');
      setLoading(false);
    }
  };

  // --- Styles (คงเดิม) ---
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
      width: '100%', 
      boxSizing: 'border-box',
      background: '#222',
      color: '#fff',
      border: '1px solid #333',
      padding: '0.5rem',
      borderRadius: '4px',
  };
  const buttonStyle = {
    width: '100%',
    padding: '12px',
    fontSize: '1rem',
    fontWeight: 'bold',
    background: '#e5b80b', // สีทอง
    color: '#141414',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'background 0.2s',
  };
  const disabledButtonStyle = { ...buttonStyle, background: '#555', color: '#888', cursor: 'not-allowed' };
  const linkStyle = { color: '#e5b80b', fontWeight: 'bold' };

  return (
    <div style={pageStyle}>
      <div style={formContainerStyle}>
        <h2 style={{ color: '#f4f4f4', textAlign: 'center', marginTop: 0, marginBottom: '1.5rem' }}>Register</h2>
        
        {/* ถ้ายังไม่ส่ง ให้แสดงฟอร์ม */}
        {!message && (
          <form onSubmit={handleSubmit}>
            {/* Username */}
            <div style={inputGroupStyle}>
              <label htmlFor="reg-username" style={labelStyle}>Username:</label>
              <input
                id="reg-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                style={inputStyle}
              />
            </div>
            {/* Email */}
            <div style={inputGroupStyle}>
              <label htmlFor="reg-email" style={labelStyle}>Email:</label>
              <input
                id="reg-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={inputStyle}
              />
            </div>
            {/* Password */}
            <div style={inputGroupStyle}>
              <label htmlFor="reg-password" style={labelStyle}>Password (min 6 characters):</label>
              <input
                id="reg-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength="6"
                style={inputStyle}
              />
            </div>

            {error && <p className="error-message" style={{ color: 'red', marginTop: '1rem', textAlign: 'center' }}>{error}</p>}
            
            <button type="submit" disabled={loading} style={loading ? disabledButtonStyle : buttonStyle}>
              {loading ? 'Registering...' : 'Register'}
            </button>
          </form>
        )}

        {/* ถ้าส่งสำเร็จ (มี message) ให้แสดงข้อความยืนยัน */}
        {message && (
            <div style={{ textAlign: 'center' }}>
                <p className="success-message" style={{ color: 'lightgreen', fontSize: '1.1em' }}>{message}</p>
            </div>
        )}

        <p style={{ marginTop: '1.5rem', color: '#aaa', textAlign: 'center' }}>
          Already have an account? <Link to="/login" style={linkStyle}>Login here</Link>
        </p>
      </div>
    </div>
  );
}

export default RegisterPage;