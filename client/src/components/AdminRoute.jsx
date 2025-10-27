// /client/src/components/AdminRoute.jsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
// ตรวจสอบว่า Path นี้ถูกต้องตามโครงสร้างโฟลเดอร์ของคุณ
// ถ้า AdminRoute.jsx อยู่ใน /src/components และ AuthContext อยู่ใน /src/contexts, Path นี้ถูกต้อง
import { useAuth } from '../contexts/AuthContext';

function AdminRoute({ children }) {
  // ดึง profile และ loading state จาก AuthContext
  const { profile, loading } = useAuth();

  // 1. รอจนกว่า AuthContext จะโหลดข้อมูลเสร็จ
  if (loading) {
    return (
        // แสดงข้อความ Loading แบบง่ายๆ (สามารถเปลี่ยนเป็น Spinner ได้)
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh', color: '#aaa', background: '#121212' }}>
            Loading authentication...
        </div>
    );
  }

  // 2. ถ้าโหลดเสร็จแล้ว แต่ไม่มี profile หรือไม่ใช่ admin -> Redirect กลับหน้าแรก
  // (เราเช็ก profile ก่อน เพื่อให้แน่ใจว่าข้อมูลโหลดมาแล้ว)
  if (!profile || !profile.is_admin) {
    console.log("AdminRoute: Access denied. User is not admin or profile not loaded.", profile);
    // ใช้ replace เพื่อป้องกันการกด Back กลับมาหน้านี้
    return <Navigate to="/" replace />;
  }

  // 3. ถ้าโหลดเสร็จ และเป็น admin -> แสดงหน้าที่ต้องการ
  console.log("AdminRoute: Access granted. Rendering admin content.");
  // ใช้ children ถ้าเป็นการห่อ Component ตรงๆ (<AdminRoute><Dashboard /></AdminRoute>)
  // ใช้ <Outlet /> ถ้าเป็นการห่อ Route ใน App.jsx (<Route element={<AdminRoute />}><Route path="/admin" ... /></Route>)
  return children ? children : <Outlet />;
}

export default AdminRoute;

