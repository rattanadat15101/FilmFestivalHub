// /client/src/pages/AdminDashboardPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext'; 
import { Link } from 'react-router-dom'; // Import Link

function AdminDashboardPage() {
  const { session } = useAuth();

  // States
  const [pendingFilms, setPendingFilms] = useState([]);
  const [filmsLoading, setFilmsLoading] = useState(true);
  const [filmsError, setFilmsError] = useState('');

  const [approvedFilms, setApprovedFilms] = useState([]);
  const [approvedFilmsLoading, setApprovedFilmsLoading] = useState(true);
  const [approvedFilmsError, setApprovedFilmsError] = useState('');

  const [pendingApps, setPendingApps] = useState([]);
  const [appsLoading, setAppsLoading] = useState(true);
  const [appsError, setAppsError] = useState('');

  const [pendingQAs, setPendingQAs] = useState([]);
  const [qasLoading, setQAsLoading] = useState(true);
  const [qasError, setQAsError] = useState('');
  const [streamUrlMap, setStreamUrlMap] = useState({});

  const [approvedQAs, setApprovedQAs] = useState([]);
  const [approvedQAsLoading, setApprovedQAsLoading] = useState(true);
  const [approvedQAsError, setApprovedQAsError] = useState('');


  // --- (1) ฟังก์ชันดึงข้อมูล ---

  // ดึงหนังรออนุมัติ
  const fetchPendingFilms = useCallback(async () => {
    if (!session) return;
    try {
      setFilmsLoading(true);
      const response = await axios.get('http://localhost:4000/api/admin/pending-films', {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      setPendingFilms(response.data);
    } catch (err) {
      setFilmsError(err.response?.data?.message || 'Failed to fetch pending films.');
    } finally {
      setFilmsLoading(false);
    }
  }, [session]);

  // ดึงหนังที่อนุมัติแล้ว
  const fetchApprovedFilms = useCallback(async () => {
    if (!session) return;
    try {
      setApprovedFilmsLoading(true);
      const response = await axios.get('http://localhost:4000/api/admin/approved-films', {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      setApprovedFilms(response.data);
    } catch (err) {
      setApprovedFilmsError(err.response?.data?.message || 'Failed to fetch approved films.');
    } finally {
      setApprovedFilmsLoading(false);
    }
  }, [session]);

  // ดึงใบสมัครรออนุมัติ
  const fetchPendingApps = useCallback(async () => {
    if (!session) return;
    try {
      setAppsLoading(true);
      const response = await axios.get('http://localhost:4000/api/admin/pending-applications', {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      setPendingApps(response.data);
    } catch (err) {
      setAppsError(err.response?.data?.message || 'Failed to fetch applications.');
    } finally {
      setAppsLoading(false);
    }
  }, [session]);

  // ดึง Q&A รออนุมัติ
  const fetchPendingQAs = useCallback(async () => {
    if (!session) return;
    try {
      setQAsLoading(true);
      const response = await axios.get('http://localhost:4000/api/admin/pending-qas', {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      setPendingQAs(response.data);
    } catch (err) {
      setQAsError(err.response?.data?.message || 'Failed to fetch pending Q&As.');
    } finally {
      setQAsLoading(false);
    }
  }, [session]);

  // ดึง Q&A ที่ Approved แล้ว
  const fetchApprovedQAs = useCallback(async () => {
    if (!session) return;
    try {
      setApprovedQAsLoading(true);
      const response = await axios.get('http://localhost:4000/api/admin/approved-qas', {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      setApprovedQAs(response.data);
    } catch (err) {
      setApprovedQAsError(err.response?.data?.message || 'Failed to fetch approved Q&As.');
    } finally {
      setApprovedQAsLoading(false);
    }
  }, [session]);

  // (useEffect เรียก 5 ฟังก์ชัน)
  useEffect(() => {
    if (session) {
      fetchPendingFilms();
      fetchApprovedFilms();
      fetchPendingApps();
      fetchPendingQAs();
      fetchApprovedQAs();
    }
  }, [session, fetchPendingFilms, fetchApprovedFilms, fetchPendingApps, fetchPendingQAs, fetchApprovedQAs]);

  // --- (2) ฟังก์ชัน Action ---

  // อนุมัติหนัง
  const handleApproveFilm = async (filmId) => {
    try {
      await axios.post(`http://localhost:4000/api/admin/approve-film/${filmId}`, {}, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      fetchPendingFilms(); // โหลด Pending ใหม่
      fetchApprovedFilms(); // โหลด Approved ใหม่
    } catch (err) {
      alert('Failed to approve film: ' + err.response?.data?.message);
    }
  };

  // ซ่อนหนัง (จาก Approved)
  const handleHideFilm = async (filmId) => {
    if (!window.confirm('Are you sure you want to hide this film? It will be unpublished.')) return;
    try {
      await axios.post(`http://localhost:4000/api/admin/hide-film/${filmId}`, {}, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      fetchPendingFilms();
      fetchApprovedFilms();
    } catch (err) {
      alert('Failed to hide film: ' + err.response?.data?.message);
    }
  };

  // ลบหนังถาวร (Admin)
  const handleDeleteFilmAdmin = async (filmId) => {
      if (!window.confirm('Are you sure you want to PERMANENTLY delete this film?')) return;
      try {
          await axios.delete(`http://localhost:4000/api/filmmaker/film/${filmId}`, {
              headers: { Authorization: `Bearer ${session.access_token}` }
          });
          alert('Film deleted by admin.');
          fetchPendingFilms();
          fetchApprovedFilms();
      } catch (err) {
          alert('Failed to delete film: ' + err.response?.data?.message);
      }
  };

  // ปฏิเสธหนัง (จาก Pending)
  const handleRejectFilm = async (filmId) => {
    if (!window.confirm('Are you sure you want to reject this film?')) return;
    try {
      await axios.post(`http://localhost:4000/api/admin/reject-film/${filmId}`, {}, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      fetchPendingFilms();
    } catch (err) {
      alert('Failed to reject film: ' + err.response?.data?.message);
    }
  };

  // อนุมัติใบสมัคร
  const handleApproveApp = async (application) => {
    if (!application.profiles?.id) {
        alert('Error: Cannot approve application, user profile ID is missing.');
        return;
    }
    try {
      await axios.post('http://localhost:4000/api/admin/approve-application',
      {
        applicationId: application.id,
        userId: application.profiles.id
      },
      {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      fetchPendingApps();
    } catch (err) {
        alert('Failed to approve application: ' + err.response?.data?.message);
    }
  };

  // อนุมัติ Q&A
  const handleApproveQA = async (qaId) => {
    const streamUrl = streamUrlMap[qaId];
    if (!streamUrl || !streamUrl.startsWith('http')) {
      alert('Please enter a valid Stream URL (starting with http).');
      return;
    }
    try {
      await axios.post('http://localhost:4000/api/admin/approve-qa',
      { qaId: qaId, streamUrl: streamUrl },
      { headers: { Authorization: `Bearer ${session.access_token}` } });
      fetchPendingQAs();
      fetchApprovedQAs();
    } catch (err) {
      alert('Failed to approve Q&A: ' + err.response?.data?.message);
    }
  };

  // ลบ/ยกเลิก Q&A (ใช้ได้ทั้ง Pending และ Approved)
  const handleRejectQA = async (qaId) => {
    if (!window.confirm('Are you sure you want to delete this Q&A session?')) return;
    try {
      await axios.post(`http://localhost:4000/api/admin/reject-qa/${qaId}`, {}, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      fetchPendingQAs();
      fetchApprovedQAs();
    } catch (err) {
      alert('Failed to delete Q&A: ' + err.response?.data?.message);
    }
  };


  // --- (3) ส่วนที่แสดงผล (Return JSX) ---
  return (
    // กำหนด Theme หลักที่นี่
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', color: '#f4f4f4', background: '#121212', minHeight: '100vh' }}>
      <h1 style={{ borderBottom: '2px solid #e5b80b', paddingBottom: '1rem', marginBottom: '2rem' }}>Admin Dashboard</h1>
      <p style={{ color: '#aaa', marginTop: '-1rem', marginBottom: '2rem' }}>Welcome back, Administrator. Manage the platform's content and users here.</p>

      {/* ส่วนที่ 1: อนุมัติใบสมัคร */}
      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ color: '#e5b80b', borderLeft: '4px solid #e5b80b', paddingLeft: '10px' }}>Filmmaker Applications ({pendingApps.length})</h2>
        {appsLoading && <p style={{ color: '#aaa' }}>Loading applications...</p>}
        {appsError && <p style={{ color: 'red' }}>{appsError}</p>}
        {!appsLoading && !appsError && pendingApps.length === 0 && <p style={{ color: '#aaa' }}>No pending applications.</p>}
        {!appsLoading && !appsError && pendingApps.map(app => (
          <div key={app.id} style={{ border: '1px solid #333', padding: '1rem', marginBottom: '1rem', background: '#222', borderRadius: '4px' }}>
            <h3 style={{ marginTop: 0, color: '#f4f4f4' }}>{app.profiles?.username || 'Unknown User'}</h3>
            <p style={{ color: '#aaa' }}><strong>Reason:</strong> {app.reason || 'N/A'}</p>
            <small style={{ color: '#aaa' }}>Applied on: {new Date(app.created_at).toLocaleDateString()}</small>
            <br /><br />
            <button
              onClick={() => handleApproveApp(app)}
              style={{ background: 'green', color: 'white', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer', border: 'none' }}
              disabled={!app.profiles?.id} // ป้องกันการกดถ้าไม่มี ID
            >
              Approve Filmmaker
            </button>
             {!app.profiles?.id && <span style={{color: 'red', marginLeft: '10px'}}>Error: User profile link broken.</span>}
          </div>
        ))}
      </section>

      <hr style={{ borderColor: '#333', margin: '2rem 0' }} />

      {/* ส่วนที่ 2: คำขอ Q&A (Pending) */}
      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ color: '#e5b80b', borderLeft: '4px solid #e5b80b', paddingLeft: '10px' }}>Live Q&A Requests ({pendingQAs.length})</h2>
        {qasLoading && <p style={{ color: '#aaa' }}>Loading Q&A requests...</p>}
        {qasError && <p style={{ color: 'red' }}>{qasError}</p>}
        {!qasLoading && !qasError && pendingQAs.length === 0 && <p style={{ color: '#aaa' }}>No pending Q&A requests.</p>}
        {!qasLoading && !qasError && pendingQAs.map(qa => (
          <div key={qa.id} style={{ border: '1px solid #333', padding: '1rem', marginBottom: '1rem', background: '#222', borderRadius: '4px' }}>
            <h3 style={{ marginTop: 0, color: '#f4f4f4' }}>{qa.films?.title || 'Unknown Film'}</h3>
            <p style={{ color: '#aaa' }}><strong>By:</strong> {qa.profiles?.username || 'Unknown Filmmaker'}</p>
            <p style={{ color: '#aaa' }}><strong>Requested time:</strong> {new Date(qa.scheduled_at).toLocaleString()}</p>
            <div>
              <input
                type="text"
                placeholder="Enter Stream URL (e.g., YouTube Live)"
                style={{ width: '300px', padding: '0.5rem', border: '1px solid #333', background: '#1c1c1c', color: '#f4f4f4', borderRadius: '4px' }}
                onChange={(e) => setStreamUrlMap(prev => ({ ...prev, [qa.id]: e.target.value }))}
              />
              <button
                onClick={() => handleApproveQA(qa.id)}
                style={{ background: 'green', color: 'white', marginLeft: '1rem', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer', border: 'none' }}
              >
                Approve Q&A
              </button>
              <button
                onClick={() => handleRejectQA(qa.id)}
                style={{ background: 'red', color: 'white', marginLeft: '1rem', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer', border: 'none' }}
              >
                Reject / Cancel
              </button>
            </div>
          </div>
        ))}
      </section>

      <hr style={{ borderColor: '#333', margin: '2rem 0' }} />

      {/* ส่วนที่ 3: จัดการ Q&A ที่อนุมัติแล้ว */}
      <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ color: '#e5b80b', borderLeft: '4px solid #e5b80b', paddingLeft: '10px' }}>Manage Approved Q&A Sessions ({approvedQAs.length})</h2>
          {approvedQAsLoading && <p style={{ color: '#aaa' }}>Loading approved Q&As...</p>}
          {approvedQAsError && <p style={{ color: 'red' }}>{approvedQAsError}</p>}
          {!approvedQAsLoading && !approvedQAsError && approvedQAs.length === 0 && <p style={{ color: '#aaa' }}>No Q&A sessions currently approved.</p>}
          {!approvedQAsLoading && !approvedQAsError && approvedQAs.map(qa => (
              <div key={qa.id} style={{ border: '1px solid #333', padding: '1rem', marginBottom: '1rem', background: '#1c1c1c', borderRadius: '4px', color: '#f4f4f4' }}>
                  <h3 style={{ marginTop: 0, color: '#f4f4f4' }}>{qa.films?.title || 'Unknown Film'}</h3>
                  <p style={{ color: '#aaa' }}><strong>By:</strong> {qa.profiles?.username || 'Unknown Filmmaker'}</p>
                  <p style={{ color: '#aaa' }}><strong>Scheduled:</strong> {new Date(qa.scheduled_at).toLocaleString()}</p>
                  <p style={{ color: '#aaa' }}><strong>Stream URL:</strong> <a href={qa.stream_url} target="_blank" rel="noopener noreferrer" style={{ color: '#e5b88b' }}>{qa.stream_url}</a></p>
                  <button
                      onClick={() => handleRejectQA(qa.id)}
                      style={{ background: 'red', color: 'white', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer', border: 'none' }}
                  >
                      Delete Session
                  </button>
              </div>
          ))}
      </section>

      <hr style={{ borderColor: '#333', margin: '2rem 0' }} />

      {/* ส่วนที่ 4: อนุมัติหนัง */}
      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ color: '#e5b80b', borderLeft: '4px solid #e5b80b', paddingLeft: '10px' }}>Films Pending Approval ({pendingFilms.length})</h2>
        {filmsLoading && <p style={{ color: '#aaa' }}>Loading films...</p>}
        {filmsError && <p style={{ color: 'red' }}>{filmsError}</p>}
        {!filmsLoading && !filmsError && pendingFilms.length === 0 && <p style={{ color: '#aaa' }}>No films pending approval.</p>}
        {!filmsLoading && !filmsError && pendingFilms.map(film => (
          <div key={film.id} style={{ border: '1px solid #333', padding: '1rem', marginBottom: '1rem', background: '#222', borderRadius: '4px' }}>
            <h3 style={{ marginTop: 0, color: '#f4f4f4' }}>{film.title}</h3>
            <p style={{ color: '#aaa' }}><strong>By:</strong> {film.profiles?.username || 'Unknown'}</p>
            <a href={film.video_url} target="_blank" rel="noopener noreferrer" style={{ color: '#e5b80b' }}> Watch Video (Preview) </a>
            <hr style={{ borderColor: '#333', margin: '1rem 0' }} />
            <button
              onClick={() => handleApproveFilm(film.id)}
              style={{ background: 'green', color: 'white', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer', border: 'none' }}
            >
              Approve
            </button>
            <button
              onClick={() => handleRejectFilm(film.id)}
              style={{ background: 'red', color: 'white', marginLeft: '1rem', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer', border: 'none' }}
            >
              Reject
            </button>
          </div>
        ))}
      </section>

      <hr style={{ borderColor: '#333', margin: '2rem 0' }} />

      {/* ส่วนที่ 5: จัดการหนังที่ Approved แล้ว */}
      <section>
          <h2 style={{ color: '#e5b80b', borderLeft: '4px solid #e5b80b', paddingLeft: '10px' }}>Manage Approved Films ({approvedFilms.length})</h2>
          {approvedFilmsLoading && <p style={{ color: '#aaa' }}>Loading approved films...</p>}
          {approvedFilmsError && <p style={{ color: 'red' }}>{approvedFilmsError}</p>}
          {!approvedFilmsLoading && !approvedFilmsError && approvedFilms.length === 0 && <p style={{ color: '#aaa' }}>No films currently approved.</p>}
          {!approvedFilmsLoading && !approvedFilmsError && approvedFilms.map(film => (
              <div key={film.id} style={{ border: '1px solid #333', padding: '1rem', marginBottom: '1rem', background: '#1c1c1c', borderRadius: '4px', color: '#f4f4f4' }}>
                  <h3 style={{ marginTop: 0, color: '#f4f4f4' }}>{film.title}</h3>
                  <p style={{ color: '#aaa' }}><strong>By:</strong> {film.profiles?.username || 'Unknown'}</p>
                  <p><strong>Access:</strong> <span style={{ color: film.is_premium ? '#f06' : '#2ecc71' }}>{film.is_premium ? 'Premium' : 'Standard'}</span></p>
                  <Link to={`/film/${film.id}`} style={{ marginRight: '1rem', color: '#e5b80b' }}>View</Link>
                  <button
                      onClick={() => handleHideFilm(film.id)}
                      style={{ background: '#555', color: '#f4f4f4', marginRight: '1rem', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer', border: 'none' }}
                  >
                      Hide (Unpublish)
                  </button>
                  <button
                      onClick={() => handleDeleteFilmAdmin(film.id)}
                      style={{ background: '#E74C3C', color: 'white', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer', border: 'none' }}
                  >
                      Delete Permanently
                  </button>
              </div>
          ))}
      </section>

    </div>
  );
}

export default AdminDashboardPage;