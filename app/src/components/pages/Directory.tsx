import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Search, User, MapPin, Briefcase, ArrowLeft } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { useData } from '../DataContext';

export default function Directory() {
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const { alumni } = useData();
  
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
      <div className="flex items-center gap-3 mb-4">
        <Link to="/dashboard" className="p-2 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-xl font-bold text-[var(--uwi-blue-800)]">Alumni Directory</h1>
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
        {filteredAlumni.map((person) => (
          <motion.div 
            key={person.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="ui-card rounded-xl p-4 flex items-start gap-3"
          >
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0 overflow-hidden">
              <img src={person.avatar} alt={person.name} className="w-full h-full object-cover" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">{person.name}</h3>
              <p className="text-xs text-blue-600 font-medium">{person.role} at {person.company}</p>
              <div className="flex flex-wrap gap-2 mt-2 text-xs text-slate-500">
                <span className="flex items-center gap-1"><Briefcase size={12} /> {person.degree} ('{person.year})</span>
                <span className="flex items-center gap-1"><MapPin size={12} /> {person.location}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
