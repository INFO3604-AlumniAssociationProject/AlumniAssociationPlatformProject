import React, { useState } from 'react';
import { useAuth, UserRole } from '../AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { User, ShieldCheck, ArrowRight } from 'lucide-react';
import Logo from '../components/Logo';
import { useToast } from '../components/Toast';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [role, setRole] = useState<UserRole>('alumni');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(email, password, role);
      showToast(`Welcome back, ${email.split('@')[0]}!`, 'success');
      navigate('/dashboard');
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
        className="ui-card rounded-2xl p-6 mb-4"
      >
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-blue-50 rounded-full mx-auto mb-3 flex items-center justify-center shadow-inner overflow-hidden">
            <Logo className="w-full h-full" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--uwi-blue-800)]">Login</h1>
          <p className="text-sm text-slate-600">Sign in as Alumni or Admin.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-600 block mb-2">Login as</label>
            <div className="grid grid-cols-2 gap-3">
              <div 
                onClick={() => setRole('alumni')}
                className={`cursor-pointer border rounded-2xl p-4 text-center transition-all duration-200 ${role === 'alumni' ? 'border-[var(--uwi-blue-600)] bg-blue-50 shadow-md transform -translate-y-1' : 'border-slate-200 hover:bg-slate-50'}`}
              >
                <div className="flex justify-center mb-2 text-[var(--uwi-blue-700)]">
                  <User size={28} />
                </div>
                <div className="font-bold text-[var(--uwi-blue-800)]">Alumni</div>
                <div className="text-[10px] text-slate-500">Graduate access</div>
              </div>
              
              <div 
                onClick={() => setRole('admin')}
                className={`cursor-pointer border rounded-2xl p-4 text-center transition-all duration-200 ${role === 'admin' ? 'border-[var(--uwi-blue-600)] bg-blue-50 shadow-md transform -translate-y-1' : 'border-slate-200 hover:bg-slate-50'}`}
              >
                <div className="flex justify-center mb-2 text-[var(--uwi-blue-700)]">
                  <ShieldCheck size={28} />
                </div>
                <div className="font-bold text-[var(--uwi-blue-800)]">Admin</div>
                <div className="text-[10px] text-slate-500">Management access</div>
              </div>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-600 block mb-1">Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-[var(--uwi-blue-600)] focus:ring-2 focus:ring-blue-100 outline-none transition-all"
              placeholder="name@mail.com"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-600 block mb-1">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-[var(--uwi-blue-600)] focus:ring-2 focus:ring-blue-100 outline-none transition-all"
              placeholder="••••••••"
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="btn ui-btn w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? 'Logging in...' : 'Login'}
            {!loading && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
          </button>
        </form>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="ui-card rounded-2xl p-4"
      >
        <p className="text-sm font-medium text-slate-600 mb-2">Quick Login</p>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <button onClick={() => { setEmail('aaron@mail.com'); setPassword('pass'); setRole('alumni'); }} className="text-xs py-2 px-3 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors">
            Aaron (Alumni)
          </button>
          <button onClick={() => { setEmail('priya@mail.com'); setPassword('pass'); setRole('alumni'); }} className="text-xs py-2 px-3 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors">
            Priya (Alumni)
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => { setEmail('kelvin@mail.com'); setPassword('pass'); setRole('admin'); }} className="text-xs py-2 px-3 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors">
            Kelvin (Admin)
          </button>
          <button onClick={() => { setEmail('tanya@mail.com'); setPassword('pass'); setRole('admin'); }} className="text-xs py-2 px-3 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors">
            Tanya (Admin)
          </button>
        </div>
      </motion.div>
    </div>
  );
}
