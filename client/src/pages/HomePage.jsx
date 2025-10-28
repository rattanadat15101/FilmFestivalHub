// /client/src/pages/HomePage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import FilmDetailsModal from '../components/FilmDetailsModal';

function HomePage() {
  const { session } = useAuth();
  const [films, setFilms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedTerm, setDebouncedTerm] = useState('');
  const [genres, setGenres] = useState([]);
  const [selectedGenreId, setSelectedGenreId] = useState(null);
  const [selectedFilmForModal, setSelectedFilmForModal] = useState(null);

  // Debounce Logic
  useEffect(() => {
    const timerId = setTimeout(() => { setDebouncedTerm(searchTerm); }, 500);
    return () => { clearTimeout(timerId); };
  }, [searchTerm]);

  // Fetch Genres
  useEffect(() => {
    const fetchGenres = async () => {
      try {
        console.log("Fetching genres...");
        // แก้ไข: เปลี่ยนจาก 'http://localhost:4000/api/genres' เป็น Path สัมพัทธ์
        const response = await axios.get('/api/genres'); 
        console.log("Genres API response:", response.data);
        if (Array.isArray(response.data)) {
          setGenres(response.data);
        } else {
          console.error("Genres API did not return an array:", response.data);
          setGenres([]);
        }
      } catch (err) {
        console.error("Failed to fetch genres for filtering", err);
        setGenres([]);
      }
    };
    fetchGenres();
  }, []);

  // Fetch Films (uses RPC from backend)
  const fetchFilms = useCallback(async (currentSearchTerm, currentGenreId) => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (currentSearchTerm) params.append('search', currentSearchTerm);
      if (currentGenreId) params.append('genre', currentGenreId);
      
      // แก้ไข: เปลี่ยนจาก apiUrl เต็มรูปแบบ เป็น Path สัมพัทธ์
      const apiUrl = `/api/films?${params.toString()}`; 
      
      console.log("Fetching films from:", apiUrl);
      // axios จะใช้โดเมนปัจจุบัน (Codespace URL) แล้วเรียกไปที่ /api/films
      const response = await axios.get(apiUrl); 
      
      if (Array.isArray(response.data)) {
          setFilms(response.data);
      } else {
          console.error("Films API did not return an array:", response.data);
          setError('Received invalid film data from server.');
          setFilms([]);
      }
    } catch (err) {
      setError('Could not fetch films.');
      console.error("Error in fetchFilms:", err);
      setFilms([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Trigger fetchFilms when search term or genre changes
  useEffect(() => {
    // *** แก้ไข: ลบบรรทัดนี้ออก เพราะเราจะใช้ Path สัมพัทธ์แทนการตั้งค่า Base URL ***
    // axios.defaults.baseURL = 'http://localhost:4000'; // Make sure this is correct 
    fetchFilms(debouncedTerm, selectedGenreId);
  }, [debouncedTerm, selectedGenreId, fetchFilms]); // Dependencies that trigger re-fetch

  // Modal Functions
  const handleShowDetails = (film, event) => {
      event.preventDefault();
      event.stopPropagation();
      setSelectedFilmForModal(film);
  };
  const handleCloseModal = () => {
      setSelectedFilmForModal(null);
  };

  // Styles (ไม่มีการเปลี่ยนแปลง)
  const filterButtonStyle = {
    background: '#333',
    color: '#f4f4f4',
    border: '1px solid #444',
    padding: '8px 15px',
    borderRadius: '20px',
    cursor: 'pointer',
    transition: 'background 0.2s',
  };
  const activeFilterButtonStyle = {
    ...filterButtonStyle,
    background: '#e5b80b', // Gold
    color: '#141414', // Dark text
    fontWeight: 'bold',
  };


  return (
    // Main page container with dark theme styles
    <div style={{ padding: '30px', maxWidth: '1400px', margin: '0 auto', color: '#f4f4f4', background: '#121212', minHeight: '100vh' }}>
      <h1 style={{ color: '#e5b80b', marginBottom: '10px', fontSize: '2rem' }}>Recommended & Top Rated</h1>
      <p style={{ color: '#aaa', marginTop: 0, marginBottom: '30px' }}>Discover highly-rated short films from our collection.</p>


      {/* Search Input */}
      <div style={{ marginBottom: '1.5rem' }}>
        <input
          type="search"
          placeholder="Search by film title..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ padding: '10px', width: '300px', fontSize: '1rem', background: '#333', border: '1px solid #444', color: '#f4f4f4', borderRadius: '4px' }}/>
      </div>

      {/* Genre Filter Buttons */}
      <div style={{ marginBottom: '40px', display: 'flex', flexWrap: 'wrap', gap: '10px', borderBottom: '1px solid #333', paddingBottom: '15px' }}>
          <button onClick={() => setSelectedGenreId(null)} style={selectedGenreId === null ? activeFilterButtonStyle : filterButtonStyle} > All Genres </button>
          {Array.isArray(genres) && genres.map(genre => ( <button key={genre.id} onClick={() => setSelectedGenreId(genre.id)} style={selectedGenreId === genre.id ? activeFilterButtonStyle : filterButtonStyle} > {genre.name} </button> ))}
          {!Array.isArray(genres) && <p style={{ color: '#aaa' }}>Loading genres...</p>}
      </div>

      {/* Film Grid */}
      {loading && <div style={{ color: '#e5b80b', textAlign: 'center', fontSize: '1.2rem' }}>Loading films...</div>}
      {error && <div style={{ color: '#E74C3C', textAlign: 'center', fontSize: '1.2rem' }}>Error: {error}</div>}
      {!loading && !error && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '25px' }}>
          {Array.isArray(films) && films.length > 0 ? (
            films.map(film => (
              // Film Card container
              <div key={film.id} style={{ borderRadius: '6px', overflow: 'hidden', backgroundColor: '#222', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.4)', transition: 'transform 0.2s ease', cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.03)'} // Slight zoom on hover
                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                {/* Link wrapping the image */}
                <Link to={session ? `/film/${film.id}` : '/login'} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                    <img src={film.poster_url || 'https://via.placeholder.com/200x300?text=Poster'} alt={`Poster for ${film.title}`} style={{ width: '100%', height: '300px', objectFit: 'cover', display: 'block' }} />
                </Link>
                {/* Text and buttons section */}
                <div style={{ padding: '15px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '120px' }}>
                  <div>
                      {/* Title and Rating */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                          <h3 style={{ margin: 0, fontSize: '1.1em', color: '#e5b80b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flexGrow: 1, marginRight: '10px' }}>
                            {film.title}
                            {film.is_premium && <span style={{ color: '#f06', fontSize: '0.8em', marginLeft: '5px' }}>★</span>}
                          </h3>
                          {/* Display Rating */}
                          {film.avg_rating !== null && typeof film.avg_rating !== 'undefined' && (
                              <span style={{ color: '#e5b80b', fontWeight: 'bold', fontSize: '1.0em', flexShrink: 0 }}>
                                  ⭐ {Number(film.avg_rating).toFixed(1)} {/* Ensure one decimal place */}
                              </span>
                          )}
                      </div>
                      {/* Genres */}
                      <p style={{ fontSize: '0.8em', color: '#aaa', margin: '0 0 10px 0', minHeight: '1.2em' }}> {/* Ensure space even if no genres */}
                          {Array.isArray(film.genres) ? film.genres.slice(0, 2).map(g => g.name).join(', ') : ''}{film.genres?.length > 2 ? '...' : ''}
                      </p>
                  </div>
                  {/* Buttons Container */}
                  <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Link to={session ? `/film/${film.id}` : '/login'} style={{ color: '#e5b80b', fontWeight: 'bold' }}> ดูหนัง </Link>
                      <button onClick={(e) => handleShowDetails(film, e)} style={{ background: '#333', color: '#f4f4f4', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }} > รายละเอียด </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            // Message when no films match criteria
            <p style={{ color: '#aaa', gridColumn: '1 / -1', textAlign: 'center' }}>{debouncedTerm || selectedGenreId ? `No films found matching criteria.` : 'No films available.'}</p>
          )}
        </div>
      )}

      {/* Render Modal (conditionally) */}
      <FilmDetailsModal film={selectedFilmForModal} onClose={handleCloseModal} />
    </div>
  );
}

export default HomePage;