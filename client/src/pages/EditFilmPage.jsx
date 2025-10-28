// /client/src/pages/EditFilmPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext'; // Path นี้ถูกต้อง
import { useParams, useNavigate } from 'react-router-dom';

function EditFilmPage() {
  const { filmId } = useParams();
  const { session } = useAuth();
  const navigate = useNavigate();

  // States for form fields
  const [title, setTitle] = useState('');
  const [synopsis, setSynopsis] = useState('');
  const [posterFile, setPosterFile] = useState(null); // For new poster upload
  const [currentPosterUrl, setCurrentPosterUrl] = useState(''); // To display current poster

  // --- States for Genres ---
  const [genres, setGenres] = useState([]); // Genre ทั้งหมด
  const [selectedGenres, setSelectedGenres] = useState([]); // ID ที่เลือก (จากข้อมูลหนัง)
  // --- จบส่วน Genres ---

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // 1. Fetch existing film data (รวม genreIds) AND all genres
  const fetchData = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    setError('');
    try {
      // ดึง Genre ทั้งหมดก่อน
      const genresResponse = await axios.get('/api/genres');
      if (Array.isArray(genresResponse.data)) {
        setGenres(genresResponse.data);
      } else {
        console.error("Genres API did not return array:", genresResponse.data);
        setGenres([]); // Set empty array on failure
      }

      // ดึงข้อมูลหนัง (Backend จะส่ง genreIds มาให้)
      const filmResponse = await axios.get(
        `/api/filmmaker/film/${filmId}/details`,
        { headers: { Authorization: `Bearer ${session.access_token}` } }
      );
      const filmData = filmResponse.data;
      setTitle(filmData.title);
      setSynopsis(filmData.synopsis);
      setCurrentPosterUrl(filmData.poster_url);
      setSelectedGenres(filmData.genreIds || []); // <-- ใช้ genreIds ที่ได้มา
    } catch (err) {
      setError('Failed to load data. You might not own this film or genres are unavailable.');
      console.error("Error fetching data for edit page:", err.response || err);
    } finally {
      setLoading(false);
    }
  }, [filmId, session]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handler สำหรับ Poster
  const handlePosterFileChange = (e) => setPosterFile(e.target.files[0]);

  // Handler สำหรับ Genre Checkbox
  const handleGenreChange = (e) => {
    const genreId = parseInt(e.target.value);
    if (e.target.checked) {
      setSelectedGenres(prev => [...prev, genreId]);
    } else {
      setSelectedGenres(prev => prev.filter(id => id !== genreId));
    }
  };

  // 3. Handle form submission (ส่ง genreIds ไปด้วย)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setMessage('');

    const formData = new FormData();
    formData.append('title', title);
    formData.append('synopsis', synopsis);
    if (posterFile) formData.append('filmPoster', posterFile);
    // [อัปเดต] ส่ง selectedGenres เป็น JSON string
    formData.append('genreIds', JSON.stringify(selectedGenres));

    try {
      // Send PUT request to the backend
      const response = await axios.put(
        `/api/filmmaker/film/${filmId}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data', // Important for file uploads
            Authorization: `Bearer ${session.access_token}`
          }
        }
      );
      setMessage(response.data.message);
      // Optional: Refresh data or navigate back
      fetchData(); // Reload data to show updated poster if changed
      setPosterFile(null); // Clear selected file
      // setTimeout(() => navigate('/studio'), 1500); // Navigate back after a delay
    } catch (err) {
      setError(err.response?.data?.message || 'Update failed.');
      console.error("Error updating film:", err.response || err);
    } finally {
      setSubmitting(false);
    }
  };

  // --- Styles ---
  const pageStyle = { maxWidth: '600px', margin: '4rem auto', color: '#f4f4f4' };
  const formStyle = { background: '#222', padding: '2rem', borderRadius: '8px', border: '1px solid #333' };
  const labelStyle = { color: '#aaa', display: 'block', marginBottom: '5px' };
  const inputGroupStyle = { marginBottom: '1.5rem' }; // Increased margin
  const inputStyle = { width: '100%', boxSizing: 'border-box' };
  const textareaStyle = { width: '100%', boxSizing: 'border-box' };
  const buttonStyle = { background: '#e5b80b', color: '#141414', border: 'none', fontWeight: 'bold' };
  const cancelButton = { ...buttonStyle, background: '#555', color: 'white', marginLeft: '1rem' };
  const genreCheckboxContainerStyle = { display: 'flex', flexWrap: 'wrap', gap: '10px 15px', marginTop: '5px' };
  const genreCheckboxStyle = { display: 'flex', alignItems: 'center' };


  if (loading) return <div style={pageStyle}>Loading film data...</div>;

  return (
    <div style={pageStyle}>
      <h2 style={{ color: '#f4f4f4', marginBottom: '2rem' }}>Edit Film Details</h2>
      {error && <p className="error-message" style={{ marginBottom: '1rem' }}>{error}</p>}
      <form onSubmit={handleSubmit} style={formStyle}>
        {/* Title */}
        <div style={inputGroupStyle}>
          <label htmlFor="film-title-edit" style={labelStyle}>Film Title:</label>
          <input
            id="film-title-edit"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            style={inputStyle}
          />
        </div>
        {/* Synopsis */}
        <div style={inputGroupStyle}>
          <label htmlFor="film-synopsis-edit" style={labelStyle}>Synopsis:</label>
          <textarea
            id="film-synopsis-edit"
            value={synopsis}
            onChange={(e) => setSynopsis(e.target.value)}
            rows="5"
            required
            style={textareaStyle}
          />
        </div>

        {/* --- Genres Checkboxes --- */}
        <div style={inputGroupStyle}>
            <label style={labelStyle}>Genres:</label>
            <div style={genreCheckboxContainerStyle}>
                {genres.length > 0 ? (
                    genres.map(genre => (
                        <div key={genre.id} style={genreCheckboxStyle}>
                            <input
                                type="checkbox"
                                id={`genre-edit-${genre.id}`}
                                value={genre.id}
                                checked={selectedGenres.includes(genre.id)}
                                onChange={handleGenreChange}
                            />
                            <label htmlFor={`genre-edit-${genre.id}`} style={{ marginLeft: '5px', color: '#ccc' }}>{genre.name}</label>
                        </div>
                    ))
                ) : (
                    <p style={{ color: '#aaa' }}>Loading genres...</p>
                )}
            </div>
        </div>
        {/* --- จบส่วน Genres --- */}

        {/* Poster Upload */}
        <div style={inputGroupStyle}>
          <label style={labelStyle}>Current Poster:</label><br />
          {currentPosterUrl ? (
            <img src={currentPosterUrl} alt="Current Poster" style={{ maxWidth: '200px', maxHeight: '300px', marginBottom: '0.5rem', borderRadius: '4px' }} />
          ) : ( <p style={{ color: '#aaa' }}>No current poster.</p> )}
          <br />
          <label htmlFor="poster-upload-edit" style={labelStyle}>Upload New Poster (Optional):</label>
          <input
            id="poster-upload-edit"
            type="file"
            accept="image/*"
            onChange={handlePosterFileChange}
            style={{ display: 'block', marginTop: '5px' }} // Make file input block
          />
        </div>

        {message && <p className="success-message">{message}</p>}
        {/* (Error แสดงข้างบนแล้ว) */}

        <div style={{ marginTop: '2rem' }}> {/* Add margin above buttons */}
            <button type="submit" disabled={submitting} style={buttonStyle}>
            {submitting ? 'Saving...' : 'Save Changes'}
            </button>
            <button type="button" onClick={() => navigate('/studio')} style={cancelButton}>
            Cancel
            </button>
        </div>
      </form>
    </div>
  );
}

export default EditFilmPage;