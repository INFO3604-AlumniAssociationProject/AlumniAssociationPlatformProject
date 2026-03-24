import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import Logo from '../components/Logo';

export default function Welcome() {
  return (
    <div className="flex flex-col justify-center min-h-[calc(100vh-100px)]">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="ui-card rounded-2xl p-6 mb-4 text-center"
      >
        <div className="w-24 h-24 bg-blue-50 rounded-full mx-auto mb-4 flex items-center justify-center shadow-inner overflow-hidden">
          <Logo className="w-full h-full" />
        </div>
        <h1 className="text-2xl font-bold text-[var(--uwi-blue-800)] mb-2">Welcome</h1>
        <p className="text-sm text-slate-600 leading-relaxed mb-6">
          The University of the West Indies Alumni Association Platform for St. Augustine Campus, Trinidad and Tobago.
          Connect with graduates, discover opportunities, and manage events from a mobile-first experience.
        </p>
        
        <div className="space-y-3">
          <Link to="/login" className="btn ui-btn w-full py-3 rounded-xl font-medium block">
            Login
          </Link>
          <Link to="/register" className="btn ui-outline w-full py-3 rounded-xl font-medium block border border-[var(--uwi-blue-600)] text-[var(--uwi-blue-700)] hover:bg-blue-50">
            Create An Account
          </Link>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="grid grid-cols-2 gap-3"
      >
        <div className="ui-card rounded-2xl p-4 text-center">
          <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Alumni Network</p>
          <p className="text-sm font-semibold text-[var(--uwi-blue-800)]">Jobs & Mentorship</p>
        </div>
        <div className="ui-card rounded-2xl p-4 text-center">
          <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Campus Focus</p>
          <p className="text-sm font-semibold text-[var(--uwi-blue-800)]">UWI St. Augustine</p>
        </div>
      </motion.div>
    </div>
  );
}
