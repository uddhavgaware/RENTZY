import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Users, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Helmet } from 'react-helmet-async';

const JoinSplitGroupPage = () => {
  const { inviteCode } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [groupDetails, setGroupDetails] = useState(null);

  useEffect(() => {
    // Optional: We could pre-fetch group details by invite code if we had a public endpoint.
    // For now, we just let them try to join.
    if (!isAuthenticated) {
      sessionStorage.setItem('redirectAfterLogin', `/join/${inviteCode}`);
      navigate('/auth');
    }
  }, [isAuthenticated, inviteCode, navigate]);

  const handleJoin = async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.post(`/split/groups/join/${inviteCode}`);
      setGroupDetails(res.data.group || res.data);
      setSuccess(true);
      setTimeout(() => navigate('/split-expenses'), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to join group. The link might be invalid or you are already a member.');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950">
        <Loader2 size={32} className="animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Join Group – RentXY</title>
      </Helmet>
      <div className="min-h-screen flex items-center justify-center bg-mesh-gradient p-4">
        <div className="bg-white dark:bg-slate-900 max-w-md w-full rounded-3xl p-8 shadow-2xl border border-gray-100 dark:border-white/10 text-center relative overflow-hidden">
          
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full translate-x-1/2 -translate-y-1/2 blur-2xl pointer-events-none" />
          
          {success ? (
            <div className="animate-fade-in relative z-10">
              <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle size={36} className="text-emerald-500" />
              </div>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">You're In!</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                Successfully joined {groupDetails?.name ? `"${groupDetails.name}"` : 'the group'}.
              </p>
              <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-2">
                <Loader2 size={16} className="animate-spin" /> Redirecting to Split Expenses...
              </p>
            </div>
          ) : (
            <div className="relative z-10">
              <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users size={36} className="text-indigo-500" />
              </div>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">You're Invited!</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-8">
                You've been invited to join a Split Expenses group on RentXY. Join to start splitting bills effortlessly.
              </p>

              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl text-sm font-medium mb-6 flex items-start gap-2 text-left">
                  <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <button
                onClick={handleJoin}
                disabled={loading}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-emerald-500/25 active:scale-[0.98] flex items-center justify-center gap-2"
              >
                {loading ? (
                  <><Loader2 size={20} className="animate-spin" /> Joining...</>
                ) : (
                  'Accept Invitation'
                )}
              </button>
              <button
                onClick={() => navigate('/')}
                className="w-full mt-3 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 font-bold py-4 rounded-xl transition-all active:scale-[0.98]"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default JoinSplitGroupPage;
