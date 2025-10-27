// /client/src/contexts/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);   // ใช้แทนข้อมูล token
  const [profile, setProfile] = useState(null);   // ข้อมูลผู้ใช้จาก Supabase
  const [loading, setLoading] = useState(true);

  // โหลด token ที่เคยเก็บไว้ใน localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      setSession({ access_token: savedToken });
      fetchProfile(savedToken);
    } else {
      setLoading(false);
    }
  }, []);

  // ดึงข้อมูล profile จาก Supabase (ผ่าน API backend)
  const fetchProfile = useCallback(async (token) => {
    if (!token) return;
    try {
      const res = await axios.get('http://localhost:4000/api/user/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProfile(res.data);
    } catch (err) {
      console.error('Failed to fetch profile:', err);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // 🔹 Login
  const login = async (email, password) => {
    try {
      const res = await axios.post('http://localhost:4000/api/user/login', { email, password });
      const token = res.data.token;

      localStorage.setItem('token', token);
      setSession({ access_token: token });

      // ดึงข้อมูลผู้ใช้หลังล็อกอิน
      await fetchProfile(token);

      return { success: true };
    } catch (err) {
      console.error('Login error:', err);
      return { success: false, message: err.response?.data?.message || 'Login failed' };
    }
  };

  // 🔹 Logout
  const logout = () => {
    localStorage.removeItem('token');
    setSession(null);
    setProfile(null);
  };

  const value = {
    session,
    profile,
    user: profile,
    loading,
    login,
    logout,
    fetchProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
