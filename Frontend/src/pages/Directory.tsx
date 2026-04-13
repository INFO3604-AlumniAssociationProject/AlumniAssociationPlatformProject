import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Search, User, MapPin, Briefcase, ArrowLeft, Grid, List, MessageSquare } from 'lucide-react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useData } from '../DataContext';

export default function Directory() {
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [isLoading, setIsLoading] = useState(true);
  const { alumni } = useData();
  const navigate = useNavigate();
  
  // View Mode
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const isDesktopMode = localStorage.getItem('desktopMode') === 'true';

  // Force list view on mobile
  useEffect(() => {
    if (!isDesktopMode && viewMode === 'grid') {
      setViewMode('list');
    }
  }, [isDesktopMode]);

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

  return (
    <div className="space-y-4 pt-2">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Link to="/dashboard" className="p-2 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-xl font-bold text-[var(--uwi-blue-800)]">Alumni Directory</h1>
        </div>
        
        <div className="flex bg-slate-100 p-1 rounded-xl">
          {isDesktopMode && (
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400'}`}
              title="Grid View"
            >
              <Grid size={16} />
            </button>
          )}
          <button 
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400'}`}
            title="List View"
          >
            <List size={16} />
          </button>
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

      <div className={viewMode === 'grid' && isDesktopMode ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-3'}>
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
          filteredAlumni.map((person) => (
          <motion.div 
            key={person.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`ui-card rounded-xl p-4 flex items-start gap-3 hover:shadow-md transition-all ${viewMode === 'grid' ? 'flex-col items-center text-center' : ''}`}
          >
            <div className={`w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0 overflow-hidden ${viewMode === 'grid' ? 'w-20 h-20 mb-2' : ''}`}>
              <img src={person.avatar} alt={person.name} className="w-full h-full object-cover" />
            </div>
              <div className="flex-1 min-w-0">
              <h3 className="font-bold text-slate-800 truncate">{person.name}</h3>
              <p className="text-xs text-blue-600 font-medium truncate">{person.role} at {person.company}</p>
              <div className={`flex flex-wrap gap-2 mt-2 text-xs text-slate-500 ${viewMode === 'grid' ? 'justify-center' : ''}`}>
                <span className="flex items-center gap-1"><Briefcase size={12} /> {person.degree} ('{person.year})</span>
                <span className="flex items-center gap-1"><MapPin size={12} /> {person.location || 'Trinidad & Tobago'}</span>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <button
                onClick={() => navigate(`/messages?new=${person.id}`)}
                className="p-2 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100"
                title={`Message ${person.name}`}
              >
                <MessageSquare size={14} />
              </button>
            </div>
          </motion.div>
        ))
      )}
    </div>
  </div>
);
}
