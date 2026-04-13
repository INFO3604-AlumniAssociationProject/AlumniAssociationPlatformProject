import React, { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { Home, Calendar, Briefcase, MessageSquare, User, ShieldCheck, Users, ChevronRight, ArrowUp } from 'lucide-react';
import { getAuthToken, useAuth } from './AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import Logo from './components/Logo';
import { API_BASE } from './apiConfig';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [resourceNames, setResourceNames] = useState<Record<string, string>>({});
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const shell = document.querySelector('.mobile-shell') as HTMLElement | null;
    const handleScroll = () => {
      const scrollTop = shell?.scrollTop || 0;
      setShowScrollTop(scrollTop > 400);
    };

    shell?.addEventListener('scroll', handleScroll);
    return () => {
      shell?.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Detect modal overlays (they use fixed inset-0) and hide header/nav when present
  useEffect(() => {
    const check = () => Boolean(document.querySelector('[data-overlay]'));
    setModalOpen(check());
    const obs = new MutationObserver(() => setModalOpen(check()));
    obs.observe(document.body, { childList: true, subtree: true });
    return () => obs.disconnect();
  }, []);

  // Fetch resource names for dynamic breadcrumb segments (boards, jobs, events)
  useEffect(() => {
    const segments = location.pathname.split('/').filter(Boolean);
    if (segments.length === 0) return;

    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      const prev = segments[i - 1];
      if (['boards', 'jobs', 'events'].includes(prev)) {
        const token = getAuthToken();
        const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
        fetch(`${API_BASE}/${prev}/${seg}`, { headers })
          .then((res) => res.json())
          .then((data) => {
            const name = data.board?.name || data.name || data.title || data.event?.title || data.job?.title || seg;
            setResourceNames((prev: Record<string, string>) => ({ ...prev, [seg]: name }));
          })
          .catch(() => {});
      }
    }
  }, [location.pathname]);

  const isAuthPage = ['/welcome', '/login', '/admin-secret-login', '/register', '/forgot-password', '/reset-password', '/'].includes(location.pathname);

  if (!user || isAuthPage) {
    return <div className="mobile-shell">{children}</div>;
  }

  const navItems = [
    { path: '/dashboard', icon: Home, label: 'Home' },
    { path: '/boards', icon: Users, label: 'Community' },
    { path: '/events', icon: Calendar, label: 'Events' },
    { path: '/jobs', icon: Briefcase, label: 'Jobs' },
    { path: '/messages', icon: MessageSquare, label: 'Messages' },
    { 
      path: user.role === 'admin' ? '/admin' : '/profile', 
      icon: user.role === 'admin' ? ShieldCheck : User, 
      label: user.role === 'admin' ? 'Admin' : 'Profile' 
    },
  ];

  type NavItem = { path: string; icon: React.ComponentType<any>; label: string };
  const typedNavItems: NavItem[] = navItems as unknown as NavItem[];

  const getBreadcrumbs = () => {
    const paths = location.pathname.split('/').filter(p => p);
    return (
      <div className="hidden md:flex items-center gap-2 text-xs font-medium text-slate-400 mb-4">
        <Link to="/dashboard" className="hover:text-blue-600 transition-colors">Home</Link>
        {paths.map((path, idx) => {
          const url = `/${paths.slice(0, idx + 1).join('/')}`;
          const label = resourceNames[path] || (path.charAt(0).toUpperCase() + path.slice(1));
          return (
            <React.Fragment key={url}>
              <ChevronRight size={12} />
              <Link to={url} className="hover:text-blue-600 transition-colors last:text-slate-600 last:font-bold">
                {label}
              </Link>
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  const scrollToTop = () => {
    const el = document.querySelector('.mobile-shell') as HTMLElement | null;
    el?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="mobile-shell transition-all duration-500">
      {!modalOpen && (
        <header className="mobile-header sticky top-0 z-[100] w-full">
          <Link to="/dashboard" className="block relative overflow-hidden shadow-xl rounded-t-3xl h-24 w-full">
            <div className="absolute inset-0 bg-gradient-to-r from-[#002a77] via-[#003594] to-[#002a77] z-0"></div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-8 -mt-16 blur-2xl"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-400/10 rounded-full -ml-4 -mb-8 blur-xl"></div>
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 mix-blend-overlay"></div>

            <div className="relative z-10 h-full flex items-center px-6 gap-4">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 shadow-lg p-1">
                <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden border-2 border-white shadow-inner">
                  <Logo className="w-full h-full object-cover rounded-full" />
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
      )}

      <div className="mobile-content pt-1">
        <motion.main
          key={location.pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="relative"
        >
          {children}
        </motion.main>
      </div>

      {!modalOpen && (
        <nav className="bottom-nav">
          <div className="grid grid-cols-6 gap-1">
            {typedNavItems.map((item) => {
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
      )}

      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            onClick={scrollToTop}
            className="fixed z-50 p-3 rounded-full bg-blue-600 text-white shadow-xl hover:bg-blue-700 transition-all bottom-24 right-6"
          >
            <ArrowUp size={20} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}