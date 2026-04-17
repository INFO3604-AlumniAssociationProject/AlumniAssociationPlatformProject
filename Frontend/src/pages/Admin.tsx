// File: Admin.tsx

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../AuthContext';
import { useData } from '../DataContext';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { 
  Users, Briefcase, Calendar, MessageSquare, Check, X, RefreshCw, 
  LogOut, Grid, List, ChevronLeft, ChevronRight, AlertTriangle, Ban, Eye 
} from 'lucide-react';
import { useToast } from '../components/Toast';
import { useNavigate } from 'react-router-dom';
import PDFViewer from '../components/PDFViewer';

export default function Admin() {
  const { user, logout } = useAuth();
  const { 
    stats: globalStats, 
    jobs, 
    events, 
    messageRequests, 
    approveApplication, 
    rejectApplication, 
    approveJob,      // <-- used for community board job approval
    rejectJob,       // <-- used for community board job rejection
    alumni, 
    loading, 
    fetchAndSetJobApplications 
  } = useData();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const initialFetchDone = useRef(false);

  // View Mode
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const isDesktopMode = localStorage.getItem('desktopMode') === 'true';

  // Calendar state
  const [showCalendar, setShowCalendar] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Suspend/Ban state
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');
  const [suspendDuration, setSuspendDuration] = useState('7');
  const [showBanModal, setShowBanModal] = useState(false);
  const [banReason, setBanReason] = useState('');

  // PDF viewer state (for Alumni Job Approval)
  const [viewPdfUrl, setViewPdfUrl] = useState<string | null>(null);

  // Force list view on mobile
  useEffect(() => {
    if (!isDesktopMode && viewMode === 'grid') {
      setViewMode('list');
    }
  }, [isDesktopMode]);

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  // Fetch job applications for alumni jobs once on load
  useEffect(() => {
    const fetchAllJobApplications = async () => {
      if (!fetchAndSetJobApplications) return;
      if (initialFetchDone.current) return;
      
      const jobsToFetch = jobs.filter(job => !job.applicants || job.applicants.length === 0);
      if (jobsToFetch.length === 0) {
        initialFetchDone.current = true;
        return;
      }
      
      setRefreshing(true);
      try {
        await Promise.all(jobsToFetch.map(job => fetchAndSetJobApplications(job.id)));
        initialFetchDone.current = true;
      } catch (error) {
        console.error('Failed to fetch job applications', error);
      } finally {
        setRefreshing(false);
      }
    };
    
    if (jobs.length > 0 && !initialFetchDone.current) {
      fetchAllJobApplications();
    }
  }, [jobs.length, fetchAndSetJobApplications]);

  const handleLogout = () => {
    showToast('Logged out successfully.', 'info');
    logout();
    navigate('/welcome');
  };

  const stats = [
    { label: 'Users', count: globalStats.alumniCount, pending: globalStats.pendingJobsCount, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', link: '/directory' },
    { label: 'Jobs', count: jobs.length, open: jobs.filter((j) => j.status === 'approved').length, icon: Briefcase, color: 'text-purple-600', bg: 'bg-purple-50', link: '/jobs' },
    { label: 'Events', count: events.length, active: events.filter((e) => e.registered).length, icon: Calendar, color: 'text-orange-600', bg: 'bg-orange-50', link: '/events' },
    { label: 'Messages', count: messageRequests.length, requested: messageRequests.length, icon: MessageSquare, color: 'text-emerald-600', bg: 'bg-emerald-50', link: '/messages' },
  ];

  // Pending job postings (Community Board Job Approval)
  const pendingCommunityJobs = jobs.filter(job => 
    job.status === 'pending' && job.communityId !== undefined
  );

  // Pending job applications (Alumni Job Approval)
  const alumniDirectPendingApps = jobs.flatMap(job => 
    (job.applicants || [])
      .filter(app => app.status === 'pending')
      .map(app => ({ ...app, jobTitle: job.title, company: job.company, jobId: job.id }))
  ).filter(app => {
    const job = jobs.find(j => j.id === app.jobId);
    return job?.communityId === undefined;
  });

  const handleApproveJob = async (jobId: string) => {
    const ok = await approveJob(jobId);
    if (ok) showToast('Job approved.', 'success');
    else showToast('Failed to approve job.', 'error');
  };

  const handleRejectJob = async (jobId: string) => {
    const ok = await rejectJob(jobId);
    if (ok) showToast('Job rejected.', 'info');
    else showToast('Failed to reject job.', 'error');
  };

  const handleApproveApplication = async (jobId: string, applicantId: string) => {
    const ok = await approveApplication(jobId, applicantId);
    if (ok) showToast('Application approved.', 'success');
    else showToast('Failed to approve application.', 'error');
  };

  const handleRejectApplication = async (jobId: string, applicantId: string) => {
    const ok = await rejectApplication(jobId, applicantId);
    if (ok) showToast('Application rejected.', 'info');
    else showToast('Failed to reject application.', 'error');
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      if (fetchAndSetJobApplications) {
        await Promise.all(jobs.map(job => fetchAndSetJobApplications(job.id)));
      }
      showToast('Dashboard refreshed.', 'success');
    } catch (error) {
      showToast('Refresh failed.', 'error');
    } finally {
      setRefreshing(false);
    }
  };

  // Calendar helpers
  const daysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

  const getEventsForDay = (day: number) => {
    return events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate.getFullYear() === currentMonth.getFullYear() &&
             eventDate.getMonth() === currentMonth.getMonth() &&
             eventDate.getDate() === day;
    });
  };

  const openSuspendModal = (user: any) => {
    setSelectedUser(user);
    setSuspendReason('');
    setSuspendDuration('7');
    setShowSuspendModal(true);
  };

  const openBanModal = (user: any) => {
    setSelectedUser(user);
    setBanReason('');
    setShowBanModal(true);
  };

  const handleSuspendSubmit = () => {
    if (!suspendReason.trim()) {
      showToast('Please provide a reason for suspension', 'error');
      return;
    }
    showToast(`User ${selectedUser.name} suspended for ${suspendDuration} days`, 'info');
    setShowSuspendModal(false);
    setSelectedUser(null);
  };

  const handleBanSubmit = () => {
    if (!banReason.trim()) {
      showToast('Please provide a reason for ban', 'error');
      return;
    }
    showToast(`User ${selectedUser.name} permanently banned`, 'error');
    setShowBanModal(false);
    setSelectedUser(null);
  };

  // Format date helper
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Recently';
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return 'Recently';
    }
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
          <div className="flex items-center gap-2">
            <div className="flex bg-slate-100 p-1 rounded-xl">
              {isDesktopMode && (
                <button 
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400'}`}
                  title="Grid View"
                >
                  <Grid size={16} />
                </button>
              )}
              <button 
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400'}`}
                title="List View"
              >
                <List size={16} />
              </button>
            </div>
            <button 
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors disabled:opacity-50"
            >
              <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
            </button>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleLogout}
              className="text-xs px-3 py-1.5 bg-white border border-slate-200 rounded-xl hover:bg-red-500 hover:text-white hover:border-red-500 text-slate-600 transition-all flex items-center gap-2 font-bold shadow-sm"
            >
              <LogOut size={14} /> Logout
            </motion.button>
          </div>
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

      {/* Calendar View Toggle */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="ui-card rounded-2xl p-5"
      >
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-bold text-[var(--uwi-blue-800)]">Event Calendar</h2>
          <button 
            onClick={() => setShowCalendar(!showCalendar)}
            className="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg font-bold hover:bg-blue-100"
          >
            {showCalendar ? 'Hide Calendar' : 'Show Calendar'}
          </button>
        </div>
        {showCalendar && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3"
          >
            <div className="flex items-center justify-between mb-4">
              <button onClick={prevMonth} className="p-1 hover:bg-slate-100 rounded-full"><ChevronLeft size={20} /></button>
              <h3 className="font-bold text-slate-700">
                {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
              </h3>
              <button onClick={nextMonth} className="p-1 hover:bg-slate-100 rounded-full"><ChevronRight size={20} /></button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-slate-500 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d}>{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 42 }).map((_, i) => {
                const dayNumber = i - firstDayOfMonth(currentMonth) + 1;
                const isCurrentMonth = dayNumber > 0 && dayNumber <= daysInMonth(currentMonth);
                const dayEvents = isCurrentMonth ? getEventsForDay(dayNumber) : [];
                return (
                  <div key={i} className={`aspect-square p-1 border border-slate-100 rounded-lg ${isCurrentMonth ? 'bg-white' : 'bg-slate-50 text-slate-300'}`}>
                    {isCurrentMonth && (
                      <>
                        <div className="text-xs font-bold">{dayNumber}</div>
                        {dayEvents.length > 0 && (
                          <div className="mt-1">
                            {dayEvents.slice(0, 2).map(ev => (
                              <div key={ev.id} className="w-full h-1.5 bg-blue-500 rounded-full mb-0.5" title={ev.title}></div>
                            ))}
                            {dayEvents.length > 2 && <div className="text-[8px] text-slate-400">+{dayEvents.length-2}</div>}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Community Board Job Approval Section - Approve/Reject Job Postings */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="ui-card rounded-2xl p-5"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-[var(--uwi-blue-800)]">Community Board Job Approval</h2>
          {pendingCommunityJobs.length > 0 && (
            <span className="bg-orange-100 text-orange-700 text-[10px] font-bold px-2 py-1 rounded-full">{pendingCommunityJobs.length} Pending</span>
          )}
        </div>
        
        <div className={viewMode === 'grid' && isDesktopMode ? 'grid grid-cols-1 md:grid-cols-2 gap-3' : 'space-y-3'}>
          {isLoading || refreshing ? (
            Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 animate-pulse">
                <div className="space-y-2 w-1/2">
                  <div className="h-4 bg-slate-200 rounded w-full"></div>
                  <div className="h-3 bg-slate-200 rounded w-3/4"></div>
                </div>
                <div className="flex gap-2">
                  <div className="w-8 h-8 rounded-full bg-slate-200"></div>
                  <div className="w-8 h-8 rounded-full bg-slate-200"></div>
                </div>
              </div>
            ))
          ) : pendingCommunityJobs.length === 0 ? (
            <p className="col-span-full text-sm text-slate-500 text-center py-4">No pending community board jobs.</p>
          ) : (
            pendingCommunityJobs.map((job) => (
              <div key={job.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-blue-100 hover:bg-blue-50/30 transition-all">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-slate-800 truncate">{job.title}</h3>
                  <p className="text-xs text-slate-500 truncate">{job.company} • {job.location}</p>
                  <p className="text-xs text-slate-500 mt-1">{job.type} • {job.salary}</p>
                  <span className="text-[10px] text-slate-400">Posted: {formatDate(job.posted)}</span>
                </div>
                <div className="flex gap-2 ml-3 shrink-0">
                  <button 
                    onClick={() => handleApproveJob(job.id)}
                    disabled={loading?.approvingJob}
                    className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-colors disabled:opacity-50"
                    title="Approve"
                  >
                    <Check size={16} />
                  </button>
                  <button 
                    onClick={() => handleRejectJob(job.id)}
                    disabled={loading?.rejectingJob}
                    className="w-8 h-8 rounded-full bg-red-50 text-red-600 border border-red-200 flex items-center justify-center hover:bg-red-500 hover:text-white hover:border-red-500 transition-colors disabled:opacity-50"
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

      {/* Alumni Job Approval Section - Includes resume viewer and cover letter */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="ui-card rounded-2xl p-5"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-[var(--uwi-blue-800)]">Alumni Job Approval</h2>
          {alumniDirectPendingApps.length > 0 && (
            <span className="bg-orange-100 text-orange-700 text-[10px] font-bold px-2 py-1 rounded-full">{alumniDirectPendingApps.length} Pending</span>
          )}
        </div>
        
        <div className={viewMode === 'grid' && isDesktopMode ? 'grid grid-cols-1 md:grid-cols-2 gap-3' : 'space-y-3'}>
          {isLoading || refreshing ? (
            Array.from({ length: 1 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 animate-pulse">
                <div className="space-y-2 w-1/2">
                  <div className="h-4 bg-slate-200 rounded w-full"></div>
                  <div className="h-3 bg-slate-200 rounded w-3/4"></div>
                </div>
                <div className="flex gap-2">
                  <div className="w-8 h-8 rounded-full bg-slate-200"></div>
                  <div className="w-8 h-8 rounded-full bg-slate-200"></div>
                </div>
              </div>
            ))
          ) : alumniDirectPendingApps.length === 0 ? (
            <p className="col-span-full text-sm text-slate-500 text-center py-4">No pending alumni job applications.</p>
          ) : (
            alumniDirectPendingApps.map((app) => (
              <div key={app.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-blue-100 hover:bg-blue-50/30 transition-all">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-slate-800 truncate">{app.applicantName}</h3>
                  <p className="text-xs text-slate-500 truncate">Applied for: <span className="font-medium">{app.jobTitle}</span> at {app.company}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <button 
                      onClick={() => setViewPdfUrl(app.resumeUrl)}
                      className="text-xs font-bold text-blue-600 flex items-center gap-1 hover:underline"
                    >
                      <Eye size={12} /> View Resume
                    </button>
                    <span className="text-[10px] text-slate-400">{formatDate(app.date)}</span>
                  </div>
                  {app.coverLetter && (
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2 italic bg-slate-50 p-2 rounded-lg">"{app.coverLetter}"</p>
                  )}
                </div>
                <div className="flex gap-2 ml-3 shrink-0">
                  <button 
                    onClick={() => handleApproveApplication(app.jobId, app.applicantId)}
                    disabled={loading?.approvingApplication}
                    className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-colors disabled:opacity-50"
                    title="Approve"
                  >
                    <Check size={16} />
                  </button>
                  <button 
                    onClick={() => handleRejectApplication(app.jobId, app.applicantId)}
                    disabled={loading?.rejectingApplication}
                    className="w-8 h-8 rounded-full bg-red-50 text-red-600 border border-red-200 flex items-center justify-center hover:bg-red-500 hover:text-white hover:border-red-500 transition-colors disabled:opacity-50"
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

      {/* User Management - Suspend/Ban */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="ui-card rounded-2xl p-5"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-[var(--uwi-blue-800)]">User Management</h2>
          <button 
            onClick={() => setShowUserManagement(!showUserManagement)}
            className="text-xs bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg font-bold hover:bg-slate-200"
          >
            {showUserManagement ? 'Hide' : 'Manage Users'}
          </button>
        </div>
        {showUserManagement && (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {alumni.map((person) => (
              <div key={person.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50">
                <div className="flex items-center gap-3">
                  <img src={person.avatar} alt={person.name} className="w-10 h-10 rounded-full" />
                  <div>
                    <p className="text-sm font-bold">{person.name}</p>
                    <p className="text-xs text-slate-500">{person.role} at {person.company}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openSuspendModal(person)}
                    className="px-3 py-1.5 rounded-lg bg-orange-50 text-orange-600 text-xs font-bold hover:bg-[#ff7f2a] hover:text-white border border-orange-200 transition-colors flex items-center gap-1"
                  >
                    <AlertTriangle size={12} /> Suspend
                  </button>
                  <button
                    onClick={() => openBanModal(person)}
                    className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-bold hover:bg-[#ff3b3b] hover:text-white border border-red-200 transition-colors flex items-center gap-1"
                  >
                    <Ban size={12} /> Ban
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Quick Actions */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="ui-card rounded-2xl p-5"
      >
        <h2 className="font-bold text-[var(--uwi-blue-800)] mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3">
          <Link 
            to="/admin/applications"
            className="p-3 rounded-xl bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-blue-700 text-xs font-medium transition-colors text-center border border-slate-100 block"
          >
            Manage Applications
          </Link>
          <Link 
            to="/admin/testimonials"
            className="p-3 rounded-xl bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-blue-700 text-xs font-medium transition-colors text-center border border-slate-100 block"
          >
            Moderate Testimonials
          </Link>
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

      {/* Suspend Modal */}
      <AnimatePresence>
        {showSuspendModal && selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            data-overlay="true"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl"
            >
              <h2 className="text-xl font-bold text-slate-800 mb-2">Suspend User</h2>
              <p className="text-sm text-slate-600 mb-4">
                Suspending <span className="font-bold">{selectedUser.name}</span>
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Reason for suspension</label>
                  <textarea
                    value={suspendReason}
                    onChange={(e) => setSuspendReason(e.target.value)}
                    placeholder="Explain why this user is being suspended..."
                    className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-sm min-h-[80px]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Duration (days)</label>
                  <select
                    value={suspendDuration}
                    onChange={(e) => setSuspendDuration(e.target.value)}
                    className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-sm"
                  >
                    <option value="1">1 day</option>
                    <option value="3">3 days</option>
                    <option value="7">7 days</option>
                    <option value="14">14 days</option>
                    <option value="30">30 days</option>
                    <option value="90">90 days</option>
                  </select>
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowSuspendModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-medium text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSuspendSubmit}
                  className="flex-1 py-2.5 bg-orange-500 text-white rounded-xl font-medium text-sm hover:bg-orange-600"
                >
                  Confirm Suspend
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ban Modal */}
      <AnimatePresence>
        {showBanModal && selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            data-overlay="true"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl"
            >
              <h2 className="text-xl font-bold text-slate-800 mb-2">Ban User</h2>
              <p className="text-sm text-slate-600 mb-4">
                Permanently banning <span className="font-bold">{selectedUser.name}</span>
              </p>
              
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Reason for ban</label>
                <textarea
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  placeholder="Explain why this user is being banned..."
                  className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-sm min-h-[80px]"
                />
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowBanModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-medium text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBanSubmit}
                  className="flex-1 py-2.5 bg-red-500 text-white rounded-xl font-medium text-sm hover:bg-red-600"
                >
                  Confirm Ban
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PDF Viewer Modal */}
      <AnimatePresence>
        {viewPdfUrl && (
          <PDFViewer pdfUrl={viewPdfUrl} onClose={() => setViewPdfUrl(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}