import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import { useData } from '../DataContext';
import { motion } from 'motion/react';
import { Calendar, MapPin, Clock, Plus, X, Search, Filter } from 'lucide-react';
import { useToast } from '../components/Toast';
import placeholderImage from '../assets/UWILogo.jpg';

export default function Events() {
  const { user } = useAuth();
  const { events, addEvent, toggleRegisterEvent, cancelEvent } = useData();
  const { showToast } = useToast();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filter, setFilter] = useState('All');
  const [newEvent, setNewEvent] = useState<Omit<import('../DataContext').Event, 'id' | 'registered'>>({
    title: '',
    date: '',
    time: '',
    location: '',
    category: 'Networking',
    // image property is required by the Event type but it will be
    // overwritten when events are fetched from the server using
    // generateEventImage. keep it empty in the create form.
    image: ''
  });

  const handleRegister = async (id: string, title: string) => {
    const event = events.find(e => e.id === id);
    await toggleRegisterEvent(id);
    if (event?.registered) {
      showToast(`Cancelled registration for ${title}`, 'info');
    } else {
      showToast(`Successfully registered for ${title}`, 'success');
    }
  };

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.title || !newEvent.date || !newEvent.location) {
      showToast('Please fill in all required fields', 'error');
      return;
    }
    
    addEvent(newEvent);
    setShowCreateModal(false);
    setNewEvent({
      title: '',
      date: '',
      time: '',
      location: '',
      category: 'Networking',
      image: ''
    });
    showToast('Event created successfully!', 'success');
  };

  const filteredEvents = filter === 'All' 
    ? events 
    : events.filter(event => event.category === filter);

  return (
    <div className="space-y-4 pt-2">
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-xl font-bold text-[var(--uwi-blue-800)]">Events</h1>
        {(user?.role === 'alumni' || user?.role === 'admin') && (
          <button 
            onClick={() => setShowCreateModal(true)}
            className="btn ui-btn py-2 px-3 rounded-xl text-xs font-medium flex items-center gap-1"
          >
            <Plus size={14} /> Create Event
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2 pb-2">
        {['All', 'Networking', 'Career', 'Social', 'Technology'].map((cat) => (
          <motion.button
            key={cat}
            onClick={() => setFilter(cat)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
              filter === cat 
                ? 'bg-blue-600 text-white shadow-blue-200' 
                : 'bg-white text-slate-600 border border-slate-100 hover:bg-slate-50 hover:shadow-md'
            }`}
          >
            {cat}
          </motion.button>
        ))}
      </div>

      <div className="space-y-5">
        {filteredEvents.map((event) => (
          <motion.div 
            key={event.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4 }}
            className="ui-card rounded-3xl overflow-hidden group shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100/50"
          >
            <div className="h-40 bg-slate-200 relative overflow-hidden">
              <img 
                src={event.image || placeholderImage} 
                alt={event.title} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = placeholderImage;
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60"></div>
              <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl text-xs font-bold text-blue-800 shadow-lg">
                {event.category}
              </div>
            </div>
            <div className="p-5">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-slate-800 text-xl leading-tight group-hover:text-blue-600 transition-colors">{event.title}</h3>
                  <div className="flex flex-col gap-1.5 mt-3 text-xs font-medium text-slate-500">
                    <span className="flex items-center gap-2"><Calendar size={14} className="text-blue-500" /> {event.date}</span>
                    <span className="flex items-center gap-2"><Clock size={14} className="text-orange-500" /> {event.time}</span>
                    <span className="flex items-center gap-2"><MapPin size={14} className="text-emerald-500" /> {event.location}</span>
                  </div>
                </div>
                <div className="flex flex-col items-center justify-center bg-blue-50 rounded-2xl p-3 w-16 shrink-0 border border-blue-100 shadow-sm group-hover:bg-blue-600 group-hover:border-blue-600 transition-colors group-hover:shadow-blue-200">
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider group-hover:text-blue-100">{event.date.split(' ')[0]}</span>
                  <span className="text-2xl font-bold text-slate-800 leading-none mt-0.5 group-hover:text-white">{event.date.split(' ')[1].replace(',', '')}</span>
                </div>
              </div>
              
              {user?.role === 'admin' ? (
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    cancelEvent(event.id);
                    showToast('Event cancelled by admin.', 'info');
                  }}
                  className="w-full py-3 rounded-xl text-sm font-bold mt-2 transition-all flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-100"
                >
                  Cancel Event
                </motion.button>
              ) : (
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleRegister(event.id, event.title)}
                  className={`w-full py-3 rounded-xl text-sm font-bold mt-2 transition-all flex items-center justify-center gap-2 ${
                    event.registered 
                      ? 'bg-red-50 hover:bg-red-100 text-red-600 border border-red-100' 
                      : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200 hover:shadow-blue-300'
                  }`}
                >
                  {event.registered ? (
                    <>Cancel Registration</>
                  ) : (
                    <>Register Now</>
                  )}
                </motion.button>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Create Event Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-xl"
          >
            <div className="p-4 border-b border-slate-100 flex justify-between items-center">
              <h2 className="font-bold text-lg text-slate-800">Create Event</h2>
              <button onClick={() => setShowCreateModal(false)} className="p-1 hover:bg-slate-100 rounded-full">
                <X size={20} className="text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleCreateEvent} className="p-4 space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-500 ml-1">Event Title</label>
                <input 
                  type="text" 
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-blue-100 text-sm"
                  placeholder="e.g. Alumni Mixer"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-500 ml-1">Date</label>
                  <input 
                    type="text" 
                    value={newEvent.date}
                    onChange={(e) => setNewEvent({...newEvent, date: e.target.value})}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-blue-100 text-sm"
                    placeholder="e.g. Mar 15, 2026"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 ml-1">Time</label>
                  <input 
                    type="text" 
                    value={newEvent.time}
                    onChange={(e) => setNewEvent({...newEvent, time: e.target.value})}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-blue-100 text-sm"
                    placeholder="e.g. 6:00 PM"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 ml-1">Location</label>
                <input 
                  type="text" 
                  value={newEvent.location}
                  onChange={(e) => setNewEvent({...newEvent, location: e.target.value})}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-blue-100 text-sm"
                  placeholder="e.g. UWI Inn"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 ml-1">Category</label>
                <select 
                  value={newEvent.category}
                  onChange={(e) => setNewEvent({...newEvent, category: e.target.value})}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-blue-100 text-sm"
                >
                  <option>Networking</option>
                  <option>Career</option>
                  <option>Social</option>
                  <option>Technology</option>
                </select>
              </div>
              <button type="submit" className="btn ui-btn w-full py-3 rounded-xl font-medium mt-2">
                Create Event
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
