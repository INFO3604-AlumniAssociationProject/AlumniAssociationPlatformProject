import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Save, Bell, Shield, Lock, Eye, Moon, Globe } from 'lucide-react';
import { useToast } from '../components/Toast';

export default function SettingsPage() {
  const { type } = useParams();
  const { showToast } = useToast();
  
  // State for settings
  const [twoFactor, setTwoFactor] = useState(false);
  const [profileVisibility, setProfileVisibility] = useState('Alumni');
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  const getTitle = () => {
    switch(type) {
      case 'privacy': return 'Privacy & Security';
      case 'notifications': return 'Notifications';
      default: return 'Settings';
    }
  };

  const handleSave = () => {
    showToast('Settings updated successfully!', 'success');
  };

  const ToggleSwitch = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
    <div 
      onClick={onChange}
      className={`w-12 h-7 rounded-full relative cursor-pointer transition-colors duration-300 ease-in-out ${checked ? 'bg-blue-600' : 'bg-slate-200'}`}
    >
      <motion.div 
        layout
        transition={{ type: "spring", stiffness: 700, damping: 30 }}
        className={`w-5 h-5 bg-white rounded-full absolute top-1 shadow-md ${checked ? 'left-6' : 'left-1'}`}
      />
    </div>
  );

  return (
    <div className="space-y-6 pt-2 max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link to="/profile" className="p-2.5 rounded-full bg-white border border-slate-100 text-slate-600 hover:bg-slate-50 hover:shadow-sm transition-all">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">{getTitle()}</h1>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="ui-card rounded-3xl p-6 shadow-sm border border-slate-100/50 bg-white/80 backdrop-blur-xl"
      >
        {type === 'privacy' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-slate-50/80 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                  <Lock size={20} />
                </div>
                <div>
                  <span className="text-sm font-bold text-slate-800 block">Two-Factor Authentication</span>
                  <span className="text-xs text-slate-500">Secure your account with 2FA</span>
                </div>
              </div>
              <ToggleSwitch checked={twoFactor} onChange={() => setTwoFactor(!twoFactor)} />
            </div>

            <div className="flex flex-col gap-4 p-5 bg-slate-50/80 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                  <Eye size={20} />
                </div>
                <div>
                  <span className="text-sm font-bold text-slate-800 block">Profile Visibility</span>
                  <span className="text-xs text-slate-500">Control who can see your profile</span>
                </div>
              </div>
              
              <div className="flex p-1.5 bg-slate-200/60 rounded-xl relative">
                {['Public', 'Alumni', 'Private'].map((option) => (
                  <button
                    key={option}
                    onClick={() => setProfileVisibility(option)}
                    className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all relative z-10 ${
                      profileVisibility === option 
                        ? 'text-blue-600' 
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {option}
                    {profileVisibility === option && (
                      <motion.div
                        layoutId="visibility-tab"
                        className="absolute inset-0 bg-white rounded-lg shadow-sm -z-10"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <button 
              onClick={handleSave} 
              className="w-full py-3.5 rounded-xl font-bold text-sm bg-blue-600 text-white shadow-lg shadow-blue-200 hover:bg-blue-700 hover:shadow-blue-300 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              <Save size={18} /> Update Privacy Settings
            </button>
          </div>
        )}

        {type === 'notifications' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-slate-50/80 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                  <Bell size={20} />
                </div>
                <div>
                  <span className="text-sm font-bold text-slate-800 block">Push Notifications</span>
                  <span className="text-xs text-slate-500">Receive alerts on your device</span>
                </div>
              </div>
              <ToggleSwitch checked={pushNotifications} onChange={() => setPushNotifications(!pushNotifications)} />
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50/80 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <Globe size={20} />
                </div>
                <div>
                  <span className="text-sm font-bold text-slate-800 block">Email Alerts</span>
                  <span className="text-xs text-slate-500">Get updates via email</span>
                </div>
              </div>
              <ToggleSwitch checked={emailAlerts} onChange={() => setEmailAlerts(!emailAlerts)} />
            </div>

            <button 
              onClick={handleSave} 
              className="w-full py-3.5 rounded-xl font-bold text-sm bg-blue-600 text-white shadow-lg shadow-blue-200 hover:bg-blue-700 hover:shadow-blue-300 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              <Save size={18} /> Save Preferences
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
