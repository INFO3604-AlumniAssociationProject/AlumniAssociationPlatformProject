import React, { useState, useRef } from 'react';
import { useAuth } from '../AuthContext';
import { useData } from '../DataContext';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { User, Mail, Shield, Settings, LogOut, Camera, Edit2, MapPin, Briefcase, X, Lock, Unlock, Eye, EyeOff } from 'lucide-react';
import { useToast } from '../components/Toast';
import placeholderImage from '../assets/UWILogo.jpg';

export default function Profile() {
  const { logout } = useAuth();
  const { userProfile, updateProfile } = useData();
  const { showToast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  
  const [editForm, setEditForm] = useState({
    name: userProfile.name,
    email: userProfile.email,
    bio: userProfile.bio,
    role: userProfile.role
  });

  // whenever userProfile is refreshed we want the input fields to reflect
  // the latest values; this prevents the form from becoming stale after an
  // edit or when the profile is loaded asynchronously.
  React.useEffect(() => {
    setEditForm({
      name: userProfile.name,
      email: userProfile.email,
      bio: userProfile.bio,
      role: userProfile.role,
    });
  }, [userProfile]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile(editForm);
    setIsEditing(false);
    showToast('Profile updated successfully!', 'success');
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'cover') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const result = reader.result as string;
        if (type === 'avatar') {
          await updateProfile({ avatar: result });
          showToast('Profile photo updated!', 'success');
        } else {
          // coverImage doesn't hit the server, just update locally
          await updateProfile({ coverImage: result });
          showToast('Cover photo updated!', 'success');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6 pt-2 max-w-2xl mx-auto">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="ui-card rounded-3xl overflow-hidden shadow-sm border border-slate-100/50 bg-white"
      >
        {/* Cover Image */}
        <div className="h-48 bg-slate-200 relative group">
          <img 
            src={userProfile.coverImage} 
            alt="Cover" 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = placeholderImage || '';
            }}
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors"></div>
          <button 
            onClick={() => coverInputRef.current?.click()}
            className="absolute bottom-4 right-4 px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-xl text-white hover:bg-black/60 transition-all flex items-center gap-2 text-xs font-bold border border-white/20 shadow-lg opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0"
          >
            <Camera size={14} /> Change Cover
          </button>
          <input 
            type="file" 
            ref={coverInputRef} 
            className="hidden" 
            accept="image/*"
            onChange={(e) => handleImageUpload(e, 'cover')}
          />
        </div>

        <div className="px-6 pb-6 relative">
          {/* Avatar */}
          <div className="relative -mt-16 mb-4 flex justify-between items-end">
            <div className="relative group">
              <div className="w-32 h-32 rounded-full border-[6px] border-white overflow-hidden bg-white shadow-lg relative z-10">
                <img 
                  src={userProfile.avatar} 
                  alt={userProfile.name} 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = placeholderImage || '';
                  }}
                />
              </div>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-2 right-2 p-2 bg-blue-600 rounded-full text-white border-4 border-white hover:bg-blue-700 transition-all shadow-md z-20 group-hover:scale-110"
              >
                <Camera size={16} />
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*"
                onChange={(e) => handleImageUpload(e, 'avatar')}
              />
            </div>
            
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsEditing(!isEditing)}
              className={`mb-2 px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-sm ${
                isEditing 
                  ? 'bg-red-50 text-red-600 border border-red-100 hover:bg-red-100' 
                  : 'bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200'
              }`}
            >
              {isEditing ? <X size={14} /> : <Edit2 size={14} />} 
              {isEditing ? 'Cancel Editing' : 'Edit Profile'}
            </motion.button>
          </div>

          {/* Profile Info */}
          {!isEditing ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-2"
            >
              <div>
                 <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-slate-800 tracking-tight">{userProfile.name}</h1>
                  <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${userProfile.isPrivate ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {userProfile.isPrivate ? <Lock size={10} /> : <Unlock size={10} />}
                    {userProfile.isPrivate ? 'Private' : 'Public'}
                  </div>
                </div>
                <p className="text-sm font-medium text-blue-600 uppercase tracking-wider">{userProfile.role}</p>
              </div>
              
              <p className="text-sm text-slate-600 leading-relaxed max-w-lg">{userProfile.bio}</p>
              
              <div className="flex flex-wrap gap-4 mt-6 pt-6 border-t border-slate-100">
                <div className="flex items-center gap-2 text-xs font-medium text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg">
                  <Briefcase size={14} className="text-slate-400" />
                  <span>Software Engineer</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-medium text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg">
                  <MapPin size={14} className="text-slate-400" />
                  <span>Trinidad & Tobago</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-medium text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg">
                  <Mail size={14} className="text-slate-400" />
                  <span>{userProfile.email}</span>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.form 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={handleUpdateProfile} 
              className="space-y-4 mt-2 bg-slate-50 p-4 rounded-2xl border border-slate-100"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 ml-1 uppercase tracking-wider">Full Name</label>
                  <input 
                    type="text" 
                    value={editForm.name}
                    onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                    className="w-full p-3 rounded-xl bg-white border border-slate-200 text-sm focus:ring-2 focus:ring-blue-100 outline-none transition-all shadow-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 ml-1 uppercase tracking-wider">Email</label>
                  <input 
                    type="email" 
                    value={editForm.email}
                    onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                    className="w-full p-3 rounded-xl bg-white border border-slate-200 text-sm focus:ring-2 focus:ring-blue-100 outline-none transition-all shadow-sm"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 ml-1 uppercase tracking-wider">Bio</label>
                <textarea 
                  value={editForm.bio}
                  onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                  className="w-full p-3 rounded-xl bg-white border border-slate-200 text-sm focus:ring-2 focus:ring-blue-100 outline-none resize-none h-24 transition-all shadow-sm"
                />
              </div>
              <div className="flex justify-end pt-2">
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
                >
                  Save Changes
                </motion.button>
              </div>
            </motion.form>
          )}
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="ui-card rounded-3xl p-6 shadow-sm border border-slate-100/50 bg-white"
      >
        <h2 className="font-bold text-slate-800 mb-5 flex items-center gap-2 text-lg">
          <div className="p-2 bg-slate-100 rounded-xl">
            <Settings size={20} className="text-slate-600" />
          </div>
          Settings
        </h2>
        
        <div className="space-y-3">
          <div 
            onClick={() => updateProfile({ isPrivate: !userProfile.isPrivate })}
            className="flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 transition-all cursor-pointer border border-transparent hover:border-slate-100 group"
          >
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${userProfile.isPrivate ? 'bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white' : 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white'}`}>
                {userProfile.isPrivate ? <EyeOff size={20} /> : <Eye size={20} />}
              </div>
              <div>
                <span className="text-sm font-bold text-slate-700 block">Profile Visibility</span>
                <span className="text-xs text-slate-400">Your account is currently {userProfile.isPrivate ? 'PRIVATE' : 'PUBLIC'}</span>
              </div>
            </div>
            <div className={`text-xs font-bold px-2 py-1 rounded-lg ${userProfile.isPrivate ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
              {userProfile.isPrivate ? 'Switch to Public' : 'Switch to Private'}
            </div>
          </div>

          <Link 
            to="/settings/privacy"
            className="flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 transition-all cursor-pointer border border-transparent hover:border-slate-100 group"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Shield size={20} />
              </div>
              <div>
                <span className="text-sm font-bold text-slate-700 block">Privacy & Security</span>
                <span className="text-xs text-slate-400">Manage your account security</span>
              </div>
            </div>
            <span className="text-slate-300 group-hover:text-blue-400 transition-colors">›</span>
          </Link>
          
          <Link 
            to="/settings/notifications"
            className="flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 transition-all cursor-pointer border border-transparent hover:border-slate-100 group"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                <Mail size={20} />
              </div>
              <div>
                <span className="text-sm font-bold text-slate-700 block">Notifications</span>
                <span className="text-xs text-slate-400">Manage email & push alerts</span>
              </div>
            </div>
            <span className="text-slate-300 group-hover:text-purple-400 transition-colors">›</span>
          </Link>
          
          <motion.button 
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={logout}
            className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-red-50 transition-all cursor-pointer text-red-600 mt-4 border border-red-100 group shadow-sm hover:shadow-md"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center text-red-600 group-hover:bg-red-600 group-hover:text-white transition-colors">
                <LogOut size={20} />
              </div>
              <div className="text-left">
                <span className="text-sm font-bold block">Logout</span>
                <span className="text-xs text-red-400/80">Sign out of your account</span>
              </div>
            </div>
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
