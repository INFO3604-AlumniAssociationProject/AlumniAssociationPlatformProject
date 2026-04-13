// File: Events.tsx

import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import { useData } from '../DataContext';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar as CalendarIcon, MapPin, Clock, Plus, X, Search, 
  CheckCircle2, ArrowLeft, ChevronRight, User 
} from 'lucide-react';
import { useToast } from '../components/Toast';
import { useNavigate, useParams } from 'react-router-dom';
import placeholderImage from '../assets/UWILogo.jpg';

export default function Events() {
  const { user } = useAuth();
  const { events, addEvent, toggleRegisterEvent, cancelEvent } = useData();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const { id: eventId } = useParams<{ id?: string }>();

  // UI State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [filter, setFilter] = useState('All');
  const [eventTab, setEventTab] = useState<'all' | 'registered'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // New event form state
  const [newEvent, setNewEvent] = useState<Omit<import('../DataContext').Event, 'id' | 'registered'>>({
    title: '',
    date: '',
    time: '',
    location: '',
    category: 'Networking',
    image: '',
    description: '',
    faculty: 'General',
    department: 'All Departments',
    hostClub: 'UWI Alumni Association'
  });

  const stripEventSeconds = (timeValue: string) => timeValue.replace(/:\d{2}(?=(?:\s*[AaPp][Mm])?$)/, '');

  // Simulate loading
  React.useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  // Open event from URL param
  React.useEffect(() => {
    if (!eventId) return;
    const match = events.find(e => String(e.id) === String(eventId));
    if (match) {
      setSelectedEvent(match);
      setShowDetailsModal(true);
    } else if (events.length > 0) {
      navigate('/events', { replace: true });
    }
  }, [eventId, events, navigate]);

  const handleRegister = async (event: any) => {
    if (event.registered) {
      await toggleRegisterEvent(event.id);
      setSelectedEvent((prev: any) => prev ? { ...prev, registered: false } : prev);
      setShowConfirmModal(false);
      setShowSuccessModal(false);
      showToast(`Cancelled registration for ${event.title}`, 'info');
    } else {
      setSelectedEvent(event);
      setShowConfirmModal(true);
    }
  };

  const confirmRegistration = async () => {
    if (selectedEvent) {
      await toggleRegisterEvent(selectedEvent.id);
      setShowConfirmModal(false);
      setSelectedEvent((prev: any) => prev ? { ...prev, registered: true } : prev);
      setShowSuccessModal(true);
      showToast(`Registered for ${selectedEvent.title}!`, 'success');
      // Auto‑message is handled by the backend
    }
  };

  const openEventDetails = (event: import('../DataContext').Event) => {
    setSelectedEvent(event);
    setShowConfirmModal(false);
    setShowSuccessModal(false);
    setShowDetailsModal(true);
    navigate(`/events/${event.id}`);
  };

  const closeEventDetails = () => {
    setShowDetailsModal(false);
    setShowConfirmModal(false);
    setShowSuccessModal(false);
    setSelectedEvent(null);
    navigate('/events', { replace: true });
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.title || !newEvent.date || !newEvent.location) {
      showToast('Please fill in all required fields', 'error');
      return;
    }
    
    const created = await addEvent(newEvent);
    if (!created) {
      showToast('Unable to create event', 'error');
      return;
    }
    setShowCreateModal(false);
    setNewEvent({
      title: '', date: '', time: '', location: '', category: 'Networking', image: '',
      description: '', faculty: 'General', department: 'All Departments', hostClub: 'UWI Alumni Association'
    });
    showToast('Event created!', 'success');
  };

  // Filter events
  const filteredEvents = events
    .filter(event => filter === 'All' ? true : event.category === filter)
    .filter(event => {
      if (eventTab === 'registered') return event.registered === true;
      const q = searchQuery.toLowerCase();
      return event.title.toLowerCase().includes(q) ||
             event.location.toLowerCase().includes(q) ||
             event.category.toLowerCase().includes(q);
    })
    .filter(event => event.status === 'approved' || user?.role === 'admin' || event.creatorId === user?.id);

  return (
    <div className="space-y-4 pt-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[var(--uwi-blue-800)]">Events</h1>
        {(user?.role === 'alumni' || user?.role === 'admin') && (
          <button 
            onClick={() => setShowCreateModal(true)}
            className="p-2 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100"
          >
            <Plus size={20} />
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          type="text"
          placeholder="Search events..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-100"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setEventTab('all')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition ${eventTab === 'all' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
        >
          All Events
        </button>
        <button
          onClick={() => setEventTab('registered')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition ${eventTab === 'registered' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
        >
          Registered Events
        </button>
      </div>

      {/* Category Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
        {['All', 'Networking', 'Career', 'Social', 'Technology'].map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              filter === cat 
                ? 'bg-blue-600 text-white shadow-sm' 
                : 'bg-white text-slate-600 border border-slate-100'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Event Cards */}
      <div className="space-y-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="ui-card rounded-2xl p-4 animate-pulse">
              <div className="flex gap-3">
                <div className="w-16 h-16 rounded-xl bg-slate-200 shrink-0"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                  <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                  <div className="h-3 bg-slate-200 rounded w-2/3"></div>
                </div>
              </div>
            </div>
          ))
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-10 text-slate-400">No events found</div>
        ) : (
          filteredEvents.map(event => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="ui-card rounded-2xl p-4 hover:shadow-md transition-all cursor-pointer relative"
            >
              {/* Registered indicator */}
              {event.registered && (
                <div className="absolute top-3 right-3 z-10">
                  <CheckCircle2 size={20} className="text-emerald-500 fill-emerald-50" />
                </div>
              )}

              <div className="flex gap-3 pr-8">
                {/* Thumbnail */}
                <div className="w-16 h-16 rounded-xl bg-slate-100 overflow-hidden shrink-0">
                  <img 
                    src={event.image || placeholderImage} 
                    alt={event.title}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.currentTarget.src = placeholderImage; }}
                  />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-800 truncate">{event.title}</h3>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                    <CalendarIcon size={14} className="text-blue-500" />
                    <span>{event.date} • {stripEventSeconds(event.time)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                    <MapPin size={14} className="text-emerald-500" />
                    <span className="truncate">{event.location}</span>
                  </div>
                </div>
              </div>

              {/* Category tag & Register button */}
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full font-medium">
                  {event.category}
                </span>
                <div className="flex items-center gap-2">
                  {user?.role !== 'admin' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRegister(event);
                      }}
                      className={`text-xs font-bold px-3 py-1.5 rounded-lg transition ${
                        event.registered
                          ? 'bg-red-50 text-red-600 hover:bg-red-100'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {event.registered ? 'Cancel' : 'Register'}
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openEventDetails(event);
                    }}
                    className="text-xs text-slate-500 hover:text-slate-700"
                  >
                    Details <ChevronRight size={14} className="inline" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Event Details Bottom Sheet */}
      <AnimatePresence>
        {showDetailsModal && selectedEvent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end justify-center"
            onClick={closeEventDetails}
            data-overlay="true"
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="bg-white rounded-t-3xl w-full max-w-lg p-6 max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mb-4" />
              <div className="w-full h-40 rounded-2xl overflow-hidden mb-4">
                <img 
                  src={selectedEvent.image || placeholderImage} 
                  alt={selectedEvent.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex items-start justify-between mb-2">
                <h2 className="text-xl font-bold text-slate-800 pr-4">{selectedEvent.title}</h2>
                <span className="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded-full whitespace-nowrap">
                  {selectedEvent.category}
                </span>
              </div>
              <div className="space-y-3 mt-4">
                <div className="flex items-center gap-3 text-sm">
                  <CalendarIcon size={18} className="text-blue-500" />
                  <span className="text-slate-700">{selectedEvent.date} at {stripEventSeconds(selectedEvent.time)}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <MapPin size={18} className="text-emerald-500" />
                  <span className="text-slate-700">{selectedEvent.location}</span>
                </div>
                {selectedEvent.hostClub && (
                  <div className="flex items-center gap-3 text-sm">
                    <User size={18} className="text-purple-500" />
                    <span className="text-slate-700">Hosted by {selectedEvent.hostClub}</span>
                  </div>
                )}
              </div>
              {selectedEvent.description && (
                <div className="mt-4 p-4 bg-slate-50 rounded-xl">
                  <p className="text-sm text-slate-600">{selectedEvent.description}</p>
                </div>
              )}
              <div className="flex gap-3 mt-6">
                <button 
                  onClick={closeEventDetails}
                  className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold"
                >
                  Close
                </button>
                {user?.role === 'admin' ? (
                  <button 
                    onClick={() => {
                      cancelEvent(selectedEvent.id);
                      closeEventDetails();
                      showToast('Event cancelled', 'info');
                    }}
                    className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold"
                  >
                    Cancel Event
                  </button>
                ) : (
                  <button 
                    onClick={() => {
                      closeEventDetails();
                      handleRegister(selectedEvent);
                    }}
                    className={`flex-1 py-3 rounded-xl font-bold text-white ${
                      selectedEvent.registered 
                        ? 'bg-red-500' 
                        : 'bg-blue-600'
                    }`}
                  >
                    {selectedEvent.registered ? 'Cancel Registration' : 'Register'}
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Registration Confirmation Modal (small & simple) */}
      <AnimatePresence>
        {showConfirmModal && selectedEvent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            data-overlay="true"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white rounded-2xl p-5 w-full max-w-xs"
            >
              <h2 className="text-lg font-bold text-center mb-2">Confirm Registration</h2>
              <p className="text-sm text-slate-600 text-center mb-4">
                Register for "{selectedEvent.title}"?
              </p>
              <div className="flex gap-2">
                <button 
                  onClick={() => setShowConfirmModal(false)} 
                  className="flex-1 py-2.5 bg-slate-100 rounded-xl font-medium text-sm"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmRegistration} 
                  className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl font-medium text-sm"
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccessModal && selectedEvent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            data-overlay="true"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white rounded-2xl p-5 w-full max-w-xs text-center"
            >
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 size={24} className="text-emerald-600" />
              </div>
              <h2 className="text-lg font-bold mb-1">Registered!</h2>
              <p className="text-sm text-slate-500 mb-4">You're registered for "{selectedEvent.title}".</p>
              <button 
                onClick={closeEventDetails} 
                className="w-full py-2.5 bg-blue-600 text-white rounded-xl font-medium text-sm"
              >
                Done
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Event Modal (unchanged) */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            data-overlay="true"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white rounded-3xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center gap-2 mb-4">
                <button onClick={() => setShowCreateModal(false)} className="p-2">
                  <ArrowLeft size={20} />
                </button>
                <h2 className="text-xl font-bold">Create Event</h2>
              </div>

              <form onSubmit={handleCreateEvent} className="space-y-4">
                <input type="text" value={newEvent.title} onChange={e => setNewEvent({...newEvent, title: e.target.value})} placeholder="Event Title" className="w-full p-3 bg-slate-50 rounded-xl text-sm" required />
                <div className="grid grid-cols-2 gap-3">
                  <input type="text" value={newEvent.date} onChange={e => setNewEvent({...newEvent, date: e.target.value})} placeholder="Date (e.g. Mar 15, 2026)" className="w-full p-3 bg-slate-50 rounded-xl text-sm" required />
                  <input type="text" value={newEvent.time} onChange={e => setNewEvent({...newEvent, time: e.target.value})} placeholder="Time (e.g. 6:00 PM)" className="w-full p-3 bg-slate-50 rounded-xl text-sm" required />
                </div>
                <input type="text" value={newEvent.location} onChange={e => setNewEvent({...newEvent, location: e.target.value})} placeholder="Location" className="w-full p-3 bg-slate-50 rounded-xl text-sm" required />
                <select value={newEvent.category} onChange={e => setNewEvent({...newEvent, category: e.target.value})} className="w-full p-3 bg-slate-50 rounded-xl text-sm">
                  <option>Networking</option><option>Career</option><option>Social</option><option>Technology</option>
                </select>
                <textarea value={newEvent.description} onChange={e => setNewEvent({...newEvent, description: e.target.value})} placeholder="Description (optional)" className="w-full p-3 bg-slate-50 rounded-xl text-sm h-24" />
                
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 py-3 bg-slate-100 rounded-xl font-bold">Cancel</button>
                  <button type="submit" className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold">Create</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}