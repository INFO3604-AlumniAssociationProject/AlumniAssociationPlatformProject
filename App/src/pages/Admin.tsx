import { useState } from 'react';
import { useAuth } from '../AuthContext';
import { useData } from '../DataContext';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Users, Briefcase, Calendar, MessageSquare, Check, X, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '../components/Toast';

export default function Admin() {
  const { user } = useAuth();
  const { stats: globalStats, jobs, approveJob, rejectJob } = useData();
  const { showToast } = useToast();

  const stats = [
    { label: 'Users', count: globalStats.alumniCount, pending: 5, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', link: '/directory' },
    { label: 'Jobs', count: globalStats.appliedJobsCount, open: 12, icon: Briefcase, color: 'text-purple-600', bg: 'bg-purple-50', link: '/jobs' },
    { label: 'Events', count: globalStats.registeredEventsCount, active: 3, icon: Calendar, color: 'text-orange-600', bg: 'bg-orange-50', link: '/events' },
    { label: 'Messages', count: globalStats.unreadCount, requested: 14, icon: MessageSquare, color: 'text-emerald-600', bg: 'bg-emerald-50', link: '/messages' },
  ];

  const pendingJobs = jobs.filter(j => j.status === 'pending');

  const handleApproveJob = (id: number) => {
    approveJob(id);
    showToast('Job approved successfully.', 'success');
  };

  const handleRejectJob = (id: number) => {
    rejectJob(id);
    showToast('Job rejected.', 'info');
  };

  const handleRefresh = () => {
    showToast('Dashboard refreshed.', 'info');
  };

  return (
    <div className="space-y-4 pt-2">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="ui-card rounded-2xl p-5"
      >
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-xl font-bold text-[var(--uwi-blue-800)]">Admin Control</h1>
            <p className="text-sm text-slate-600 mt-1">Manage users, content, and platform activity.</p>
          </div>
          <button 
            onClick={handleRefresh}
            className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 gap-3"
      >
        {stats.map((stat, idx) => (
          <Link to={stat.link} key={idx} className="block">
            <div className="ui-card rounded-2xl p-4 flex flex-col justify-between h-32 relative overflow-hidden group hover:shadow-md transition-all cursor-pointer">
              <div className="flex justify-between items-start">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">{stat.label}</span>
                <div className={`w-8 h-8 rounded-full ${stat.bg} flex items-center justify-center`}>
                  <stat.icon size={14} className={stat.color} />
                </div>
              </div>
              <div>
                <span className="text-2xl font-bold text-[var(--uwi-blue-800)] block">{stat.count}</span>
                <span className="text-[10px] text-slate-500">
                  {stat.pending ? `${stat.pending} Pending` : 
                   stat.open ? `${stat.open} Open` : 
                   stat.active ? `${stat.active} Active` : 
                   `${stat.requested} New`}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="ui-card rounded-2xl p-5"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-[var(--uwi-blue-800)]">Job Approvals</h2>
          {pendingJobs.length > 0 && (
            <span className="bg-orange-100 text-orange-700 text-[10px] font-bold px-2 py-1 rounded-full">{pendingJobs.length} Pending</span>
          )}
        </div>
        
        <div className="space-y-3">
          {pendingJobs.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-4">No pending job approvals.</p>
          ) : (
            pendingJobs.map((job) => (
              <div key={job.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-blue-100 hover:bg-blue-50/30 transition-all">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">{job.title}</h3>
                  <p className="text-xs text-slate-500">{job.company} • Posted by {job.postedBy || 'Unknown'}</p>
                  <span className="text-[10px] text-slate-400 font-mono mt-1 block">ID: {job.id}</span>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleApproveJob(job.id)}
                    className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center hover:bg-emerald-100 transition-colors"
                    title="Approve"
                  >
                    <Check size={16} />
                  </button>
                  <button 
                    onClick={() => handleRejectJob(job.id)}
                    className="w-8 h-8 rounded-full bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-100 transition-colors"
                    title="Reject"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="ui-card rounded-2xl p-5"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-[var(--uwi-blue-800)]">Approved Jobs</h2>
        </div>
        
        <div className="space-y-3">
          {jobs.filter(j => j.status === 'approved').length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-4">No approved jobs yet.</p>
          ) : (
            jobs.filter(j => j.status === 'approved').map((job) => (
              <div key={job.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-blue-100 hover:bg-blue-50/30 transition-all">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">{job.title}</h3>
                  <p className="text-xs text-slate-500">{job.company} • Posted by {job.postedBy || 'Unknown'}</p>
                </div>
                <div className="flex gap-2">
                  <span className="text-[10px] bg-emerald-50 text-emerald-600 px-2 py-1 rounded-full font-bold">Active</span>
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="ui-card rounded-2xl p-5"
      >
        <h2 className="font-bold text-[var(--uwi-blue-800)] mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3">
          <Link 
            to="/admin/announcements"
            className="p-3 rounded-xl bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-blue-700 text-xs font-medium transition-colors text-center border border-slate-100 block"
          >
            Post Announcement
          </Link>
          <Link 
            to="/admin/reports"
            className="p-3 rounded-xl bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-blue-700 text-xs font-medium transition-colors text-center border border-slate-100 block"
          >
            Review Reports
          </Link>
          <Link 
            to="/events"
            className="p-3 rounded-xl bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-blue-700 text-xs font-medium transition-colors text-center border border-slate-100 block"
          >
            Manage Events
          </Link>
          <Link 
            to="/admin/settings"
            className="p-3 rounded-xl bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-blue-700 text-xs font-medium transition-colors text-center border border-slate-100 block"
          >
            System Settings
          </Link>
        </div>
      </motion.div>
    </div>
  );
}