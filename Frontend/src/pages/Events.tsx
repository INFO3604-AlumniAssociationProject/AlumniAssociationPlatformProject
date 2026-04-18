// File: src/pages/Events.tsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { useData } from '../DataContext';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar as CalendarIcon, MapPin, Clock, Plus, X, Search, 
  CheckCircle2, ArrowLeft, CalendarDays, Users 
} from 'lucide-react';
import { useToast } from '../components/Toast';
import { useNavigate, useParams } from 'react-router-dom';
import placeholderImage from '../assets/UWILogo.jpg';
import { API_BASE } from '../apiConfig';
import { getAuthToken } from '../AuthContext';

export default function Events() {
  const { user } = useAuth();
  const { events, addEvent, toggleRegisterEvent, cancelEvent } = useData();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const { id: eventId } = useParams<{ id?: string }>();

  // UI State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showCancelConfirmModal, setShowCancelConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [filter, setFilter] = useState('All');
  const [eventTab, setEventTab] = useState<'all' | 'registered'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showCalendar, setShowCalendar] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDayEventsModal, setShowDayEventsModal] = useState(false);
  const [showEventDetailsModal, setShowEventDetailsModal] = useState(false);

  // Admin modals
  const [showAdminCancelModal, setShowAdminCancelModal] = useState(false);
  const [showAdminPostponeModal, setShowAdminPostponeModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [postponeReason, setPostponeReason] = useState('');

  // Attendees modal for admin
  const [showAttendeesModal, setShowAttendeesModal] = useState(false);
  const [attendeesList, setAttendeesList] = useState<any[]>([]);
  const [loadingAttendees, setLoadingAttendees] = useState(false);
  const [selectedEventForAttendees, setSelectedEventForAttendees] = useState<any>(null);

  // Attendee counts per event (fetched on demand)
  const [attendeeCounts, setAttendeeCounts] = useState<Record<string, number>>({});

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
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  // Fetch attendee counts for all events (admin only)
  useEffect(() => {
    if (user?.role !== 'admin') return;
    const fetchCounts = async () => {
      const counts: Record<string, number> = {};
      await Promise.all(events.map(async (event) => {
        try {
          const res = await fetch(`${API_BASE}/events/${event.id}/applications`, {
            headers: { Authorization: `Bearer ${getAuthToken()}` }
          });
          if (res.ok) {
            const data = await res.json();
            counts[event.id] = (data.applications || []).filter((a: any) => a.status === 'registered').length;
          } else {
            counts[event.id] = 0;
          }
        } catch {
          counts[event.id] = 0;
        }
      }));
      setAttendeeCounts(counts);
    };
    if (events.length > 0) fetchCounts();
  }, [events, user]);

  const fetchAttendees = async (event: any) => {
    setLoadingAttendees(true);
    setSelectedEventForAttendees(event);
    try {
      const res = await fetch(`${API_BASE}/events/${event.id}/applications`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` }
      });
      if (res.ok) {
        const data = await res.json();
        const registered = (data.applications || []).filter((a: any) => a.status === 'registered');
        setAttendeesList(registered);
      } else {
        setAttendeesList([]);
      }
    } catch {
      setAttendeesList([]);
    } finally {
      setLoadingAttendees(false);
      setShowAttendeesModal(true);
    }
  };

  // Calendar helpers
  const daysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  const getEventsForDay = (day: number) => {
    return events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate.getFullYear() === currentMonth.getFullYear() &&
             eventDate.getMonth() === currentMonth.getMonth() &&
             eventDate.getDate() === day;
    });
  };

  const handleDayClick = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    setSelectedDate(date);
    setShowDayEventsModal(true);
  };

  const handleEventClick = (event: any) => {
    setSelectedEvent(event);
    setShowDayEventsModal(false);
    setShowEventDetailsModal(true);
  };

  // Open event from URL param
  useEffect(() => {
    if (!eventId) return;
    const match = events.find(e => String(e.id) === String(eventId));
    if (match) {
      setSelectedEvent(match);
      setShowEventDetailsModal(true);
    } else if (events.length > 0) {
      navigate('/events', { replace: true });
    }
  }, [eventId, events, navigate]);

  const handleRegister = (event: any) => {
    setSelectedEvent(event);
    setShowConfirmModal(true);
  };

  const confirmRegistration = async () => {
    if (selectedEvent) {
      await toggleRegisterEvent(selectedEvent.id);
      setShowConfirmModal(false);
      setSelectedEvent((prev: any) => prev ? { ...prev, registered: true } : prev);
      setShowSuccessModal(true);
      showToast(`Registered for ${selectedEvent.title}!`, 'success');
    }
  };

  const handleCancelRegistration = (event: any) => {
    setSelectedEvent(event);
    setShowCancelConfirmModal(true);
  };

  const confirmCancelRegistration = async () => {
    if (selectedEvent) {
      await toggleRegisterEvent(selectedEvent.id);
      setShowCancelConfirmModal(false);
      setSelectedEvent((prev: any) => prev ? { ...prev, registered: false } : prev);
      showToast(`Cancelled registration for ${selectedEvent.title}`, 'info');
    }
  };

  const handleAdminCancel = (event: any) => {
    setSelectedEvent(event);
    setCancelReason('');
    setShowAdminCancelModal(true);
  };

  const confirmAdminCancel = async () => {
    if (!selectedEvent) return;
    if (!cancelReason.trim()) {
      showToast('Please provide a reason for cancellation', 'error');
      return;
    }
    await cancelEvent(selectedEvent.id);
    setShowAdminCancelModal(false);
    setShowEventDetailsModal(false);
    showToast(`Event cancelled. Reason: ${cancelReason}`, 'info');
  };

  const handleAdminPostpone = (event: any) => {
    setSelectedEvent(event);
    setPostponeReason('');
    setShowAdminPostponeModal(true);
  };

  const confirmAdminPostpone = async () => {
    if (!selectedEvent) return;
    if (!postponeReason.trim()) {
      showToast('Please provide a reason for postponement', 'error');
      return;
    }
    // Postpone logic (e.g., update date) not implemented; just close modals
    setShowAdminPostponeModal(false);
    setShowEventDetailsModal(false);
    showToast(`Event postponed. Reason: ${postponeReason}`, 'info');
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

  // For admin, we don't show registered tab; just "All Events"
  const isAdmin = user?.role === 'admin';

  // Get events for selected date
  const dayEvents = selectedDate ? getEventsForDay(selectedDate.getDate()) : [];

  return (
    <div className="space-y-4 pt-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[var(--uwi-blue-800)]">Events</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCalendar(!showCalendar)}
            className="p-2 bg-slate-100 text-slate-600 rounded-full hover:bg-slate-200 transition-colors"
            title="Calendar View"
          >
            <CalendarDays size={20} />
          </button>
          {(user?.role === 'alumni' || user?.role === 'admin') && (
            <button 
              onClick={() => setShowCreateModal(true)}
              className="p-2 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100"
            >
              <Plus size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Calendar View */}
      <AnimatePresence>
        {showCalendar && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="ui-card rounded-2xl p-4 mb-4">
              <div className="flex items-center justify-between mb-4">
                <button onClick={prevMonth} className="p-1 hover:bg-slate-100 rounded-full">←</button>
                <h3 className="font-bold text-slate-700">
                  {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </h3>
                <button onClick={nextMonth} className="p-1 hover:bg-slate-100 rounded-full">→</button>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-slate-500 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d}>{d}</div>)}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: 42 }).map((_, i) => {
                  const dayNumber = i - firstDayOfMonth(currentMonth) + 1;
                  const isCurrentMonth = dayNumber > 0 && dayNumber <= daysInMonth(currentMonth);
                  const dayEvents = isCurrentMonth ? getEventsForDay(dayNumber) : [];
                  const hasEvents = dayEvents.length > 0;
                  return (
                    <div
                      key={i}
                      onClick={() => isCurrentMonth && hasEvents && handleDayClick(dayNumber)}
                      className={`aspect-square p-1 border border-slate-100 rounded-lg ${
                        isCurrentMonth ? 'bg-white' : 'bg-slate-50 text-slate-300'
                      } ${hasEvents ? 'cursor-pointer hover:bg-blue-50' : ''}`}
                    >
                      {isCurrentMonth && (
                        <>
                          <div className="text-xs font-bold">{dayNumber}</div>
                          {hasEvents && (
                            <div className="mt-1">
                              {dayEvents.slice(0, 2).map(ev => (
                                <div key={ev.id} className="w-full h-1.5 bg-blue-500 rounded-full mb-0.5" title={ev.title}></div>
                              ))}
                              {dayEvents.length > 2 && <div className="text-[8px] text-slate-400">+{dayEvents.length-2}</div>}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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

      {/* Tabs - hide "Registered" for admin */}
      {!isAdmin && (
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
      )}

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
              onClick={() => {
                setSelectedEvent(event);
                setShowEventDetailsModal(true);
              }}
            >
              {/* Registered indicator for alumni */}
              {!isAdmin && event.registered && (
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

              {/* Category tag, attendee count & Action buttons */}
              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full font-medium">
                    {event.category}
                  </span>
                  {isAdmin && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        fetchAttendees(event);
                      }}
                      className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded-full flex items-center gap-1 hover:bg-purple-100 transition-colors"
                    >
                      <Users size={12} />
                      {attendeeCounts[event.id] ?? '...'} registered
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {isAdmin ? (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAdminCancel(event);
                        }}
                        className="text-xs font-bold px-3 py-1.5 rounded-lg bg-orange-50 text-orange-600 border border-orange-200 hover:bg-[#ff7f2a] hover:text-white hover:border-[#ff7f2a] transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAdminPostpone(event);
                        }}
                        className="text-xs font-bold px-3 py-1.5 rounded-lg bg-amber-50 text-amber-600 border border-amber-200 hover:bg-[#ffb347] hover:text-white hover:border-[#ffb347] transition-colors"
                      >
                        Postpone
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        event.registered ? handleCancelRegistration(event) : handleRegister(event);
                      }}
                      className={`text-xs font-bold px-3 py-1.5 rounded-lg transition ${
                        event.registered
                          ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-500 hover:text-white'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {event.registered ? 'Cancel' : 'Register'}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Day Events Modal */}
      <AnimatePresence>
        {showDayEventsModal && selectedDate && (
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
              className="bg-white rounded-2xl p-5 w-full max-w-sm max-h-96 overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-slate-800">
                  {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </h2>
                <button onClick={() => setShowDayEventsModal(false)} className="p-1 hover:bg-slate-100 rounded-full">
                  <X size={20} className="text-slate-500" />
                </button>
              </div>
              <div className="space-y-2">
                {dayEvents.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-4">No events on this day.</p>
                ) : (
                  dayEvents.map(event => (
                    <div
                      key={event.id}
                      onClick={() => handleEventClick(event)}
                      className="p-3 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <h3 className="font-bold text-slate-800 text-sm">{event.title}</h3>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                        <Clock size={12} /> {stripEventSeconds(event.time)}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                        <MapPin size={12} /> {event.location}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Event Details Modal */}
      <AnimatePresence>
        {showEventDetailsModal && selectedEvent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end justify-center"
            onClick={() => setShowEventDetailsModal(false)}
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
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-bold text-slate-800 pr-4">{selectedEvent.title}</h2>
                <button onClick={() => setShowEventDetailsModal(false)} className="p-1 hover:bg-slate-100 rounded-full">
                  <X size={20} className="text-slate-500" />
                </button>
              </div>
              <div className="w-full h-40 rounded-2xl overflow-hidden mb-4">
                <img 
                  src={selectedEvent.image || placeholderImage} 
                  alt={selectedEvent.title}
                  className="w-full h-full object-cover"
                />
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
                    <span className="text-purple-500">👤</span>
                    <span className="text-slate-700">Hosted by {selectedEvent.hostClub}</span>
                  </div>
                )}
                {isAdmin && (
                  <div className="flex items-center gap-3 text-sm">
                    <Users size={18} className="text-indigo-500" />
                    <span className="text-slate-700">{attendeeCounts[selectedEvent.id] ?? 0} registered</span>
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
                  onClick={() => setShowEventDetailsModal(false)}
                  className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                >
                  Close
                </button>
                {isAdmin ? (
                  <>
                    <button 
                      onClick={() => {
                        setShowEventDetailsModal(false);
                        handleAdminCancel(selectedEvent);
                      }}
                      className="flex-1 py-3 bg-orange-50 text-orange-600 border border-orange-200 rounded-xl font-bold hover:bg-orange-500 hover:text-white transition-colors"
                    >
                      Cancel Event
                    </button>
                    <button 
                      onClick={() => {
                        setShowEventDetailsModal(false);
                        handleAdminPostpone(selectedEvent);
                      }}
                      className="flex-1 py-3 bg-amber-50 text-amber-600 border border-amber-200 rounded-xl font-bold hover:bg-amber-500 hover:text-white transition-colors"
                    >
                      Postpone
                    </button>
                  </>
                ) : (
                  selectedEvent.registered ? (
                    <button 
                      onClick={() => {
                        setShowEventDetailsModal(false);
                        handleCancelRegistration(selectedEvent);
                      }}
                      className="flex-1 py-3 bg-red-50 text-red-600 border border-red-200 rounded-xl font-bold hover:bg-red-500 hover:text-white transition-colors"
                    >
                      Cancel Registration
                    </button>
                  ) : (
                    <button 
                      onClick={() => {
                        setShowEventDetailsModal(false);
                        handleRegister(selectedEvent);
                      }}
                      className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors"
                    >
                      Register
                    </button>
                  )
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Attendees List Modal (Admin) */}
      <AnimatePresence>
        {showAttendeesModal && selectedEventForAttendees && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            data-overlay="true"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-2xl p-5 w-full max-w-md max-h-96 overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-slate-800">
                  Registered Alumni ({attendeesList.length})
                </h2>
                <button onClick={() => setShowAttendeesModal(false)} className="p-1 hover:bg-slate-100 rounded-full">
                  <X size={20} className="text-slate-500" />
                </button>
              </div>
              {loadingAttendees ? (
                <div className="text-center py-8 text-slate-500">Loading...</div>
              ) : attendeesList.length === 0 ? (
                <div className="text-center py-8 text-slate-500">No registered alumni yet.</div>
              ) : (
                <div className="space-y-2">
                  {attendeesList.map((attendee: any) => (
                    <div key={attendee.id || attendee.userID} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
                      <img 
                        src={attendee.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(attendee.name || 'Alumni')}&background=random`} 
                        alt={attendee.name}
                        className="w-10 h-10 rounded-full"
                      />
                      <div>
                        <p className="text-sm font-bold text-slate-800">{attendee.name}</p>
                        <p className="text-xs text-slate-500">{attendee.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Registration Confirmation Modal */}
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
                  className="flex-1 py-2.5 bg-slate-100 rounded-xl font-medium text-sm hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmRegistration} 
                  className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl font-medium text-sm hover:bg-blue-700"
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cancel Registration Confirmation Modal */}
      <AnimatePresence>
        {showCancelConfirmModal && selectedEvent && (
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
              <h2 className="text-lg font-bold text-center mb-2">Cancel Registration</h2>
              <p className="text-sm text-slate-600 text-center mb-4">
                Are you sure you want to cancel your registration for "{selectedEvent.title}"?
              </p>
              <div className="flex gap-2">
                <button 
                  onClick={() => setShowCancelConfirmModal(false)} 
                  className="flex-1 py-2.5 bg-slate-100 rounded-xl font-medium text-sm hover:bg-slate-200"
                >
                  No
                </button>
                <button 
                  onClick={confirmCancelRegistration} 
                  className="flex-1 py-2.5 bg-red-500 text-white rounded-xl font-medium text-sm hover:bg-red-600"
                >
                  Yes, Cancel
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
                onClick={() => setShowSuccessModal(false)} 
                className="w-full py-2.5 bg-blue-600 text-white rounded-xl font-medium text-sm hover:bg-blue-700"
              >
                Done
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Admin Cancel Reason Modal */}
      <AnimatePresence>
        {showAdminCancelModal && selectedEvent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            data-overlay="true"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-2xl p-5 w-full max-w-sm"
            >
              <h2 className="text-lg font-bold mb-2">Cancel Event</h2>
              <p className="text-sm text-slate-600 mb-3">
                Please provide a reason for cancelling "{selectedEvent.title}".
              </p>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Reason for cancellation..."
                className="w-full p-3 bg-slate-50 rounded-xl text-sm min-h-[80px] border border-slate-200"
              />
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => setShowAdminCancelModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 rounded-xl font-medium text-sm"
                >
                  Back
                </button>
                <button
                  onClick={confirmAdminCancel}
                  className="flex-1 py-2.5 bg-orange-500 text-white rounded-xl font-medium text-sm hover:bg-orange-600"
                >
                  Confirm Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Admin Postpone Reason Modal */}
      <AnimatePresence>
        {showAdminPostponeModal && selectedEvent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            data-overlay="true"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-2xl p-5 w-full max-w-sm"
            >
              <h2 className="text-lg font-bold mb-2">Postpone Event</h2>
              <p className="text-sm text-slate-600 mb-3">
                Please provide a reason for postponing "{selectedEvent.title}".
              </p>
              <textarea
                value={postponeReason}
                onChange={(e) => setPostponeReason(e.target.value)}
                placeholder="Reason for postponement..."
                className="w-full p-3 bg-slate-50 rounded-xl text-sm min-h-[80px] border border-slate-200"
              />
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => setShowAdminPostponeModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 rounded-xl font-medium text-sm"
                >
                  Back
                </button>
                <button
                  onClick={confirmAdminPostpone}
                  className="flex-1 py-2.5 bg-amber-500 text-white rounded-xl font-medium text-sm hover:bg-amber-600"
                >
                  Confirm Postpone
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Event Modal */}
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