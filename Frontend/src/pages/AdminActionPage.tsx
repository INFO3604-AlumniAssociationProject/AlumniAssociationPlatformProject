import { useParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, Save, AlertTriangle } from 'lucide-react';
import { useToast } from '../components/Toast';

export default function AdminActionPage() {
  const { action } = useParams();
  const { showToast } = useToast();

  const getTitle = () => {
    switch(action) {
      case 'announcements': return 'Post Announcement';
      case 'reports': return 'Review Reports';
      case 'settings': return 'System Settings';
      default: return 'Admin Action';
    }
  };

  const handleSave = () => {
    showToast('Changes saved successfully!', 'success');
  };

  return (
    <div className="space-y-4 pt-2">
      <div className="flex items-center gap-3 mb-4">
        <Link to="/admin" className="p-2 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-xl font-bold text-[var(--uwi-blue-800)]">{getTitle()}</h1>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="ui-card rounded-2xl p-5"
      >
        {action === 'announcements' && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Title</label>
              <input type="text" className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-blue-100 text-sm" placeholder="Announcement Title" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Content</label>
              <textarea rows={5} className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-blue-100 text-sm" placeholder="Write your announcement here..."></textarea>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="notify" className="rounded text-blue-600 focus:ring-blue-500" />
              <label htmlFor="notify" className="text-sm text-slate-600">Send push notification to all users</label>
            </div>
            <button onClick={handleSave} className="btn ui-btn w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2">
              <Save size={18} /> Post Announcement
            </button>
          </div>
        )}

        {action === 'reports' && (
          <div className="space-y-4">
            <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-100 flex gap-3">
              <AlertTriangle className="text-yellow-600 shrink-0" />
              <div>
                <h3 className="font-bold text-yellow-800 text-sm">Inappropriate Content Reported</h3>
                <p className="text-xs text-yellow-700 mt-1">Reported by User #442 on Community Board.</p>
                <div className="flex gap-2 mt-2">
                  <button className="text-xs bg-white px-2 py-1 rounded border border-yellow-200 text-yellow-800 font-medium">View Content</button>
                  <button className="text-xs bg-yellow-200 px-2 py-1 rounded border border-yellow-300 text-yellow-900 font-medium">Dismiss</button>
                </div>
              </div>
            </div>
            <p className="text-center text-slate-400 text-sm py-4">No other pending reports.</p>
          </div>
        )}

        {action === 'settings' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
              <span className="text-sm font-medium text-slate-700">Maintenance Mode</span>
              <div className="w-10 h-6 bg-slate-200 rounded-full relative cursor-pointer">
                <div className="w-4 h-4 bg-white rounded-full absolute left-1 top-1 shadow-sm"></div>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
              <span className="text-sm font-medium text-slate-700">Allow New Registrations</span>
              <div className="w-10 h-6 bg-emerald-500 rounded-full relative cursor-pointer">
                <div className="w-4 h-4 bg-white rounded-full absolute right-1 top-1 shadow-sm"></div>
              </div>
            </div>
            <button onClick={handleSave} className="btn ui-btn w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 mt-4">
              <Save size={18} /> Save Settings
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}