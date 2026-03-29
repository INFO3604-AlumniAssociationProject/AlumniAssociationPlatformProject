import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import { useToast } from '../components/Toast';
import { API_BASE } from '../apiConfig';

export default function Register() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    graduationYear: '2020',
    faculty: '',
    degree: '',
    currentJobTitle: '',
    company: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/users/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          role: 'alumni',
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      showToast(data.message || 'Account created successfully! Please login.', 'success');
      navigate('/login');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Registration failed';
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col justify-center min-h-[calc(100vh-100px)]">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="ui-card rounded-2xl p-6 mb-4"
      >
        <div className="flex items-center mb-6">
          <Link to="/welcome" className="p-2 rounded-full hover:bg-slate-100 transition-colors mr-2">
            <ArrowLeft size={20} className="text-slate-600" />
          </Link>
          <h1 className="text-xl font-bold text-[var(--uwi-blue-800)]">Create Account</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-600 block mb-1">Full Name</label>
            <input 
              type="text" 
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-[var(--uwi-blue-600)] focus:ring-2 focus:ring-blue-100 outline-none transition-all"
              placeholder="Aaron Baptiste"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-600 block mb-1">Email</label>
            <input 
              type="email" 
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-[var(--uwi-blue-600)] focus:ring-2 focus:ring-blue-100 outline-none transition-all"
              placeholder="name@mail.com"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-600 block mb-1">Password</label>
            <input 
              type="password" 
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-[var(--uwi-blue-600)] focus:ring-2 focus:ring-blue-100 outline-none transition-all"
              placeholder="••••••••"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-slate-600 block mb-1">Grad Year</label>
              <input 
                type="number" 
                name="graduationYear"
                value={formData.graduationYear}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-[var(--uwi-blue-600)] focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                min="1950"
                max="2030"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600 block mb-1">Faculty</label>
              <select 
                name="faculty"
                value={formData.faculty}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-[var(--uwi-blue-600)] focus:ring-2 focus:ring-blue-100 outline-none transition-all bg-white"
                required
              >
                <option value="">Select...</option>
                <option value="Engineering">Engineering</option>
                <option value="Science & Tech">Science & Technology</option>
                <option value="Social Sciences">Social Sciences</option>
                <option value="Humanities">Humanities and Education</option>
                <option value="Medical Sciences">Medical Sciences</option>
                <option value="Law">Law</option>
                <option value="Food & Agriculture">Food & Agriculture</option>
                <option value="Sport">Sport</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-600 block mb-1">Degree</label>
            <input 
              type="text" 
              name="degree"
              value={formData.degree}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-[var(--uwi-blue-600)] focus:ring-2 focus:ring-blue-100 outline-none transition-all"
              placeholder="BSc Computer Science"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="btn ui-btn w-full py-3 rounded-xl font-medium mt-6 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
          
          <div className="text-center mt-4">
            <Link to="/login" className="text-sm text-[var(--uwi-blue-600)] hover:underline">
              Already have an account? Login
            </Link>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
