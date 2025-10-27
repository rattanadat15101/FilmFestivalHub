// /server/middleware/adminMiddleware.js
import jwt from 'jsonwebtoken';
import 'dotenv/config';

/**
 * ✅ Middleware สำหรับตรวจสอบสิทธิ์ Admin
 * ใช้งานคู่กับ authMiddleware
 */
export const adminMiddleware = async (req, res, next) => {
  try {
    // ตรวจสอบว่ามีข้อมูลผู้ใช้ไหม
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized: No user info' });
    }

    // ตรวจสอบสิทธิ์จาก payload (หรือจะไปดึงจาก DB ก็ได้)
    if (!user.is_admin && user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: Admin only' });
    }

    // ผ่าน ✅
    next();
  } catch (err) {
    console.error('Admin middleware error:', err);
    res.status(500).json({ message: 'Server error in admin middleware' });
  }
};
