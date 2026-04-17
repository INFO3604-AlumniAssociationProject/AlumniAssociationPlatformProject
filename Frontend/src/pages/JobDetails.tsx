// File: JobDetails.tsx

import React, { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useData } from '../DataContext';
import { motion, AnimatePresence } from 'motion/react';
import { Briefcase, MapPin, DollarSign, Clock, ArrowLeft, Heart, Star, Upload, CheckCircle, X, Share2 } from 'lucide-react';
import { useToast } from '../components/Toast';

export default function JobDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { jobs, saveJob, submitJobApplication, addTestimonial, deleteTestimonial, userProfile, withdrawApplication, getApplicationId } = useData();
  const { showToast } = useToast();
  
  const job = jobs.find(j => j.id === id);
  
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [application, setApplication] = useState({ coverLetter: '', resume: null as File | null });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showTestimonialForm, setShowTestimonialForm] = useState(false);
  const [testimonialRating, setTestimonialRating] = useState(5);
  const [testimonialComment, setTestimonialComment] = useState('');

  if (!job) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <h2 className="text-xl font-bold mb-2">Job Not Found</h2>
        <button onClick={() => navigate('/jobs')} className="text-blue-600">Return to Jobs</button>
      </div>
    );
  }

  const handleSaveJob = () => {
    saveJob(job.id);
    showToast(job.saved ? 'Removed from saved' : 'Job saved', 'success');
  };

  const handleSubmitApplication = (e: React.FormEvent) => {
    e.preventDefault();
    if (!application.resume) {
      showToast('Please upload a resume', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      submitJobApplication(job.id, {
        jobId: job.id,
        applicantId: 'current-user',
        applicantName: userProfile.name,
        resumeUrl: reader.result as string,
        coverLetter: application.coverLetter
      });
      setShowApplyModal(false);
      setApplication({ coverLetter: '', resume: null });
      showToast('Application submitted!', 'success');
    };
    reader.readAsDataURL(application.resume);
  };

  const handleSubmitTestimonial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testimonialComment.trim()) {
      showToast('Please provide a comment', 'error');
      return;
    }
    addTestimonial(job.id, {
      name: userProfile.name || 'Anonymous',
      avatar: userProfile.avatar || `https://ui-avatars.com/api/?name=Anonymous`,
      stars: testimonialRating,
      comment: testimonialComment
    });
    setShowTestimonialForm(false);
    setTestimonialComment('');
    setTestimonialRating(5);
    showToast('Review submitted!', 'success');
  };

  const testimonials = job.testimonials || [];
  const averageRating = testimonials.length ? (testimonials.reduce((acc, t) => acc + t.stars, 0) / testimonials.length).toFixed(1) : '0.0';
  const starBreakdown = [5, 4, 3, 2, 1].map(star => {
    const count = testimonials.filter(t => t.stars === star).length;
    const percentage = testimonials.length ? (count / testimonials.length) * 100 : 0;
    return { star, count, percentage };
  });

  return (
    <div className="space-y-6 pt-2 pb-10">
      <button onClick={() => navigate('/jobs')} className="flex items-center gap-2 text-sm font-medium text-slate-500 mb-2">
        <ArrowLeft size={16} /> Back to Jobs
      </button>

      {/* Job Header Card */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 relative">
        <div className="absolute top-6 right-6 flex gap-2 z-10">
          <button onClick={handleSaveJob} className="p-2 rounded-full hover:bg-slate-100 bg-white/80 backdrop-blur-sm shadow-sm">
            <Heart size={20} className={job.saved ? 'fill-red-500 text-red-500' : 'text-slate-500'} />
          </button>
          <button onClick={() => {
            const message = `Check out this job: ${job.title} at ${job.company} – ${window.location.origin}/jobs/${job.id}`;
            navigate(`/messages?body=${encodeURIComponent(message)}`);
          }} className="p-2 rounded-full hover:bg-slate-100 bg-white/80 backdrop-blur-sm shadow-sm">
            <Share2 size={18} className="text-slate-500" />
          </button>
        </div>

        <div className="flex items-center gap-5 mb-6 pr-20">
          <div className="w-20 h-20 rounded-2xl bg-blue-50 flex items-center justify-center text-3xl font-bold text-blue-600 shadow-sm shrink-0">
            {job.company.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold text-slate-800 leading-tight break-words">{job.title}</h1>
            <p className="text-lg text-slate-600 font-medium truncate">{job.company}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-600 bg-slate-50 px-4 py-2 rounded-xl"><MapPin size={16} className="text-emerald-500" /> {job.location}</div>
          <div className="flex items-center gap-2 text-sm font-medium text-slate-600 bg-slate-50 px-4 py-2 rounded-xl">
            <DollarSign size={16} className="text-emerald-500" /> 
            <span className="font-medium text-emerald-700">{job.salary || 'Not specified'}</span>
          </div>
          <div className="flex items-center gap-2 text-sm font-medium text-slate-600 bg-slate-50 px-4 py-2 rounded-xl"><Briefcase size={16} className="text-blue-500" /> {job.type}</div>
          <div className="flex items-center gap-2 text-sm font-medium text-slate-600 bg-slate-50 px-4 py-2 rounded-xl"><Clock size={16} className="text-orange-500" /> Posted {job.posted}</div>
        </div>

        {job.applied ? (
          <div className="mt-6 p-5 rounded-2xl border border-slate-100 bg-slate-50">
            <h3 className="font-bold mb-4 flex items-center gap-2"><CheckCircle size={18} className="text-blue-600" /> Application Status</h3>
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200"></div>
              <div className="relative flex items-start gap-4 mb-6">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center z-10 shrink-0"><CheckCircle size={16} /></div>
                <div><h4 className="font-bold">Application Submitted</h4><p className="text-xs text-slate-500">We have received your application.</p></div>
              </div>
              <div className="relative flex items-start gap-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 shrink-0 ${job.applicationStatus === 'approved' ? 'bg-emerald-500 text-white' : job.applicationStatus === 'rejected' ? 'bg-red-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                  {job.applicationStatus === 'approved' ? <CheckCircle size={16} /> : job.applicationStatus === 'rejected' ? <X size={16} /> : <Clock size={16} />}
                </div>
                <div>
                  <h4 className={`font-bold ${job.applicationStatus === 'approved' ? 'text-emerald-600' : job.applicationStatus === 'rejected' ? 'text-red-600' : 'text-slate-600'}`}>
                    {job.applicationStatus === 'approved' ? 'Application Approved' : job.applicationStatus === 'rejected' ? 'Application Rejected' : 'Under Review'}
                  </h4>
                  <p className="text-xs text-slate-500">
                    {job.applicationStatus === 'approved' ? 'Congratulations! The employer will contact you soon.' : job.applicationStatus === 'rejected' ? 'Unfortunately, the employer has decided not to proceed.' : 'The employer is currently reviewing applications.'}
                  </p>
                </div>
              </div>
            </div>
            {job.applicationStatus === 'pending' && withdrawApplication && getApplicationId && (
              <div className="mt-4">
                <button onClick={async () => {
                  const appId = getApplicationId(job.id, user?.id || '');
                  if (!appId) { showToast('Unable to find application.', 'error'); return; }
                  const ok = await withdrawApplication(appId);
                  showToast(ok ? 'Application withdrawn.' : 'Failed to withdraw.', ok ? 'info' : 'error');
                }} className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-2 rounded-xl">Withdraw Application</button>
              </div>
            )}
          </div>
        ) : (
          user?.role !== 'admin' && (
            <button onClick={() => setShowApplyModal(true)} className="w-full py-4 rounded-xl text-base font-bold bg-blue-600 text-white shadow-lg">Apply for this Job</button>
          )
        )}
      </div>

      {/* Description */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
        <h2 className="text-xl font-bold mb-4">Job Description</h2>
        <p className="text-slate-600 whitespace-pre-line">{job.description}</p>
      </div>

      {/* Testimonials */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Company Reviews</h2>
          {!showTestimonialForm && <button onClick={() => setShowTestimonialForm(true)} className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-sm font-bold">Write a Review</button>}
        </div>

        <AnimatePresence>
          {showTestimonialForm && (
            <motion.form initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} onSubmit={handleSubmitTestimonial} className="mb-8 p-5 bg-slate-50 rounded-2xl overflow-hidden">
              <div className="flex justify-between mb-4">
                <h3 className="font-bold">Share your experience</h3>
                <button type="button" onClick={() => setShowTestimonialForm(false)}><X size={20} /></button>
              </div>
              <div className="mb-4">
                <label className="block text-sm mb-2">Rating</label>
                <div className="flex gap-1">{[1,2,3,4,5].map(s => <button type="button" key={s} onClick={() => setTestimonialRating(s)}><Star size={24} className={s <= testimonialRating ? "fill-amber-400 text-amber-400" : "text-slate-300"} /></button>)}</div>
              </div>
              <div className="mb-4">
                <label className="block text-sm mb-2">Review</label>
                <textarea value={testimonialComment} onChange={(e) => setTestimonialComment(e.target.value)} className="w-full p-3 rounded-xl border min-h-[100px]" placeholder="What was it like?" />
              </div>
              <button type="submit" disabled={!testimonialComment.trim()} className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold">Submit Review</button>
            </motion.form>
          )}
        </AnimatePresence>

        {testimonials.length > 0 ? (
          <>
            <div className="flex flex-col md:flex-row gap-8 mb-8">
              <div className="flex flex-col items-center p-6 bg-slate-50 rounded-2xl min-w-[200px]">
                <span className="text-5xl font-bold mb-2">{averageRating}</span>
                <div className="flex gap-1 mb-2">{[1,2,3,4,5].map(s => <Star key={s} size={16} className={s <= Math.round(Number(averageRating)) ? "fill-amber-400 text-amber-400" : "text-slate-300"} />)}</div>
                <span className="text-sm text-slate-500">{testimonials.length} reviews</span>
              </div>
              <div className="flex-1 space-y-2">
                {starBreakdown.map(({star, count, percentage}) => (
                  <div key={star} className="flex items-center gap-3">
                    <span className="text-sm w-8">{star} ★</span>
                    <div className="flex-1 h-2 bg-slate-100 rounded-full"><div className="h-full bg-amber-400 rounded-full" style={{width: `${percentage}%`}} /></div>
                    <span className="text-xs w-8 text-right">{count}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              {testimonials.map(t => (
                <div key={t.id} className="p-5 rounded-2xl border relative group">
                  {user?.role === 'admin' && <button onClick={() => deleteTestimonial(job.id, t.id)} className="absolute top-4 right-4 p-1.5 bg-red-50 text-red-500 rounded-full opacity-0 group-hover:opacity-100"><X size={14} /></button>}
                  <div className="flex items-center gap-3 mb-3">
                    <img src={t.avatar} className="w-10 h-10 rounded-full" />
                    <div><h4 className="font-bold text-sm">{t.name}</h4><span className="text-xs text-slate-400">{new Date(t.timestamp).toLocaleDateString()}</span></div>
                    <div className="flex gap-0.5 ml-auto pr-8">{[1,2,3,4,5].map(s => <Star key={s} size={14} className={s <= t.stars ? "fill-amber-400 text-amber-400" : "text-slate-200"} />)}</div>
                  </div>
                  <p className="text-sm text-slate-600">{t.comment}</p>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="text-center py-8 text-slate-500">No reviews yet.</p>
        )}
      </div>

      {/* Apply Modal */}
      <AnimatePresence>
        {showApplyModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" data-overlay="true">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-white rounded-3xl p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Apply for {job.title}</h2>
              <form onSubmit={handleSubmitApplication} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold mb-1">Resume (PDF/DOCX)</label>
                  <div onClick={() => fileInputRef.current?.click()} className="w-full border-2 border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400">
                    <Upload size={24} className="text-slate-400 mb-2" />
                    <span className="text-sm">{application.resume ? application.resume.name : 'Click to upload'}</span>
                  </div>
                  <input type="file" ref={fileInputRef} onChange={(e) => setApplication({...application, resume: e.target.files?.[0] || null})} accept=".pdf,.docx,.doc" className="hidden" />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">Cover Letter</label>
                  <textarea value={application.coverLetter} onChange={(e) => setApplication({...application, coverLetter: e.target.value})} className="w-full bg-slate-50 rounded-xl p-3 text-sm min-h-[100px]" placeholder="Why are you a good fit?" />
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setShowApplyModal(false)} className="flex-1 py-3 bg-slate-100 rounded-xl font-bold">Cancel</button>
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