// /client/src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function ProtectedRoute({ children, allowedRoles }) {
  const { session, loading, profile } = useAuth();

  // 1️⃣ ระหว่างโหลด AuthContext ให้แสดงสถานะ Loading
  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          color: '#e5b80b',
          fontSize: '1.2rem',
          backgroundColor: '#141414',
        }}
      >
        Loading Authentication...
      </div>
    );
  }

  // 2️⃣ ถ้าไม่มี token (session) → redirect ไปหน้า Login
  if (!session) {
    console.log('ProtectedRoute: No session/token found. Redirecting to login...');
    return <Navigate to="/login" replace />;
  }

  // 3️⃣ ตรวจสอบ Role (เฉพาะกรณีหน้าแอดมิน)
  if (allowedRoles && profile) {
    const userRole = profile.is_admin ? 'admin' : 'user';
    if (!allowedRoles.includes(userRole)) {
      console.warn('ProtectedRoute: Access denied for role:', userRole);
      return <Navigate to="/" replace />;
    }
  }

  // 4️⃣ ถ้ามี token และสิทธิ์ถูกต้อง → แสดงหน้าที่ป้องกันไว้
  return children ? children : <Outlet />;
}

export default ProtectedRoute;
