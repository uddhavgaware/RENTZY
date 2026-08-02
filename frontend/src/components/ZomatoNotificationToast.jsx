import React, { useState, useEffect } from 'react';
import { Sparkles, X, ChevronRight, BellRing, Flame, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const WITTY_NOTIFS = [
  {
    tag: 'ZOMATO STYLE',
    bg: 'from-rose-500 to-red-600',
    badgeBg: 'bg-rose-100 text-rose-700',
    title: 'Match made in pizza heaven! 🍕',
    message: 'Someone sent a roommate request! Time to split rent & garlic bread.',
    link: '/roommates',
    actionText: 'View Match'
  },
  {
    tag: 'ZEPTO SPEED',
    bg: 'from-purple-600 to-indigo-600',
    badgeBg: 'bg-purple-100 text-purple-700',
    title: 'Relocation faster than 10 mins! 📦',
    message: 'Zepto speed movers booked! Pack your bags before your noodles cook.',
    link: '/movers',
    actionText: 'Track Movers'
  },
  {
    tag: 'SWIGGY VIBES',
    bg: 'from-amber-500 to-orange-600',
    badgeBg: 'bg-orange-100 text-orange-700',
    title: 'Landlord Approved! 🔑',
    message: 'Visit request confirmed! Zero brokerage, zero drama — dream flat awaits.',
    link: '/dashboard',
    actionText: 'View Visit'
  },
  {
    tag: 'BILL SPLIT',
    bg: 'from-emerald-500 to-teal-600',
    badgeBg: 'bg-emerald-100 text-emerald-700',
    title: 'No leaving the group chat! 💸',
    message: 'Pay your ₹500 bill split before your flatmate eats your secret ice cream stash 🍦',
    link: '/split-expenses',
    actionText: 'Pay Now'
  },
  {
    tag: 'EXCLUSIVE',
    bg: 'from-blue-600 to-cyan-600',
    badgeBg: 'bg-blue-100 text-blue-700',
    title: 'Boom! Property is LIVE! 🚀',
    message: '100+ room seekers in Pune are checking out your listing right now!',
    link: '/listings',
    actionText: 'Check Views'
  }
];

export default function ZomatoNotificationToast() {
  const [activeNotif, setActiveNotif] = useState(null);
  const [progress, setProgress] = useState(100);
  const navigate = useNavigate();

  useEffect(() => {
    const handleTrigger = (e) => {
      let notifData = e.detail;
      if (!notifData) {
        // Random witty template if no detail provided
        notifData = WITTY_NOTIFS[Math.floor(Math.random() * WITTY_NOTIFS.length)];
      }
      setActiveNotif(notifData);
      setProgress(100);
    };

    window.addEventListener('trigger-witty-toast', handleTrigger);
    return () => window.removeEventListener('trigger-witty-toast', handleTrigger);
  }, []);

  useEffect(() => {
    if (!activeNotif) return;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev <= 0) {
          setActiveNotif(null);
          return 0;
        }
        return prev - 2;
      });
    }, 100);

    return () => clearInterval(timer);
  }, [activeNotif]);

  if (!activeNotif) return null;

  return (
    <div className="fixed top-20 right-4 z-[9999] max-w-sm w-full animate-bounce-short transition-all duration-300">
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 p-4 overflow-hidden group hover:scale-[1.02] transition-transform">
        
        {/* Top Accent bar */}
        <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${activeNotif.bg || 'from-rose-500 to-orange-500'}`} />

        <div className="flex items-start gap-3 mt-1">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${activeNotif.bg || 'from-rose-500 to-orange-500'} text-white flex items-center justify-center font-bold shadow-md shadow-rose-500/20 shrink-0`}>
            <Flame size={20} className="animate-pulse" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${activeNotif.badgeBg || 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300'}`}>
                {activeNotif.tag || 'TRENDING'}
              </span>
              <button 
                onClick={() => setActiveNotif(null)} 
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>

            <h4 className="font-extrabold text-sm text-slate-900 dark:text-white leading-snug">
              {activeNotif.title}
            </h4>

            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
              {activeNotif.message}
            </p>

            {activeNotif.link && (
              <button
                onClick={() => {
                  navigate(activeNotif.link);
                  setActiveNotif(null);
                }}
                className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer group/btn"
              >
                <span>{activeNotif.actionText || 'Take Action'}</span>
                <ChevronRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar Countdown */}
        <div className="mt-3 w-full bg-slate-100 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
          <div 
            className={`h-full bg-gradient-to-r ${activeNotif.bg || 'from-rose-500 to-orange-500'} transition-all duration-100`}
            style={{ width: `${progress}%` }}
          />
        </div>

      </div>
    </div>
  );
}
