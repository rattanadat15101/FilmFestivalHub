// /client/src/components/FilmDetailsModal.jsx
import React from 'react';

// Basic styling for the modal
const modalStyles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)', /* พื้นหลังดำเข้ม */
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  content: {
    backgroundColor: '#1e1e1e', /* พื้นหลัง Modal ดำอ่อน */
    padding: '30px',
    borderRadius: '8px',
    maxWidth: '600px',
    width: '90%',
    position: 'relative',
    maxHeight: '90vh',
    overflowY: 'auto',
    color: '#f4f4f4', /* สีตัวอักษรขาว */
    boxShadow: '0 0 20px rgba(229, 184, 11, 0.3)', /* เพิ่มเงาสีทอง */
  },
  closeButton: {
    position: 'absolute',
    top: '15px',
    right: '15px',
    background: 'transparent',
    border: 'none',
    fontSize: '2rem',
    color: '#e5b80b', /* ปุ่มปิดสีทอง */
    cursor: 'pointer',
    lineHeight: '1', // Ensure button doesn't take too much height
  },
  header: {
    color: '#e5b80b',
    borderBottom: '1px solid #333',
    paddingBottom: '10px',
    marginBottom: '20px',
    marginTop: 0, // Reset default margin
  },
  info: {
    marginBottom: '10px',
    fontSize: '1.1em',
    color: '#ccc',
    lineHeight: '1.5',
  },
  label: {
      color: '#aaa',
      marginRight: '5px',
  }
};

function FilmDetailsModal({ film, onClose }) {
  if (!film) return null; // Don't render if no film is selected

  // Format the date (optional)
  const formattedDate = film.created_at
    ? new Date(film.created_at).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' }) // Specify format
    : 'N/A';

  // Safely access filmmaker username (จาก RPC function)
  const filmmakerName = film.filmmaker_username || film.profiles?.username || 'Unknown';

  // Safely map genres
  const genreNames = Array.isArray(film.genres) && film.genres.length > 0
    ? film.genres.map(g => g?.name || 'Unknown Genre').join(', ')
    : 'N/A';

  return (
    <div style={modalStyles.overlay} onClick={onClose}> {/* Close when clicking overlay */}
      <div style={modalStyles.content} onClick={(e) => e.stopPropagation()}> {/* Prevent closing when clicking content */}
        <button style={modalStyles.closeButton} onClick={onClose}>&times;</button>

        <h2 style={modalStyles.header}>{film.title || 'No Title'}</h2>

        {/* Poster */}
        {film.poster_url && (
            <img
                src={film.poster_url}
                alt={`Poster for ${film.title}`}
                style={{ width: '100%', maxHeight: '400px', objectFit: 'contain', marginBottom: '1rem', borderRadius: '4px' }}
            />
        )}

        <div style={modalStyles.info}>
            <strong style={modalStyles.label}>เรื่องย่อ:</strong> {film.synopsis || 'ไม่มีเรื่องย่อ'}
        </div>

        <div style={modalStyles.info}>
            <strong style={modalStyles.label}>ประเภท:</strong>
            {genreNames}
        </div>

        <div style={modalStyles.info}>
            <strong style={modalStyles.label}>ผู้สร้าง:</strong>
            <span style={{ color: '#e5b80b' }}> {filmmakerName}</span>
        </div>

        <div style={modalStyles.info}>
            <strong style={modalStyles.label}>สถานะการเข้าถึง:</strong>
            <span style={{ color: film.is_premium ? '#f06' : '#2ecc71', fontWeight: 'bold' }}>
                {film.is_premium ? ' Premium' : ' Standard'}
            </span>
        </div>

        <div style={modalStyles.info}>
            <strong style={modalStyles.label}>อัปโหลดเมื่อ:</strong> {formattedDate}
        </div>
      </div>
    </div>
  );
}

export default FilmDetailsModal;
