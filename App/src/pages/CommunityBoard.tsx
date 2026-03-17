import React, { useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, MessageSquare, Send, ThumbsUp, MoreHorizontal, Image as ImageIcon, Smile, Plus, Briefcase, Users, FileText, CheckCircle, Upload, X, Eye, Calendar, Trash2 } from 'lucide-react';
import { useToast } from '../components/Toast';
import { useAuth } from '../AuthContext';
import { useData, Job, Application, CommunityMember } from '../DataContext';
import placeholderImage from '../assets/UWILogo.jpg';

export default function CommunityBoard() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { 
    posts, addPost, toggleLikePost, addComment,
    communities, createCommunity, joinCommunity, leaveCommunity,
    jobs, addJob, submitJobApplication, approveApplication, rejectApplication,
    events, addEvent, cancelEvent, toggleRegisterEvent,
    userProfile, getCommunityMembers
  } = useData();
  const { showToast } = useToast();

  // State for Community Creation
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCommunityName, setNewCommunityName] = useState('');
  const [newCommunityDesc, setNewCommunityDesc] = useState('');

  // State for specific community view
  const [activeTab, setActiveTab] = useState<'discussions' | 'jobs' | 'events'>('discussions');
  const [newPost, setNewPost] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [communityMembers, setCommunityMembers] = useState<CommunityMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);

  // State for Job Posting
  const [showPostJobModal, setShowPostJobModal] = useState(false);
  const [newJob, setNewJob] = useState({ title: '', company: '', location: '', salary: '', type: 'Full-time', description: '' });

  // State for Job Application
  const [showApplyModal, setShowApplyModal] = useState<string | null>(null);
  const [application, setApplication] = useState({ coverLetter: '', resume: null as File | null });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State for Viewing Applicants (for job posters)
  const [viewApplicantsJobId, setViewApplicantsJobId] = useState<string | null>(null);
  const [viewPdfUrl, setViewPdfUrl] = useState<string | null>(null);

  // State for Event Creation
  const [showCreateEventModal, setShowCreateEventModal] = useState(false);
  const [newEvent, setNewEvent] = useState<Omit<import('../DataContext').Event, 'id' | 'registered'>>({
    title: '',
    date: '',
    time: '',
    location: '',
    category: 'Community',
    image: ''
  });

  const currentCommunity = id ? communities.find((community) => String(community.id) === String(id)) : null;
  const communityPosts = id ? posts.filter((post) => String(post.communityId) === String(id)) : [];
  const communityJobs = id ? jobs.filter((job) => String(job.communityId) === String(id)) : [];
  const communityEvents = id ? events.filter((event) => String(event.communityId) === String(id)) : [];
  const canDiscuss = Boolean(user?.role === 'admin' || currentCommunity?.isMember || currentCommunity?.adminId === user?.id);

  const handleCreateCommunity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommunityName || !newCommunityDesc) return;
    createCommunity(newCommunityName, newCommunityDesc);
    setShowCreateModal(false);
    setNewCommunityName('');
    setNewCommunityDesc('');
    showToast('Community created successfully!', 'success');
  };

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.trim() || !canDiscuss) {
      showToast('Join this community first to participate in discussions.', 'error');
      return;
    }
    const ok = await addPost(newPost, id);
    if (!ok) {
      showToast('Unable to post. Join this community first.', 'error');
      return;
    }
    setNewPost('');
    setIsFocused(false);
    showToast('Post shared to community board!', 'success');
  };

  const handleComment = async (e: React.FormEvent, postId: string) => {
    e.preventDefault();
    if (!newComment.trim() || !canDiscuss) {
      showToast('Join this community first to comment.', 'error');
      return;
    }
    const ok = await addComment(postId, newComment);
    if (!ok) {
      showToast('Unable to comment right now.', 'error');
      return;
    }
    setNewComment('');
    showToast('Comment added!', 'success');
  };

  const handlePostJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJob.title || !newJob.company) return;
    
    addJob({
      ...newJob,
      posted: 'Just now',
      communityId: id,
      postedBy: user?.id
    });
    
    setShowPostJobModal(false);
    setNewJob({ title: '', company: '', location: '', salary: '', type: 'Full-time', description: '' });
    showToast('Job posted! Waiting for admin approval.', 'info');
  };

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.title || !newEvent.date) return;

    // when we add the event we don't need to pass the image – the
    // data layer will compute a suitable cover using the title/category
    addEvent({
      ...newEvent,
      communityId: id,
      creatorId: user?.role === 'admin' ? 'admin' : user?.id,
    });

    setShowCreateEventModal(false);
    setNewEvent({ title: '', date: '', time: '', location: '', category: 'Community', image: '' });
    showToast('Event created successfully!', 'success');
  };

  const handleApply = (e: React.FormEvent) => {
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

  const handleJoinLeave = async () => {
    if (currentCommunity?.isMember) {
      const ok = await leaveCommunity(String(id));
      if (ok) showToast('Left community.', 'info');
      else showToast('Unable to leave this community.', 'error');
    } else {
      const ok = await joinCommunity(String(id));
      if (ok) showToast('Joined community!', 'success');
      else showToast('Unable to join this community.', 'error');
    }
  };

  const handleMembersClick = async () => {
    if (!id) return;
    setMembersLoading(true);
    const members = await getCommunityMembers(String(id));
    setCommunityMembers(members);
    setMembersLoading(false);
    setShowMembersModal(true);
  };

  // If viewing list of communities
  if (!id) {
    return (
      <div className="space-y-6 pt-2 max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Communities</h1>
            <p className="text-xs text-slate-500 font-medium">Join groups, find jobs, and network</p>
          </div>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="btn ui-btn px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-blue-200 hover:shadow-blue-300 transition-all"
          >
            <Plus size={18} /> Create Community
          </button>
        </div>

        <div className="space-y-4">
          {communities.map((community) => (
            <Link to={`/boards/${community.id}`} key={community.id}>
              <motion.div 
                whileHover={{ scale: 1.01, y: -2 }}
                className="ui-card rounded-2xl p-5 border border-slate-100/50 hover:shadow-md transition-all cursor-pointer flex items-center gap-4"
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-blue-200 shrink-0">
                  {community.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-800 text-lg truncate">{community.name}</h3>
                  <p className="text-sm text-slate-500 line-clamp-1 mb-2">{community.description}</p>
                  <div className="flex items-center gap-4 text-xs font-medium text-slate-400">
                    <span className="flex items-center gap-1"><Users size={14} /> {community.members} Members</span>
                    <span className="flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">Admin: {community.adminName}</span>
                  </div>
                </div>
              </motion.div>
            </Link>
          ))}
        </div>

        {/* Create Community Modal */}
        <AnimatePresence>
          {showCreateModal && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            >
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl"
              >
                <h2 className="text-xl font-bold text-slate-800 mb-4">Create New Community</h2>
                <form onSubmit={handleCreateCommunity} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Community Name</label>
                    <input 
                      type="text" 
                      value={newCommunityName}
                      onChange={(e) => setNewCommunityName(e.target.value)}
                      className="w-full bg-slate-50 rounded-xl p-3 text-sm border-none focus:ring-2 focus:ring-blue-100"
                      placeholder="e.g. Tech Innovators"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Description</label>
                    <textarea 
                      value={newCommunityDesc}
                      onChange={(e) => setNewCommunityDesc(e.target.value)}
                      className="w-full bg-slate-50 rounded-xl p-3 text-sm border-none focus:ring-2 focus:ring-blue-100 min-h-[100px] resize-none"
                      placeholder="What is this community about?"
                      required
                    ></textarea>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-colors">Cancel</button>
                    <button type="submit" className="flex-1 btn ui-btn py-3 rounded-xl font-bold">Create</button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Specific Community View
  if (!currentCommunity) return <div>Community not found</div>;

  return (
    <div className="space-y-6 pt-2 max-w-2xl mx-auto">
      {/* Header */}
      <div className="ui-card rounded-3xl p-6 bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-xl shadow-blue-600/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-16 -mt-32 blur-3xl"></div>
        <div className="relative z-10">
          <Link to="/boards" className="inline-flex items-center gap-2 text-blue-100 hover:text-white mb-4 transition-colors text-sm font-medium bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-md">
            <ArrowLeft size={16} /> Back to Communities
          </Link>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold mb-2">{currentCommunity.name}</h1>
              <p className="text-blue-100 leading-relaxed max-w-lg">{currentCommunity.description}</p>
            </div>
            <button 
              onClick={handleJoinLeave}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${currentCommunity.isMember ? 'bg-white/20 text-white hover:bg-white/30' : 'bg-white text-blue-600 hover:bg-blue-50'}`}
            >
              {currentCommunity.isMember ? 'Leave' : 'Join'}
            </button>
          </div>
          <div className="flex items-center gap-4 mt-6">
            <button
              onClick={handleMembersClick}
              className="flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-white/30 transition-colors"
            >
              <Users size={14} /> {currentCommunity.members} Members
            </button>
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-xl text-xs font-bold">
              <CheckCircle size={14} /> Community Admin: {currentCommunity.adminName}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-slate-100 rounded-xl">
        <button 
          onClick={() => setActiveTab('discussions')}
          className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'discussions' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Discussions
        </button>
        <button 
          onClick={() => setActiveTab('jobs')}
          className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'jobs' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Jobs
        </button>
        <button 
          onClick={() => setActiveTab('events')}
          className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'events' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Events
        </button>
      </div>

      {/* Discussions Tab */}
      {activeTab === 'discussions' && (
        <div className="space-y-6">
          {!canDiscuss && (
            <div className="ui-card rounded-2xl p-4 border border-orange-100 bg-orange-50 text-orange-700 text-sm">
              Join this community first to create posts, like posts, and comment.
            </div>
          )}
          {/* Post Input */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className={`ui-card rounded-3xl p-5 transition-all duration-300 border border-slate-100/50 shadow-sm ${isFocused ? 'ring-2 ring-blue-100 shadow-md' : ''}`}
          >
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-blue-200 shadow-lg shrink-0">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <form onSubmit={handlePost} className="flex-1">
                <textarea 
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => !newPost && setIsFocused(false)}
                  disabled={!canDiscuss}
                  placeholder={`Discuss something with ${currentCommunity.name}...`} 
                  className="w-full bg-slate-50/50 rounded-2xl p-4 text-sm border-none focus:ring-0 min-h-[100px] resize-none placeholder:text-slate-400 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                ></textarea>
                
                <AnimatePresence>
                  {isFocused && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                      className="flex justify-between items-center mt-3 pt-3 border-t border-slate-100"
                    >
                      <div className="flex gap-2">
                        <button type="button" className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"><ImageIcon size={18} /></button>
                        <button type="button" className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"><Smile size={18} /></button>
                      </div>
                      <button 
                        type="submit" 
                        disabled={!newPost.trim() || !canDiscuss}
                        className="btn ui-btn py-2.5 px-6 rounded-xl text-sm font-bold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-200 hover:shadow-blue-300 transition-all active:scale-95"
                      >
                        <Send size={16} /> Post
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </form>
            </div>
          </motion.div>

          {/* Posts Feed */}
          <div className="space-y-5">
            {communityPosts.map((post, index) => (
              <motion.div 
                key={post.id}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}
                className="ui-card rounded-3xl p-6 border border-slate-100/50 hover:shadow-md transition-all duration-300"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <img src={post.avatar} alt={post.author} className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm" />
                    <div>
                      <h3 className="font-bold text-slate-800 text-sm">{post.author}</h3>
                      <p className="text-[11px] text-slate-400 font-medium">{post.time}</p>
                    </div>
                  </div>
                  <button className="text-slate-300 hover:text-slate-600 p-2 hover:bg-slate-50 rounded-full transition-colors">
                    <MoreHorizontal size={18} />
                  </button>
                </div>
                <p className="text-sm text-slate-700 mb-5 leading-relaxed whitespace-pre-wrap">{post.content}</p>
                <div className="flex items-center gap-6 pt-4 border-t border-slate-50">
                  <button
                    onClick={async () => {
                      if (!canDiscuss) {
                        showToast('Join this community first to like posts.', 'error');
                        return;
                      }
                      const ok = await toggleLikePost(post.id);
                      if (!ok) showToast('Unable to update like right now.', 'error');
                    }}
                    className={`flex items-center gap-2 text-xs font-bold transition-colors px-3 py-1.5 rounded-lg ${post.liked ? 'text-blue-600 bg-blue-50' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}
                  >
                    <ThumbsUp size={16} className={post.liked ? 'fill-current' : ''} /> {post.likes} <span className="hidden sm:inline">Likes</span>
                  </button>
                  <button 
                    onClick={() => setActiveCommentPostId(activeCommentPostId === post.id ? null : post.id)}
                    className={`flex items-center gap-2 text-xs font-bold transition-colors px-3 py-1.5 rounded-lg ${activeCommentPostId === post.id ? 'text-blue-600 bg-blue-50' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}
                  >
                    <MessageSquare size={16} /> {post.commentsCount} <span className="hidden sm:inline">Comments</span>
                  </button>
                </div>

                {/* Comments Section */}
                <AnimatePresence>
                  {activeCommentPostId === post.id && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                      className="mt-4 pt-4 border-t border-slate-50"
                    >
                      <div className="space-y-4 mb-4">
                        {post.comments?.map((comment) => (
                          <div key={comment.id} className="flex gap-3">
                            <img src={comment.avatar} alt={comment.author} className="w-8 h-8 rounded-full object-cover" />
                            <div className="bg-slate-50 p-3 rounded-2xl rounded-tl-none flex-1">
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-xs font-bold text-slate-800">{comment.author}</span>
                                <span className="text-[10px] text-slate-400">{comment.time}</span>
                              </div>
                              <p className="text-xs text-slate-600">{comment.content}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <form onSubmit={(e) => handleComment(e, post.id)} className="flex gap-2">
                        <input 
                          type="text" 
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          disabled={!canDiscuss}
                          placeholder="Write a comment..."
                          className="flex-1 bg-slate-50 rounded-xl px-4 py-2 text-xs border-none focus:ring-1 focus:ring-blue-200 disabled:opacity-60"
                        />
                        <button type="submit" disabled={!newComment.trim() || !canDiscuss} className="p-2 bg-blue-600 text-white rounded-xl disabled:opacity-50">
                          <Send size={14} />
                        </button>
                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Jobs Tab */}
      {activeTab === 'jobs' && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button 
              onClick={() => setShowPostJobModal(true)}
              className="btn ui-btn px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-blue-200 hover:shadow-blue-300 transition-all"
            >
              <Briefcase size={18} /> Post Job
            </button>
          </div>

          <div className="space-y-4">
            {communityJobs.length === 0 ? (
              <div className="text-center py-10 text-slate-400">No jobs posted in this community yet.</div>
            ) : (
              communityJobs.map((job) => (
                <motion.div 
                  key={job.id}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="ui-card rounded-2xl p-5 border border-slate-100/50 hover:shadow-md transition-all"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-slate-800 text-lg">{job.title}</h3>
                      <p className="text-sm text-slate-500 font-medium">{job.company} • {job.location}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs bg-emerald-50 text-emerald-600 px-2 py-1 rounded-md font-bold">{job.salary}</span>
                        <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded-md font-medium">{job.type}</span>
                        {job.status === 'pending' && <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-md font-bold">Pending Approval</span>}
                      </div>
                    </div>
                    {job.status === 'approved' && !job.applied && (
                      <button 
                        onClick={() => setShowApplyModal(job.id)}
                        className="btn ui-outline px-4 py-2 rounded-xl text-xs font-bold border-blue-200 text-blue-600 hover:bg-blue-50"
                      >
                        Apply Now
                      </button>
                    )}
                    {job.applied && (
                      <span className={`text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 ${
                        job.applicationStatus === 'approved' ? 'bg-emerald-50 text-emerald-600' :
                        job.applicationStatus === 'rejected' ? 'bg-red-50 text-red-600' :
                        'bg-blue-50 text-blue-600'
                      }`}>
                        {job.applicationStatus === 'approved' ? <CheckCircle size={14} /> : null}
                        {job.applicationStatus === 'rejected' ? <X size={14} /> : null}
                        {job.applicationStatus === 'approved' ? 'Application Approved' : 
                         job.applicationStatus === 'rejected' ? 'Application Rejected' : 
                         'Applied - Pending'}
                      </span>
                    )}
                    {/* View Applicants Button for Job Poster */}
                    {(job.postedBy === user?.id || user?.role === 'admin') && (
                      <button 
                        onClick={() => setViewApplicantsJobId(job.id)}
                        className="ml-2 btn ui-outline px-4 py-2 rounded-xl text-xs font-bold border-purple-200 text-purple-600 hover:bg-purple-50"
                      >
                        View Applicants ({job.applicants?.length || 0})
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-slate-600 mt-4 leading-relaxed">{job.description}</p>
                </motion.div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Events Tab */}
      {activeTab === 'events' && (
        <div className="space-y-6">
          <div className="flex justify-end">
            {(user?.role === 'admin' || currentCommunity.adminName === userProfile.name) && (
              <button 
                onClick={() => setShowCreateEventModal(true)}
                className="btn ui-btn px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-blue-200 hover:shadow-blue-300 transition-all"
              >
                <Plus size={18} /> Create Event
              </button>
            )}
          </div>

          <div className="space-y-4">
            {communityEvents.length === 0 ? (
              <div className="text-center py-10 text-slate-400">No events in this community yet.</div>
            ) : (
              communityEvents.map((event) => (
                <motion.div 
                  key={event.id}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="ui-card rounded-2xl p-5 border border-slate-100/50 hover:shadow-md transition-all flex gap-4"
                >
                  <div className="w-20 h-20 rounded-xl bg-slate-100 overflow-hidden shrink-0">
                    <img
                      src={event.image || placeholderImage}
                      alt={event.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = placeholderImage;
                      }}
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-slate-800 text-lg">{event.title}</h3>
                        <p className="text-sm text-slate-500 font-medium flex items-center gap-1 mt-1">
                          <Calendar size={14} /> {event.date} • {event.time}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">{event.location}</p>
                      </div>
                      
                      {/* Admin/Creator Actions */}
                      {(user?.role === 'admin' || (event.creatorId === user?.id)) ? (
                        <button 
                          onClick={() => {
                            cancelEvent(event.id);
                            showToast('Event cancelled.', 'info');
                          }}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Cancel Event"
                        >
                          <Trash2 size={18} />
                        </button>
                      ) : (
                        user?.role !== 'admin' && ( // Admin cannot register
                          <button 
                            onClick={() => toggleRegisterEvent(event.id)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${event.registered ? 'bg-emerald-50 text-emerald-600' : 'btn ui-btn'}`}
                          >
                            {event.registered ? 'Cancel Registration' : 'Register'}
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      )}

      <AnimatePresence>
        {showMembersModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl max-h-[80vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-slate-800">Community Members</h2>
                <button onClick={() => setShowMembersModal(false)} className="p-2 hover:bg-slate-100 rounded-full">
                  <X size={18} />
                </button>
              </div>

              {membersLoading ? (
                <p className="text-sm text-slate-500">Loading members...</p>
              ) : communityMembers.length === 0 ? (
                <p className="text-sm text-slate-500">No members found.</p>
              ) : (
                <div className="space-y-3">
                  {communityMembers.map((member) => (
                    <div key={member.userID} className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50">
                      <img src={member.avatar} alt={member.name} className="w-10 h-10 rounded-full object-cover" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-800 truncate">{member.name}</p>
                        <p className="text-xs text-slate-500 truncate">
                          {member.role}{member.isAdmin ? ' · Admin' : ''}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Post Job Modal */}
      <AnimatePresence>
        {showPostJobModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <h2 className="text-xl font-bold text-slate-800 mb-4">Post a Job</h2>
              <form onSubmit={handlePostJob} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Job Title</label>
                    <input type="text" value={newJob.title} onChange={(e) => setNewJob({...newJob, title: e.target.value})} className="w-full bg-slate-50 rounded-xl p-3 text-sm border-none focus:ring-2 focus:ring-blue-100" required />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Company</label>
                    <input type="text" value={newJob.company} onChange={(e) => setNewJob({...newJob, company: e.target.value})} className="w-full bg-slate-50 rounded-xl p-3 text-sm border-none focus:ring-2 focus:ring-blue-100" required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Location</label>
                    <input type="text" value={newJob.location} onChange={(e) => setNewJob({...newJob, location: e.target.value})} className="w-full bg-slate-50 rounded-xl p-3 text-sm border-none focus:ring-2 focus:ring-blue-100" required />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Salary Range</label>
                    <input type="text" value={newJob.salary} onChange={(e) => setNewJob({...newJob, salary: e.target.value})} className="w-full bg-slate-50 rounded-xl p-3 text-sm border-none focus:ring-2 focus:ring-blue-100" required />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Description</label>
                  <textarea value={newJob.description} onChange={(e) => setNewJob({...newJob, description: e.target.value})} className="w-full bg-slate-50 rounded-xl p-3 text-sm border-none focus:ring-2 focus:ring-blue-100 min-h-[100px]" required></textarea>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowPostJobModal(false)} className="flex-1 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-colors">Cancel</button>
                  <button type="submit" className="flex-1 btn ui-btn py-3 rounded-xl font-bold">Post Job</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Event Modal */}
      <AnimatePresence>
        {showCreateEventModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl"
            >
              <h2 className="text-xl font-bold text-slate-800 mb-4">Create Community Event</h2>
              <form onSubmit={handleCreateEvent} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Event Title</label>
                  <input type="text" value={newEvent.title} onChange={(e) => setNewEvent({...newEvent, title: e.target.value})} className="w-full bg-slate-50 rounded-xl p-3 text-sm border-none focus:ring-2 focus:ring-blue-100" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Date</label>
                    <input type="date" value={newEvent.date} onChange={(e) => setNewEvent({...newEvent, date: e.target.value})} className="w-full bg-slate-50 rounded-xl p-3 text-sm border-none focus:ring-2 focus:ring-blue-100" required />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Time</label>
                    <input type="time" value={newEvent.time} onChange={(e) => setNewEvent({...newEvent, time: e.target.value})} className="w-full bg-slate-50 rounded-xl p-3 text-sm border-none focus:ring-2 focus:ring-blue-100" required />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Location</label>
                  <input type="text" value={newEvent.location} onChange={(e) => setNewEvent({...newEvent, location: e.target.value})} className="w-full bg-slate-50 rounded-xl p-3 text-sm border-none focus:ring-2 focus:ring-blue-100" required />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowCreateEventModal(false)} className="flex-1 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-colors">Cancel</button>
                  <button type="submit" className="flex-1 btn ui-btn py-3 rounded-xl font-bold">Create Event</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
              <form onSubmit={handleApply} className="space-y-4">
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
