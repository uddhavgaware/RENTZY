import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Building2, Mail, Lock, User, ArrowRight, Phone, KeyRound, Shield, Zap, Star, CheckCircle2 } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';

import { useAuth } from '../context/AuthContext';
import api, { isNativePlatform } from '../services/api';
import Truecaller from '../plugins/Truecaller';

const AuthPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const isLogin = searchParams.get('mode') !== 'signup';
  const [activeTab, setActiveTab] = useState('email'); // 'email' or 'truecaller'
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailToVerify, setEmailToVerify] = useState('');
  const [emailOtp, setEmailOtp] = useState('');

  const { login, register, loginWithGoogle, loginWithTruecaller, loginWithOtp, verifyEmailOtp } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'truecaller' && import.meta.env.VITE_TRUECALLER_APP_KEY) {
      // Initialize Truecaller Web SDK
      const truecallerSdkContainer = document.getElementById('truecaller-web-sdk-container');
      
      if (truecallerSdkContainer && window.TruecallerAuth) {
        truecallerSdkContainer.innerHTML = ''; // Clear loading text
        
        // Define callbacks globally for Truecaller Web SDK
        window.onTruecallerLoginSuccess = async (response) => {
           try {
             setLoading(true);
             await loginWithTruecaller(response.payload, response.signature, response.signatureAlgorithm);
             navigate('/dashboard', { replace: true });
           } catch(err) {
             setError(err?.message || 'Truecaller Web Login Failed');
           } finally {
             setLoading(false);
           }
        };

        window.onTruecallerLoginFailure = (error) => {
           setError('Truecaller Login Error: ' + error);
        };

        window.TruecallerAuth.init({
          appKey: import.meta.env.VITE_TRUECALLER_APP_KEY,
          onSuccess: window.onTruecallerLoginSuccess,
          onFailure: window.onTruecallerLoginFailure,
          type: 4, // 4 indicates a button
          color: 'blue',
          shape: 'rect'
        });

        // Trigger rendering of widget inside the container
        window.TruecallerAuth.render('truecaller-web-sdk-container');
      }
    }
  }, [activeTab]);

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
        navigate('/dashboard', { replace: true });
      } else {
        const name = form.querySelector('input[type="text"]').value;
        const role = form.querySelector('input[name="role"]:checked').value.toUpperCase();
        await register(name, email, password, role);
        setEmailToVerify(email);
        setEmailOtpSent(true);
      }
    } catch (err) {
      // Handle network errors (common on Android when API is unreachable)
      if (!err.response && (err.message === 'Network Error' || err.code === 'ERR_NETWORK')) {
        setError('Cannot reach the server. Please check your internet connection and try again.');
      } else {
        setError(err.response?.data?.message || err.userMessage || err.message || 'An error occurred during authentication');
      }
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
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired OTP');
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
            {activeTab === 'truecaller' ? 'Welcome to RentXY' : isLogin ? 'Welcome back' : 'Create your account'}
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
          {activeTab === 'truecaller' && <div className="mb-8" />}

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
                className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${activeTab === 'truecaller' ? 'bg-white dark:bg-gray-800 shadow-sm text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                onClick={() => setActiveTab('truecaller')}
              >
                Truecaller
              </button>
            </div>

            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm font-medium">
                {error}
              </div>
            )}

            {/* Google Login */}
            <div className="mb-6 flex flex-col items-center gap-3">
              {import.meta.env.VITE_GOOGLE_CLIENT_ID ? (
                <GoogleLogin
                  onSuccess={async (credentialResponse) => {
                    try {
                      setLoading(true);
                      await loginWithGoogle(credentialResponse.credential);
                      navigate('/dashboard', { replace: true });
                    } catch (err) {
                      setError(err.response?.data?.message || 'Google Login failed');
                    } finally {
                      setLoading(false);
                    }
                  }}
                  onError={() => setError('Google Login Failed')}
                  theme="outline" size="large" shape="pill"
                />
              ) : (
                <button onClick={() => setError('Google Login is not configured. Please add VITE_GOOGLE_CLIENT_ID to your .env file.')} className="w-full max-w-[250px] bg-white border border-gray-300 text-gray-700 py-2 rounded-full text-sm font-medium flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors">
                  <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                  Sign in with Google
                </button>
              )}
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
              <div className="py-8 text-center flex flex-col items-center animate-fadeIn">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                  <Shield className="h-8 w-8 text-[#2F5299]" />
                </div>
                <h3 className="text-xl font-extrabold text-gray-900 dark:text-white mb-2">One-tap Login</h3>
                <p className="text-sm text-gray-500 mb-6 max-w-[250px] mx-auto">
                  Sign in instantly and securely using your Truecaller account.
                </p>
                {isNativePlatform() ? (
                  <button 
                    disabled={loading}
                    onClick={async () => {
                      try {
                        setLoading(true);
                        const tcResult = await Truecaller.authenticate();
                        await loginWithTruecaller(tcResult.payload, tcResult.signature, tcResult.signatureAlgorithm);
                        navigate('/dashboard', { replace: true });
                      } catch (err) {
                        setError(err?.message || 'Truecaller login failed or cancelled');
                      } finally {
                        setLoading(false);
                      }
                    }}
                    className="w-full max-w-[260px] bg-[#2F5299] text-white py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-[#203D78] transition-all shadow-lg shadow-[#2F5299]/30 active:scale-95 disabled:opacity-70"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Connecting...
                      </div>
                    ) : (
                      <>
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M17.5 2C15 2 13 4 13 6.5C13 9 15 11 17.5 11C20 11 22 9 22 6.5C22 4 20 2 17.5 2Z" fill="white"/>
                          <path d="M12 2C9.5 2 7.5 4 7.5 6.5C7.5 9 9.5 11 12 11C14.5 11 16.5 9 16.5 6.5C16.5 4 14.5 2 12 2Z" fill="white" opacity="0.6"/>
                          <path d="M6.5 2C4 2 2 4 2 6.5C2 9 4 11 6.5 11C9 11 11 9 11 6.5C11 4 9 2 6.5 2Z" fill="white" opacity="0.3"/>
                          <path d="M12 13C6.48 13 2 15.69 2 19V22H22V19C22 15.69 17.52 13 12 13Z" fill="white"/>
                        </svg>
                        Sign in with Truecaller
                      </>
                    )}
                  </button>
                ) : (
                  <div className="w-full max-w-[260px] flex flex-col items-center">
                    {import.meta.env.VITE_TRUECALLER_APP_KEY ? (
                      <div id="truecaller-web-sdk-container" className="w-full min-h-[50px] flex items-center justify-center">
                        <span className="text-sm text-gray-500 font-medium">Truecaller Widget Loading...</span>
                        {/* The Truecaller JS snippet will mount here */}
                      </div>
                    ) : (
                      <button 
                        onClick={() => setError('Truecaller Web Login is not configured. Please add VITE_TRUECALLER_APP_KEY to your .env file.')}
                        className="w-full bg-[#2F5299] text-white py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-[#203D78] transition-all shadow-lg shadow-[#2F5299]/30 active:scale-95"
                      >
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M17.5 2C15 2 13 4 13 6.5C13 9 15 11 17.5 11C20 11 22 9 22 6.5C22 4 20 2 17.5 2Z" fill="white"/>
                          <path d="M12 2C9.5 2 7.5 4 7.5 6.5C7.5 9 9.5 11 12 11C14.5 11 16.5 9 16.5 6.5C16.5 4 14.5 2 12 2Z" fill="white" opacity="0.6"/>
                          <path d="M6.5 2C4 2 2 4 2 6.5C2 9 4 11 6.5 11C9 11 11 9 11 6.5C11 4 9 2 6.5 2Z" fill="white" opacity="0.3"/>
                          <path d="M12 13C6.48 13 2 15.69 2 19V22H22V19C22 15.69 17.52 13 12 13Z" fill="white"/>
                        </svg>
                        Sign in with Truecaller
                      </button>
                    )}
                  </div>
                )}
                <div className="mt-4 text-xs text-gray-400 font-medium max-w-[200px]">
                  Verified by Truecaller SDK
                </div>
              </div>
            )}
          </div>

          {/* Terms */}
          <p className="mt-6 text-center text-xs text-gray-400">
            By continuing, you agree to our{' '}
            <Link to="/terms" className="text-primary-500 hover:underline">Terms of Service</Link>
            {' & '}
            <Link to="/privacy" className="text-primary-500 hover:underline">Privacy Policy</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
