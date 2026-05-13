import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { User, Calendar, BookOpen, Briefcase, Camera, CheckCircle2 } from 'lucide-react';

const CompleteProfilePage = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    name: user?.name?.includes('User') ? '' : (user?.name || ''),
    email: user?.email || '',
    dob: '',
    gender: 'Male',
    occupation: 'Working Professional',
    phone: user?.phone || '',
    role: user?.role === 'ADMIN' ? 'ADMIN' : (user?.role || 'TENANT'),
    educationLevel: 'UG',
    collegeName: '',
    courseName: '',
    currentYear: '1st Year',
    serviceCity: '',
    companyName: '',
    jobRole: '',
    businessDescription: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const res = await api.put('/users/me', formData);
      if (res.data.token) {
        localStorage.setItem('token', res.data.token);
      }
      await refreshUser(); // Sync auth context with updated profile
      navigate('/dashboard');
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to complete profile. Please try again.';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-xl">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Complete Your Profile
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          We need a few more details before you can access the platform.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {error && (
            <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          
          <form className="space-y-6" onSubmit={handleSubmit}>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Full Name *</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input type="text" name="name" value={formData.name} onChange={handleChange} required
                    className="pl-10 w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-primary-500 focus:border-primary-500" placeholder="John Doe" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Mobile Number *</label>
                <div className="mt-1">
                  <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required
                    className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-primary-500 focus:border-primary-500" placeholder="9876543210" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Email Address *</label>
                <div className="mt-1">
                  <input type="email" name="email" value={formData.email} onChange={handleChange} required
                    className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-primary-500 focus:border-primary-500" placeholder="you@example.com" />
                  {formData.email.endsWith('@rentxy.local') && (
                    <p className="text-xs text-red-500 mt-1">Please provide a valid email address.</p>
                  )}
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">I am a</label>
                <div className="grid grid-cols-3 gap-4">
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, role: 'TENANT'})}
                    className={`p-4 rounded-xl border-2 text-center transition-all ${
                      formData.role === 'TENANT' 
                        ? 'border-primary-600 bg-primary-50 text-primary-700' 
                        : 'border-gray-200 hover:border-primary-200'
                    }`}
                  >
                    <span className="block font-bold">Tenant</span>
                    <span className="text-xs text-gray-500">Looking for a place</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, role: 'OWNER'})}
                    className={`p-4 rounded-xl border-2 text-center transition-all ${
                      formData.role === 'OWNER' 
                        ? 'border-primary-600 bg-primary-50 text-primary-700' 
                        : 'border-gray-200 hover:border-primary-200'
                    }`}
                  >
                    <span className="block font-bold">Owner</span>
                    <span className="text-xs text-gray-500">Listing a property</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, role: 'MOVER'})}
                    className={`p-4 rounded-xl border-2 text-center transition-all ${
                      formData.role === 'MOVER' 
                        ? 'border-primary-600 bg-primary-50 text-primary-700' 
                        : 'border-gray-200 hover:border-primary-200'
                    }`}
                  >
                    <span className="block font-bold">Mover</span>
                    <span className="text-xs text-gray-500">Service Provider</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Date of Birth *</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-gray-400" />
                  </div>
                  <input type="date" name="dob" value={formData.dob} onChange={handleChange} required
                    className="pl-10 w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-primary-500 focus:border-primary-500" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Gender *</label>
                <div className="mt-1">
                  <select name="gender" value={formData.gender} onChange={handleChange} required
                    className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-primary-500 focus:border-primary-500">
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>


            </div>

            {formData.role === 'TENANT' && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Occupation *</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Briefcase className="h-5 w-5 text-gray-400" />
                  </div>
                  <select name="occupation" value={formData.occupation} onChange={handleChange} required
                    className="pl-10 w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-primary-500 focus:border-primary-500">
                    <option value="Working Professional">Working Professional</option>
                    <option value="Student">Student</option>
                    <option value="Business">Business</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            )}

            {formData.role === 'TENANT' && formData.occupation === 'Student' && (
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-4">
                <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2"><BookOpen size={16}/> Student Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700">Education Level</label>
                    <select name="educationLevel" value={formData.educationLevel} onChange={handleChange}
                      className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-primary-500 focus:border-primary-500">
                      <option value="UG">Undergraduate (UG)</option>
                      <option value="PG">Postgraduate (PG)</option>
                      <option value="Diploma">Diploma</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700">Current Year</label>
                    <select name="currentYear" value={formData.currentYear} onChange={handleChange}
                      className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-primary-500 focus:border-primary-500">
                      <option value="1st Year">1st Year</option>
                      <option value="2nd Year">2nd Year</option>
                      <option value="3rd Year">3rd Year</option>
                      <option value="4th Year">4th Year</option>
                      <option value="5th Year">5th Year</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-700">College Name</label>
                    <input type="text" name="collegeName" value={formData.collegeName} onChange={handleChange} placeholder="e.g. Pune University"
                      className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-primary-500 focus:border-primary-500" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-700">Course Name</label>
                    <input type="text" name="courseName" value={formData.courseName} onChange={handleChange} placeholder="e.g. B.Tech Computer Science"
                      className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-primary-500 focus:border-primary-500" />
                  </div>
                </div>
              </div>
            )}

            {formData.role === 'TENANT' && formData.occupation === 'Working Professional' && (
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-4">
                <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2"><Briefcase size={16}/> Professional Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-700">Company Name *</label>
                    <input type="text" name="companyName" value={formData.companyName} onChange={handleChange} placeholder="e.g. Infosys, TCS" required
                      className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-primary-500 focus:border-primary-500" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-700">Job Role / Designation *</label>
                    <input type="text" name="jobRole" value={formData.jobRole} onChange={handleChange} placeholder="e.g. Software Engineer, Marketing Manager" required
                      className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-primary-500 focus:border-primary-500" />
                  </div>
                </div>
              </div>
            )}

            {formData.role === 'TENANT' && formData.occupation === 'Business' && (
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-4">
                <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2"><Briefcase size={16}/> Business Details</h4>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700">Business Description / Domain *</label>
                    <input type="text" name="businessDescription" value={formData.businessDescription} onChange={handleChange} placeholder="e.g. Retail Shop, Freelance Designer, Agency" required
                      className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-primary-500 focus:border-primary-500" />
                  </div>
                </div>
              </div>
            )}

            {formData.role === 'MOVER' && (
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-4">
                <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2"><Briefcase size={16}/> Vendor Details</h4>
                <div>
                  <label className="block text-xs font-medium text-gray-700">Service City *</label>
                  <input type="text" name="serviceCity" value={formData.serviceCity} onChange={handleChange} placeholder="e.g. Mumbai, Bangalore"
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-primary-500 focus:border-primary-500" required />
                  <p className="text-xs text-gray-500 mt-1">You will only receive moving requests where the From or To location contains this city.</p>
                </div>
                <div className="bg-blue-50 text-blue-800 p-3 rounded-lg text-xs font-medium">
                  Note: You must upload your KYC documents in your Dashboard after completing your profile to get Verified. Only Verified Partners can accept jobs.
                </div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-70"
              >
                {loading ? 'Saving Profile...' : 'Complete Profile & Continue'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CompleteProfilePage;
