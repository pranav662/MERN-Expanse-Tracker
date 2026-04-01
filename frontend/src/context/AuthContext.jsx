import React, { createContext, useState, useEffect } from 'react';
import api from '../api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      if (token) {
        // Here we could decode the token or fetch user details, 
        // since we just need basic info for now, we'll try to just load basic stats
        // Or decode from local storage
        try {
          const storedUser = localStorage.getItem('user');
          if (storedUser) setUser(JSON.parse(storedUser));
        } catch (e) {
          logout();
        }
      }
      setLoading(false);
    };
    checkUser();
  }, [token]);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', res.data.token);
    localStorage.setItem('user', JSON.stringify(res.data.user));
    setToken(res.data.token);
    setUser(res.data.user);
    return res.data;
  };

  const register = async (username, email, password) => {
    const res = await api.post('/auth/register', { username, email, password });
    return res.data;
  };

  const verifyOtp = async (email, otp) => {
    const res = await api.post('/auth/verify-otp', { email, otp });
    localStorage.setItem('token', res.data.token);
    localStorage.setItem('user', JSON.stringify(res.data.user));
    setToken(res.data.token);
    setUser(res.data.user);
    return res.data;
  };

  const forgotPassword = async (email) => {
    const res = await api.post('/auth/forgot-password', { email });
    return res.data;
  };

  const resetPassword = async (token, password) => {
    const res = await api.put(`/auth/reset-password/${token}`, { password });
    return res.data;
  };

  const changePassword = async (oldPassword, newPassword) => {
    const res = await api.put('/auth/change-password', { oldPassword, newPassword });
    return res.data;
  };

  const googleLogin = async (idToken) => {
    const res = await api.post('/auth/google', { idToken });
    localStorage.setItem('token', res.data.token);
    localStorage.setItem('user', JSON.stringify(res.data.user));
    setToken(res.data.token);
    setUser(res.data.user);
    return res.data;
  };

  const deleteAccount = async () => {
    await api.delete('/auth/profile');
    logout();
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ 
      user, token, loading, login, register, verifyOtp, 
      forgotPassword, resetPassword, changePassword, 
      googleLogin, deleteAccount, logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
};
