import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 🔥 Warmup ping — wake the Render backend immediately on page load.
    // Uses a lightweight HEAD request so the server starts booting while the
    // user sees the landing page. This cuts perceived cold-start from ~50s to ~10-15s.
    fetch(
      (import.meta.env.VITE_API_URL || 'https://rentxybookings.onrender.com/api')
        .replace(/\/api\/?$/, '/api/health'),
      { method: 'HEAD', mode: 'cors' }
    ).catch(() => {});

    // Check if user is logged in on mount and fetch fresh profile
    const token = localStorage.getItem('token');
    if (token) {
      api.get('/users/me')
        .then(res => {
          setUser({
            id: res.data.id,
            userCode: res.data.userCode,
            email: res.data.email,
            name: res.data.name,
            role: res.data.role,
            profileCompleted: res.data.profileCompleted,
            profilePhoto: res.data.profilePhoto,
            dietaryPref: res.data.dietaryPref,
            smokingPref: res.data.smokingPref,
            drinkingPref: res.data.drinkingPref,
            sleepSchedule: res.data.sleepSchedule,
            cleanlinessLevel: res.data.cleanlinessLevel,
          });
        })
        .catch(e => {
          console.error('Failed to fetch user profile', e);
          localStorage.removeItem('token');
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user && 'Notification' in window && Notification.permission === 'granted') {
      import('../utils/pushNotification').then(({ setupPushNotifications }) => {
        setupPushNotifications();
      }).catch(err => console.error('Failed to import push notifications', err));
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const sendPing = () => {
      api.post('/users/ping').catch(() => {});
    };
    sendPing();
    const interval = setInterval(sendPing, 60000);
    return () => clearInterval(interval);
  }, [user]);

  const fetchProfileAfterLogin = async (token) => {
    localStorage.setItem('token', token);
    const res = await api.get('/users/me');
    setUser({
      id: res.data.id,
      userCode: res.data.userCode,
      email: res.data.email,
      name: res.data.name,
      role: res.data.role,
      profileCompleted: res.data.profileCompleted,
      profilePhoto: res.data.profilePhoto,
      dietaryPref: res.data.dietaryPref,
      smokingPref: res.data.smokingPref,
      drinkingPref: res.data.drinkingPref,
      sleepSchedule: res.data.sleepSchedule,
      cleanlinessLevel: res.data.cleanlinessLevel,
    });
  };

  // Call this after any profile update to sync context with backend
  const refreshUser = async () => {
    try {
      const res = await api.get('/users/me');
      setUser({
        id: res.data.id,
        userCode: res.data.userCode,
        email: res.data.email,
        name: res.data.name,
        role: res.data.role,
        profileCompleted: res.data.profileCompleted,
        profilePhoto: res.data.profilePhoto,
        dietaryPref: res.data.dietaryPref,
        smokingPref: res.data.smokingPref,
        drinkingPref: res.data.drinkingPref,
        sleepSchedule: res.data.sleepSchedule,
        cleanlinessLevel: res.data.cleanlinessLevel,
      });
    } catch (e) {
      console.error('Failed to refresh user profile', e);
    }
  };

  const getReferralData = () => {
    const referralCode = localStorage.getItem('rentzy_referral_code') || null;
    const signupSource = localStorage.getItem('rentzy_signup_source') || (referralCode ? `Link: ${referralCode}` : null);
    return { referralCode, signupSource };
  };

  const loginWithGoogle = async (tokenId) => {
    const { referralCode, signupSource } = getReferralData();
    const maxRetries = 3;
    let attempt = 0;
    while (attempt < maxRetries) {
      try {
        const response = await api.post('/auth/google', { tokenId, referralCode, signupSource });
        await fetchProfileAfterLogin(response.data.token);
        return;
      } catch (error) {
        attempt++;
        if (attempt >= maxRetries) {
          throw error;
        }
        // Wait before retrying (exponential backoff)
        await new Promise(res => setTimeout(res, 1000 * attempt));
      }
    }
  };

  const loginWithTruecaller = async (payload, signature, signatureAlgorithm) => {
    const response = await api.post('/auth/truecaller', { payload, signature, signatureAlgorithm });
    await fetchProfileAfterLogin(response.data.token);
  };

  const loginWithOtp = async (phone, otp) => {
    const response = await api.post('/auth/verify-otp', { phone, otp });
    await fetchProfileAfterLogin(response.data.token);
  };

  const login = async (email, password) => {
    const response = await api.post('/auth/authenticate', { email, password });
    await fetchProfileAfterLogin(response.data.token);
  };

  const register = async (name, email, password, role) => {
    const { referralCode, signupSource } = getReferralData();
    await api.post('/auth/register', { name, email, password, role, referralCode, signupSource });
    // User is not logged in yet, needs email OTP verification
  };

  const verifyEmailOtp = async (email, otp) => {
    const response = await api.post('/auth/verify-email-otp', { email, otp });
    await fetchProfileAfterLogin(response.data.token);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isOwner: user?.role === 'OWNER',
    isBroker: user?.role === 'BROKER',
    isAdmin: user?.role === 'ADMIN',
    login,
    loginWithGoogle,
    loginWithTruecaller,
    loginWithOtp,
    verifyEmailOtp,
    register,
    logout,
    refreshUser,
    loading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
