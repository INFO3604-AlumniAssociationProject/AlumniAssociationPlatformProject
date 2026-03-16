import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import { useData } from '../DataContext';
import { motion } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, Briefcase, MessageSquare, Users, Search, Plus, LogOut } from 'lucide-react';
import { useToast } from '../components/Toast';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const { stats, events, jobs, alumni } = useData();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const handleLogout = () => {
    showToast('Logged out successfully.', 'info');
    logout();
    navigate('/welcome');
  };

  const filteredAlumni = searchQuery 
    ? alumni.filter(person => 
        person.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        person.degree.toLowerCase().includes(searchQuery.toLowerCase()) ||
        person.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
        person.company.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 5) // Limit to 5 results for the dropdown
    : [];

  const handleSearch = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      navigate(`/directory?search=${searchQuery}`);
    }
  };

  const dashboardStats = [
    { label: 'Alumni', count: stats.alumniCount, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', link: '/directory' },
    { label: 'Unread', count: stats.unreadCount, icon: MessageSquare, color: 'text-emerald-600', bg: 'bg-emerald-50', link: '/messages' },
    { label: 'Applied', count: stats.appliedJobsCount, icon: Briefcase, color: 'text-purple-600', bg: 'bg-purple-50', link: '/jobs' },
    { label: 'Events', count: stats.registeredEventsCount, icon: Calendar, color: 'text-orange-600', bg: 'bg-orange-50', link: '/events' },
  ];

  const upcomingEvents = events.slice(0, 2);
  const latestJobs = jobs.slice(0, 2);

  return (
    <div className="space-y-6 pt-2 max-w-2xl mx-auto">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="ui-card rounded-3xl p-6 relative overflow-hidden shadow-sm border border-slate-100/50 bg-white/80 backdrop-blur-xl"
      >
        <div className="flex justify-between items-start relative z-10">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">{user?.role}</p>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Hello, {user?.name}</h1>
            <p className="text-sm text-slate-500 mt-1 font-medium">{user?.email}</p>
          </div>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleLogout}
            className="text-xs px-4 py-2 bg-red-50 border border-red-100 rounded-xl hover:bg-red-100 text-red-600 transition-colors flex items-center gap-2 font-bold shadow-sm"
          >
            <LogOut size={14} /> Logout
          </motion.button>
        </div>
        
        <div className="mt-6 grid grid-cols-4 gap-3">
          {dashboardStats.map((stat, idx) => (
            <Link to={stat.link} key={idx}>
              <motion.div 
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="flex flex-col items-center p-3 rounded-2xl hover:bg-slate-50 transition-all cursor-pointer border border-transparent hover:border-slate-100 hover:shadow-md bg-white"
              >
                <div className={`w-12 h-12 rounded-2xl ${stat.bg} flex items-center justify-center mb-2 shadow-sm`}>
                  <stat.icon size={20} className={stat.color} />
                </div>
                <span className="text-xl font-bold text-slate-800 leading-none">{stat.count}</span>
                <span className="text-[10px] uppercase font-bold text-slate-400 mt-1.5 tracking-wide">{stat.label}</span>
              </motion.div>
            </Link>
          ))}
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="ui-card rounded-3xl p-6 shadow-sm border border-slate-100/50 bg-white/80 backdrop-blur-xl"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-slate-800 text-lg">Search Alumni</h2>
          <span className="text-xs font-medium text-slate-400">Connect & Message</span>
        </div>
        <div className="relative group">
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearch}
            placeholder="Search alumni by name, degree, or job..." 
            className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-blue-100 text-sm transition-all group-hover:bg-white group-hover:shadow-md group-hover:ring-1 group-hover:ring-slate-100 placeholder:text-slate-400 font-medium"
          />
          <Search size={20} className="absolute left-4 top-3.5 text-slate-400 group-hover:text-blue-500 transition-colors" />
          
          {searchQuery && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50">
              {filteredAlumni.length > 0 ? (
                <div className="py-2">
                  {filteredAlumni.map((person) => (
                    <Link 
                      to={`/directory?id=${person.id}`} 
                      key={person.id}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center overflow-hidden flex-shrink-0">
                        <img src={person.avatar} alt={person.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-slate-800 truncate">{person.name}</h4>
                        <p className="text-xs text-slate-500 truncate">{person.role} at {person.company}</p>
                      </div>
                    </Link>
                  ))}
                  <div className="border-t border-slate-100 mt-1 pt-1">
                    <Link to={`/directory?search=${searchQuery}`} className="block px-4 py-2 text-xs font-bold text-blue-600 text-center hover:bg-blue-50 transition-colors">
                      View all results
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="p-4 text-center text-sm text-slate-500">
                  No alumni found matching "{searchQuery}"
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>

      {user?.role === 'alumni' && (
        <Link to="/boards">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="ui-card rounded-3xl p-6 bg-gradient-to-br from-blue-600 to-blue-700 text-white cursor-pointer shadow-xl shadow-blue-600/20 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl group-hover:bg-white/20 transition-colors"></div>
            <div className="flex items-center justify-between relative z-10">
              <div>
                <h2 className="font-bold text-white text-lg">Communities</h2>
                <p className="text-sm text-blue-100 mt-1 font-medium">Join groups, find jobs, and network</p>
              </div>
              <div 
                className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md group-hover:bg-white group-hover:text-blue-600 transition-all shadow-lg"
              >
                <Users size={24} className="text-white group-hover:text-blue-600 transition-colors" />
              </div>
            </div>
          </motion.div>
        </Link>
      )}

      <div className="space-y-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="ui-card rounded-3xl p-6 shadow-sm border border-slate-100/50 bg-white/80 backdrop-blur-xl"
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-slate-800 flex items-center gap-2">
              <div className="p-2 bg-orange-50 rounded-xl">
                <Calendar size={18} className="text-orange-600" />
              </div>
              Upcoming Events
            </h2>
            <Link to="/events" className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline px-2 py-1 rounded-lg hover:bg-blue-50 transition-all">View All</Link>
          </div>
          <div className="space-y-4">
            {upcomingEvents.map((event) => (
              <Link to="/events" key={event.id}>
                <motion.div 
                  whileHover={{ scale: 1.02, backgroundColor: 'rgba(248, 250, 252, 1)' }}
                  className="flex items-start gap-3 p-3 -mx-3 rounded-2xl transition-all group cursor-pointer border border-transparent hover:border-slate-100 hover:shadow-sm"
                >
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 flex flex-col items-center justify-center text-blue-700 flex-shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                    <span className="text-[10px] font-bold uppercase tracking-wider">{event.date.split(' ')[0]}</span>
                    <span className="text-xl font-bold leading-none">{event.date.split(' ')[1].replace(',', '')}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors truncate">{event.title}</h3>
                    <p className="text-xs text-slate-500 mt-1 font-medium truncate">{event.time} • {event.location}</p>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="ui-card rounded-3xl p-6 shadow-sm border border-slate-100/50 bg-white/80 backdrop-blur-xl"
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-slate-800 flex items-center gap-2">
              <div className="p-2 bg-purple-50 rounded-xl">
                <Briefcase size={18} className="text-purple-600" />
              </div>
              Latest Jobs
            </h2>
            <Link to="/jobs" className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline px-2 py-1 rounded-lg hover:bg-blue-50 transition-all">View All</Link>
          </div>
          <div className="space-y-3">
            {latestJobs.map((job) => (
              <Link to="/jobs" key={job.id}>
                <motion.div 
                  whileHover={{ scale: 1.02, y: -2 }}
                  className="block p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-md hover:border-blue-100 transition-all cursor-pointer mb-3 last:mb-0"
                >
                  <h3 className="text-sm font-bold text-slate-800 truncate">{job.title}</h3>
                  <p className="text-xs text-slate-500 mt-1 font-medium truncate">{job.company} • {job.location}</p>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">{job.salary}</span>
                    <span className="text-[10px] font-medium text-slate-400">{job.posted}</span>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
