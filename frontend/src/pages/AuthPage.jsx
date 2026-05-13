import React, { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Building2, Mail, Lock, User, ArrowRight, Phone, KeyRound } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';

import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const AuthPage = () => {
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get('mode') === 'signup' ? 'signup' : 'login';
  const [isLogin, setIsLogin] = useState(initialMode === 'login');
  const [activeTab, setActiveTab] = useState('email'); // 'email' or 'mobile'
  const [otpSent, setOtpSent] = useState(false);
  const [countryCode, setCountryCode] = useState('+91');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailToVerify, setEmailToVerify] = useState('');
  const [emailOtp, setEmailOtp] = useState('');
  
  const { login, register, loginWithGoogle, loginWithOtp, verifyEmailOtp } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const form = e.target;
      const email = form.querySelector('input[type="email"]').value;
      const password = form.querySelector('input[type="password"]').value;
      
      if (isLogin) {
        await login(email, password);
        window.location.href = '/dashboard';
      } else {
        const name = form.querySelector('input[type="text"]').value;
        const role = form.querySelector('input[name="role"]:checked').value.toUpperCase();
        await register(name, email, password, role);
        setEmailToVerify(email);
        setEmailOtpSent(true);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'An error occurred during authentication');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmailOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await verifyEmailOtp(emailToVerify, emailOtp);
      window.location.href = '/dashboard';
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (phone.length !== 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }
    setError('');
    setLoading(true);
    const fullPhone = `${countryCode}${phone}`;
    try {
      await api.post('/auth/send-otp', { phone: fullPhone });
      setOtpSent(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const fullPhone = `${countryCode}${phone}`;
    try {
      await loginWithOtp(fullPhone, otp);
      window.location.href = '/dashboard';
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-primary-100 opacity-50 mix-blend-multiply filter blur-3xl"></div>
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 rounded-full bg-purple-100 opacity-50 mix-blend-multiply filter blur-3xl"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white shadow-lg">
            <Building2 size={28} />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {activeTab === 'mobile' ? 'Welcome to RentXY' : isLogin ? 'Welcome back to RentXY' : 'Create your RentXY account'}
        </h2>
        {activeTab === 'email' && (
          <p className="mt-2 text-center text-sm text-gray-600">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button 
              type="button"
              onClick={() => setIsLogin(!isLogin)} 
              className="font-medium text-primary-600 hover:text-primary-500 transition-colors"
            >
              {isLogin ? 'Sign up' : 'Log in'}
            </button>
          </p>
        )}
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white py-8 px-4 shadow-xl shadow-gray-200/50 sm:rounded-2xl sm:px-10 border border-gray-100">
          
          <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
            <button 
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'email' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('email')}
            >
              Email
            </button>
            <button 
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'mobile' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('mobile')}
            >
              Mobile OTP
            </button>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}
          
          <div className="mb-6 flex justify-center">
            <GoogleLogin
              onSuccess={async (credentialResponse) => {
                try {
                  setLoading(true);
                  await loginWithGoogle(credentialResponse.credential);
                  window.location.href = '/dashboard';
                } catch (err) {
                  setError(err.response?.data?.message || 'Google Login failed');
                  setLoading(false);
                }
              }}
              onError={() => setError('Google Login Failed')}
              theme="outline" size="large" shape="pill"
            />
          </div>
          
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
            <div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-gray-500">Or continue with</span></div>
          </div>

          {activeTab === 'email' ? (
            <div>
              {!emailOtpSent ? (
                <form className="space-y-6" onSubmit={handleEmailSubmit}>
              {!isLogin && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Full Name</label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><User className="h-5 w-5 text-gray-400" /></div>
                    <input type="text" required className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all" placeholder="John Doe" />
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700">Email address</label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Mail className="h-5 w-5 text-gray-400" /></div>
                  <input type="email" required className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all" placeholder="you@example.com" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Lock className="h-5 w-5 text-gray-400" /></div>
                  <input type="password" required className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all" placeholder="••••••••" />
                </div>
              </div>

              {isLogin && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input id="remember-me" type="checkbox" className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded" />
                    <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">Remember me</label>
                  </div>
                  <div className="text-sm">
                    <Link to="/forgot-password" className="font-medium text-primary-600 hover:text-primary-500">Forgot password?</Link>
                  </div>
                </div>
              )}

              {!isLogin && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">I am a...</label>
                  <div className="grid grid-cols-2 gap-3 sm:flex sm:space-x-2 sm:gap-0">
                    <label className="flex-1 cursor-pointer">
                      <input type="radio" name="role" value="tenant" className="peer sr-only" defaultChecked />
                      <div className="rounded-xl border border-gray-200 px-2 py-3 text-center peer-checked:border-primary-500 peer-checked:bg-primary-50 peer-checked:text-primary-700 transition-all"><span className="font-medium text-sm">Tenant</span></div>
                    </label>
                    <label className="flex-1 cursor-pointer">
                      <input type="radio" name="role" value="owner" className="peer sr-only" />
                      <div className="rounded-xl border border-gray-200 px-2 py-3 text-center peer-checked:border-primary-500 peer-checked:bg-primary-50 peer-checked:text-primary-700 transition-all"><span className="font-medium text-sm">Owner</span></div>
                    </label>
                    <label className="flex-1 cursor-pointer">
                      <input type="radio" name="role" value="mover" className="peer sr-only" />
                      <div className="rounded-xl border border-gray-200 px-2 py-3 text-center peer-checked:border-gray-900 peer-checked:bg-gray-100 peer-checked:text-gray-900 transition-all"><span className="font-medium text-sm">Mover</span></div>
                    </label>
                    <label className="flex-1 cursor-pointer">
                      <input type="radio" name="role" value="admin" className="peer sr-only" />
                      <div className="rounded-xl border border-gray-200 px-2 py-3 text-center peer-checked:border-purple-500 peer-checked:bg-purple-50 peer-checked:text-purple-700 transition-all"><span className="font-medium text-sm">Admin</span></div>
                    </label>
                  </div>
                </div>
              )}

              <button disabled={loading} type="submit" className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed">
                {loading ? 'Processing...' : isLogin ? 'Sign in' : 'Create Account'}
                {!loading && <ArrowRight className="ml-2 h-5 w-5" />}
              </button>
            </form>
              ) : (
                <form className="space-y-6" onSubmit={handleVerifyEmailOtp}>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Verify your Email</label>
                    <p className="text-xs text-gray-500 mb-2 mt-1">We sent a 6-digit code to <span className="font-semibold text-gray-900">{emailToVerify}</span></p>
                    <div className="mt-1 relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><KeyRound className="h-5 w-5 text-gray-400" /></div>
                      <input type="text" required value={emailOtp} onChange={(e) => setEmailOtp(e.target.value)} maxLength="6" className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-center tracking-widest font-bold" placeholder="------" />
                    </div>
                  </div>
                  <button disabled={loading} type="submit" className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 transition-all">
                    {loading ? 'Verifying...' : 'Verify & Create Account'}
                  </button>
                  <div className="text-center">
                    <button type="button" onClick={() => setEmailOtpSent(false)} className="text-sm text-primary-600 hover:underline">Change Email Address</button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            <div>
              {!otpSent ? (
                <form className="space-y-6" onSubmit={handleSendOtp}>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                    <div className="mt-1 relative flex rounded-xl shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10"><Phone className="h-5 w-5 text-gray-400" /></div>
                      <select 
                        value={countryCode} 
                        onChange={(e) => setCountryCode(e.target.value)}
                        className="pl-10 pr-2 py-3 border border-gray-200 border-r-0 rounded-l-xl bg-gray-50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                      >
                        <option value="+91">+91 (IND)</option>
                        <option value="+1">+1 (US/CA)</option>
                        <option value="+44">+44 (UK)</option>
                        <option value="+61">+61 (AUS)</option>
                        <option value="+971">+971 (UAE)</option>
                      </select>
                      <input 
                        type="tel" 
                        required 
                        value={phone} 
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} 
                        className="flex-1 appearance-none block w-full px-3 py-3 border border-gray-200 rounded-r-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all" 
                        placeholder="Enter 10-digit number" 
                      />
                    </div>
                  </div>
                  <button disabled={loading} type="submit" className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 transition-all">
                    {loading ? 'Sending...' : 'Send OTP Code'}
                  </button>
                </form>
              ) : (
                <form className="space-y-6" onSubmit={handleVerifyOtp}>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Enter 6-digit OTP</label>
                    <p className="text-xs text-primary-600 font-medium mb-2 mt-1">Note: OTP System is currently under development. For testing, please signup through a google account</p>
                    <div className="mt-1 relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><KeyRound className="h-5 w-5 text-gray-400" /></div>
                      <input type="text" required value={otp} onChange={(e) => setOtp(e.target.value)} maxLength="6" className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-center tracking-widest font-bold" placeholder="------" />
                    </div>
                  </div>
                  <button disabled={loading} type="submit" className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 transition-all">
                    {loading ? 'Verifying...' : 'Verify & Login'}
                  </button>
                  <div className="text-center">
                    <button type="button" onClick={() => setOtpSent(false)} className="text-sm text-primary-600 hover:underline">Use a different number</button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
