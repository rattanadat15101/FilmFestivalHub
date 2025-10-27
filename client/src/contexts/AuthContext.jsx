// /client/src/contexts/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

// ตั้งค่า Default Header ของ Axios
// (ถ้ามี Token มันจะถูกส่งไปกับทุก Request)
const setAuthToken = (token) => {
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common['Authorization'];
  }
};

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);   // เก็บ Token { access_token: "..." }
  const [profile, setProfile] = useState(null);   // เก็บข้อมูลผู้ใช้ { id, email, username, ... }
  const [loading, setLoading] = useState(true);

  // 1. (Callback) ดึงข้อมูล Profile
  // (ใช้ Token ที่มีอยู่ไปยิง /api/user/profile)
  const fetchProfile = useCallback(async (token) => {
    if (!token) {
        setLoading(false);
        return;
    }
    setAuthToken(token); // ⬅️ ตั้ง Header ให้ Axios
    try {
      const res = await axios.get('http://localhost:4000/api/user/profile');
      setProfile(res.data);
    } catch (err) {
      console.error('Failed to fetch profile:', err);
      setProfile(null);
      setSession(null); // ถ้า Token ผิด ให้ Logout
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  }, []);

  // 2. (Effect) โหลด Token จาก localStorage ตอนเปิดแอป
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      setSession({ access_token: savedToken });
      fetchProfile(savedToken); // ⬅️ ดึง Profile ทันที
    } else {
      setLoading(false);
    }
  }, [fetchProfile]);

  // 3. 🔹 Login
  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await axios.post('http://localhost:4000/api/auth/login', { email, password });
      
      const { token, user } = res.data;

      localStorage.setItem('token', token);
      setSession({ access_token: token });
      setProfile(user); // ⬅️ ใช้ข้อมูล user ที่ได้จากการ Login เลย
      setAuthToken(token); // ⬅️ ตั้ง Header ให้ Axios ทันที

      setLoading(false);
      return { success: true };
    } catch (err) {
      console.error('Login error:', err);
      setLoading(false);
      return { success: false, message: err.response?.data?.message || 'Login failed' };
    }
  };

  // 4. 🔹 Logout
  const logout = () => {
    localStorage.removeItem('token');
    setSession(null);
    setProfile(null);
    setAuthToken(null); // ⬅️ ลบ Header ออกจาก Axios
  };

  const value = {
    session,    // ➡️ { access_token: "..." } (โครงสร้างเดิมที่ Component อื่นใช้)
    profile,    // ➡️ { id, username, ... }
    user: profile, // ➡️ (ใช้แทน profile ได้)
    loading,
    login,
    logout,
    fetchProfile, // (เผื่อใช้ refresh profile)
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};