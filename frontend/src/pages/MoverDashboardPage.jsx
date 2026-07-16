import React, { useState, useEffect } from 'react';
import { Truck, MapPin, Calendar, Package, CheckCircle2, ShieldCheck, AlertCircle, Mail, Phone, ArrowRight, Clock, IndianRupee, TrendingUp, CircleDot, ChevronDown, ChevronUp, HelpCircle, Zap, Star, RotateCcw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Modal from '../components/Modal';
import MoverRouteMap from '../components/MoverRouteMap';
import { motion, AnimatePresence } from 'framer-motion';

/* ─── Workflow Step Indicator ──────────────────────────────── */
const WorkflowSteps = ({ status }) => {
  const steps = [
    { key: 'ASSIGNED', label: 'Accepted', icon: CheckCircle2 },
    { key: 'IN_TRANSIT', label: 'In Transit', icon: Truck },
    { key: 'COMPLETED', label: 'Completed', icon: Star },
  ];
  const currentIdx = steps.findIndex(s => s.key === status);

  return (
    <div className="flex items-center gap-1 w-full">
      {steps.map((step, i) => {
        const Icon = step.icon;
        const isActive = i === currentIdx;
        const isDone = i < currentIdx;
        return (
          <React.Fragment key={step.key}>
            <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              isActive ? 'bg-primary-600 text-white shadow-md shadow-primary-600/20' :
              isDone ? 'bg-green-100 text-green-700' :
              'bg-gray-100 text-gray-400'
            }`}>
              <Icon size={14} />
              <span className="hidden sm:inline">{step.label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-0.5 rounded-full ${isDone ? 'bg-green-400' : 'bg-gray-200'}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

/* ─── Stat Card ────────────────────────────────────────────── */
const StatCard = ({ icon: Icon, label, value, accent, sub, delay = 0 }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    whileHover={{ y: -5, scale: 1.02 }}
    className="bg-white/80 backdrop-blur-xl rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-xl transition-all p-6"
  >
    <div className="flex items-center gap-4 mb-4">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner ${accent}`}>
        <Icon size={24} />
      </div>
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
    </div>
    <p className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600">{value}</p>
    {sub && <p className="text-xs text-gray-500 font-medium mt-2">{sub}</p>}
  </motion.div>
);

/* ─── How It Works Guide ───────────────────────────────────── */
const HowItWorksGuide = () => {
  const [open, setOpen] = useState(false);
  const guideSteps = [
    { num: '1', title: 'Browse Available Leads', desc: 'New moving requests from customers appear in the "Available Leads" tab in real-time.' },
    { num: '2', title: 'Accept a Job', desc: 'Click "Accept Job" to claim a lead. You\'ll get the customer\'s contact details instantly.' },
    { num: '3', title: 'Negotiate & Navigate', desc: 'Contact the customer, negotiate pricing, then use the built-in navigation to reach the pickup point.' },
    { num: '4', title: 'Start Move (OTP)', desc: 'When you arrive, ask the customer for their 4-digit Start OTP. This activates live GPS tracking.' },
    { num: '5', title: 'Complete & Get Paid', desc: 'After delivery, collect payment (cash) and enter the End OTP to mark the job as complete.' },
  ];

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl border border-indigo-100 overflow-hidden mb-6">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-5 py-4 text-left">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
            <HelpCircle size={18} className="text-indigo-600" />
          </div>
          <div>
            <p className="font-bold text-indigo-900 text-sm">How It Works</p>
            <p className="text-xs text-indigo-500">New here? Learn the complete workflow</p>
          </div>
        </div>
        {open ? <ChevronUp size={20} className="text-indigo-400" /> : <ChevronDown size={20} className="text-indigo-400" />}
      </button>
      {open && (
        <div className="px-5 pb-5 grid grid-cols-1 sm:grid-cols-5 gap-3">
          {guideSteps.map((s, i) => (
            <div key={i} className="bg-white rounded-xl p-4 border border-indigo-100 shadow-sm relative">
              <div className="w-7 h-7 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs font-black mb-2">{s.num}</div>
              <p className="font-bold text-gray-900 text-sm mb-1">{s.title}</p>
              <p className="text-xs text-gray-500 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ─── Available Lead Card ──────────────────────────────────── */
const LeadCard = ({ lead, onAccept, isBlocked = false }) => (
  <motion.div 
    initial={{ opacity: 0, y: 15 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4 }}
    whileHover={{ y: isBlocked ? 0 : -4 }}
    className={`bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl border border-white/40 dark:border-white/5 shadow-sm hover:shadow-xl hover:shadow-primary-500/10 transition-all duration-300 overflow-hidden group ${isBlocked ? 'opacity-60 grayscale-[30%]' : ''}`}
  >
    {/* Top accent bar */}
    <div className="h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
    
    <div className="p-6">
      {/* Header with badge and date */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500 shadow-sm shadow-blue-500/50"></span>
          </span>
          <span className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider border border-blue-200/50 dark:border-blue-700/30">New Lead</span>
        </div>
        <span className="text-gray-400 text-xs font-bold flex items-center gap-1.5"><Clock size={12} /> {new Date(lead.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
      </div>

      {/* Route visualization */}
      <div className="flex items-start gap-4 mb-6 bg-gray-50/50 dark:bg-slate-900/50 rounded-xl p-4 border border-gray-100 dark:border-white/5">
        <div className="flex flex-col items-center pt-1.5">
          <div className="w-3.5 h-3.5 rounded-full bg-indigo-500 ring-4 ring-indigo-100 dark:ring-indigo-900/30 shadow-sm" />
          <div className="w-0.5 h-10 bg-gradient-to-b from-indigo-300 to-green-300 dark:from-indigo-600 dark:to-green-600 my-1.5" />
          <div className="w-3.5 h-3.5 rounded-full bg-green-500 ring-4 ring-green-100 dark:ring-green-900/30 shadow-sm" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="mb-4">
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-0.5">Pickup</p>
            <p className="font-bold text-gray-900 dark:text-white text-sm truncate">{lead.fromLocation}</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-0.5">Drop-off</p>
            <p className="font-bold text-gray-900 dark:text-white text-sm truncate">{lead.toLocation}</p>
          </div>
        </div>
      </div>

      {/* Info chips */}
      <div className="flex flex-wrap gap-2.5 mb-6">
        <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-3.5 py-2 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-white/10 shadow-sm">
          <Calendar size={14} className="text-indigo-500" />
          {lead.movingDate}
          {lead.movingTime && <span className="text-primary-600 dark:text-primary-400 ml-1">• {lead.movingTime}</span>}
        </div>
        <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-3.5 py-2 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-white/10 shadow-sm">
          <Package size={14} className="text-indigo-500" />
          {lead.propertySize}
        </div>
      </div>

      {/* Footer: Price + Accept */}
      <div className="flex items-center justify-between pt-5 border-t border-gray-100 dark:border-white/10">
        <div>
          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Est. Payout</p>
          <p className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-500">{lead.estimatedPrice ? `₹${lead.estimatedPrice.toLocaleString('en-IN')}` : 'Negotiate'}</p>
        </div>
        {isBlocked ? (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-500 font-bold py-3 px-4 rounded-xl text-xs cursor-not-allowed">
            <AlertCircle size={14} /> Job Locked
          </div>
        ) : (
          <button
            onClick={() => onAccept(lead.id)}
            className="bg-gray-900 hover:bg-black dark:bg-primary-600 dark:hover:bg-primary-500 text-white font-bold py-3.5 px-6 rounded-xl transition-all active:scale-95 shadow-lg shadow-gray-900/20 dark:shadow-primary-600/20 flex items-center gap-2 text-sm group-hover:scale-105"
          >
            Accept <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </button>
        )}
      </div>
    </div>
  </motion.div>
);

/* ─── My Job Card ──────────────────────────────────────────── */
const JobCard = ({ job, onStart, onComplete, onRelease }) => {
  const [expanded, setExpanded] = useState(job.status === 'IN_TRANSIT');

  const statusConfig = {
    ASSIGNED: { color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-700/50', label: '⏳ Awaiting Pickup' },
    IN_TRANSIT: { color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-700/50', label: '🚚 In Transit' },
    COMPLETED: { color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-700/50', label: '✅ Completed' },
  };
  const sc = statusConfig[job.status] || statusConfig.ASSIGNED;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className={`bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-3xl border shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden ${
      job.status === 'IN_TRANSIT' ? 'border-blue-300 ring-4 ring-blue-50 dark:ring-blue-900/20' : 'border-gray-200 dark:border-white/10'
    }`}>
      {/* Status accent */}
      <div className={`h-2 ${
        job.status === 'IN_TRANSIT' ? 'bg-gradient-to-r from-blue-500 to-cyan-500' :
        job.status === 'COMPLETED' ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
        'bg-gradient-to-r from-amber-400 to-orange-500'
      }`} />

      <div className="p-6">
        {/* Status + Workflow */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <span className={`px-4 py-1.5 rounded-xl text-xs font-black tracking-wide border shadow-sm ${sc.color}`}>
            {sc.label}
          </span>
          <WorkflowSteps status={job.status} />
        </div>

        {/* Route + Price row */}
        <div className="flex flex-col md:flex-row gap-6 bg-gray-50/50 dark:bg-slate-900/50 p-5 rounded-2xl border border-gray-100 dark:border-white/5">
          {/* Route */}
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <div className="flex flex-col items-center pt-1.5">
              <div className="w-3.5 h-3.5 rounded-full bg-indigo-500 ring-4 ring-indigo-100 dark:ring-indigo-900/30" />
              <div className="w-0.5 h-10 bg-gradient-to-b from-indigo-300 to-green-300 dark:from-indigo-600 dark:to-green-600 my-1.5" />
              <div className="w-3.5 h-3.5 rounded-full bg-green-500 ring-4 ring-green-100 dark:ring-green-900/30" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="mb-4">
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-0.5">Pickup</p>
                <p className="font-bold text-gray-900 dark:text-white text-sm truncate">{job.fromLocation}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-0.5">Drop-off</p>
                <p className="font-bold text-gray-900 dark:text-white text-sm truncate">{job.toLocation}</p>
              </div>
            </div>
          </div>

          {/* Meta info */}
          <div className="flex flex-row md:flex-col items-center md:items-end justify-center gap-4 md:gap-2 pl-0 md:pl-6 border-t md:border-t-0 md:border-l border-gray-200 dark:border-white/10 pt-4 md:pt-0">
            <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg text-xs font-bold text-gray-600 dark:text-gray-300 shadow-sm border border-gray-100 dark:border-white/5">
              <Calendar size={14} className="text-indigo-500" /> {job.movingDate}
            </div>
            <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg text-xs font-bold text-gray-600 dark:text-gray-300 shadow-sm border border-gray-100 dark:border-white/5">
              <Package size={14} className="text-indigo-500" /> {job.propertySize}
            </div>
            <p className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 mt-2">{job.estimatedPrice ? `₹${job.estimatedPrice.toLocaleString('en-IN')}` : 'TBD'}</p>
          </div>
        </div>

        {/* Expandable section */}
        <button onClick={() => setExpanded(!expanded)} className="w-full mt-4 flex items-center justify-center gap-2 text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors py-2 border-t border-gray-100">
          {expanded ? 'Show Less' : 'Show Details & Actions'}
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {expanded && (
          <div className="mt-3 space-y-4 animate-fade-in">
            {/* Customer Details */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
              <p className="text-[10px] font-extrabold text-primary-600 mb-3 uppercase tracking-widest">Customer Details</p>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-11 h-11 bg-gradient-to-br from-primary-500 to-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0 shadow-md">
                  {job.user?.name?.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-gray-900">{job.user?.name}</p>
                  <p className="text-sm text-gray-600">{job.user?.phone || 'No phone provided'}</p>
                  {job.user?.email && <p className="text-xs text-gray-400 truncate">{job.user?.email}</p>}
                </div>
              </div>
              
              {/* Contact buttons */}
              <div className="flex gap-2 pt-3 border-t border-gray-200">
                {job.user?.phone && (
                  <>
                    <a href={`tel:${job.user?.phone}`} className="flex-1 flex items-center justify-center gap-1.5 bg-gray-900 text-white text-xs font-bold px-3 py-2.5 rounded-xl hover:bg-gray-800 transition-all active:scale-95 shadow-sm">
                      <Phone size={14} /> Call
                    </a>
                    <a href={`https://wa.me/${job.user?.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-1.5 bg-[#25D366] text-white text-xs font-bold px-3 py-2.5 rounded-xl hover:bg-[#1ebd5a] transition-all active:scale-95 shadow-sm">
                      WhatsApp
                    </a>
                  </>
                )}
                {job.user?.email && (
                  <a href={`mailto:${job.user?.email}`} className="flex-1 flex items-center justify-center gap-1.5 bg-blue-100 text-blue-800 hover:bg-blue-200 text-xs font-bold px-3 py-2.5 rounded-xl transition-all active:scale-95">
                    <Mail size={14} /> Email
                  </a>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            {job.status === 'ASSIGNED' && (
              <div className="space-y-2">
                <a 
                  href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(job.fromLocation)}`} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="w-full bg-[#4285F4] hover:bg-[#3367D6] text-white font-bold py-3 px-6 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 shadow-md shadow-[#4285F4]/20"
                >
                  <MapPin size={18} /> Navigate to Pickup
                </a>
                <button onClick={() => onStart(job.id)} className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-6 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 shadow-md shadow-primary-600/20">
                  <Zap size={18} /> Start Move (Enter OTP)
                </button>
                <button onClick={() => onRelease(job.id)} className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-bold py-2.5 px-4 rounded-xl transition-colors text-sm border border-red-200 flex items-center justify-center gap-2">
                  <RotateCcw size={14} /> Negotiation Failed? Release Job
                </button>
              </div>
            )}
            {job.status === 'IN_TRANSIT' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-blue-700 font-bold bg-blue-50 px-4 py-3 rounded-xl border border-blue-200">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                  </span>
                  Live GPS Tracking Active
                </div>
                <div className="bg-amber-50 text-amber-800 p-3 rounded-xl border border-amber-200 text-sm font-bold text-center">
                  ⚠️ Collect {job.estimatedPrice ? `₹${job.estimatedPrice.toLocaleString('en-IN')}` : 'payment'} (Cash) before completing
                </div>
                <a 
                  href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(job.toLocation)}`} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="w-full bg-[#4285F4] hover:bg-[#3367D6] text-white font-bold py-3 px-6 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 shadow-md shadow-[#4285F4]/20"
                >
                  <MapPin size={18} /> Navigate to Drop-off
                </a>
                <button onClick={() => onComplete(job.id)} className="w-full bg-gray-900 hover:bg-black text-white font-bold py-3 px-6 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg">
                  <CheckCircle2 size={18} /> Complete Job (Enter OTP)
                </button>
              </div>
            )}

            {/* Route Map */}
            {(job.status === 'ASSIGNED' || job.status === 'IN_TRANSIT') && (
              <MoverRouteMap job={job} />
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

/* ─── Completed Ride (compact notification-sized item) ─────── */
const CompletedRideItem = ({ job }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:border-gray-200 transition-all shadow-sm">
      {/* Compact row — notification sized */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
          <CheckCircle2 size={16} className="text-green-500" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold text-gray-900 truncate">{job.fromLocation}</p>
            <ArrowRight size={12} className="text-gray-300 flex-shrink-0" />
            <p className="text-sm font-bold text-gray-900 truncate">{job.toLocation}</p>
          </div>
          <p className="text-[11px] text-gray-400 mt-0.5">{job.movingDate} • {job.propertySize}</p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="text-sm font-black text-green-600">{job.estimatedPrice ? `₹${job.estimatedPrice.toLocaleString('en-IN')}` : '—'}</span>
          <ChevronDown size={16} className={`text-gray-300 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="px-4 pb-4 pt-1 border-t border-gray-100 space-y-3 animate-fade-in">
          {/* Customer info */}
          <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg">
            <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
              {job.user?.name?.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-gray-900 text-sm">{job.user?.name}</p>
              <p className="text-xs text-gray-500">{job.user?.phone || 'No phone'} {job.user?.email ? `• ${job.user.email}` : ''}</p>
            </div>
          </div>
          {/* Contact buttons */}
          <div className="flex gap-2">
            {job.user?.phone && (
              <>
                <a href={`tel:${job.user.phone}`} className="flex-1 flex items-center justify-center gap-1.5 bg-gray-900 text-white text-xs font-bold py-2 rounded-lg hover:bg-gray-800 transition-all active:scale-95">
                  <Phone size={12} /> Call
                </a>
                <a href={`https://wa.me/${job.user.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-1.5 bg-[#25D366] text-white text-xs font-bold py-2 rounded-lg hover:bg-[#1ebd5a] transition-all active:scale-95">
                  WhatsApp
                </a>
              </>
            )}
            {job.user?.email && (
              <a href={`mailto:${job.user.email}`} className="flex-1 flex items-center justify-center gap-1.5 bg-blue-100 text-blue-800 text-xs font-bold py-2 rounded-lg hover:bg-blue-200 transition-all active:scale-95">
                <Mail size={12} /> Email
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

/* ─── Main Page ────────────────────────────────────────────── */
const MoverDashboardPage = () => {
  const { user, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [availableLeads, setAvailableLeads] = useState([]);
  const [myJobs, setMyJobs] = useState([]);
  const [profile, setProfile] = useState(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalConfig, setModalConfig] = useState({ isOpen: false });

  const showModal = (config) => setModalConfig({ ...config, isOpen: true });
  const closeModal = () => setModalConfig({ isOpen: false });

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) navigate('/auth');
      else if (user?.role !== 'MOVER') navigate('/');
    }
  }, [isAuthenticated, loading, user, navigate]);

  useEffect(() => {
    if (user?.role !== 'MOVER') return;
    fetchData();
    // Always load myJobs regardless of active tab so fraud-prevention state is current
    api.get('/users/me').then(res => setProfile(res.data)).catch(() => {});
    api.get('/moving/vendor/my').then(res => setMyJobs(res.data)).catch(() => {});
  }, [user, activeTab]);

  const fetchData = async () => {
    setDataLoading(true);
    setError(null);
    try {
      if (activeTab === 'available') {
        const res = await api.get('/moving/vendor/available');
        setAvailableLeads(res.data);
      } else {
        const res = await api.get('/moving/vendor/my');
        setMyJobs(res.data);
      }
    } catch (err) {
      setError('Failed to fetch data. Please try again.');
    } finally {
      setDataLoading(false);
    }
  };

  const handleAcceptJob = async (id) => {
    try {
      await api.put(`/moving/vendor/${id}/accept`);
      showModal({ type: 'alert', title: '🎉 Job Accepted!', message: 'You can now contact the customer and start the move. Go to "My Jobs" to see details.', onConfirm: () => { closeModal(); fetchData(); } });
    } catch (err) {
      showModal({ type: 'alert', title: 'Error', message: err.response?.data?.message || 'Failed to accept job.', onConfirm: closeModal });
    }
  };

  const handleStartJob = (id) => {
    showModal({
      type: 'prompt',
      title: '🔑 Enter Start OTP',
      message: 'Ask the customer for their 4-digit Start OTP. This will activate live GPS tracking for this move.',
      placeholder: '0000',
      onConfirm: async (otp) => {
        closeModal();
        try {
          await api.post(`/moving/vendor/${id}/verify-start`, { otp });
          import('react-hot-toast').then(({ toast }) => toast.success('Live Tracking Started!'));
          fetchData();
        } catch (err) {
          showModal({ type: 'alert', title: 'Error', message: err.response?.data?.message || 'Invalid OTP. Please try again.', onConfirm: closeModal });
        }
      },
      onCancel: closeModal
    });
  };

  const handleReleaseJob = (id) => showModal({
    type: 'confirm',
    title: '⚠️ Release This Job?',
    message: 'If negotiation failed, releasing this job allows other movers to claim it. You will lose this lead permanently.',
    onConfirm: async () => {
      closeModal();
      try {
        await api.put(`/moving/vendor/${id}/release`);
        setMyJobs(prev => prev.filter(job => job.id !== id));
        fetchData();
      } catch (err) {
        setError('Failed to release job');
      }
    }
  });

  const handleCompleteJob = (id) => {
    showModal({
      type: 'prompt',
      title: '✅ Enter End OTP',
      message: 'Ask the customer for their 4-digit End OTP to mark this job as COMPLETED and stop live tracking.',
      placeholder: '0000',
      onConfirm: async (otp) => {
        closeModal();
        try {
          await api.post(`/moving/vendor/${id}/verify-end`, { otp });
          import('react-hot-toast').then(({ toast }) => toast.success('Job Completed Successfully! 🎉'));
          fetchData();
        } catch (err) {
          showModal({ type: 'alert', title: 'Error', message: err.response?.data?.message || 'Invalid OTP. Please try again.', onConfirm: closeModal });
        }
      },
      onCancel: closeModal
    });
  };

  // Live GPS tracking for in-transit jobs
  useEffect(() => {
    let watchId;
    const inTransitJob = myJobs.find(j => j.status === 'IN_TRANSIT');
    if (inTransitJob) {
      if ('geolocation' in navigator) {
        watchId = navigator.geolocation.watchPosition(
          async (position) => {
            try {
              await api.put(`/moving/vendor/${inTransitJob.id}/location`, {
                lat: position.coords.latitude,
                lng: position.coords.longitude
              });
            } catch (err) { }
          },
          (err) => console.error("Error watching position", err),
          { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
        );
      }
    }
    return () => {
      if (watchId !== undefined) navigator.geolocation.clearWatch(watchId);
    };
  }, [myJobs]);

  if (loading || user?.role !== 'MOVER') return null;

  // Compute stats
  const completedJobs = myJobs.filter(j => j.status === 'COMPLETED');
  const totalEarnings = completedJobs.reduce((sum, j) => sum + (j.estimatedPrice || 0), 0);
  const activeJobs = myJobs.filter(j => j.status !== 'COMPLETED').length;
  
  // Calculate average rating
  const ratedJobs = completedJobs.filter(j => j.reviewRating);
  const avgRating = ratedJobs.length > 0 
    ? (ratedJobs.reduce((sum, j) => sum + parseInt(j.reviewRating), 0) / ratedJobs.length).toFixed(1)
    : 0;

  // 🔒 FRAUD PREVENTION: Block new accepts while already active
  const isInTransitOrAssigned = myJobs.some(j => j.status === 'IN_TRANSIT' || j.status === 'ASSIGNED');
  const activeBlockingJob = myJobs.find(j => j.status === 'IN_TRANSIT' || j.status === 'ASSIGNED');

  return (
    <div className="bg-gray-50 min-h-screen pb-16">
      {/* ── Sticky Header & Tabs ── */}
      <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-white/5 sticky top-16 z-30 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-4 gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-gray-900 to-gray-700 rounded-xl flex items-center justify-center shadow-md">
                <Truck size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">Mover Dashboard</h1>
                <p className="text-gray-500 text-xs sm:text-sm">Welcome back, <span className="font-semibold text-gray-700 dark:text-gray-300">{user?.name}</span></p>
              </div>
            </div>
            {profile?.kycStatus === 'APPROVED' && (
              <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1.5 rounded-lg font-bold text-xs border border-green-200 shadow-sm">
                <ShieldCheck size={16} /> Verified Partner
              </div>
            )}
          </div>
          
          <div className="flex gap-6 overflow-x-auto hide-scrollbar pt-2">
            {[
              { id: 'overview', name: 'Overview', icon: TrendingUp },
              { id: 'available', name: 'Lead Market', icon: CircleDot, count: availableLeads.length },
              { id: 'my_jobs', name: 'Active Jobs', icon: Truck, count: activeJobs },
              { id: 'history', name: 'History & Reviews', icon: Star, count: completedJobs.length }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-3 border-b-2 font-bold text-sm transition-colors whitespace-nowrap ${
                  activeTab === tab.id 
                    ? 'border-primary-600 text-primary-600 dark:text-primary-400' 
                    : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'
                }`}
              >
                <tab.icon size={16} />
                {tab.name}
                {tab.count !== undefined && tab.count !== null && tab.count > 0 && (
                  <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] ${activeTab === tab.id ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-600'}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* ── Error ── */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-2 border border-red-200">
            <AlertCircle size={20} /> <span className="font-semibold">{error}</span>
          </div>
        )}

        {/* ── Content ── */}
        {dataLoading ? (
          <div className="flex flex-col justify-center items-center py-20 gap-3">
            <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-gray-200 border-t-gray-900"></div>
            <p className="text-sm text-gray-400 font-medium">Loading...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            
            {activeTab === 'overview' && (
              <div className="lg:col-span-2 space-y-6 animate-fade-in">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <StatCard icon={Zap} label="Available" value={availableLeads.length} accent="bg-blue-50 text-blue-600" sub="Open leads" />
                  <StatCard icon={Truck} label="Active" value={activeJobs} accent="bg-amber-50 text-amber-600" sub="In progress" />
                  <StatCard icon={Star} label="Rating" value={avgRating > 0 ? avgRating : 'New'} accent="bg-green-50 text-green-600" sub={avgRating > 0 ? "Average score" : "No reviews yet"} />
                  <StatCard icon={IndianRupee} label="Earnings" value={`₹${totalEarnings.toLocaleString('en-IN')}`} accent="bg-purple-50 text-purple-600" sub="Total earned" />
                </div>
                <HowItWorksGuide />
              </div>
            )}

            {activeTab === 'available' && (
              <div className="lg:col-span-2 space-y-4 animate-fade-in">
                {/* 🔒 FRAUD PREVENTION BANNER */}
                {isInTransitOrAssigned && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4"
                  >
                    <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                      <AlertCircle size={24} className="text-red-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-black text-red-800 text-base">🔒 Job Acceptance Locked</p>
                      <p className="text-red-600 text-sm font-medium mt-0.5">
                        You currently have an active {activeBlockingJob?.status === 'IN_TRANSIT' ? 'IN TRANSIT' : 'ASSIGNED'} job:
                        <span className="font-bold"> {activeBlockingJob?.fromLocation} → {activeBlockingJob?.toLocation}</span>.
                        Complete or release your current job before accepting a new lead.
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveTab('my_jobs')}
                      className="flex-shrink-0 bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-all active:scale-95 flex items-center gap-2"
                    >
                      <Truck size={16} /> View Active Job
                    </button>
                  </motion.div>
                )}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {availableLeads.length === 0 ? (
                    <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-12 text-center">
                      <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <CircleDot size={32} className="text-gray-300" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">No leads right now</h3>
                      <p className="text-gray-500 mt-2 text-sm">New moving requests will appear here automatically. Check back soon!</p>
                    </div>
                  ) : (
                    availableLeads.map(lead => (
                      <LeadCard key={lead.id} lead={lead} onAccept={handleAcceptJob} isBlocked={isInTransitOrAssigned} />
                    ))
                  )}
                </div>
              </div>
            )}

            {activeTab === 'my_jobs' && (
              <div className="lg:col-span-2 animate-fade-in">
                {myJobs.filter(j => j.status !== 'COMPLETED').length === 0 ? (
                  <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Truck size={32} className="text-gray-300" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">No active jobs</h3>
                    <p className="text-gray-500 mt-2 text-sm">Accept leads from the "Lead Market" tab to get started!</p>
                    <button onClick={() => setActiveTab('available')} className="mt-4 bg-primary-600 hover:bg-primary-700 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-colors">Find Leads</button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {myJobs.filter(j => j.status !== 'COMPLETED').map(job => (
                      <JobCard
                        key={job.id}
                        job={job}
                        onStart={handleStartJob}
                        onComplete={handleCompleteJob}
                        onRelease={handleReleaseJob}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'history' && (
              <div className="lg:col-span-2 animate-fade-in">
                {completedJobs.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Star size={32} className="text-gray-300" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">No completed jobs</h3>
                    <p className="text-gray-500 mt-2 text-sm">Complete jobs to build your history and receive ratings from customers.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {completedJobs.map(job => (
                      <div key={job.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <span className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-md bg-green-50 text-green-700">Completed</span>
                            <p className="text-xs text-gray-400 font-bold mt-2">{new Date(job.createdAt).toLocaleDateString()}</p>
                          </div>
                          <p className="font-black text-lg text-primary-600">₹{job.estimatedPrice?.toLocaleString('en-IN')}</p>
                        </div>
                        
                        <div className="flex items-center gap-3 mb-4 bg-gray-50 p-3 rounded-xl border border-gray-100">
                          <div className="w-8 h-8 bg-gray-200 text-gray-600 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0">{job.user?.name?.charAt(0)}</div>
                          <div className="min-w-0">
                            <p className="font-bold text-sm text-gray-900 truncate">{job.user?.name}</p>
                            <p className="text-xs text-gray-500 truncate">{job.user?.phone}</p>
                          </div>
                        </div>
                        
                        <div className="space-y-1 mb-4">
                          <p className="text-sm font-medium text-gray-900 truncate"><span className="text-gray-400 mr-2">From:</span>{job.fromLocation}</p>
                          <p className="text-sm font-medium text-gray-900 truncate"><span className="text-gray-400 mr-2">To:</span>{job.toLocation}</p>
                        </div>

                        {/* Customer Review Section */}
                        <div className="border-t border-gray-100 pt-4 mt-4">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Customer Review</p>
                          {job.reviewRating ? (
                            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                              <div className="flex items-center gap-1 mb-1">
                                {[1, 2, 3, 4, 5].map(star => (
                                  <Star key={star} size={14} className={star <= parseInt(job.reviewRating) ? 'text-amber-400 fill-amber-400' : 'text-amber-100'} />
                                ))}
                              </div>
                              {job.reviewComments && <p className="text-xs text-amber-900 italic">"{job.reviewComments}"</p>}
                            </div>
                          ) : (
                            <p className="text-xs text-gray-400 italic">No review provided by customer yet.</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      <Modal {...modalConfig} onCancel={closeModal} />
    </div>
  );
};

export default MoverDashboardPage;
