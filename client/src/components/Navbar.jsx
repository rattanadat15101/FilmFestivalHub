// /client/src/components/Navbar.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx'; // Path แก้ไข: ระบุ .jsx ชัดเจน

function Navbar() {
  const { user, profile, logout } = useAuth();
  const isAdmin = profile?.is_admin;
  const isFilmmaker = profile?.is_filmmaker;

  // Styles
  const navStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 30px', background: '#080808', borderBottom: '1px solid #333', color: '#f4f4f4' }; // Slightly darker nav
  const leftNavStyle = { display: 'flex', alignItems: 'center', gap: '20px' }; // Use gap
  const rightNavStyle = { display: 'flex', alignItems: 'center', gap: '15px' }; // Use gap
  const logoStyle = { color: '#e5b80b', fontWeight: 'bold', fontSize: '1.3rem', textDecoration: 'none' };
  const linkStyle = { color: '#ccc', textDecoration: 'none', padding: '5px 0' }; // Lighter grey links
  const activeLinkStyle = { ...linkStyle, color: '#e5b80b', fontWeight: 'bold' };
  const premiumLinkStyle = { ...linkStyle, color: '#f06', fontWeight: 'bold' };
  const adminLinkStyle = { ...linkStyle, color: '#E74C3C', fontWeight: 'bold' }; // Red for admin links
  const buttonStyle = { background: '#333', color: '#f4f4f4', border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer', transition: 'background-color 0.2s' };
  const logoutButtonStyle = { background: '#E74C3C', color: '#f4f4f4', border: 'none', marginLeft: '1rem', padding: '8px 15px', borderRadius: '4px' };

  return (
    <nav style={navStyle}>
      <div style={leftNavStyle}>
        <Link to="/" style={logoStyle}>
          FilmFestival Hub
        </Link>
        
        <Link to="/schedule" style={linkStyle}>Q&A Schedule</Link>

        {/* Studio/Filmmaker Link (Only show if NOT Admin) */}
        {user && !isAdmin && (
            isFilmmaker ? (
              <Link to="/studio" style={activeLinkStyle}> Creator Studio </Link>
            ) : (
              <Link to="/apply-filmmaker" style={linkStyle}> Become a Filmmaker </Link>
            )
        )}

        {/* Premium Link */}
        {user && !profile?.is_subscriber && (
          <Link to="/subscribe" style={premiumLinkStyle}> Go Premium </Link>
        )}

        {/* Admin Links */}
        {isAdmin && (
          <>
            <Link to="/admin" style={adminLinkStyle}> Admin Panel </Link>
            <Link to="/admin/genres" style={linkStyle}> Manage Genres </Link>
          </>
        )}
      </div>
      <div style={rightNavStyle}>
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ color: '#f4f4f4' }}>{profile?.username || user.email}</span>
            {profile?.is_subscriber && ( <span style={{ color: '#e5b80b', fontWeight: 'bold' }}>(Premium)</span> )}
            {isAdmin && ( <span style={{ color: '#E74C3C', fontWeight: 'bold' }}>(Admin)</span> )}
            <button onClick={logout} style={logoutButtonStyle}>Logout</button>
          </div>
        ) : (
          <Link to="/login" style={{ ...logoStyle, color: '#e5b80b' }}>Login</Link>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
