import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Home, Calendar, Briefcase, MessageSquare, User, ShieldCheck } from 'lucide-react';
import { useAuth } from './AuthContext';
import { motion } from 'motion/react';
import Logo from './components/Logo';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const location = useLocation();
  const isAuthPage = ['/welcome', '/login', '/register', '/'].includes(location.pathname);

  if (!user || isAuthPage) {
    return <div className="mobile-shell">{children}</div>;
  }

  const navItems = [
    { path: '/dashboard', icon: Home, label: 'Home' },
    { path: '/events', icon: Calendar, label: 'Events' },
    { path: '/jobs', icon: Briefcase, label: 'Jobs' },
    { path: '/messages', icon: MessageSquare, label: 'Messages' },
    { 
      path: user.role === 'admin' ? '/admin' : '/profile', 
      icon: user.role === 'admin' ? ShieldCheck : User, 
      label: user.role === 'admin' ? 'Admin' : 'Profile' 
    },
  ];

  return (
    <div className="mobile-shell">
      <header className="sticky top-0 z-20 mb-6">
        <Link to="/dashboard" className="block relative overflow-hidden shadow-xl rounded-b-[40px] h-24">
          <div className="absolute inset-0 bg-gradient-to-r from-[#002a77] via-[#003594] to-[#002a77] z-0"></div>
          
          {/* Decorative background elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-8 -mt-16 blur-2xl"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-400/10 rounded-full -ml-4 -mb-8 blur-xl"></div>
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 mix-blend-overlay"></div>

          <div className="relative z-10 h-full flex items-center px-6 gap-4">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 shadow-lg p-1">
              <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden border-2 border-white shadow-inner">
                <Logo className="w-full h-full object-cover" />
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <h1 className="text-4xl font-black tracking-tighter text-white drop-shadow-md">UWI</h1>
              <div className="h-8 w-px bg-white/30"></div>
              <div className="flex flex-col">
                <p className="text-[11px] uppercase tracking-[0.05em] text-white font-black leading-none">ST. AUGUSTINE CAMPUS</p>
                <p className="text-[11px] uppercase tracking-[0.05em] text-blue-200/90 font-bold leading-none mt-1">ALUMNI NETWORK</p>
              </div>
            </div>
          </div>
        </Link>
      </header>

      <motion.main
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {children}
      </motion.main>

      <nav className="bottom-nav">
        <div className="grid grid-cols-5 gap-1">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item ${isActive ? 'active' : ''}`}
              >
                <item.icon size={20} strokeWidth={1.8} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
