import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import { useData } from '../DataContext';
import { motion } from 'motion/react';
import { MessageSquare, Search, Send, User, Check, X, Plus } from 'lucide-react';
import { useToast } from '../components/Toast';

export default function Messages() {
  const { user } = useAuth();
  const { messages, messageRequests, acceptMessageRequest, rejectMessageRequest, sendMessage } = useData();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'inbox' | 'requests'>('inbox');
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [showNewMessageModal, setShowNewMessageModal] = useState(false);
  const [newRecipient, setNewRecipient] = useState('');

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    
    if (selectedChat) {
      sendMessage(selectedChat, newMessage);
      setNewMessage('');
    }
  };

  const handleNewChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRecipient || !newMessage) {
      showToast('Please fill in all fields', 'error');
      return;
    }
    
    // In a real app, this would create a new chat
    showToast(`Message sent to ${newRecipient}`, 'success');
    setShowNewMessageModal(false);
    setNewRecipient('');
    setNewMessage('');
  };

  const activeChat = messages.find((message) => message.senderId === selectedChat);

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col pt-2">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold text-[var(--uwi-blue-800)]">Messages</h1>
        <button 
          onClick={() => setShowNewMessageModal(true)}
          className="p-2 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-colors"
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
          {messageRequests.length > 0 && (
            <span className="absolute top-1 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
          )}
        </button>
      </div>

      {activeTab === 'inbox' ? (
        selectedChat ? (
          <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-100">
            {/* Chat Header */}
            <div className="p-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
              <button onClick={() => setSelectedChat(null)} className="md:hidden text-slate-500">
                <X size={20} />
              </button>
              <div className="relative">
                <img src={activeChat?.avatar} alt={activeChat?.sender} className="w-10 h-10 rounded-full object-cover" />
                {activeChat?.online && <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"></div>}
              </div>
              <div>
                <h3 className="font-bold text-slate-800">{activeChat?.sender}</h3>
                <p className="text-xs text-slate-500">{activeChat?.online ? 'Online' : 'Offline'}</p>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/30">
              {/* Mock conversation history */}
              <div className="flex justify-start">
                <div className="bg-white border border-slate-100 p-3 rounded-2xl rounded-tl-none max-w-[80%] shadow-sm">
                  <p className="text-sm text-slate-700">Hey, how are you doing?</p>
                  <span className="text-[10px] text-slate-400 mt-1 block">10:30 AM</span>
                </div>
              </div>
              <div className="flex justify-end">
                <div className="bg-blue-600 text-white p-3 rounded-2xl rounded-tr-none max-w-[80%] shadow-sm">
                  <p className="text-sm">I'm good! Just working on some projects.</p>
                  <span className="text-[10px] text-blue-200 mt-1 block">10:32 AM</span>
                </div>
              </div>
              <div className="flex justify-start">
                <div className="bg-white border border-slate-100 p-3 rounded-2xl rounded-tl-none max-w-[80%] shadow-sm">
                  <p className="text-sm text-slate-700">{activeChat?.preview}</p>
                  <span className="text-[10px] text-slate-400 mt-1 block">{activeChat?.time}</span>
                </div>
              </div>
            </div>

            {/* Input Area */}
            <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-100 bg-white">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..." 
                  className="flex-1 bg-slate-50 border-none rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-100 outline-none"
                />
                <button 
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={18} />
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-2">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <MessageSquare size={48} className="mb-2 opacity-20" />
                <p>No messages yet</p>
              </div>
            ) : (
              messages.map((msg) => (
                <motion.div 
                  key={msg.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => setSelectedChat(msg.senderId)}
                  className={`p-4 rounded-2xl cursor-pointer transition-all border ${msg.unread ? 'bg-white border-blue-100 shadow-sm' : 'bg-transparent border-transparent hover:bg-white hover:shadow-sm'}`}
                >
                  <div className="flex gap-3">
                    <div className="relative">
                      <img src={msg.avatar} alt={msg.sender} className="w-12 h-12 rounded-full object-cover" />
                      {msg.online && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <h3 className={`text-sm truncate ${msg.unread ? 'font-bold text-slate-800' : 'font-medium text-slate-700'}`}>
                          {msg.sender}
                        </h3>
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
              ))
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
                    className="flex-1 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-medium flex items-center justify-center gap-1 hover:bg-slate-200 transition-colors"
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
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
                  className="w-full p-2.5 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-blue-100 text-sm"
                  placeholder="Search for alumni..."
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 ml-1">Message:</label>
                <textarea 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-blue-100 text-sm h-32 resize-none"
                  placeholder="Type your message..."
                />
              </div>
              <button type="submit" className="btn ui-btn w-full py-3 rounded-xl font-medium">
                Send Message
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
