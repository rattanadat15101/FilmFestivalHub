// /client/src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import HomePage from './pages/HomePage';
import FilmDetailPage from './pages/FilmDetailPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import UploadPage from './pages/UploadPage';
import SubscriptionPage from './pages/SubscriptionPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminGenresPage from './pages/AdminGenresPage';
import ApplyFilmmakerPage from './pages/ApplyFilmmakerPage';
import QASchedulePage from './pages/QASchedulePage';
import LiveQAPage from './pages/LiveQAPage';
import FilmmakerStudioPage from './pages/FilmmakerStudioPage';
import EditFilmPage from './pages/EditFilmPage';

// Global styles (คงเดิม)
const globalStyles = `
  body {
    margin: 0;
    padding: 0;
    background-color: #121212;
    color: #e0e0e0;
    font-family: 'Inter', sans-serif;
    line-height: 1.6;
  }
  a {
    text-decoration: none;
    color: #e5b80b;
    transition: color 0.2s;
  }
  a:hover {
    color: #f0c83a;
  }
  button {
    cursor: pointer;
    border-radius: 4px;
    padding: 10px 18px;
    font-weight: 500;
    font-size: 0.95rem;
    border: none;
    transition: background-color 0.2s, color 0.2s;
  }
  input, textarea, select {
    background-color: #333333;
    border: 1px solid #444;
    color: #e0e0e0;
    padding: 10px;
    border-radius: 4px;
    font-size: 1rem;
  }
  input::placeholder, textarea::placeholder {
    color: #888;
  }
  h1, h2, h3, h4 {
    color: #f4f4f4;
  }
  hr {
    border: none;
    border-top: 1px solid #333;
    margin: 2rem 0;
  }
`;

function App() {
  return (
    <AuthProvider>
      <style>{globalStyles}</style>
      <BrowserRouter>
        <Navbar />
        <Routes>
          {/* ✅ Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/schedule" element={<QASchedulePage />} />

          {/* ✅ Protected Routes (ต้องล็อกอินก่อนถึงเข้าได้) */}
          <Route path="/film/:id" element={<ProtectedRoute><FilmDetailPage /></ProtectedRoute>} />
          <Route path="/upload" element={<ProtectedRoute><UploadPage /></ProtectedRoute>} />
          <Route path="/subscribe" element={<ProtectedRoute><SubscriptionPage /></ProtectedRoute>} />
          <Route path="/apply-filmmaker" element={<ProtectedRoute><ApplyFilmmakerPage /></ProtectedRoute>} />
          <Route path="/live/:id" element={<ProtectedRoute><LiveQAPage /></ProtectedRoute>} />
          <Route path="/studio" element={<ProtectedRoute><FilmmakerStudioPage /></ProtectedRoute>} />
          <Route path="/studio/edit/:filmId" element={<ProtectedRoute><EditFilmPage /></ProtectedRoute>} />

          {/* ✅ Admin Routes (เฉพาะ Admin เท่านั้น) */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/genres"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminGenresPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
