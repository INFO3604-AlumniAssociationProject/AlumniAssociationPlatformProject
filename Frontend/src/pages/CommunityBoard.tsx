// File: CommunityBoard.tsx

import React, { useState, useRef, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, MessageSquare, Send, ThumbsUp, MoreHorizontal, Image as ImageIcon, 
  Smile, Plus, Briefcase, Users, CheckCircle, X, Eye, Calendar, Trash2, 
  ChevronRight, Menu, MapPin
} from 'lucide-react';
import { API_BASE } from '../apiConfig';
import { getAuthToken } from '../AuthContext';
import { useToast } from '../components/Toast';
import { useAuth } from '../AuthContext';
import PDFViewer from '../components/PDFViewer';
import { useData, Job, Application, CommunityMember, Post, Comment, Community, Event } from '../DataContext';
import placeholderImage from '../assets/UWILogo.jpg';

export default function CommunityBoard() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { 
    posts, addPost, toggleLikePost, addComment,
    communities, createCommunity, joinCommunity, leaveCommunity,
    jobs, addJob, submitJobApplication, approveApplication, rejectApplication,
    fetchAndSetJobApplications,
    events, addEvent, cancelEvent, toggleRegisterEvent,
    userProfile, alumni, getCommunityMembers
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
  const [showLikers, setShowLikers] = useState<string | null>(null);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [communityMembers, setCommunityMembers] = useState<CommunityMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [communityFilter, setCommunityFilter] = useState<'all' | 'joined'>('all');

  // State for Job Posting
  const [showPostJobModal, setShowPostJobModal] = useState(false);
  const [newJob, setNewJob] = useState({ title: '', company: '', location: '', salary: '', type: 'Full-time', description: '' });

  // State for Viewing Applicants (admin only)
  const [viewApplicantsJobId, setViewApplicantsJobId] = useState<string | null>(null);
  const [viewPdfUrl, setViewPdfUrl] = useState<string | null>(null);

  // State for Event Creation
  const [showCreateEventModal, setShowCreateEventModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const [newEvent, setNewEvent] = useState<Omit<import('../DataContext').Event, 'id' | 'registered'>>({
    title: '',
    date: '',
    time: '',
    location: '',
    category: 'Community',
    image: ''
  });

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, [id]);

  const currentCommunity = id ? communities.find((c) => String(c.id) === String(id)) : null;
  const communityPosts = id ? posts.filter((p) => String(p.communityId) === String(id)) : [];
  const communityJobs = id ? jobs.filter((j) => String(j.communityId) === String(id)) : [];
  const communityEvents = id ? events.filter((e) => String(e.communityId) === String(id)) : [];
  const canDiscuss = Boolean((user?.role ?? '') === 'admin' || currentCommunity?.isMember || currentCommunity?.adminId === user?.id);
  const stripEventSeconds = (timeValue: string) => timeValue.replace(/:\d{2}(?=(?:\s*[AaPp][Mm])?$)/, '');

  const handleCreateCommunity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommunityName || !newCommunityDesc) return;
    createCommunity(newCommunityName, newCommunityDesc);
    setShowCreateModal(false);
    setNewCommunityName('');
    setNewCommunityDesc('');
    showToast('Community created! A confirmation message has been sent.', 'success');
  };

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.trim() || !canDiscuss) {
      showToast('Join this community first to post.', 'error');
      return;
    }
    const ok = await addPost(newPost, id);
    if (!ok) {
      showToast('Unable to post.', 'error');
      return;
    }
    setNewPost('');
    setIsFocused(false);
    showToast('Post shared!', 'success');
  };

  const handleComment = async (e: React.FormEvent, postId: string) => {
    e.preventDefault();
    if (!newComment.trim() || !canDiscuss) {
      showToast('Join this community to comment.', 'error');
      return;
    }
    const ok = await addComment(postId, newComment);
    if (!ok) {
      showToast('Unable to comment.', 'error');
      return;
    }
    setNewComment('');
    showToast('Comment added!', 'success');
  };

  const handlePostJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJob.title || !newJob.company || !canDiscuss) {
      showToast('Join this community to post jobs.', 'error');
      return;
    }
    const created = await addJob({ ...newJob, posted: 'Just now', communityId: id, postedBy: user?.id });
    if (!created) {
      showToast('Unable to submit job.', 'error');
      return;
    }
    setShowPostJobModal(false);
    setNewJob({ title: '', company: '', location: '', salary: '', type: 'Full-time', description: '' });
    showToast('Job submitted for approval.', 'info');
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.title || !newEvent.date || !canDiscuss) {
      showToast('Join this community to create events.', 'error');
      return;
    }
    const created = await addEvent({ ...newEvent, communityId: id, creatorId: user?.id });
    if (!created) {
      showToast('Unable to create event.', 'error');
      return;
    }
    setShowCreateEventModal(false);
    setNewEvent({ title: '', date: '', time: '', location: '', category: 'Community', image: '' });
    showToast('Event created!', 'success');
  };

  const handleJoinLeave = async () => {
    if (!id) return;
    if (currentCommunity?.isMember) {
      const ok = await leaveCommunity(String(id));
      showToast(ok ? 'Left community.' : 'Unable to leave.', ok ? 'info' : 'error');
    } else {
      const ok = await joinCommunity(String(id));
      showToast(ok ? 'Joined community!' : 'Unable to join.', ok ? 'success' : 'error');
    }
  };

  const handleMembersClick = async () => {
    if (!id) return;
    setMembersLoading(true);
    const members = await getCommunityMembers(String(id));
    const sorted = [...members].sort((a, b) => (b.isAdmin ? 1 : 0) - (a.isAdmin ? 1 : 0));
    setCommunityMembers(sorted);
    setMembersLoading(false);
    setShowMembersModal(true);
  };

  // If viewing list of communities
  if (!id) {
    return (
      <div className="space-y-4 pt-2 max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-xl font-bold text-[var(--uwi-blue-800)]">Communities</h1>
          <button onClick={() => setShowCreateModal(true)} className="btn ui-btn px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2">
            <Plus size={18} /> Create
          </button>
        </div>

        <div className="flex gap-2 mb-2">
          <button onClick={() => setCommunityFilter('all')} className={`py-2 px-3 rounded-lg text-sm font-bold ${communityFilter === 'all' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>All</button>
          <button onClick={() => setCommunityFilter('joined')} className={`py-2 px-3 rounded-lg text-sm font-bold ${communityFilter === 'joined' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>My Communities</button>
        </div>

        <div className="space-y-3">
          {(communityFilter === 'joined' ? communities.filter(c => c.isMember) : communities).map(community => (
            <Link to={`/boards/${community.id}`} key={community.id}>
              <motion.div whileHover={{ scale: 1.01 }} className="ui-card rounded-2xl p-4 flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow shrink-0">
                  {community.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-800 truncate">{community.name}</h3>
                  <p className="text-sm text-slate-500 truncate">{community.description}</p>
                  <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                    <span className="flex items-center gap-1"><Users size={12} /> {community.members}</span>
                    <span>Admin: {community.adminName}</span>
                  </div>
                </div>
                <ChevronRight size={20} className="text-slate-300" />
              </motion.div>
            </Link>
          ))}
        </div>

        {/* Create Community Modal */}
        <AnimatePresence>
          {showCreateModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" data-overlay="true">
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-white rounded-3xl p-6 w-full max-w-md">
                <h2 className="text-xl font-bold mb-4">Create Community</h2>
                <form onSubmit={handleCreateCommunity} className="space-y-4">
                  <input type="text" value={newCommunityName} onChange={(e) => setNewCommunityName(e.target.value)} placeholder="Community Name" className="w-full p-3 bg-slate-50 rounded-xl" required />
                  <textarea value={newCommunityDesc} onChange={(e) => setNewCommunityDesc(e.target.value)} placeholder="Description" className="w-full p-3 bg-slate-50 rounded-xl h-24" required />
                  <div className="flex gap-3">
                    <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 py-3 bg-slate-100 rounded-xl font-bold">Cancel</button>
                    <button type="submit" className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700">Create</button>
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
  if (!currentCommunity) return <div className="text-center py-10">Community not found</div>;

  return (
    <div className="space-y-4 pt-2 max-w-2xl mx-auto">
      {/* Header */}
      <div className="ui-card rounded-2xl p-5 bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
        <Link to="/boards" className="inline-flex items-center gap-2 text-blue-100 hover:text-white mb-3 text-sm">
          <ArrowLeft size={16} /> Back
        </Link>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold">{currentCommunity.name}</h1>
            <p className="text-blue-100 text-sm mt-1">{currentCommunity.description}</p>
          </div>
          <button 
            onClick={handleJoinLeave} 
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
              currentCommunity.isMember 
                ? 'bg-white/20 text-white hover:bg-white/30' 
                : 'bg-white text-blue-600 hover:bg-blue-50'
            }`}
          >
            {currentCommunity.isMember ? 'Leave' : 'Join'}
          </button>
        </div>
        <div className="flex items-center gap-3 mt-4">
          <button onClick={handleMembersClick} className="flex items-center gap-1 bg-white/20 px-3 py-1.5 rounded-xl text-xs hover:bg-white/30">
            <Users size={14} /> {currentCommunity.members} Members
          </button>
          <span className="bg-white/20 px-3 py-1.5 rounded-xl text-xs">Admin: {currentCommunity.adminName}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
        {['discussions', 'jobs', 'events'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab as any)} className={`flex-1 py-2.5 rounded-lg text-sm font-bold capitalize ${activeTab === tab ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>
            {tab}
          </button>
        ))}
      </div>

      {/* Discussions Tab */}
      {activeTab === 'discussions' && (
        <div className="space-y-4">
          {!canDiscuss ? (
            <div className="bg-orange-50 text-orange-700 p-4 rounded-xl text-sm">Join this community to view and participate in discussions.</div>
          ) : (
            <>
              {/* Post Input */}
              <div className="ui-card rounded-2xl p-4">
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold shrink-0">{user?.name?.charAt(0)}</div>
                  <form onSubmit={handlePost} className="flex-1">
                    <textarea value={newPost} onChange={(e) => setNewPost(e.target.value)} onFocus={() => setIsFocused(true)} onBlur={() => !newPost && setIsFocused(false)} placeholder="Share something..." className="w-full bg-slate-50 rounded-xl p-3 text-sm min-h-[80px] resize-none" />
                    <AnimatePresence>
                      {isFocused && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="flex justify-end mt-3">
                          <button type="submit" disabled={!newPost.trim()} className="btn ui-btn px-5 py-2 rounded-xl text-sm font-bold">Post</button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </form>
                </div>
              </div>

              {/* Posts Feed */}
              <div className="space-y-4">
                {isLoading ? (
                  Array.from({ length: 2 }).map((_, i) => <div key={i} className="ui-card rounded-2xl p-5 animate-pulse"><div className="h-4 bg-slate-200 rounded w-3/4 mb-3" /><div className="h-20 bg-slate-200 rounded" /></div>)
                ) : communityPosts.length === 0 ? (
                  <p className="text-center text-slate-400 py-8">No posts yet.</p>
                ) : (
                  communityPosts.map(post => (
                    <motion.div key={post.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="ui-card rounded-2xl p-5">
                      <div className="flex items-start gap-3 mb-3">
                        <img src={post.avatar} className="w-10 h-10 rounded-full" />
                        <div className="flex-1">
                          <h4 className="font-bold text-sm">{post.author}</h4>
                          <span className="text-xs text-slate-400">{post.time}</span>
                        </div>
                      </div>
                      <p className="text-sm text-slate-700 mb-4">{post.content}</p>
                      <div className="flex items-center gap-4 border-t border-slate-100 pt-3">
                        <button 
                          onClick={() => toggleLikePost(post.id)} 
                          className={`flex items-center gap-1 text-xs font-bold transition-colors px-3 py-1.5 rounded-lg ${
                            post.liked 
                              ? 'text-blue-600 bg-blue-50' 
                              : 'text-slate-500 hover:text-blue-600 hover:bg-blue-50'
                          }`}
                        >
                          <ThumbsUp size={16} className={post.liked ? 'fill-blue-600' : ''} /> {post.likes}
                        </button>
                        <button onClick={() => setShowLikers(post.id)} className="text-xs font-bold text-slate-500 hover:text-slate-700">View Likers</button>
                        <button 
                          onClick={() => setActiveCommentPostId(activeCommentPostId === post.id ? null : post.id)} 
                          className="text-xs font-bold text-slate-500 hover:text-slate-700 flex items-center gap-1"
                        >
                          <MessageSquare size={16} /> {post.commentsCount}
                        </button>
                      </div>

                      {/* Comments */}
                      <AnimatePresence>
                        {activeCommentPostId === post.id && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-4 pt-4 border-t border-slate-100">
                            <div className="space-y-3 mb-3">
                              {post.comments.map(comment => (
                                <div key={comment.id} className="flex gap-3">
                                  <img src={comment.avatar} className="w-8 h-8 rounded-full" />
                                  <div className="bg-slate-50 p-3 rounded-xl flex-1">
                                    <div className="flex justify-between mb-1">
                                      <span className="text-xs font-bold">{comment.author}</span>
                                      <span className="text-[10px] text-slate-400">{comment.time}</span>
                                    </div>
                                    <p className="text-xs">{comment.content}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                            <form onSubmit={(e) => handleComment(e, post.id)} className="flex gap-2">
                              <input type="text" value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Write a comment..." className="flex-1 bg-slate-50 rounded-xl px-3 py-2 text-xs" />
                              <button type="submit" disabled={!newComment.trim()} className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50">
                                <Send size={14} />
                              </button>
                            </form>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Jobs Tab */}
      {activeTab === 'jobs' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setShowPostJobModal(true)} className="btn ui-btn px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2">
              <Briefcase size={18} /> Post Job
            </button>
          </div>
          <div className="space-y-3">
            {communityJobs.length === 0 ? (
              <p className="text-center text-slate-400 py-8">No jobs posted.</p>
            ) : (
              communityJobs.map(job => (
                <motion.div key={job.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="ui-card rounded-2xl p-4 relative">
                  {job.status === 'approved' && (
                    <div className="absolute top-3 right-3">
                      <CheckCircle size={20} className="text-emerald-500 fill-emerald-50" />
                    </div>
                  )}
                  <div className="pr-8">
                    <h3 className="font-bold text-slate-800">{job.title}</h3>
                    <p className="text-sm text-slate-500">{job.company} • {job.location}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="text-xs bg-slate-50 px-2 py-1 rounded-lg">{job.salary}</span>
                      <span className="text-xs bg-slate-50 px-2 py-1 rounded-lg">{job.type}</span>
                      {job.status === 'pending' && <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-lg">Pending</span>}
                    </div>
                    {/* Only admin can view applicants */}
                    {user?.role === 'admin' && (
                      <button onClick={async () => { await fetchAndSetJobApplications?.(job.id); setViewApplicantsJobId(job.id); }} className="mt-2 text-xs text-purple-600 hover:text-purple-800 flex items-center gap-1">
                        <Eye size={12} /> Applicants ({job.applicants?.length || 0})
                      </button>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Events Tab */}
      {activeTab === 'events' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setShowCreateEventModal(true)} className="btn ui-btn px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2">
              <Plus size={18} /> Create Event
            </button>
          </div>
          <div className="space-y-3">
            {communityEvents.length === 0 ? (
              <p className="text-center text-slate-400 py-8">No events yet.</p>
            ) : (
              communityEvents.map(event => (
                <motion.div key={event.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="ui-card rounded-2xl p-4 flex gap-3">
                  <div className="w-16 h-16 rounded-xl bg-slate-100 overflow-hidden shrink-0">
                    <img src={event.image || placeholderImage} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-800">{event.title}</h3>
                    <p className="text-xs text-slate-500"><Calendar size={12} className="inline mr-1" />{event.date} • {stripEventSeconds(event.time)}</p>
                    <p className="text-xs text-slate-500"><MapPin size={12} className="inline mr-1" />{event.location}</p>
                    <button onClick={() => navigate(`/events/${event.id}`)} className="text-xs text-blue-600 hover:underline mt-1">View Details</button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Likers Modal */}
      <AnimatePresence>
        {showLikers && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" data-overlay="true">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-white rounded-3xl p-5 w-full max-w-xs max-h-80 overflow-y-auto">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-slate-800">Liked by</h3>
                <button onClick={() => setShowLikers(null)} className="p-1"><X size={18} /></button>
              </div>
              <div className="space-y-2">
                {(posts.find(p => p.id === showLikers)?.likedBy || []).map(userId => {
                  const liker = alumni.find(p => p.id === userId);
                  return (
                    <div key={userId} className="flex items-center gap-3 p-2 rounded-lg bg-slate-50">
                      <img src={liker?.avatar || `https://ui-avatars.com/api/?name=User`} className="w-8 h-8 rounded-full" />
                      <div>
                        <p className="text-sm font-bold">{liker?.name || userId}</p>
                        <p className="text-xs text-slate-500">{liker?.role || 'Alumni'}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Members Modal */}
      <AnimatePresence>
        {showMembersModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" data-overlay="true">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-white rounded-3xl p-5 w-full max-w-md max-h-96 overflow-y-auto">
              <div className="flex items-center gap-2 mb-4">
                <button onClick={() => setShowMembersModal(false)} className="p-2"><ArrowLeft size={20} /></button>
                <h2 className="text-lg font-bold">Members</h2>
              </div>
              {membersLoading ? <p>Loading...</p> : communityMembers.map(m => (
                <div key={m.userID} className={`flex items-center gap-3 p-2 ${m.isAdmin ? 'bg-blue-50 rounded-xl' : ''}`}>
                  <img src={m.avatar} className="w-10 h-10 rounded-full" />
                  <div>
                    <p className="text-sm font-bold">{m.name} {m.isAdmin && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full ml-2">Admin</span>}</p>
                    <p className="text-xs text-slate-500">{m.role}</p>
                  </div>
                </div>
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Post Job Modal */}
      <AnimatePresence>
        {showPostJobModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" data-overlay="true">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-white rounded-3xl p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Post a Job</h2>
              <form onSubmit={handlePostJob} className="space-y-3">
                <input type="text" value={newJob.title} onChange={(e) => setNewJob({...newJob, title: e.target.value})} placeholder="Job Title" className="w-full p-3 bg-slate-50 rounded-xl" required />
                <input type="text" value={newJob.company} onChange={(e) => setNewJob({...newJob, company: e.target.value})} placeholder="Company" className="w-full p-3 bg-slate-50 rounded-xl" required />
                <input type="text" value={newJob.location} onChange={(e) => setNewJob({...newJob, location: e.target.value})} placeholder="Location" className="w-full p-3 bg-slate-50 rounded-xl" />
                <input type="text" value={newJob.salary} onChange={(e) => setNewJob({...newJob, salary: e.target.value})} placeholder="Salary Range" className="w-full p-3 bg-slate-50 rounded-xl" />
                <textarea value={newJob.description} onChange={(e) => setNewJob({...newJob, description: e.target.value})} placeholder="Description" className="w-full p-3 bg-slate-50 rounded-xl h-24" required />
                <div className="flex gap-3">
                  <button type="button" onClick={() => setShowPostJobModal(false)} className="flex-1 py-3 bg-slate-100 rounded-xl font-bold">Cancel</button>
                  <button type="submit" className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700">Post</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Event Modal */}
      <AnimatePresence>
        {showCreateEventModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" data-overlay="true">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-white rounded-3xl p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Create Event</h2>
              <form onSubmit={handleCreateEvent} className="space-y-3">
                <input type="text" value={newEvent.title} onChange={(e) => setNewEvent({...newEvent, title: e.target.value})} placeholder="Event Title" className="w-full p-3 bg-slate-50 rounded-xl" required />
                <input type="text" value={newEvent.date} onChange={(e) => setNewEvent({...newEvent, date: e.target.value})} placeholder="Date (e.g. Mar 15, 2026)" className="w-full p-3 bg-slate-50 rounded-xl" required />
                <input type="text" value={newEvent.time} onChange={(e) => setNewEvent({...newEvent, time: e.target.value})} placeholder="Time (e.g. 6:00 PM)" className="w-full p-3 bg-slate-50 rounded-xl" required />
                <input type="text" value={newEvent.location} onChange={(e) => setNewEvent({...newEvent, location: e.target.value})} placeholder="Location" className="w-full p-3 bg-slate-50 rounded-xl" required />
                <div className="flex gap-3">
                  <button type="button" onClick={() => setShowCreateEventModal(false)} className="flex-1 py-3 bg-slate-100 rounded-xl font-bold">Cancel</button>
                  <button type="submit" className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700">Create</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* View Applicants Modal (Admin only) */}
      <AnimatePresence>
        {viewApplicantsJobId && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" data-overlay="true">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-white rounded-3xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center gap-2 mb-4">
                <button onClick={() => setViewApplicantsJobId(null)} className="p-2"><ArrowLeft size={20} /></button>
                <h2 className="text-xl font-bold">Applicants</h2>
              </div>
              {jobs.find(j => j.id === viewApplicantsJobId)?.applicants?.length === 0 ? (
                <p className="text-center py-8 text-slate-400">No applicants yet.</p>
              ) : (
                jobs.find(j => j.id === viewApplicantsJobId)?.applicants?.map(app => (
                  <div key={app.id} className="p-4 rounded-xl border border-slate-100 mb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold">{app.applicantName}</h3>
                        <p className="text-xs text-slate-400">{app.date}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setViewPdfUrl(app.resumeUrl)} className="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-100">View Resume</button>
                        {app.status === 'pending' && (
                          <>
                            <button onClick={() => { approveApplication(viewApplicantsJobId, app.applicantId); showToast('Approved!', 'success'); }} className="text-xs bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-lg hover:bg-emerald-100">Approve</button>
                            <button onClick={() => { rejectApplication(viewApplicantsJobId, app.applicantId); showToast('Rejected', 'info'); }} className="text-xs bg-red-50 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-100">Reject</button>
                          </>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 mt-2 bg-slate-50 p-3 rounded-lg">{app.coverLetter}</p>
                  </div>
                ))
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PDF Viewer */}
      <AnimatePresence>
        {viewPdfUrl && <PDFViewer pdfUrl={viewPdfUrl} onClose={() => setViewPdfUrl(null)} />}
      </AnimatePresence>
    </div>
  );
}