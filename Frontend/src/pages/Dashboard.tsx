// File: Dashboard.tsx

import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import { useData, Post, Comment } from '../DataContext';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, Briefcase, MessageSquare, Users, Send, ThumbsUp, MoreHorizontal, X } from 'lucide-react';
import { useToast } from '../components/Toast';

export default function Dashboard() {
  const { user } = useAuth();
  const { stats, events, jobs, alumni, posts, toggleLikePost, addComment } = useData();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  // Feed state
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [showLikers, setShowLikers] = useState<string | null>(null);
  const stripEventSeconds = (timeValue: string) => timeValue.replace(/:\d{2}(?=(?:\s*[AaPp][Mm])?$)/, '');

  // Simulate loading
  React.useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const handleComment = async (e: React.FormEvent, postId: string) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    
    const ok = await addComment(postId, newComment);
    if (ok) {
      setNewComment('');
      showToast('Comment added!', 'success');
    } else {
      showToast('Failed to add comment.', 'error');
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
    <div className="space-y-6 pt-2 max-w-2xl mx-auto pb-10">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="ui-card rounded-3xl p-6 relative overflow-hidden shadow-sm border border-slate-100/50 bg-white/80 backdrop-blur-xl"
      >
        <div className="flex justify-between items-start relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-blue-50 border-2 border-white shadow-sm overflow-hidden">
              <img src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.name}&background=random`} alt={user?.name} className="w-full h-full object-cover" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">{user?.role}</p>
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Hello, {user?.name}</h1>
              <p className="text-sm text-slate-500 mt-1 font-medium">{user?.email}</p>
            </div>
          </div>
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

      {/* Feed Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Recent Activity</h2>
        </div>

        {/* Posts List */}
        <div className="space-y-4">
          {isLoading ? (
            Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="ui-card rounded-3xl p-5 border border-slate-100/50 bg-white animate-pulse">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-slate-200"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-slate-200 rounded w-32"></div>
                    <div className="h-3 bg-slate-200 rounded w-16"></div>
                  </div>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="h-4 bg-slate-200 rounded w-full"></div>
                  <div className="h-4 bg-slate-200 rounded w-5/6"></div>
                </div>
              </div>
            ))
          ) : posts.length === 0 ? (
            <div className="text-center py-10 text-slate-400 bg-white rounded-3xl border border-slate-100">
              No posts yet.
            </div>
          ) : (
            posts.slice(0, 5).map((post: Post) => (
              <motion.div 
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="ui-card rounded-3xl p-5 shadow-sm border border-slate-100/50 bg-white cursor-pointer"
                onClick={() => navigate(`/boards/${post.communityId}`)}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-50 overflow-hidden border border-slate-100">
                      <img src={post.avatar} alt={post.author} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm leading-tight">{post.author}</h4>
                      <span className="text-[10px] text-slate-400 font-medium">{post.time}</span>
                    </div>
                  </div>
                  <button className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-50 transition-colors" onClick={(e) => e.stopPropagation()}>
                    <MoreHorizontal size={16} />
                  </button>
                </div>
                
                <p className="text-sm text-slate-700 mb-4 whitespace-pre-line leading-relaxed">{post.content}</p>
                
                <div className="flex items-center gap-4 pt-3 border-t border-slate-100">
                  <button 
                    onClick={(e) => { e.stopPropagation(); toggleLikePost(post.id); }}
                    className={`flex items-center gap-1.5 text-xs font-bold transition-colors px-3 py-1.5 rounded-lg ${post.liked ? 'text-blue-600 bg-blue-50' : 'text-slate-500 hover:bg-slate-50'}`}
                  >
                    <ThumbsUp size={16} className={post.liked ? 'fill-blue-600' : ''} /> 
                    Like
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowLikers(post.id); }}
                    className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:bg-slate-50 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    {post.likes} likes
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setActiveCommentPostId(activeCommentPostId === post.id ? null : post.id); }}
                    className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:bg-slate-50 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <MessageSquare size={16} /> 
                    {post.commentsCount}
                  </button>
                </div>

                <AnimatePresence>
                  {activeCommentPostId === post.id && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 pt-4 border-t border-slate-100 overflow-hidden"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="space-y-3 mb-4">
                        {post.comments.map((comment: Comment) => (
                          <div key={comment.id} className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-100 overflow-hidden flex-shrink-0 border border-slate-200">
                              <img src={comment.avatar} alt={comment.author} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 bg-slate-50 rounded-2xl p-3 border border-slate-100">
                              <div className="flex justify-between items-start mb-1">
                                <h5 className="font-bold text-slate-800 text-xs">{comment.author}</h5>
                                <span className="text-[10px] text-slate-400">{comment.time}</span>
                              </div>
                              <p className="text-xs text-slate-600 leading-relaxed">{comment.content}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <form onSubmit={(e) => handleComment(e, post.id)} className="flex gap-2">
                        <div className="flex-1 relative">
                          <input 
                            type="text" 
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Write a comment..." 
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-3 pr-10 py-2 text-xs focus:ring-2 focus:ring-blue-100 transition-all"
                          />
                          <button 
                            type="submit"
                            disabled={!newComment.trim()}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed p-1 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Send size={14} />
                          </button>
                        </div>
                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))
          )}
        </div>
      </div>

      <AnimatePresence>
        {showLikers && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            data-overlay="true"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-slate-800 modal-title">Liked by</h2>
                <button onClick={() => setShowLikers(null)} className="p-2 hover:bg-slate-100 rounded-full">
                  <X size={18} />
                </button>
              </div>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {(posts.find((post) => post.id === showLikers)?.likedBy || []).length === 0 ? (
                  <p className="text-sm text-slate-500">No likes yet.</p>
                ) : (
                  (posts.find((post) => post.id === showLikers)?.likedBy || []).map((userId) => {
                    const liker = alumni.find((person) => person.id === userId);
                    return (
                      <div key={userId} className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50">
                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                          {(liker?.name || userId).charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800">{liker?.name || userId}</p>
                          <p className="text-xs text-slate-500">{liker?.role || 'Alumni'}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
            {isLoading ? (
              Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="flex items-start gap-3 p-3 -mx-3 rounded-2xl animate-pulse">
                  <div className="w-14 h-14 rounded-2xl bg-slate-200 shrink-0"></div>
                  <div className="flex-1 min-w-0 space-y-2 py-1">
                    <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                    <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))
            ) : upcomingEvents.length === 0 ? (
              <div className="text-center py-4 text-slate-400 text-sm">No upcoming events.</div>
            ) : (
              upcomingEvents.map((event) => (
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
                      <p className="text-xs text-slate-500 mt-1 font-medium truncate">{stripEventSeconds(event.time)} • {event.location}</p>
                    </div>
                  </motion.div>
                </Link>
              ))
            )}
          </div>
        </motion.div>
      </div>

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
          {isLoading ? (
            Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="block p-4 rounded-2xl border border-slate-100 bg-slate-50/50 mb-3 last:mb-0 animate-pulse">
                <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-slate-200 rounded w-1/2 mb-3"></div>
                <div className="flex items-center justify-between mt-3">
                  <div className="h-5 bg-slate-200 rounded w-16"></div>
                  <div className="h-3 bg-slate-200 rounded w-12"></div>
                </div>
              </div>
            ))
          ) : latestJobs.length === 0 ? (
            <div className="text-center py-4 text-slate-400 text-sm">No recent jobs.</div>
          ) : (
            latestJobs.map((job) => (
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
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
}