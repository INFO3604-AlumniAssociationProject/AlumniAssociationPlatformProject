import React, { useState, useRef } from 'react';
import { useAuth } from '../AuthContext';
import { useData } from '../DataContext';
import { motion, AnimatePresence } from 'motion/react';
import { Briefcase, MapPin, DollarSign, Clock, Plus, X, Search, Filter, Upload, CheckCircle, Eye } from 'lucide-react';
import { useToast } from '../components/Toast';

export default function Jobs() {
  const { user } = useAuth();
  const { jobs, addJob, submitJobApplication, approveApplication, rejectApplication, userProfile } = useData();
  const { showToast } = useToast();
  const [filter, setFilter] = useState('All');
  
  // Application State
  const [showApplyModal, setShowApplyModal] = useState<string | null>(null);
  const [application, setApplication] = useState({ coverLetter: '', resume: null as File | null });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // View Applicants State
  const [viewApplicantsJobId, setViewApplicantsJobId] = useState<string | null>(null);
  const [viewPdfUrl, setViewPdfUrl] = useState<string | null>(null);

  const handleApplyClick = (id: string) => {
    setShowApplyModal(id);
  };

  const handleSubmitApplication = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showApplyModal || !application.resume) {
      showToast('Please upload a resume', 'error');
      return;
    }

    // Convert file to Base64 for persistence
    const reader = new FileReader();
    reader.onloadend = () => {
      const resumeUrl = reader.result as string;

      submitJobApplication(showApplyModal, {
        jobId: showApplyModal,
        applicantId: 'current-user',
        applicantName: userProfile.name,
        resumeUrl,
        coverLetter: application.coverLetter
      });

      setShowApplyModal(null);
      setApplication({ coverLetter: '', resume: null });
      showToast('Application submitted successfully!', 'success');
    };
    reader.readAsDataURL(application.resume);
  };

  const filteredJobs = (filter === 'All' 
    ? jobs 
    : jobs.filter(job => job.type === filter)
  ).filter(job => 
    job.status === 'approved' || 
    user?.role === 'admin' || 
    job.postedBy === user?.id
  );

  return (
    <div className="space-y-4 pt-2">
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-xl font-bold text-[var(--uwi-blue-800)]">Jobs</h1>
      </div>

      <div className="flex flex-wrap gap-2 pb-2">
        {['All', 'Full-time', 'Part-time', 'Contract', 'Remote'].map((type) => (
          <motion.button
            key={type}
            onClick={() => setFilter(type)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
              filter === type 
                ? 'bg-blue-600 text-white shadow-blue-200' 
                : 'bg-white text-slate-600 border border-slate-100 hover:bg-slate-50 hover:shadow-md'
            }`}
          >
            {type}
          </motion.button>
        ))}
      </div>

      <div className="space-y-4">
        {filteredJobs.length === 0 ? (
          <div className="text-center py-10 text-slate-400">No jobs found.</div>
        ) : (
          filteredJobs.map((job) => (
            <motion.div 
              key={job.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -4 }}
              className="ui-card rounded-3xl p-6 hover:shadow-xl transition-all duration-300 border border-slate-100/50 group"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-2xl font-bold text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors shadow-sm">
                    {job.company.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg leading-tight group-hover:text-blue-600 transition-colors">{job.title}</h3>
                    <p className="text-sm text-slate-500 font-medium mt-0.5">{job.company}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-wider border border-blue-100">
                    {job.type}
                  </span>
                  {job.status === 'pending' && (
                    <span className="px-2 py-1 rounded-lg bg-orange-100 text-orange-600 text-[10px] font-bold uppercase tracking-wider">
                      Pending Approval
                    </span>
                  )}
                </div>
              </div>
            
            <div className="flex flex-wrap gap-3 mt-5 mb-5">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                <MapPin size={14} className="text-emerald-500" /> {job.location}
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                <DollarSign size={14} className="text-emerald-500" /> {job.salary}
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                <Clock size={14} className="text-orange-500" /> {job.posted}
              </div>
              {/* View Applicants for Admin/Poster */}
              {(user?.role === 'admin' || job.postedBy === user?.id) && (
                <button 
                  onClick={() => setViewApplicantsJobId(job.id)}
                  className="flex items-center gap-2 text-xs font-medium text-purple-600 bg-purple-50 px-3 py-1.5 rounded-lg border border-purple-100 hover:bg-purple-100 transition-colors"
                >
                  <Eye size={14} /> Applicants ({job.applicants?.length || 0})
                </button>
              )}
            </div>
            
            {job.applied ? (
              <div className={`w-full py-3 rounded-xl text-sm font-bold border flex items-center justify-center gap-2 ${
                job.applicationStatus === 'approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                job.applicationStatus === 'rejected' ? 'bg-red-50 text-red-600 border-red-100' :
                'bg-blue-50 text-blue-600 border-blue-100'
              }`}>
                {job.applicationStatus === 'approved' ? <CheckCircle size={16} /> : null}
                {job.applicationStatus === 'rejected' ? <X size={16} /> : null}
                {job.applicationStatus === 'approved' ? 'Application Approved' : 
                 job.applicationStatus === 'rejected' ? 'Application Rejected' : 
                 'Applied - Pending'}
              </div>
            ) : (
              user?.role !== 'admin' && (
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleApplyClick(job.id)}
                  className="w-full py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200 hover:shadow-blue-300"
                >
                  Apply Now
                </motion.button>
              )
            )}
          </motion.div>
        )))}
      </div>

      {/* Apply Job Modal */}
      <AnimatePresence>
        {showApplyModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl"
            >
              <h2 className="text-xl font-bold text-slate-800 mb-4">Apply for Job</h2>
              <form onSubmit={handleSubmitApplication} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Resume (PDF/DOCX)</label>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all"
                  >
                    <Upload size={24} className="text-slate-400 mb-2" />
                    <span className="text-sm text-slate-500 font-medium">{application.resume ? application.resume.name : 'Click to upload resume'}</span>
                  </div>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={(e) => setApplication({...application, resume: e.target.files?.[0] || null})} 
                    accept=".pdf,.docx,.doc" 
                    className="hidden" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Cover Letter</label>
                  <textarea 
                    value={application.coverLetter} 
                    onChange={(e) => setApplication({...application, coverLetter: e.target.value})} 
                    className="w-full bg-slate-50 rounded-xl p-3 text-sm border-none focus:ring-2 focus:ring-blue-100 min-h-[100px]"
                    placeholder="Why are you a good fit?"
                  ></textarea>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowApplyModal(null)} className="flex-1 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-colors">Cancel</button>
                  <button type="submit" className="flex-1 btn ui-btn py-3 rounded-xl font-bold">Submit Application</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* View Applicants Modal */}
      <AnimatePresence>
        {viewApplicantsJobId && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-6 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-slate-800">Applicants</h2>
                <button onClick={() => setViewApplicantsJobId(null)} className="p-2 hover:bg-slate-100 rounded-full"><X size={20} /></button>
              </div>
              
              <div className="space-y-3">
                {jobs.find(j => j.id === viewApplicantsJobId)?.applicants?.length === 0 ? (
                  <p className="text-slate-500 text-center py-8">No applicants yet.</p>
                ) : (
                  jobs.find(j => j.id === viewApplicantsJobId)?.applicants?.map((app) => (
                    <div key={app.id} className="p-4 rounded-xl border border-slate-100 hover:shadow-md transition-all">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-bold text-slate-800">{app.applicantName}</h3>
                          <p className="text-xs text-slate-400">{new Date(app.date).toLocaleDateString()}</p>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => setViewPdfUrl(app.resumeUrl)}
                            className="flex items-center gap-2 text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100"
                          >
                            <Eye size={14} /> Resume
                          </button>
                          {app.status === 'pending' && (
                            <>
                              <button 
                                onClick={() => {
                                  approveApplication(viewApplicantsJobId, app.applicantId);
                                  showToast('Application approved!', 'success');
                                }}
                                className="flex items-center gap-2 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg hover:bg-emerald-100"
                              >
                                <CheckCircle size={14} /> Approve
                              </button>
                              <button 
                                onClick={() => {
                                  rejectApplication(viewApplicantsJobId, app.applicantId);
                                  showToast('Application rejected.', 'info');
                                }}
                                className="flex items-center gap-2 text-xs font-bold text-red-600 bg-red-50 px-3 py-1.5 rounded-lg hover:bg-red-100"
                              >
                                <X size={14} /> Reject
                              </button>
                            </>
                          )}
                          {app.status === 'approved' && <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg">Approved</span>}
                          {app.status === 'rejected' && <span className="text-xs font-bold text-red-600 bg-red-50 px-3 py-1.5 rounded-lg">Rejected</span>}
                        </div>
                      </div>
                      <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg mt-2">{app.coverLetter}</p>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PDF Viewer Modal */}
      <AnimatePresence>
        {viewPdfUrl && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-[60] flex flex-col p-4"
          >
            <div className="flex justify-between items-center mb-4 text-white">
              <h2 className="text-lg font-bold">Resume Viewer</h2>
              <button onClick={() => setViewPdfUrl(null)} className="p-2 hover:bg-white/20 rounded-full"><X size={24} /></button>
            </div>
            <div className="flex-1 bg-white rounded-2xl overflow-hidden">
              <iframe src={viewPdfUrl} className="w-full h-full" title="Resume"></iframe>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
