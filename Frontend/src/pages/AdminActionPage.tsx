// File: AdminActionPage.tsx

import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Save, AlertTriangle, Check, X, FileText } from 'lucide-react';
import { useToast } from '../components/Toast';
import { useData } from '../DataContext';
import React, { useEffect, useState } from 'react';
import { API_BASE } from '../apiConfig';
import { getAuthToken } from '../AuthContext';
import PDFViewer from '../components/PDFViewer';

export default function AdminActionPage() {
  const { action } = useParams();
  const { showToast } = useToast();
  const { jobs, approveApplication, rejectApplication, loading, fetchAndSetJobApplications } = useData();
  const [loadedApplicants, setLoadedApplicants] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [reportData, setReportData] = useState<any>(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [postingAnnouncement, setPostingAnnouncement] = useState(false);
  const [viewPdfUrl, setViewPdfUrl] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, [action]);

  useEffect(() => {
    if (action === 'reports') {
      const fetchReport = async () => {
        setLoadingReport(true);
        try {
          const res = await fetch(`${API_BASE}/admin/reports`, {
            headers: { Authorization: `Bearer ${getAuthToken()}` },
          });
          if (res.ok) {
            const data = await res.json();
            setReportData(data.report);
          }
        } finally {
          setLoadingReport(false);
        }
      };
      fetchReport();
    }
  }, [action]);

  useEffect(() => {
    if (action === 'applications' && fetchAndSetJobApplications && jobs.length > 0 && !loadedApplicants) {
      (async () => {
        try {
          await Promise.all(jobs.map((job) => fetchAndSetJobApplications(job.id)));
        } finally {
          setLoadedApplicants(true);
        }
      })();
    }
  }, [action, jobs, fetchAndSetJobApplications, loadedApplicants]);

  const getTitle = () => {
    switch(action) {
      case 'announcements': return 'Post Announcement';
      case 'reports': return 'Review Reports';
      case 'settings': return 'System Settings';
      case 'applications': return 'Manage Applications';
      case 'testimonials': return 'Moderate Testimonials';
      default: return 'Admin Action';
    }
  };

  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementContent, setAnnouncementContent] = useState('');

  const handleSave = () => {
    showToast('Changes saved successfully!', 'success');
  };

  const handlePostAnnouncement = async () => {
    if (!announcementContent.trim()) return;
    setPostingAnnouncement(true);
    try {
      const res = await fetch(`${API_BASE}/admin/announcements`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getAuthToken()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: announcementContent }),
      });
      if (res.ok) {
        showToast('Announcement posted successfully!', 'success');
        setAnnouncementTitle('');
        setAnnouncementContent('');
      } else {
        showToast('Failed to post announcement', 'error');
      }
    } finally {
      setPostingAnnouncement(false);
    }
  };

  const handleApproveApp = async (jobId: string, applicantId: string) => {
    const ok = await approveApplication(jobId, applicantId);
    if (ok) showToast('Application approved.', 'success');
    else showToast('Failed to approve application.', 'error');
  };

  const handleRejectApp = async (jobId: string, applicantId: string) => {
    const ok = await rejectApplication(jobId, applicantId);
    if (ok) showToast('Application rejected.', 'info');
    else showToast('Failed to reject application.', 'error');
  };

  // Get all pending applications across all jobs
  const pendingApplications = jobs.flatMap(job => 
    (job.applicants || [])
      .filter(app => app.status === 'pending')
      .map(app => ({ ...app, jobTitle: job.title, company: job.company }))
  );

  // Get all testimonials across all jobs
  const allTestimonials = jobs.flatMap(job => 
    (job.testimonials || []).map(t => ({ ...t, jobId: job.id, jobTitle: job.title, company: job.company }))
  );

  const { deleteTestimonial } = useData();

  const handleDeleteTestimonial = (jobId: string, testimonialId: string) => {
    deleteTestimonial(jobId, testimonialId);
    showToast('Testimonial deleted.', 'info');
  };

  return (
    <div className="space-y-4 pt-2">
      <div className="flex items-center gap-3 mb-4">
        <Link to="/admin" className="p-2 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-xl font-bold text-[var(--uwi-blue-800)]">{getTitle()}</h1>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="ui-card rounded-2xl p-5"
      >
        {action === 'announcements' && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Title</label>
              <input 
                type="text" 
                value={announcementTitle}
                onChange={(e) => setAnnouncementTitle(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-blue-100 text-sm" 
                placeholder="Announcement Title" 
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Content</label>
              <textarea 
                rows={5} 
                value={announcementContent}
                onChange={(e) => setAnnouncementContent(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-blue-100 text-sm" 
                placeholder="Write your announcement here..."
              ></textarea>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="notify" className="rounded text-blue-600 focus:ring-blue-500" />
              <label htmlFor="notify" className="text-sm text-slate-600">Send push notification to all users</label>
            </div>
            <button 
              onClick={handlePostAnnouncement} 
              disabled={!announcementTitle.trim() || !announcementContent.trim() || postingAnnouncement}
              className="btn ui-btn w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={18} /> Post Announcement
            </button>
          </div>
        )}

        {action === 'reports' && (
          <div className="space-y-4">
            {loadingReport ? (
              <p className="text-sm text-slate-500">Loading report...</p>
            ) : reportData ? (
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <h3 className="font-bold text-blue-800 text-sm mb-1">Users</h3>
                  <p className="text-xs text-blue-700">Total: {reportData.users.total}</p>
                  <p className="text-xs text-blue-700">Pending approval: {reportData.users.pendingApproval}</p>
                </div>
                <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                  <h3 className="font-bold text-green-800 text-sm mb-1">Jobs</h3>
                  <p className="text-xs text-green-700">Total: {reportData.jobs.total}</p>
                  <p className="text-xs text-green-700">Open: {reportData.jobs.open}</p>
                </div>
                <div className="p-4 bg-orange-50 rounded-xl border border-orange-100">
                  <h3 className="font-bold text-orange-800 text-sm mb-1">Events</h3>
                  <p className="text-xs text-orange-700">Active: {reportData.events.active}</p>
                  <p className="text-xs text-orange-700">Cancelled: {reportData.events.cancelled}</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
                  <h3 className="font-bold text-purple-800 text-sm mb-1">Messages</h3>
                  <p className="text-xs text-purple-700">Requested: {reportData.messages.requested}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-400 text-center py-4">No report data available.</p>
            )}
          </div>
        )}

        {action === 'settings' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
              <span className="text-sm font-medium text-slate-700">Maintenance Mode</span>
              <div className="w-10 h-6 bg-slate-200 rounded-full relative cursor-pointer">
                <div className="w-4 h-4 bg-white rounded-full absolute left-1 top-1 shadow-sm"></div>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
              <span className="text-sm font-medium text-slate-700">Allow New Registrations</span>
              <div className="w-10 h-6 bg-emerald-500 rounded-full relative cursor-pointer">
                <div className="w-4 h-4 bg-white rounded-full absolute right-1 top-1 shadow-sm"></div>
              </div>
            </div>
            <button onClick={handleSave} className="btn ui-btn w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 mt-4">
              <Save size={18} /> Save Settings
            </button>
          </div>
        )}

        {action === 'applications' && (
          <div className="space-y-4">
            <h2 className="font-bold text-[var(--uwi-blue-800)] mb-2">Pending Applications</h2>
            {isLoading ? (
              Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="p-4 rounded-xl border border-slate-100 bg-slate-50 animate-pulse">
                  <div className="flex justify-between items-start mb-2">
                    <div className="space-y-2 w-1/2">
                      <div className="h-4 bg-slate-200 rounded w-full"></div>
                      <div className="h-3 bg-slate-200 rounded w-3/4"></div>
                    </div>
                    <div className="h-3 bg-slate-200 rounded w-16"></div>
                  </div>
                  <div className="mt-2 mb-3 bg-white p-3 rounded-lg border border-slate-100 h-12"></div>
                  <div className="flex items-center justify-between mt-3">
                    <div className="h-4 bg-slate-200 rounded w-24"></div>
                    <div className="flex gap-2">
                      <div className="w-8 h-8 rounded-full bg-slate-200"></div>
                      <div className="w-8 h-8 rounded-full bg-slate-200"></div>
                    </div>
                  </div>
                </div>
              ))
            ) : pendingApplications.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">No pending applications.</p>
            ) : (
              pendingApplications.map((app) => (
                <div key={app.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-bold text-slate-800 text-sm">{app.applicantName}</h3>
                      <p className="text-xs text-slate-500">Applied for: <span className="font-medium text-slate-700">{app.jobTitle}</span> at {app.company}</p>
                    </div>
                    <span className="text-[10px] text-slate-400">{app.date}</span>
                  </div>
                  
                  {app.coverLetter && (
                    <div className="mt-2 mb-3 bg-white p-3 rounded-lg border border-slate-100">
                      <p className="text-xs text-slate-600 line-clamp-2 italic">"{app.coverLetter}"</p>
                    </div>
                  )}

                    <div className="flex items-center justify-between mt-3">
                      <button 
                        onClick={() => setViewPdfUrl(app.resumeUrl)}
                        className="text-xs font-bold text-blue-600 flex items-center gap-1 hover:underline"
                      >
                        <FileText size={14} /> View Resume
                      </button>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleApproveApp(app.jobId, app.applicantId)}
                          disabled={loading?.approvingApplication}
                          className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center hover:bg-emerald-100 transition-colors disabled:opacity-50"
                          title="Approve"
                        >
                          <Check size={16} />
                        </button>
                        <button 
                          onClick={() => handleRejectApp(app.jobId, app.applicantId)}
                          disabled={loading?.rejectingApplication}
                          className="w-8 h-8 rounded-full bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-100 transition-colors disabled:opacity-50"
                          title="Reject"
                        >
                          <X size={16} />
                        </button>
                      </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
        {action === 'testimonials' && (
          <div className="space-y-4">
            <h2 className="font-bold text-[var(--uwi-blue-800)] mb-2">Moderate Testimonials</h2>
            {isLoading ? (
              Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="p-4 rounded-xl border border-slate-100 bg-slate-50 animate-pulse">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-slate-200"></div>
                      <div className="space-y-1">
                        <div className="h-3 bg-slate-200 rounded w-24"></div>
                        <div className="h-2 bg-slate-200 rounded w-16"></div>
                      </div>
                    </div>
                  </div>
                  <div className="h-4 bg-slate-200 rounded w-full mt-2"></div>
                  <div className="h-4 bg-slate-200 rounded w-3/4 mt-1"></div>
                </div>
              ))
            ) : allTestimonials.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">No testimonials found.</p>
            ) : (
              allTestimonials.map((testimonial) => (
                <div key={testimonial.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <img src={testimonial.avatar} alt={testimonial.name} className="w-8 h-8 rounded-full" />
                      <div>
                        <h3 className="font-bold text-slate-800 text-sm">{testimonial.name}</h3>
                        <p className="text-[10px] text-slate-500">For <span className="font-medium text-slate-700">{testimonial.jobTitle}</span> at {testimonial.company}</p>
                      </div>
                    </div>
                    <div className="flex items-center text-yellow-500">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <svg key={i} className={`w-3 h-3 ${i < testimonial.stars ? 'fill-current' : 'text-slate-200 fill-current'}`} viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 mt-2">"{testimonial.comment}"</p>
                  <div className="flex justify-end mt-3">
                    <button 
                      onClick={() => handleDeleteTestimonial(testimonial.jobId, testimonial.id)}
                      className="text-xs font-bold text-red-600 flex items-center gap-1 hover:underline"
                    >
                      <X size={14} /> Delete Testimonial
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </motion.div>

      {/* PDF Viewer Modal */}
      <AnimatePresence>
        {viewPdfUrl && <PDFViewer pdfUrl={viewPdfUrl} onClose={() => setViewPdfUrl(null)} />}
      </AnimatePresence>
    </div>
  );
}