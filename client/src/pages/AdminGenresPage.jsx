// /client/src/pages/AdminGenresPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext'; // ตรวจสอบ Path นี้

function AdminGenresPage() {
    const { session } = useAuth();
    const [genres, setGenres] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [newGenreName, setNewGenreName] = useState('');
    const [editGenreId, setEditGenreId] = useState(null); // ID ของ Genre ที่กำลังแก้ไข
    const [editGenreName, setEditGenreName] = useState(''); // ชื่อใหม่ของ Genre ที่กำลังแก้ไข

    // --- ดึงข้อมูล Genres ทั้งหมด ---
    const fetchGenres = useCallback(async () => {
        try {
            setLoading(true);
            setError(''); // เคลียร์ Error เก่า
            // Endpoint นี้ Public ไม่ต้องใช้ Token ก็ได้ แต่ใส่ไปก็ไม่ผิด
            const response = await axios.get('http://localhost:4000/api/genres');
            if (Array.isArray(response.data)) {
                setGenres(response.data);
            } else {
                console.error("Genres API did not return an array:", response.data);
                setGenres([]);
                setError('Failed to load genres: Invalid data format.');
            }
        } catch (err) {
            console.error("Failed to fetch genres:", err);
            setError('Failed to fetch genres.');
            setGenres([]);
        } finally {
            setLoading(false);
        }
    }, []); // ไม่ต้องใส่ dependency

    useEffect(() => {
        fetchGenres();
    }, [fetchGenres]);

    // --- Handler สำหรับ เพิ่ม Genre ใหม่ ---
    const handleAddGenre = async (e) => {
        e.preventDefault();
        setError('');
        if (!newGenreName.trim()) {
            setError('Genre name cannot be empty.');
            return;
        }
        if (!session?.access_token) {
            setError('Authentication required.');
            return;
        }
        try {
            await axios.post('http://localhost:4000/api/genres',
                { name: newGenreName.trim() }, // ส่งชื่อที่ตัดช่องว่างแล้ว
                { headers: { Authorization: `Bearer ${session.access_token}` } }
            );
            setNewGenreName(''); // เคลียร์ช่อง Input
            fetchGenres(); // โหลดรายการใหม่
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to add genre.');
            console.error("Error adding genre:", err.response || err);
        }
    };

    // --- Handlers สำหรับ แก้ไข Genre ---
    const handleStartEdit = (genre) => {
        setEditGenreId(genre.id);
        setEditGenreName(genre.name);
        setError(''); // เคลียร์ Error เก่า
    };

    const handleCancelEdit = () => {
        setEditGenreId(null);
        setEditGenreName('');
        setError('');
    };

    const handleSaveEdit = async (e) => {
        e.preventDefault();
        setError('');
        if (!editGenreName.trim() || editGenreId === null) {
            setError('Genre name cannot be empty.');
            return;
        }
         if (!session?.access_token) {
            setError('Authentication required.');
            return;
        }
        try {
            await axios.put(`http://localhost:4000/api/genres/${editGenreId}`,
                { name: editGenreName.trim() },
                { headers: { Authorization: `Bearer ${session.access_token}` } }
            );
            setEditGenreId(null); // ออกจากโหมด Edit
            setEditGenreName('');
            fetchGenres(); // โหลดรายการใหม่
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update genre.');
             console.error("Error updating genre:", err.response || err);
        }
    };

    // --- Handler สำหรับ ลบ Genre ---
    const handleDeleteGenre = async (genreId, genreName) => {
        if (!window.confirm(`Are you sure you want to delete the genre "${genreName}"? This will remove it from all associated films.`)) return;
        setError('');
         if (!session?.access_token) {
            setError('Authentication required.');
            return;
        }
        try {
            await axios.delete(`http://localhost:4000/api/genres/${genreId}`,
                { headers: { Authorization: `Bearer ${session.access_token}` } }
            );
            fetchGenres(); // โหลดรายการใหม่
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to delete genre.');
            console.error("Error deleting genre:", err.response || err);
        }
    };

    // --- Styles ---
    const pageStyle = { padding: '2rem', maxWidth: '800px', margin: '0 auto', color: '#f4f4f4' };
    const h1Style = { color: '#e5b80b', borderBottom: '1px solid #333', paddingBottom: '10px' };
    const formStyle = { marginBottom: '2rem', display: 'flex', gap: '10px' };
    const inputStyle = { flexGrow: 1, padding: '10px' }; // ให้ input ยืดเต็มที่
    const buttonStyle = { padding: '10px 15px', border: 'none', borderRadius: '4px', cursor: 'pointer' };
    const addButtonStyle = { ...buttonStyle, background: '#e5b80b', color: '#141414', fontWeight: 'bold' };
    const editButtonStyle = { ...buttonStyle, background: '#3498DB', color: 'white', marginRight: '5px' };
    const deleteButtonStyle = { ...buttonStyle, background: '#E74C3C', color: 'white' };
    const saveButtonStyle = { ...buttonStyle, background: '#2ECC71', color: 'white', marginRight: '5px' };
    const cancelButtonStyle = { ...buttonStyle, background: '#555', color: 'white' };
    const tableStyle = { width: '100%', borderCollapse: 'collapse', color: '#ccc' };
    const thStyle = { textAlign: 'left', padding: '10px 8px', borderBottom: '2px solid #333', color: '#aaa' };
    const tdStyle = { padding: '10px 8px', borderBottom: '1px solid #333' };
    const genreNameStyle = { color: '#f4f4f4', fontWeight: '500' };

    if (loading) return <div style={pageStyle}>Loading genres...</div>;

    return (
        <div style={pageStyle}>
            <h1 style={h1Style}>Manage Genres</h1>

            {error && <p className="error-message" style={{ color: 'red', marginBottom: '1rem' }}>{error}</p>}

            {/* Add Genre Form */}
            <form onSubmit={handleAddGenre} style={formStyle}>
                <input
                    type="text"
                    placeholder="New genre name..."
                    value={newGenreName}
                    onChange={(e) => setNewGenreName(e.target.value)}
                    required
                    style={inputStyle}
                />
                <button type="submit" style={addButtonStyle}>Add Genre</button>
            </form>

            {/* Genre List Table */}
            <table style={tableStyle}>
                <thead>
                    <tr>
                        <th style={thStyle}>Name</th>
                        <th style={thStyle}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {genres.map(genre => (
                        <tr key={genre.id}>
                            <td style={tdStyle}>
                                {editGenreId === genre.id ? (
                                    // Edit Mode Input
                                    <form onSubmit={handleSaveEdit} style={{ margin: 0 }}>
                                        <input
                                            type="text"
                                            value={editGenreName}
                                            onChange={(e) => setEditGenreName(e.target.value)}
                                            required
                                            style={{ ...inputStyle, padding: '5px', width: 'auto' }} // Adjust edit input size
                                        />
                                    </form>
                                ) : (
                                    // Display Mode Name
                                    <span style={genreNameStyle}>{genre.name}</span>
                                )}
                            </td>
                            <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}> {/* Prevent buttons wrapping */}
                                {editGenreId === genre.id ? (
                                    // Edit Mode Buttons
                                    <>
                                        <button type="button" onClick={handleSaveEdit} style={saveButtonStyle}>Save</button>
                                        <button type="button" onClick={handleCancelEdit} style={cancelButtonStyle}>Cancel</button>
                                    </>
                                ) : (
                                    // Display Mode Buttons
                                    <>
                                        <button onClick={() => handleStartEdit(genre)} style={editButtonStyle}>Edit</button>
                                        <button onClick={() => handleDeleteGenre(genre.id, genre.name)} style={deleteButtonStyle}>Delete</button>
                                    </>
                                )}
                            </td>
                        </tr>
                    ))}
                    {/* Show if no genres */}
                    {!loading && genres.length === 0 && (
                        <tr><td colSpan="2" style={{ ...tdStyle, color: '#aaa', textAlign: 'center' }}>No genres found. Add one above.</td></tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}

export default AdminGenresPage;