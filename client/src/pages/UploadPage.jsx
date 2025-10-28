// /client/src/pages/UploadPage.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext'; // Path นี้ถูกต้อง
import { useNavigate } from 'react-router-dom'; // 1. Import useNavigate

function UploadPage() {
  const { session } = useAuth();
  const navigate = useNavigate(); // 2. เรียกใช้ useNavigate
  
  // States for form fields
  const [title, setTitle] = useState('');
  const [synopsis, setSynopsis] = useState('');
  const [videoFile, setVideoFile] = useState(null);
  const [posterFile, setPosterFile] = useState(null);
  const [genres, setGenres] = useState([]);
  const [selectedGenres, setSelectedGenres] = useState([]);

  // States for UI feedback
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // --- ดึงข้อมูล Genres ทั้งหมดตอนโหลดหน้า ---
  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const response = await axios.get('/api/genres');
        if (Array.isArray(response.data)) {
            setGenres(response.data);
        } else {
            console.error("Genres API did not return an array:", response.data);
        }
      } catch (err) {
        console.error("Failed to fetch genres", err);
        setError("Could not load genre options. Please try refreshing.");
      }
    };
    fetchGenres();
  }, []); // ทำงานครั้งเดียว

  // --- Handlers ---
  const handleVideoFileChange = (e) => {
    setVideoFile(e.target.files[0]); 
  };
  
  const handlePosterFileChange = (e) => {
    setPosterFile(e.target.files[0]);
  };

  const handleGenreChange = (e) => {
    const genreId = parseInt(e.target.value);
    if (e.target.checked) {
      setSelectedGenres(prev => [...prev, genreId]);
    } else {
      setSelectedGenres(prev => prev.filter(id => id !== genreId));
    }
  };

  // --- Submit Form ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!videoFile) {
      setError('Please select a video file to upload.');
      return;
    }
    
    setSubmitting(true);
    setError('');
    setMessage('');

    const formData = new FormData();
    formData.append('title', title);
    formData.append('synopsis', synopsis);
    formData.append('filmVideo', videoFile);
    if (posterFile) {
      formData.append('filmPoster', posterFile);
    }
    formData.append('genreIds', JSON.stringify(selectedGenres));

    try {
      // 2. ยิง API ไปยัง Backend
      const response = await axios.post(
        '/api/filmmaker/upload',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${session.access_token}`
          }
        }
      );
      
      setMessage(response.data.message); // แสดงข้อความ "Success"
      
      // เคลียร์ฟอร์ม
      setTitle('');
      setSynopsis('');
      setVideoFile(null);
      setPosterFile(null);
      setSelectedGenres([]);
      e.target.reset();

      // 3. [อัปเดต] เด้งกลับไปหน้า Studio หลังจาก 1.5 วินาที
      setTimeout(() => {
        navigate('/studio');
      }, 1500); // รอ 1.5 วินาทีเพื่อให้ User อ่านข้อความ Success

    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed. Please try again.');
      console.error("Error uploading film:", err.response || err);
      setSubmitting(false); // หยุด Loading ถ้า Error
    }
    // (ไม่ต้อง setSubmitting(false) ถ้า Success เพราะกำลังจะ Redirect)
  };

  // --- Styles ---
  const pageStyle = { maxWidth: '600px', margin: '4rem auto', color: '#f4f4f4' };
  const formStyle = { background: '#222', padding: '2rem', borderRadius: '8px', border: '1px solid #333' };
  const inputGroupStyle = { marginBottom: '1.5rem' };
  const labelStyle = { color: '#aaa', display: 'block', marginBottom: '5px', fontWeight: '500' };
  const inputStyle = { width: '100%', boxSizing: 'border-box' };
  const textareaStyle = { width: '100%', boxSizing: 'border-box', minHeight: '100px', resize: 'vertical' };
  const fileInputStyle = { display: 'block', marginTop: '5px', color: '#ccc' };
  const genreCheckboxContainerStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '10px', marginTop: '5px', background: '#333', padding: '10px', borderRadius: '4px' };
  const genreCheckboxStyle = { display: 'flex', alignItems: 'center' };
  const buttonStyle = { background: '#e5b80b', color: '#141414', border: 'none', fontWeight: 'bold', width: '100%', padding: '12px' };
  const disabledButtonStyle = { ...buttonStyle, background: '#555', color: '#888', cursor: 'not-allowed' };

  return (
    <div style={pageStyle}>
      <h2 style={{ color: '#f4f4f4', marginBottom: '1rem' }}>Upload Your Short Film</h2>
      <p style={{ color: '#aaa', marginBottom: '2rem' }}>Your film will be reviewed by an admin before it goes public (unless you are an admin).</p>
      
      <form onSubmit={handleSubmit} style={formStyle}>
        
        {/* Title */}
        <div style={inputGroupStyle}>
          <label htmlFor="upload-title" style={labelStyle}>Film Title:</label>
          <input
            id="upload-title"
            type="text" 
            value={title} 
            onChange={(e) => setTitle(e.target.value)} 
            required 
            style={inputStyle}
          />
        </div>
        
        {/* Synopsis */}
        <div style={inputGroupStyle}>
          <label htmlFor="upload-synopsis" style={labelStyle}>Synopsis:</label>
          <textarea
            id="upload-synopsis"
            value={synopsis} 
            onChange={(e) => setSynopsis(e.target.value)}
            rows="5"
            required
            style={textareaStyle}
          />
        </div>

        {/* Genres Checkboxes */}
        <div style={inputGroupStyle}>
            <label style={labelStyle}>Genres:</label>
            <div style={genreCheckboxContainerStyle}>
                {genres.length > 0 ? (
                    genres.map(genre => (
                        <div key={genre.id} style={genreCheckboxStyle}>
                            <input
                                type="checkbox"
                                id={`genre-upload-${genre.id}`}
                                value={genre.id}
                                checked={selectedGenres.includes(genre.id)}
                                onChange={handleGenreChange}
                            />
                            <label htmlFor={`genre-upload-${genre.id}`} style={{ marginLeft: '5px', color: '#ccc', cursor: 'pointer' }}>{genre.name}</label>
                        </div>
                    ))
                ) : (
                    <p style={{ color: '#888', margin: 0 }}>Loading genres...</p>
                )}
            </div>
        </div>
        
        {/* Video File */}
        <div style={inputGroupStyle}>
          <label htmlFor="upload-video" style={labelStyle}>Video File (MP4, MOV, etc): <span style={{color: 'red'}}>*</span></label>
          <input
            id="upload-video"
            type="file" 
            accept="video/*"
            onChange={handleVideoFileChange} 
            required 
            style={fileInputStyle}
          />
        </div>
        
        {/* Poster File */}
        <div style={inputGroupStyle}>
          <label htmlFor="upload-poster" style={labelStyle}>Poster Image (JPG, PNG):</label>
          <input
            id="upload-poster"
            type="file" 
            accept="image/*"
            onChange={handlePosterFileChange} 
            style={fileInputStyle}
          />
        </div>
        
        {/* Feedback Messages */}
        {error && <p className="error-message" style={{ color: '#E74C3C' }}>{error}</p>}
        {message && <p className="success-message" style={{ color: 'lightgreen' }}>{message}</p>}
        
        <button type="submit" disabled={submitting} style={submitting ? disabledButtonStyle : buttonStyle}>
          {submitting ? 'Uploading...' : 'Upload Film'}
        </button>
      </form>
    </div>
  );
}

export default UploadPage;