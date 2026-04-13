// File: Profile.tsx

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { useData } from '../DataContext';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { User, Mail, Shield, Settings, LogOut, Camera, Edit2, MapPin, Briefcase, X, Lock, Unlock, Eye, EyeOff, Plus, Trash2, ArrowLeft } from 'lucide-react';
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
    role: userProfile.role,
    skills: userProfile.skills?.join(', ') || '',
    experience: userProfile.experience || []
  });

  useEffect(() => {
    setEditForm({
      name: userProfile.name,
      email: userProfile.email,
      bio: userProfile.bio,
      role: userProfile.role,
      skills: userProfile.skills?.join(', ') || '',
      experience: userProfile.experience || []
    });
  }, [userProfile]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const skillsArray = editForm.skills.split(',').map(s => s.trim()).filter(Boolean);
    await updateProfile({ ...editForm, skills: skillsArray, experience: editForm.experience });
    setIsEditing(false);
    showToast('Profile updated!', 'success');
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
          await updateProfile({ coverImage: result });
          showToast('Cover photo updated!', 'success');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddExperience = () => {
    setEditForm({
      ...editForm,
      experience: [...editForm.experience, { id: Date.now().toString(), title: '', company: '', duration: '', description: '' }]
    });
  };

  const handleRemoveExperience = (id: string) => {
    setEditForm({ ...editForm, experience: editForm.experience.filter(exp => exp.id !== id) });
  };

  const handleExperienceChange = (id: string, field: string, value: string) => {
    setEditForm({
      ...editForm,
      experience: editForm.experience.map(exp => exp.id === id ? { ...exp, [field]: value } : exp)
    });
  };

  const calculateCompleteness = () => {
    let score = 0;
    if (userProfile.name) score += 15;
    if (userProfile.email) score += 15;
    if (userProfile.bio) score += 20;
    if (userProfile.avatar && !userProfile.avatar.includes('ui-avatars.com')) score += 10;
    if (userProfile.coverImage && userProfile.coverImage !== placeholderImage) score += 10;
    if (userProfile.skills?.length) score += 15;
    if (userProfile.experience?.length) score += 15;
    return score;
  };

  const completeness = calculateCompleteness();

  return (
    <div className="space-y-6 pt-2 max-w-2xl mx-auto pb-10">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="ui-card rounded-3xl overflow-hidden shadow-sm border border-slate-100/50 bg-white">
        {/* Cover Image */}
        <div className="h-48 bg-slate-200 relative group">
          <img src={userProfile.coverImage} alt="Cover" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = placeholderImage; }} />
          <button onClick={() => coverInputRef.current?.click()} className="absolute bottom-4 right-4 px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-xl text-white text-xs font-bold opacity-0 group-hover:opacity-100 transition-all flex items-center gap-2">
            <Camera size={14} /> Change Cover
          </button>
          <input type="file" ref={coverInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'cover')} />
        </div>

        <div className="px-6 pb-6 relative">
          {/* Avatar */}
          <div className="relative -mt-16 mb-4 flex justify-between items-end">
            <div className="relative group">
              <div className="w-32 h-32 rounded-full border-[6px] border-white overflow-hidden bg-white shadow-lg">
                <img src={userProfile.avatar} alt={userProfile.name} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = placeholderImage; }} />
              </div>
              <button onClick={() => fileInputRef.current?.click()} className="absolute bottom-2 right-2 w-8 h-8 bg-blue-600 rounded-full text-white flex items-center justify-center border-2 border-white hover:bg-blue-700 transition-all shadow-md">
                <Camera size={14} />
              </button>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'avatar')} />
            </div>
            
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setIsEditing(!isEditing)} className={`mb-2 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 ${isEditing ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-700'}`}>
              {isEditing ? <X size={14} /> : <Edit2 size={14} />} {isEditing ? 'Cancel' : 'Edit Profile'}
            </motion.button>
          </div>

          {/* Profile Info */}
          {!isEditing ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-slate-800">{userProfile.name}</h1>
                  <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${userProfile.isPrivate ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {userProfile.isPrivate ? <Lock size={10} /> : <Unlock size={10} />} {userProfile.isPrivate ? 'Private' : 'Public'}
                  </div>
                </div>
                <p className="text-sm font-medium text-blue-600 uppercase tracking-wider">{userProfile.role}</p>
              </div>
              
              <div className="bg-slate-50 rounded-2xl p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-bold">Profile Completeness</span>
                  <span className="text-sm font-bold text-blue-600">{completeness}%</span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${completeness}%` }} className={`h-full rounded-full ${completeness === 100 ? 'bg-emerald-500' : completeness > 70 ? 'bg-blue-500' : 'bg-amber-500'}`} />
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-800 mb-2 uppercase tracking-wider">About</h3>
                <p className="text-sm text-slate-600">{userProfile.bio || 'No bio provided.'}</p>
              </div>

              {userProfile.skills && userProfile.skills.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-slate-800 mb-3 uppercase">Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {userProfile.skills.map((skill, i) => <span key={i} className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-xl text-xs font-bold">{skill}</span>)}
                  </div>
                </div>
              )}

              {userProfile.experience && userProfile.experience.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-slate-800 mb-4 uppercase">Experience</h3>
                  <div className="space-y-4">
                    {userProfile.experience.map(exp => (
                      <div key={exp.id} className="relative pl-6 before:absolute before:left-0 before:top-1.5 before:w-2 before:h-2 before:bg-blue-500 before:rounded-full after:absolute after:left-[3px] after:top-4 after:bottom-[-16px] after:w-0.5 after:bg-slate-100 last:after:hidden">
                        <h4 className="font-bold text-slate-800 text-sm">{exp.title}</h4>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mb-1"><span className="font-medium text-blue-600">{exp.company}</span><span>•</span><span>{exp.duration}</span></div>
                        {exp.description && <p className="text-sm text-slate-600 mt-1">{exp.description}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex flex-wrap gap-4 pt-6 border-t border-slate-100">
                <div className="flex items-center gap-2 text-xs font-medium text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg"><Briefcase size={14} /> {userProfile.experience?.[0]?.title || 'Professional'}</div>
                <div className="flex items-center gap-2 text-xs font-medium text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg"><MapPin size={14} /> Trinidad & Tobago</div>
                <div className="flex items-center gap-2 text-xs font-medium text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg"><Mail size={14} /> {userProfile.email}</div>
              </div>
            </motion.div>
          ) : (
            <motion.form initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} onSubmit={handleUpdateProfile} className="space-y-6 mt-2 bg-slate-50 p-5 rounded-3xl">
              <div className="flex items-center justify-between mb-2">
                <button type="button" onClick={() => setIsEditing(false)} className="flex items-center gap-2 text-xs font-bold text-slate-500"><ArrowLeft size={14} /> Back</button>
                <h2 className="text-sm font-bold text-slate-800 uppercase">Edit Profile</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 ml-1 uppercase">Full Name</label>
                  <input type="text" value={editForm.name} onChange={(e) => setEditForm({...editForm, name: e.target.value})} className="w-full p-3 rounded-xl bg-white border border-slate-200 text-sm capitalize-first" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 ml-1 uppercase">Email</label>
                  <input type="email" value={editForm.email} onChange={(e) => setEditForm({...editForm, email: e.target.value})} className="w-full p-3 rounded-xl bg-white border border-slate-200 text-sm" />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 ml-1 uppercase">Bio</label>
                <textarea value={editForm.bio} onChange={(e) => setEditForm({...editForm, bio: e.target.value})} className="w-full p-3 rounded-xl bg-white border border-slate-200 text-sm h-24" placeholder="Tell us about yourself..." />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 ml-1 uppercase">Skills (comma separated)</label>
                <input type="text" value={editForm.skills} onChange={(e) => setEditForm({...editForm, skills: e.target.value})} className="w-full p-3 rounded-xl bg-white border border-slate-200 text-sm" placeholder="e.g. React, Node.js" />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-bold text-slate-500 ml-1 uppercase">Experience</label>
                  <button type="button" onClick={handleAddExperience} className="flex items-center gap-1 text-xs font-bold text-blue-600"><Plus size={12} /> Add Role</button>
                </div>
                
                <div className="space-y-4">
                  {editForm.experience.map(exp => (
                    <div key={exp.id} className="p-4 bg-white rounded-2xl border border-slate-200 relative">
                      <button type="button" onClick={() => handleRemoveExperience(exp.id)} className="absolute top-3 right-3 text-slate-400 hover:text-red-500"><Trash2 size={16} /></button>
                      <div className="grid grid-cols-2 gap-3 mb-3 pr-6">
                        <input type="text" value={exp.title} onChange={(e) => handleExperienceChange(exp.id, 'title', e.target.value)} placeholder="Job Title" className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm capitalize-first" />
                        <input type="text" value={exp.company} onChange={(e) => handleExperienceChange(exp.id, 'company', e.target.value)} placeholder="Company" className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm capitalize-first" />
                      </div>
                      <div className="mb-3">
                        <input type="text" value={exp.duration} onChange={(e) => handleExperienceChange(exp.id, 'duration', e.target.value)} placeholder="Duration (e.g. 2020 - Present)" className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm" />
                      </div>
                      <div>
                        <textarea value={exp.description} onChange={(e) => handleExperienceChange(exp.id, 'description', e.target.value)} placeholder="Description" className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm h-20" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button type="button" onClick={() => setIsEditing(false)} className="px-6 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-sm font-bold flex items-center gap-2"><ArrowLeft size={16} /> Back</button>
                <button type="submit" className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold">Save Changes</button>
              </div>
            </motion.form>
          )}
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="ui-card rounded-3xl p-6 bg-white">
        <h2 className="font-bold text-slate-800 mb-5 flex items-center gap-2 text-lg"><Settings size={20} /> Settings</h2>
        <div className="space-y-3">
          <div onClick={() => updateProfile({ isPrivate: !userProfile.isPrivate })} className="flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 cursor-pointer">
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${userProfile.isPrivate ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>{userProfile.isPrivate ? <EyeOff size={20} /> : <Eye size={20} />}</div>
              <div><span className="text-sm font-bold">Profile Visibility</span><span className="text-xs text-slate-400 block">{userProfile.isPrivate ? 'Private' : 'Public'}</span></div>
            </div>
            <div className={`text-xs font-bold px-2 py-1 rounded-lg ${userProfile.isPrivate ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>{userProfile.isPrivate ? 'Switch to Public' : 'Switch to Private'}</div>
          </div>
          <Link to="/settings/privacy" className="flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50">
            <div className="flex items-center gap-4"><Shield size={20} className="text-blue-600" /><div><span className="text-sm font-bold">Privacy & Security</span><span className="text-xs text-slate-400 block">Manage account security</span></div></div>
            <span className="text-slate-300">›</span>
          </Link>
          <Link to="/settings/notifications" className="flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50">
            <div className="flex items-center gap-4"><Mail size={20} className="text-purple-600" /><div><span className="text-sm font-bold">Notifications</span><span className="text-xs text-slate-400 block">Manage alerts</span></div></div>
            <span className="text-slate-300">›</span>
          </Link>
          <motion.button 
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={logout}
            className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-red-100 transition-all cursor-pointer text-red-600 mt-4 border border-red-100 group shadow-sm hover:shadow-md"
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