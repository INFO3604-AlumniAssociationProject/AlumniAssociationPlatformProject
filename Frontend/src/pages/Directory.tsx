// File: Directory.tsx

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Search, MapPin, Briefcase, ArrowLeft, MessageSquare, Lock, Globe, Send } from 'lucide-react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useData } from '../DataContext';
import { useAuth } from '../AuthContext';
import { API_BASE } from '../apiConfig';
import { getAuthToken } from '../AuthContext';
import { useToast } from '../components/Toast';

export default function Directory() {
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [isLoading, setIsLoading] = useState(true);
  const { alumni } = useData();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  // Connection request state
  const [connectingId, setConnectingId] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const query = searchParams.get('search');
    if (query) {
      setSearchTerm(query);
    }
  }, [searchParams]);

  const filteredAlumni = alumni.filter(person => 
    person.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    person.degree.toLowerCase().includes(searchTerm.toLowerCase()) ||
    person.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    person.company.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleConnectRequest = async (personId: string, personName: string) => {
    if (!user) return;
    setConnectingId(personId);
    try {
      const response = await fetch(`${API_BASE}/alumni/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify({
          alumniID: personId,
          message: `Hi ${personName}, I'd like to connect with you on the UWI Alumni Network.`,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok) {
        showToast(`Connection request sent to ${personName}`, 'success');
      } else {
        showToast(data.error || 'Failed to send connection request', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    } finally {
      setConnectingId(null);
    }
  };

  const handleMessagePublic = (personId: string, personName: string) => {
    // Navigate to messages with pre-filled recipient
    navigate(`/messages?new=${personId}`);
  };

  return (
    <div className="space-y-4 pt-2">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Link to="/dashboard" className="p-2 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-xl font-bold text-[var(--uwi-blue-800)]">Alumni Directory</h1>
        </div>
      </div>

      <div className="relative">
        <input 
          type="text" 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search alumni by name, degree, or job..." 
          className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-blue-100 text-sm transition-all"
        />
        <Search size={18} className="absolute left-3 top-3.5 text-slate-400" />
      </div>

      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="ui-card rounded-xl p-4 flex items-start gap-3 animate-pulse">
              <div className="w-12 h-12 rounded-full bg-slate-200 shrink-0"></div>
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-slate-200 rounded w-1/3"></div>
                <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                <div className="flex gap-2 mt-2">
                  <div className="h-3 bg-slate-200 rounded w-1/4"></div>
                  <div className="h-3 bg-slate-200 rounded w-1/4"></div>
                </div>
              </div>
            </div>
          ))
        ) : filteredAlumni.length === 0 ? (
          <div className="col-span-full text-center py-10 text-slate-400">No alumni found matching your search.</div>
        ) : (
          filteredAlumni.map((person) => {
            const isAdmin = user?.role === 'admin';
            const canMessageDirectly = isAdmin || person.isPublicProfile;
            
            return (
              <motion.div 
                key={person.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="ui-card rounded-xl p-4 flex items-start gap-3 hover:shadow-md transition-all"
              >
                <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0 overflow-hidden">
                  <img src={person.avatar} alt={person.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-slate-800 truncate">{person.name}</h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                      person.isPublicProfile 
                        ? 'bg-emerald-100 text-emerald-700' 
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {person.isPublicProfile ? (
                        <><Globe size={10} /> Public</>
                      ) : (
                        <><Lock size={10} /> Private</>
                      )}
                    </span>
                  </div>
                  <p className="text-xs text-blue-600 font-medium truncate">{person.role} at {person.company}</p>
                  <div className="flex flex-wrap gap-2 mt-2 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><Briefcase size={12} /> {person.degree} ('{person.year})</span>
                    <span className="flex items-center gap-1"><MapPin size={12} /> {person.location || 'Trinidad & Tobago'}</span>
                  </div>
                </div>
                <div className="flex items-start">
                  {canMessageDirectly ? (
                    <button
                      onClick={() => handleMessagePublic(person.id, person.name)}
                      className="p-2 rounded-full bg-blue-50 text-blue-600 border border-blue-200 hover:bg-[#0ea5e9] hover:text-white hover:border-[#0ea5e9] transition-all"
                      title={`Message ${person.name}`}
                    >
                      <MessageSquare size={14} />
                    </button>
                  ) : (
                    <button
                      onClick={() => handleConnectRequest(person.id, person.name)}
                      disabled={connectingId === person.id}
                      className={`p-2 rounded-full transition-all ${
                        connectingId === person.id 
                          ? 'bg-blue-100 text-blue-400 cursor-not-allowed' 
                          : 'bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-500 hover:text-white hover:border-amber-500'
                      }`}
                      title={`Request to message ${person.name}`}
                    >
                      {connectingId === person.id ? (
                        <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Send size={14} />
                      )}
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}