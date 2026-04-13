import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ShieldCheck, ArrowRight, ArrowLeft } from 'lucide-react';
import Logo from '../components/Logo';
import { useToast } from '../components/Toast';

export default function AdminLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(email, password, 'admin');
      showToast(`Welcome back, Admin ${email.split('@')[0]}!`, 'success');
      navigate('/admin');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col justify-center min-h-[calc(100vh-100px)]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="ui-card rounded-2xl p-6 mb-4 border-t-4 border-t-[var(--uwi-blue-600)] relative overflow-hidden"
      >
        <Link 
          to="/welcome" 
          className="absolute top-4 left-4 group flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-all z-10"
        >
          <div className="w-8 h-8 rounded-full bg-white shadow-sm border border-slate-200 flex items-center justify-center group-hover:bg-blue-600 group-hover:border-blue-600 group-hover:text-white transition-all duration-300">
            <ArrowLeft size={16} />
          </div>
          <span className="text-xs font-bold">Back</span>
        </Link>

        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-blue-50 rounded-full mx-auto mb-3 flex items-center justify-center shadow-inner overflow-hidden">
            <ShieldCheck size={40} className="text-[var(--uwi-blue-700)]" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--uwi-blue-800)]">Admin Portal</h1>
          <p className="text-sm text-slate-600">Restricted Access</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="admin-login-email" className="text-sm font-medium text-slate-600 block mb-1">Admin Email</label>
            <input 
              id="admin-login-email"
              name="email"
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-[var(--uwi-blue-600)] focus:ring-2 focus:ring-blue-100 outline-none transition-all"
              placeholder="admin@mail.com"
              autoComplete="email"
              required
            />
          </div>

          <div>
            <label htmlFor="admin-login-password" className="text-sm font-medium text-slate-600 block mb-1">Password</label>
            <input 
              id="admin-login-password"
              name="password"
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-[var(--uwi-blue-600)] focus:ring-2 focus:ring-blue-100 outline-none transition-all"
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={loading || !email || !password}
            className="btn ui-btn w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? 'Authenticating...' : 'Secure Login'}
            {!loading && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
          </button>
        </form>
      </motion.div>

    </div>
  );
}
