// File: Messages.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../AuthContext';
import { useData } from '../DataContext';
import { motion } from 'motion/react';
import { MessageSquare, Search, Send, User, Check, X, Plus, MoreVertical, Trash2, Flag, Ban, BellOff, CheckCheck, ArrowLeft, ShieldAlert } from 'lucide-react';
import { useToast } from '../components/Toast';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { API_BASE } from '../apiConfig';
import { getAuthToken } from '../AuthContext';

export default function Messages() {
  const { user } = useAuth();
  const { messages, messageRequests, acceptMessageRequest, rejectMessageRequest, sendMessage, loading, alumni, reportUser } = useData();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'inbox' | 'requests'>('inbox');
  const navigate = useNavigate();
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [chatMessage, setChatMessage] = useState('');
  const [newMessageBody, setNewMessageBody] = useState('');
  const [showNewMessageModal, setShowNewMessageModal] = useState(false);
  const [newRecipient, setNewRecipient] = useState('');
  const [searchParams] = useSearchParams();
  
  // New state for chat features
  const [showChatActions, setShowChatActions] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState<{type: 'block' | 'delete', chat: string} | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [reportOtherText, setReportOtherText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [mutedChats, setMutedChats] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reportTargetId, setReportTargetId] = useState<string | null>(null);
  const [reportTargetName, setReportTargetName] = useState<string>('');

  // Simulate loading
  React.useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  // Close chat actions when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setShowChatActions(false);
    if (showChatActions) {
      document.addEventListener('click', handleClickOutside);
    }
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showChatActions]);

  // Open new message modal when query params are present
  useEffect(() => {
    const newParam = searchParams.get('new');
    const bodyParam = searchParams.get('body');
    if (newParam || bodyParam) {
      if (newParam) {
        const recipient = alumni.find((person) => person.id === newParam);
        setNewRecipient(recipient ? recipient.name : newParam);
      }
      if (bodyParam) setNewMessageBody(bodyParam);
      setShowNewMessageModal(true);
      navigate('/messages', { replace: true });
    }
  }, [searchParams, alumni, navigate]);

  const getChatPartnerId = (message: (typeof messages)[number]) =>
    message.senderId === user?.id ? message.receiverId : message.senderId;

  const resolveRecipientId = (value: string) => {
    const query = value.trim().toLowerCase();
    if (!query) return '';
    const exactMatch = alumni.find(
      (person) =>
        person.id.toLowerCase() === query ||
        person.name.toLowerCase() === query,
    );
    if (exactMatch) return exactMatch.id;

    const partialMatch = alumni.find((person) => person.name.toLowerCase().includes(query));
    return partialMatch?.id || '';
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim() || !selectedChat) return;
    
    await sendMessage(selectedChat, chatMessage);
    setChatMessage('');
  };

  const handleNewChat = async (e: React.FormEvent) => {
    e.preventDefault();
    const recipientId = resolveRecipientId(newRecipient);
    if (!recipientId || !newMessageBody.trim()) {
      showToast('Please fill in all fields', 'error');
      return;
    }
    
    await sendMessage(recipientId, newMessageBody);
    setSelectedChat(recipientId);
    showToast('Message sent successfully', 'success');
    setShowNewMessageModal(false);
    setNewRecipient('');
    setNewMessageBody('');
  };

  // Group messages by conversation partner to ensure unique chats
  const conversations = useMemo(() => {
    const map = new Map<string, typeof messages[number]>();
    messages.forEach(msg => {
      const partnerId = getChatPartnerId(msg);
      if (!map.has(partnerId)) {
        map.set(partnerId, msg);
      }
    });
    return Array.from(map.values());
  }, [messages, user?.id]);

  const activeChat = messages.find((message) => getChatPartnerId(message) === selectedChat);
  const conversationMessages = selectedChat
    ? messages
        .filter(
          (m) =>
            (m.senderId === selectedChat && m.receiverId === user?.id) ||
            (m.senderId === user?.id && m.receiverId === selectedChat),
        )
        .sort((a, b) => new Date(a.rawTimestamp || a.time).getTime() - new Date(b.rawTimestamp || b.time).getTime())
    : [];

  const openReportModal = (userId: string, userName: string) => {
    setReportTargetId(userId);
    setReportTargetName(userName);
    setReportReason('');
    setReportOtherText('');
    setShowReportModal(true);
  };

  const submitReport = async () => {
    if (!reportReason) {
      showToast('Please select a reason', 'error');
      return;
    }
    if (reportReason === 'Other' && !reportOtherText.trim()) {
      showToast('Please provide details', 'error');
      return;
    }

    if (reportTargetId && reportTargetName) {
      await reportUser(reportTargetId, reportTargetName, reportReason, reportOtherText);
      showToast('Report submitted to admin', 'success');
      setShowReportModal(false);
      setShowChatActions(false);
    } else {
      showToast('Unable to report user', 'error');
    }
  };

  // Check if message is from system/admin
  const isSystemMessage = (msg: typeof messages[0]) => {
    return msg.sender === 'UWI Admin' || msg.sender === 'System' || msg.content.startsWith('📢 Announcement:') || msg.content.startsWith('🚨 User Report');
  };

  // Count pending message requests (incoming connection requests)
  const pendingRequestsCount = messageRequests.length;

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col pt-2">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold text-[var(--uwi-blue-800)]">Messages</h1>
        <button 
          onClick={() => setShowNewMessageModal(true)}
          className="p-2 bg-blue-50 text-blue-600 rounded-full hover:bg-[#0ea5e9] hover:text-white transition-colors"
        >
          <Plus size={20} />
        </button>
      </div>

      <div className="ui-tab-strip bg-[var(--uwi-soft)] p-1 rounded-xl mb-4 shrink-0">
        <button 
          onClick={() => setActiveTab('inbox')}
          className={`ui-tab-pill ${activeTab === 'inbox' ? 'tab-active' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Inbox
        </button>
        <button 
          onClick={() => setActiveTab('requests')}
          className={`ui-tab-pill ${activeTab === 'requests' ? 'tab-active' : 'text-slate-500 hover:text-slate-700'} relative`}
        >
          Requests
          {pendingRequestsCount > 0 && (
            <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[20px] h-5 bg-red-500 text-white text-[10px] font-bold rounded-full px-1">
              {pendingRequestsCount}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'inbox' ? (
        selectedChat ? (
          <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-100">
            {/* Chat Header */}
            <div className="p-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50 relative">
              <button 
                onClick={() => setSelectedChat(null)} 
                className="p-2 hover:bg-slate-100 rounded-full text-slate-600"
                aria-label="Back to conversations"
              >
                <ArrowLeft size={20} />
              </button>
              <div className="relative">
                <img src={activeChat?.avatar} alt={activeChat?.sender} className="w-10 h-10 rounded-full object-cover" />
                {activeChat?.online && <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"></div>}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-800">{activeChat?.sender}</h3>
                <p className="text-xs text-slate-500">{activeChat?.online ? 'Online' : 'Offline'}</p>
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowChatActions(!showChatActions);
                }} 
                className="p-2 text-slate-500 hover:bg-slate-100 rounded-full"
              >
                <MoreVertical size={20} />
              </button>

              {/* Chat Actions Dropdown */}
              {showChatActions && (
                <div 
                  className="absolute top-14 right-4 bg-white rounded-xl shadow-lg border border-slate-100 w-48 overflow-hidden z-10"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button 
                    onClick={() => {
                      const isMuted = mutedChats.includes(selectedChat);
                      if (isMuted) {
                        setMutedChats(mutedChats.filter(id => id !== selectedChat));
                        showToast('Chat unmuted', 'success');
                      } else {
                        setMutedChats([...mutedChats, selectedChat]);
                        showToast('Chat muted', 'success');
                      }
                      setShowChatActions(false);
                    }}
                    className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-slate-100 flex items-center gap-2"
                  >
                    <BellOff size={16} /> {mutedChats.includes(selectedChat) ? 'Unmute chat' : 'Mute chat'}
                  </button>
                  <button 
                    onClick={() => {
                      openReportModal(selectedChat, activeChat?.sender || '');
                      setShowChatActions(false);
                    }}
                    className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-slate-100 flex items-center gap-2"
                  >
                    <Flag size={16} /> Report user
                  </button>
                  <button 
                    onClick={() => {
                      setShowConfirmModal({ type: 'block', chat: selectedChat });
                      setShowChatActions(false);
                    }}
                    className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-500 hover:text-white flex items-center gap-2"
                  >
                    <Ban size={16} /> Block user
                  </button>
                  <button 
                    onClick={() => {
                      setShowConfirmModal({ type: 'delete', chat: selectedChat });
                      setShowChatActions(false);
                    }}
                    className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-500 hover:text-white flex items-center gap-2 border-t border-slate-100"
                  >
                    <Trash2 size={16} /> Delete chat
                  </button>
                </div>
              )}
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/30">
              {conversationMessages.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-6">No messages yet.</p>
              ) : (
                conversationMessages.map((msg) => {
                  const isMine = msg.senderId === user?.id;
                  const systemMsg = isSystemMessage(msg);
                  return (
                    <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`p-3 rounded-2xl max-w-[80%] shadow-sm ${
                          isMine
                            ? 'bg-blue-600 text-white rounded-br-none'
                            : systemMsg
                              ? 'bg-amber-50 border-2 border-amber-200 text-slate-800 rounded-tl-none'
                              : 'bg-white border border-slate-100 rounded-tl-none text-slate-800'
                        }`}
                      >
                        {systemMsg && !isMine && (
                          <div className="flex items-center gap-1 mb-1 text-amber-600">
                            <ShieldAlert size={12} />
                            <span className="text-[10px] font-bold uppercase">System</span>
                          </div>
                        )}
                        <p className="text-sm leading-relaxed">{msg.content}</p>
                        <div className={`flex items-center gap-2 mt-2 ${isMine ? 'justify-end text-blue-100' : 'text-slate-400'}`}>
                          <span className="text-[10px] uppercase font-bold">{isMine ? 'You' : activeChat?.sender}</span>
                          <span className="text-[10px]">
                            {msg.rawTimestamp ? new Date(msg.rawTimestamp).toLocaleTimeString() : msg.time}
                          </span>
                          {isMine && msg.status === 'read' && <CheckCheck size={12} />}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Input Area */}
            <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-100 bg-white">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={chatMessage}
                  onChange={(e) => {
                    setChatMessage(e.target.value);
                    if (e.target.value.length > 5 && !isTyping && Math.random() > 0.7) {
                      setIsTyping(true);
                      setTimeout(() => setIsTyping(false), 3000);
                    }
                  }}
                  placeholder="Type a message..." 
                  className="flex-1 bg-slate-50 border-none rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-100 outline-none"
                />
                <button 
                  type="submit"
                  disabled={!chatMessage.trim() || loading?.sendingMessage}
                  className="p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={18} />
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-2">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="p-4 rounded-2xl border border-transparent animate-pulse">
                  <div className="flex gap-3">
                    <div className="w-12 h-12 rounded-full bg-slate-200 shrink-0"></div>
                    <div className="flex-1 min-w-0 space-y-2 py-1">
                      <div className="flex justify-between items-start">
                        <div className="h-4 bg-slate-200 rounded w-1/3"></div>
                        <div className="h-3 bg-slate-200 rounded w-8"></div>
                      </div>
                      <div className="h-3 bg-slate-200 rounded w-2/3"></div>
                    </div>
                  </div>
                </div>
              ))
            ) : conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <MessageSquare size={48} className="mb-2 opacity-20" />
                <p>No messages yet</p>
              </div>
            ) : (
              conversations.map((msg) => {
                const systemMsg = isSystemMessage(msg);
                return (
                  <motion.div 
                    key={msg.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => setSelectedChat(getChatPartnerId(msg))}
                    className={`p-4 rounded-2xl cursor-pointer transition-all border ${
                      msg.unread 
                        ? 'bg-white border-blue-100 shadow-sm' 
                        : systemMsg 
                          ? 'bg-amber-50 border-amber-200' 
                          : 'bg-transparent border-transparent hover:bg-white hover:shadow-sm'
                    }`}
                  >
                    <div className="flex gap-3">
                      <div className="relative">
                        <img src={msg.avatar} alt={msg.sender} className="w-12 h-12 rounded-full object-cover" />
                        {msg.online && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                          <div className="flex items-center gap-2">
                            <h3 className={`text-sm truncate ${msg.unread ? 'font-bold text-slate-800' : 'font-medium text-slate-700'}`}>
                              {msg.sender}
                            </h3>
                            {systemMsg && <ShieldAlert size={12} className="text-amber-600" />}
                          </div>
                          <span className="text-[10px] text-slate-400 whitespace-nowrap ml-2">{msg.time}</span>
                        </div>
                        <p className={`text-xs truncate ${msg.unread ? 'font-medium text-slate-600' : 'text-slate-500'}`}>
                          {msg.preview}
                        </p>
                      </div>
                      {msg.unread && (
                        <div className="w-2.5 h-2.5 bg-blue-600 rounded-full self-center ml-2"></div>
                      )}
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        )
      ) : (
        <div className="flex-1 overflow-y-auto space-y-3">
          {messageRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <User size={48} className="mb-2 opacity-20" />
              <p>No pending requests</p>
            </div>
          ) : (
            messageRequests.map((req) => (
              <motion.div 
                key={req.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="ui-card rounded-2xl p-4"
              >
                <div className="flex items-center gap-3 mb-3">
                  <img src={req.avatar} alt={req.name} className="w-10 h-10 rounded-full object-cover" />
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">{req.name}</h3>
                    <p className="text-xs text-slate-500">{req.role}</p>
                  </div>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl mb-3">
                  <p className="text-xs text-slate-600 italic">"{req.message}"</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => acceptMessageRequest(req.id)}
                    className="flex-1 py-2 bg-blue-600 text-white rounded-xl text-xs font-medium flex items-center justify-center gap-1 hover:bg-blue-700 transition-colors"
                  >
                    <Check size={14} /> Accept
                  </button>
                  <button 
                    onClick={() => rejectMessageRequest(req.id)}
                    className="flex-1 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-medium flex items-center justify-center gap-1 hover:bg-red-500 hover:text-white transition-colors"
                  >
                    <X size={14} /> Decline
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}

      {/* New Message Modal */}
      {showNewMessageModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" data-overlay="true">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-xl"
          >
            <div className="p-4 border-b border-slate-100 flex justify-between items-center">
              <h2 className="font-bold text-lg text-slate-800">New Message</h2>
              <button onClick={() => setShowNewMessageModal(false)} className="p-1 hover:bg-slate-100 rounded-full">
                <X size={20} className="text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleNewChat} className="p-4 space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-500 ml-1">To:</label>
                <input 
                  type="text" 
                  value={newRecipient}
                  onChange={(e) => setNewRecipient(e.target.value)}
                  list="alumni-options"
                  className="w-full p-2.5 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-blue-100 text-sm"
                  placeholder="Search for alumni..."
                />
                <datalist id="alumni-options">
                  {alumni.map((person) => (
                    <option key={person.id} value={person.name} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 ml-1">Message:</label>
                <textarea 
                  value={newMessageBody}
                  onChange={(e) => setNewMessageBody(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-blue-100 text-sm h-32 resize-none"
                  placeholder="Type your message..."
                />
              </div>
              <button type="submit" disabled={!newRecipient.trim() || !newMessageBody.trim()} className="btn ui-btn w-full py-3 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed">
                Send Message
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" data-overlay="true">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-xl"
          >
            <div className="p-4 border-b border-slate-100 flex justify-between items-center">
              <h2 className="font-bold text-lg text-slate-800">Report User</h2>
              <button onClick={() => setShowReportModal(false)} className="p-1 hover:bg-slate-100 rounded-full">
                <X size={20} className="text-slate-500" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <p className="text-sm text-slate-600">Why are you reporting {reportTargetName}?</p>
              
              <div className="space-y-2">
                {['Spam', 'Harassment', 'Inappropriate content', 'Other'].map((reason) => (
                  <label key={reason} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer">
                    <input 
                      type="radio" 
                      name="reportReason" 
                      value={reason}
                      checked={reportReason === reason}
                      onChange={(e) => setReportReason(e.target.value)}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-700">{reason}</span>
                  </label>
                ))}
              </div>

              {reportReason === 'Other' && (
                <textarea 
                  value={reportOtherText}
                  onChange={(e) => setReportOtherText(e.target.value)}
                  placeholder="Please provide more details..."
                  className="w-full p-3 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-blue-100 text-sm h-24 resize-none"
                />
              )}

              <div className="flex gap-2 pt-2">
                <button 
                  onClick={() => setShowReportModal(false)}
                  className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={submitReport}
                  className="flex-1 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors"
                >
                  Submit Report
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
      {/* Confirm Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" data-overlay="true">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-xl p-6"
          >
            <h2 className="font-bold text-lg text-slate-800 mb-2">
              {showConfirmModal.type === 'block' ? 'Block User' : 'Delete Chat'}
            </h2>
            <p className="text-sm text-slate-600 mb-6">
              {showConfirmModal.type === 'block' 
                ? 'Are you sure you want to block this user? You will no longer receive messages from them.' 
                : 'Are you sure you want to delete this chat? This action cannot be undone.'}
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowConfirmModal(null)}
                className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  if (showConfirmModal.type === 'block') {
                    showToast('User blocked', 'success');
                  } else {
                    showToast('Chat deleted', 'success');
                  }
                  setSelectedChat(null);
                  setShowConfirmModal(null);
                }}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors"
              >
                {showConfirmModal.type === 'block' ? 'Block' : 'Delete'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}