import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { GoogleOAuthProvider } from '@react-oauth/google';
import Navbar from './components/Navbar';
import ParticleBackground from './components/ParticleBackground';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Profile from './pages/Profile';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#060812' }}>
      <div className="text-center">
        <div className="relative w-14 h-14 mx-auto mb-4">
          <div className="absolute inset-0 border-2 border-blue-500/20 rounded-full"></div>
          <div className="absolute inset-0 border-2 border-t-blue-500 rounded-full animate-spin"></div>
          <div className="absolute inset-2 border-2 border-t-violet-500 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }}></div>
        </div>
        <p className="text-slate-500 text-sm tracking-wider uppercase">Loading</p>
      </div>
    </div>
  );
  return user ? children : <Navigate to="/login" />;
};

const AppRoutes = () => {
  const { user } = useContext(AuthContext);
  return (
    <Router>
      {/* Animated background layers */}
      <ParticleBackground />
      <div className="bg-mesh" />
      <div className="bg-grid" />

      {/* Floating orbs */}
      <div className="orb orb-1 w-[500px] h-[500px] top-[-15%] left-[-10%] opacity-[0.12]"
        style={{ background: 'radial-gradient(circle, #2563eb 0%, transparent 70%)' }} />
      <div className="orb orb-2 w-[400px] h-[400px] bottom-[-10%] right-[-8%] opacity-[0.10]"
        style={{ background: 'radial-gradient(circle, #7c3aed 0%, transparent 70%)' }} />
      <div className="orb orb-3 w-[300px] h-[300px] top-[50%] left-[50%] opacity-[0.07]"
        style={{ background: 'radial-gradient(circle, #06b6d4 0%, transparent 70%)' }} />

      <div className="relative z-10 min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow container mx-auto px-4 py-8 max-w-7xl">
          <Routes>
            <Route path="/" element={<Navigate to={user ? '/dashboard' : '/login'} />} />
            <Route path="/login"    element={user ? <Navigate to="/dashboard" /> : <Login />} />
            <Route path="/signup"   element={user ? <Navigate to="/dashboard" /> : <Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

const App = () => (
  <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
    <AuthProvider><AppRoutes /></AuthProvider>
  </GoogleOAuthProvider>
);

export default App;
