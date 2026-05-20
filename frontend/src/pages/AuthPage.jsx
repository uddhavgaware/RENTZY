import React, { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Building2, Mail, Lock, User, ArrowRight, Phone, KeyRound, Shield, Zap, Star, CheckCircle2 } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';

import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const AuthPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const isLogin = searchParams.get('mode') !== 'signup';
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

  const features = [
    { icon: Shield, text: 'Zero Brokerage — Save thousands' },
    { icon: Zap, text: 'Instant verified listings' },
    { icon: Star, text: 'KYC verified owners & tenants' },
    { icon: CheckCircle2, text: 'Direct chat with property owners' },
  ];

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      
      {/* ─── LEFT: Cinematic Branding Panel ─── */}
      <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden bg-gradient-to-br from-primary-900 via-primary-800 to-indigo-900 flex-col justify-between p-12">
        {/* Decorative blobs */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-primary-500/20 rounded-full -translate-x-1/2 -translate-y-1/2 blur-[80px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-purple-500/20 rounded-full translate-x-1/3 translate-y-1/3 blur-[80px] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-pink-500/10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-[60px] pointer-events-none" />
        
        {/* Logo */}
        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center text-white border border-white/20 group-hover:bg-white/25 transition-colors">
              <Building2 size={24} />
            </div>
            <span className="text-2xl font-black text-white tracking-tight">RentXY</span>
          </Link>
        </div>

        {/* Main copy */}
        <div className="relative z-10 my-auto">
          <h1 className="text-4xl xl:text-5xl font-black text-white leading-tight mb-6">
            Find Your{' '}
            <span className="bg-gradient-to-r from-blue-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">
              Perfect Stay
            </span>
          </h1>
          <p className="text-primary-200 text-lg leading-relaxed mb-10 max-w-md">
            Join thousands of happy tenants and property owners on India's most trusted zero-brokerage platform.
          </p>

          <div className="space-y-4">
            {features.map(({ icon: Icon, text }, i) => (
              <div key={i} className="flex items-center gap-4 group">
                <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-primary-300 group-hover:bg-white/20 transition-colors flex-shrink-0">
                  <Icon size={18} />
                </div>
                <span className="text-white/90 font-medium">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom trust signal */}
        <div className="relative z-10 flex items-center gap-3 text-white/50 text-sm">
          <div className="flex -space-x-2">
            {['👩‍💻', '👨‍🎓', '👩‍💼', '👨‍💼'].map((emoji, i) => (
              <div key={i} className="w-8 h-8 rounded-full bg-white/15 backdrop-blur flex items-center justify-center text-sm border-2 border-primary-800">
                {emoji}
              </div>
            ))}
          </div>
          <span>Trusted by <strong className="text-white/80">10,000+</strong> users across India</span>
        </div>
      </div>

      {/* ─── RIGHT: Form Panel ─── */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-12 xl:px-20 bg-mesh-gradient relative overflow-hidden">
        {/* Mobile-only decorative blobs */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-72 h-72 rounded-full bg-primary-200/30 mix-blend-multiply filter blur-[60px] lg:hidden pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-72 h-72 rounded-full bg-purple-200/30 mix-blend-multiply filter blur-[60px] lg:hidden pointer-events-none" />

        <div className="w-full max-w-md mx-auto relative z-10">
          {/* Mobile logo */}
          <div className="flex justify-center mb-6 lg:hidden">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white shadow-lg">
                <Building2 size={24} />
              </div>
              <span className="text-2xl font-black text-gray-900 tracking-tight">RentXY</span>
            </Link>
          </div>

          <h2 className="text-center text-3xl font-extrabold text-gray-900 dark:text-white mb-1">
            {activeTab === 'mobile' ? 'Welcome to RentXY' : isLogin ? 'Welcome back' : 'Create your account'}
          </h2>
          {activeTab === 'email' && (
            <p className="text-center text-sm text-gray-500 mb-8">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button 
                type="button"
                onClick={() => setSearchParams({ mode: isLogin ? 'signup' : 'login' })} 
                className="font-semibold text-primary-600 hover:text-primary-500 transition-colors"
              >
                {isLogin ? 'Sign up for free' : 'Log in'}
              </button>
            </p>
          )}
          {activeTab === 'mobile' && <div className="mb-8" />}

          <div className="bg-white dark:bg-gray-900 py-8 px-6 sm:px-8 shadow-xl shadow-gray-200/50 dark:shadow-black/50 rounded-2xl border border-gray-100 dark:border-gray-800">
            
            {/* Tabs */}
            <div className="flex bg-gray-100 dark:bg-gray-950 p-1 rounded-xl mb-6">
              <button 
                className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${activeTab === 'email' ? 'bg-white dark:bg-gray-800 shadow-sm text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                onClick={() => setActiveTab('email')}
              >
                Email
              </button>
              <button 
                className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${activeTab === 'mobile' ? 'bg-white dark:bg-gray-800 shadow-sm text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                onClick={() => setActiveTab('mobile')}
              >
                Mobile OTP
              </button>
            </div>

            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm font-medium">
                {error}
              </div>
            )}
            
            {/* Google Login */}
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
            
            {/* Divider */}
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200 dark:border-gray-800"></div></div>
              <div className="relative flex justify-center text-sm"><span className="px-3 bg-white dark:bg-gray-900 text-gray-400 dark:text-gray-500 font-medium">Or continue with</span></div>
            </div>

            {activeTab === 'email' ? (
              <div>
                {!emailOtpSent ? (
                  <form className="space-y-5" onSubmit={handleEmailSubmit}>
                {!isLogin && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none"><User className="h-5 w-5 text-gray-400" /></div>
                      <input type="text" required className="appearance-none block w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent focus:bg-white transition-all text-gray-900 font-medium" placeholder="John Doe" />
                    </div>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email address</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none"><Mail className="h-5 w-5 text-gray-400" /></div>
                    <input type="email" required className="appearance-none block w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent focus:bg-white transition-all text-gray-900 font-medium" placeholder="you@example.com" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none"><Lock className="h-5 w-5 text-gray-400" /></div>
                    <input type="password" required className="appearance-none block w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent focus:bg-white transition-all text-gray-900 font-medium" placeholder="••••••••" />
                  </div>
                </div>

                {isLogin && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <input id="remember-me" type="checkbox" className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded" />
                      <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-600">Remember me</label>
                    </div>
                    <div className="text-sm">
                      <Link to="/forgot-password" className="font-semibold text-primary-600 hover:text-primary-500">Forgot password?</Link>
                    </div>
                  </div>
                )}

                {!isLogin && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">I am a...</label>
                    <div className="grid grid-cols-2 gap-2.5 sm:flex sm:gap-2">
                      <label className="flex-1 cursor-pointer">
                        <input type="radio" name="role" value="tenant" className="peer sr-only" defaultChecked />
                        <div className="rounded-xl border-2 border-gray-200 px-2 py-2.5 text-center peer-checked:border-primary-500 peer-checked:bg-primary-50 peer-checked:text-primary-700 transition-all hover:border-gray-300"><span className="font-semibold text-sm">Tenant</span></div>
                      </label>
                      <label className="flex-1 cursor-pointer">
                        <input type="radio" name="role" value="owner" className="peer sr-only" />
                        <div className="rounded-xl border-2 border-gray-200 px-2 py-2.5 text-center peer-checked:border-primary-500 peer-checked:bg-primary-50 peer-checked:text-primary-700 transition-all hover:border-gray-300"><span className="font-semibold text-sm">Owner</span></div>
                      </label>
                      <label className="flex-1 cursor-pointer">
                        <input type="radio" name="role" value="mover" className="peer sr-only" />
                        <div className="rounded-xl border-2 border-gray-200 px-2 py-2.5 text-center peer-checked:border-gray-900 peer-checked:bg-gray-100 peer-checked:text-gray-900 transition-all hover:border-gray-300"><span className="font-semibold text-sm">Mover</span></div>
                      </label>
                      <label className="flex-1 cursor-pointer">
                        <input type="radio" name="role" value="admin" className="peer sr-only" />
                        <div className="rounded-xl border-2 border-gray-200 px-2 py-2.5 text-center peer-checked:border-purple-500 peer-checked:bg-purple-50 peer-checked:text-purple-700 transition-all hover:border-gray-300"><span className="font-semibold text-sm">Admin</span></div>
                      </label>
                    </div>
                  </div>
                )}

                <button disabled={loading} type="submit" className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl text-sm font-bold text-white bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-primary-600/25">
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Processing...
                    </div>
                  ) : (
                    <>
                      {isLogin ? 'Sign in' : 'Create Account'}
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </button>
              </form>
                ) : (
                  <form className="space-y-5" onSubmit={handleVerifyEmailOtp}>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700">Verify your Email</label>
                      <p className="text-xs text-gray-500 mb-2 mt-1">We sent a 6-digit code to <span className="font-semibold text-gray-900">{emailToVerify}</span></p>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none"><KeyRound className="h-5 w-5 text-gray-400" /></div>
                        <input type="text" required value={emailOtp} onChange={(e) => setEmailOtp(e.target.value)} maxLength="6" className="appearance-none block w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent focus:bg-white transition-all text-center tracking-widest font-bold text-gray-900" placeholder="------" />
                      </div>
                    </div>
                    <button disabled={loading} type="submit" className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl text-sm font-bold text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg shadow-green-600/25">
                      {loading ? 'Verifying...' : 'Verify & Create Account'}
                    </button>
                    <div className="text-center">
                      <button type="button" onClick={() => setEmailOtpSent(false)} className="text-sm text-primary-600 hover:underline font-medium">Change Email Address</button>
                    </div>
                  </form>
                )}
              </div>
            ) : (
              <div>
                {!otpSent ? (
                  <form className="space-y-5" onSubmit={handleSendOtp}>
                    <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 p-3 rounded-xl mb-4">
                      <p className="text-xs text-yellow-800 dark:text-yellow-200 font-medium text-center">
                        🚧 <b>Note:</b> Mobile OTP System is currently under development. Please use Email or Google Login.
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Phone Number</label>
                      <div className="relative flex rounded-xl shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none z-10"><Phone className="h-5 w-5 text-gray-400" /></div>
                        <select 
                          value={countryCode} 
                          onChange={(e) => setCountryCode(e.target.value)}
                          className="pl-11 pr-2 py-3 border border-gray-200 border-r-0 rounded-l-xl bg-gray-50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all font-medium"
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
                          className="flex-1 appearance-none block w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-r-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent focus:bg-white transition-all font-medium text-gray-900" 
                          placeholder="Enter 10-digit number" 
                        />
                      </div>
                    </div>
                    <button disabled={true} type="button" className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl text-sm font-bold text-white bg-gray-400 cursor-not-allowed transition-all shadow-sm">
                      Under Development
                    </button>
                  </form>
                ) : (
                  <form className="space-y-5" onSubmit={handleVerifyOtp}>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700">Enter 6-digit OTP</label>
                      <p className="text-xs text-primary-600 font-medium mb-2 mt-1">Note: OTP System is currently under development. For testing, please signup through a google account</p>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none"><KeyRound className="h-5 w-5 text-gray-400" /></div>
                        <input type="text" required value={otp} onChange={(e) => setOtp(e.target.value)} maxLength="6" className="appearance-none block w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent focus:bg-white transition-all text-center tracking-widest font-bold text-gray-900" placeholder="------" />
                      </div>
                    </div>
                    <button disabled={loading} type="submit" className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl text-sm font-bold text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg shadow-green-600/25">
                      {loading ? 'Verifying...' : 'Verify & Login'}
                    </button>
                    <div className="text-center">
                      <button type="button" onClick={() => setOtpSent(false)} className="text-sm text-primary-600 hover:underline font-medium">Use a different number</button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>

          {/* Terms */}
          <p className="mt-6 text-center text-xs text-gray-400">
            By continuing, you agree to our{' '}
            <Link to="/terms" className="text-primary-500 hover:underline">Terms of Service</Link>
            {' & '}
            <Link to="/terms" className="text-primary-500 hover:underline">Privacy Policy</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
