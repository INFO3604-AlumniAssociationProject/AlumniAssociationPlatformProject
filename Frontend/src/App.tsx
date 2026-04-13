import React, { useState } from 'react';
import { API_BASE } from './apiConfig';
import { useToast } from './components/Toast';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import { ToastProvider } from './components/Toast';
import Layout from './Layout';
import Welcome from './pages/Welcome';
import Login from './pages/Login';
import AdminLogin from './pages/AdminLogin';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Events from './pages/Events';
import Jobs from './pages/Jobs';
import JobDetails from './pages/JobDetails';
import Messages from './pages/Messages';
import Profile from './pages/Profile';
import Admin from './pages/Admin';
import Directory from './pages/Directory';
import AdminActionPage from './pages/AdminActionPage';
import SettingsPage from './pages/SettingsPage';
import CommunityBoard from './pages/CommunityBoard';

import { DataProvider } from './DataContext';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/welcome" />;
  }
  return <>{children}</>;
}

export default function App() {
  function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [resetToken, setResetToken] = useState('');
    const { showToast } = useToast();
    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!email) return showToast('Email required', 'error');
      try {
        const res = await fetch(`${API_BASE}/users/forgot-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
        const data = await res.json().catch(() => ({}));
        setResetToken(data.resetToken || '');
        showToast(data.message || 'If that email exists, a reset link was sent.', 'info');
      } catch {
        showToast('Network error', 'error');
      }
    };
    return (
      <div className="max-w-md mx-auto mt-12 bg-white p-6 rounded-2xl shadow">
        <h2 className="text-lg font-bold mb-4">Forgot Password</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Your email" className="w-full p-3 rounded-xl bg-slate-50" />
          <button type="submit" className="btn ui-btn w-full py-3 rounded-xl">Send Reset Link</button>
        </form>
        {resetToken && (
          <div className="mt-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
            Demo reset token: <span className="font-mono break-all">{resetToken}</span>
          </div>
        )}
        <div className="mt-4 text-sm">
          <Link to="/login" className="text-blue-600 hover:underline">Back to login</Link>
        </div>
      </div>
    );
  }

  function ResetPasswordPage() {
    const [token, setToken] = useState(() => new URLSearchParams(window.location.search).get('token') || '');
    const [newPassword, setNewPassword] = useState('');
    const { showToast } = useToast();
    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!token || !newPassword) return showToast('Token and new password required', 'error');
      try {
        const res = await fetch(`${API_BASE}/users/reset-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, newPassword }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok) showToast(data.message || 'Password reset', 'success');
        else showToast(data.error || 'Reset failed', 'error');
      } catch {
        showToast('Network error', 'error');
      }
    };
    return (
      <div className="max-w-md mx-auto mt-12 bg-white p-6 rounded-2xl shadow">
        <h2 className="text-lg font-bold mb-4">Reset Password</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input value={token} onChange={(e) => setToken(e.target.value)} placeholder="Reset token" className="w-full p-3 rounded-xl bg-slate-50" />
          <input value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New password" type="password" className="w-full p-3 rounded-xl bg-slate-50" />
          <button type="submit" className="btn ui-btn w-full py-3 rounded-xl">Reset Password</button>
        </form>
        <div className="mt-4 text-sm">
          <Link to="/login" className="text-blue-600 hover:underline">Back to login</Link>
        </div>
      </div>
    );
  }
  return (
    <ToastProvider>
      <AuthProvider>
        <DataProvider>
          <BrowserRouter>
            <Layout>
              <Routes>
                <Route path="/" element={<Navigate to="/welcome" />} />
                <Route path="/welcome" element={<Welcome />} />
                <Route path="/login" element={<Login />} />
                <Route path="/admin-secret-login" element={<AdminLogin />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } />
                <Route path="/directory" element={
                  <ProtectedRoute>
                    <Directory />
                  </ProtectedRoute>
                } />
                <Route path="/events" element={
                  <ProtectedRoute>
                    <Events />
                  </ProtectedRoute>
                } />
                <Route path="/events/:id" element={
                  <ProtectedRoute>
                    <Events />
                  </ProtectedRoute>
                } />
                <Route path="/jobs" element={
                  <ProtectedRoute>
                    <Jobs />
                  </ProtectedRoute>
                } />
                <Route path="/jobs/:id" element={
                  <ProtectedRoute>
                    <JobDetails />
                  </ProtectedRoute>
                } />
                <Route path="/messages" element={
                  <ProtectedRoute>
                    <Messages />
                  </ProtectedRoute>
                } />
                <Route path="/profile" element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                } />
                <Route path="/settings/:type" element={
                  <ProtectedRoute>
                    <SettingsPage />
                  </ProtectedRoute>
                } />
                <Route path="/admin" element={
                  <ProtectedRoute>
                    <Admin />
                  </ProtectedRoute>
                } />
                <Route path="/admin/:action" element={
                  <ProtectedRoute>
                    <AdminActionPage />
                  </ProtectedRoute>
                } />
                <Route path="/boards" element={
                  <ProtectedRoute>
                    <CommunityBoard />
                  </ProtectedRoute>
                } />
                <Route path="/boards/:id" element={
                  <ProtectedRoute>
                    <CommunityBoard />
                  </ProtectedRoute>
                } />
              </Routes>
            </Layout>
          </BrowserRouter>
        </DataProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
