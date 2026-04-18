// File: src/pages/Jobs.tsx

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { useData } from '../DataContext';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Briefcase, MapPin, DollarSign, Clock, Search, Bookmark, Bell, Menu, X, 
  CheckCircle, Share2, Upload 
} from 'lucide-react';
import { useToast } from '../components/Toast';
import { useNavigate } from 'react-router-dom';

export default function Jobs() {
  const { user } = useAuth();
  const { 
    jobs, saveJob, submitJobApplication, userProfile, loading 
  } = useData();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Tab state
  const [activeTab, setActiveTab] = useState<'all' | 'saved' | 'applied'>('all');
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [filterLocation, setFilterLocation] = useState('All');
  const [filterCompany, setFilterCompany] = useState('All');
  
  // Alerts toggle
  const [alertsEnabled, setAlertsEnabled] = useState(false);
  
  // Apply modal
  const [showApplyModal, setShowApplyModal] = useState<string | null>(null);
  const [application, setApplication] = useState({ coverLetter: '', resume: null as File | null });
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Loading state for skeleton
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  // Compute counts
  const savedJobsCount = jobs.filter(j => j.saved).length;
  const appliedJobsCount = jobs.filter(j => j.applied).length;

  // Unique filter options
  const locations = ['All', ...Array.from(new Set(jobs.map(j => j.location).filter(Boolean)))];
  const companies = ['All', ...Array.from(new Set(jobs.map(j => j.company).filter(Boolean)))];

  // Filtered jobs based on active tab and filters
  const filteredJobs = jobs.filter(job => {
    if (activeTab === 'saved') return job.saved === true;
    if (activeTab === 'applied') return job.applied === true;
    
    const matchesSearch = 
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (job.location || '').toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesType = filterType === 'All' || job.type === filterType;
    const matchesLocation = filterLocation === 'All' || job.location === filterLocation;
    const matchesCompany = filterCompany === 'All' || job.company === filterCompany;
    
    // Only show approved jobs to regular users; admin sees all
    const isVisible = job.status === 'approved' || user?.role === 'admin';
    
    return matchesSearch && matchesType && matchesLocation && matchesCompany && isVisible;
  });

  const handleSaveJob = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    saveJob(id);
    const job = jobs.find(j => j.id === id);
    showToast(job?.saved ? 'Job removed from saved' : 'Job saved', 'success');
  };

  const handleShareJob = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const job = jobs.find(j => j.id === id);
    if (!job) return;
    const message = `Check out this job: ${job.title} at ${job.company} – ${window.location.origin}/jobs/${id}`;
    navigate(`/messages?body=${encodeURIComponent(message)}`);
  };

  const handleApplyClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setShowApplyModal(id);
  };

  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showApplyModal || !application.resume) {
      showToast('Please upload a resume', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const resumeUrl = reader.result as string;
      await submitJobApplication(showApplyModal, {
        jobId: showApplyModal,
        applicantId: 'current-user',
        applicantName: userProfile.name,
        resumeUrl,
        coverLetter: application.coverLetter
      });
      setShowApplyModal(null);
      setApplication({ coverLetter: '', resume: null });
      showToast('Application submitted! A confirmation message has been sent.', 'success');
    };
    reader.readAsDataURL(application.resume);
  };

  return (
    <div className="space-y-4 pt-2">
      {/* Header with hamburger */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[var(--uwi-blue-800)]">Jobs</h1>
        <button 
          onClick={() => setSidebarOpen(true)} 
          className="p-2 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
        >
          <Menu size={20} className="text-slate-600" />
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          type="text"
          placeholder="Search jobs..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-100"
        />
      </div>

      {/* Horizontal Filter Row */}
      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
        <select 
          value={filterType} 
          onChange={(e) => setFilterType(e.target.value)}
          className="bg-slate-50 border-none rounded-xl px-3 py-2 text-xs font-medium text-slate-600 shrink-0"
        >
          {['All', 'Full-time', 'Part-time', 'Contract', 'Remote'].map(type => (
            <option key={type} value={type}>{type === 'All' ? 'All Types' : type}</option>
          ))}
        </select>
        <select 
          value={filterLocation} 
          onChange={(e) => setFilterLocation(e.target.value)}
          className="bg-slate-50 border-none rounded-xl px-3 py-2 text-xs font-medium text-slate-600 shrink-0"
        >
          {locations.map(loc => (
            <option key={loc} value={loc}>{loc === 'All' ? 'All Locations' : loc}</option>
          ))}
        </select>
        <select 
          value={filterCompany} 
          onChange={(e) => setFilterCompany(e.target.value)}
          className="bg-slate-50 border-none rounded-xl px-3 py-2 text-xs font-medium text-slate-600 shrink-0"
        >
          {companies.map(comp => (
            <option key={comp} value={comp}>{comp === 'All' ? 'All Companies' : comp}</option>
          ))}
        </select>
      </div>

      {/* Job Cards */}
      <div className="space-y-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="ui-card rounded-2xl p-4 animate-pulse">
              <div className="flex gap-3">
                <div className="w-12 h-12 rounded-xl bg-slate-200 shrink-0"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                  <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <div className="h-6 bg-slate-200 rounded w-16"></div>
                <div className="h-6 bg-slate-200 rounded w-16"></div>
              </div>
            </div>
          ))
        ) : filteredJobs.length === 0 ? (
          <div className="text-center py-10 text-slate-400">
            {activeTab === 'saved' ? 'No saved jobs' : activeTab === 'applied' ? 'No applied jobs' : 'No jobs found'}
          </div>
        ) : (
          filteredJobs.map(job => (
            <motion.div
              key={job.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => navigate(`/jobs/${job.id}`)}
              className="ui-card rounded-2xl p-4 hover:shadow-md transition-all cursor-pointer relative"
            >
              {/* Save & Share buttons */}
              <div className="absolute top-3 right-3 flex gap-1">
                <button 
                  onClick={(e) => handleSaveJob(job.id, e)}
                  className="p-1.5 rounded-full hover:bg-slate-100 transition-colors"
                >
                  <Bookmark size={16} className={job.saved ? 'fill-blue-600 text-blue-600' : 'text-slate-400'} />
                </button>
                <button 
                  onClick={(e) => handleShareJob(job.id, e)}
                  className="p-1.5 rounded-full hover:bg-slate-100 transition-colors"
                >
                  <Share2 size={16} className="text-slate-500" />
                </button>
              </div>

              <div className="flex gap-3 pr-16">
                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-lg shrink-0">
                  {job.company.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-800 truncate">{job.title}</h3>
                  <p className="text-sm text-slate-500 truncate">{job.company} • {job.location}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mt-3">
                <span className="text-xs bg-slate-50 px-2 py-1 rounded-lg text-slate-600 flex items-center gap-1">
                  <DollarSign size={12} className="text-emerald-500" /> 
                  <span className="font-medium text-emerald-700">{job.salary || 'Not specified'}</span>
                </span>
                <span className="text-xs bg-slate-50 px-2 py-1 rounded-lg text-slate-600 flex items-center gap-1">
                  <Clock size={12} /> {job.posted}
                </span>
                <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-lg font-medium">
                  {job.type}
                </span>
                {job.status === 'pending' && (
                  <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-lg">Pending</span>
                )}
              </div>

              {/* Application status / Apply button */}
              <div className="mt-3">
                {job.applied ? (
                  <div className={`w-full py-2 rounded-xl text-xs font-bold text-center ${
                    job.applicationStatus === 'approved' ? 'bg-emerald-50 text-emerald-600' :
                    job.applicationStatus === 'rejected' ? 'bg-red-50 text-red-600' :
                    'bg-blue-50 text-blue-600'
                  }`}>
                    {job.applicationStatus === 'approved' ? 'Approved' : 
                     job.applicationStatus === 'rejected' ? 'Rejected' : 'Pending'}
                  </div>
                ) : (
                  user?.role !== 'admin' && job.status === 'approved' && (
                    <button 
                      onClick={(e) => handleApplyClick(job.id, e)}
                      className="w-full py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors"
                    >
                      Apply Now
                    </button>
                  )
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Sidebar Filter Drawer */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.1 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
              style={{ top: '96px', bottom: '80px' }}
              onClick={() => setSidebarOpen(false)}
            />
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'tween', duration: 0.15 }}
              className="fixed left-0 bg-white z-50 w-80 overflow-y-auto shadow-xl"
              style={{ 
                top: '96px',
                bottom: '80px',
                maxWidth: 'calc(100% - 40px)',
                left: 'max(0px, calc((100% - 430px) / 2))'
              }}
            >
              <div className="p-5">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-bold text-slate-800">Filters</h2>
                  <button onClick={() => setSidebarOpen(false)} className="p-1">
                    <X size={20} className="text-slate-500" />
                  </button>
                </div>

                {/* Tabs */}
                <div className="space-y-1 mb-6">
                  <button
                    onClick={() => { setActiveTab('all'); setSidebarOpen(false); }}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-bold ${activeTab === 'all' ? 'bg-blue-50 text-blue-600' : 'text-slate-600'}`}
                  >
                    All Jobs
                  </button>
                  <button
                    onClick={() => { setActiveTab('saved'); setSidebarOpen(false); }}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-bold flex items-center justify-between ${activeTab === 'saved' ? 'bg-blue-50 text-blue-600' : 'text-slate-600'}`}
                  >
                    Saved Jobs
                    <span className="text-xs bg-slate-200 px-2 py-0.5 rounded-full">{savedJobsCount}</span>
                  </button>
                  <button
                    onClick={() => { setActiveTab('applied'); setSidebarOpen(false); }}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-bold flex items-center justify-between ${activeTab === 'applied' ? 'bg-blue-50 text-blue-600' : 'text-slate-600'}`}
                  >
                    Applied Jobs
                    <span className="text-xs bg-slate-200 px-2 py-0.5 rounded-full">{appliedJobsCount}</span>
                  </button>
                </div>

                {/* Alerts Toggle */}
                <button
                  onClick={() => {
                    setAlertsEnabled(!alertsEnabled);
                    showToast(alertsEnabled ? 'Job alerts disabled' : 'Job alerts enabled', 'success');
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-bold mb-6 ${alertsEnabled ? 'bg-blue-50 text-blue-600' : 'text-slate-600'}`}
                >
                  <span className="flex items-center gap-2"><Bell size={16} /> Job Alerts</span>
                  <span className={`text-xs ${alertsEnabled ? 'text-blue-600' : 'text-slate-400'}`}>{alertsEnabled ? 'On' : 'Off'}</span>
                </button>

                <p className="text-xs text-slate-400 text-center mt-4">Use the top bar for type/location filters</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Apply Modal */}
      <AnimatePresence>
        {showApplyModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            data-overlay="true"
          >
            <motion.div 
              initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl"
            >
              <h2 className="text-xl font-bold mb-4">Apply for Job</h2>
              <form onSubmit={handleSubmitApplication} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Resume (PDF/DOCX)</label>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50"
                  >
                    <Upload size={24} className="text-slate-400 mb-2" />
                    <span className="text-sm text-slate-500">{application.resume ? application.resume.name : 'Click to upload'}</span>
                  </div>
                  <input 
                    type="file" ref={fileInputRef} 
                    onChange={(e) => setApplication({...application, resume: e.target.files?.[0] || null})} 
                    accept=".pdf,.docx,.doc" className="hidden" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Cover Letter</label>
                  <textarea 
                    value={application.coverLetter} 
                    onChange={(e) => setApplication({...application, coverLetter: e.target.value})} 
                    className="w-full bg-slate-50 rounded-xl p-3 text-sm min-h-[100px]"
                    placeholder="Why are you a good fit?"
                  />
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setShowApplyModal(null)} className="flex-1 py-3 bg-slate-100 rounded-xl font-bold">Cancel</button>
                  <button type="submit" className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold">Submit</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}