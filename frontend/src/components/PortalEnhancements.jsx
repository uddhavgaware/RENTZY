import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Zap, Handshake, Search, PhoneCall, Key, Star } from 'lucide-react';

const PortalEnhancements = ({ type = "flat" }) => {
  // Customize content based on portal type
  const content = {
    flat: {
      accent: 'blue',
      steps: [
        { icon: Search, title: 'Find Your Flat', desc: 'Browse thousands of verified apartments with zero brokerage.' },
        { icon: PhoneCall, title: 'Connect Directly', desc: 'Contact owners instantly through our secure platform.' },
        { icon: Key, title: 'Move In', desc: 'Finalize the deal and get the keys to your new home.' }
      ]
    },
    office: {
      accent: 'emerald',
      steps: [
        { icon: Search, title: 'Discover Workspaces', desc: 'Find private cabins, co-working desks, or full floors.' },
        { icon: Handshake, title: 'Negotiate Terms', desc: 'Deal directly with property managers for the best rates.' },
        { icon: Zap, title: 'Plug & Play', desc: 'Move your team into a fully-equipped, modern office.' }
      ]
    },
    warehouse: {
      accent: 'amber',
      steps: [
        { icon: Search, title: 'Locate Facilities', desc: 'Find secure warehouses and logistics hubs near highways.' },
        { icon: PhoneCall, title: 'Verify Specs', desc: 'Confirm heavy vehicle access, power loads, and security.' },
        { icon: Key, title: 'Start Operations', desc: 'Lease the space and scale your supply chain immediately.' }
      ]
    },
    pg: {
      accent: 'purple',
      steps: [
        { icon: Search, title: 'Explore PGs', desc: 'Browse verified hostels with meals, WiFi, and CCTV.' },
        { icon: PhoneCall, title: 'Schedule a Visit', desc: 'Book a tour to check the rooms and meet the community.' },
        { icon: Key, title: 'Settle In', desc: 'Pay online securely and move into your new room.' }
      ]
    }
  };

  const config = content[type] || content.flat;

  const accentColors = {
    blue: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800 shadow-blue-500/20',
    emerald: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 shadow-emerald-500/20',
    amber: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800 shadow-amber-500/20',
    purple: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-800 shadow-purple-500/20'
  };
  
  const textColors = {
    blue: 'text-blue-600 dark:text-blue-400',
    emerald: 'text-emerald-600 dark:text-emerald-400',
    amber: 'text-amber-600 dark:text-amber-400',
    purple: 'text-purple-600 dark:text-purple-400'
  };

  return (
    <div className="w-full">
      {/* HOW IT WORKS SECTION */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-white/5 relative overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white mb-4 tracking-tight">How it Works</h2>
            <p className="text-gray-500 dark:text-gray-400 text-lg">Your journey to the perfect space, simplified in three easy steps.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 relative">
            {/* Connecting Line for Desktop */}
            <div className="hidden md:block absolute top-12 left-[16.66%] right-[16.66%] h-0.5 bg-gray-100 dark:bg-white/10" />

            {config.steps.map((step, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.2, duration: 0.5 }}
                className="relative flex flex-col items-center text-center"
              >
                <div className={`w-24 h-24 rounded-3xl flex items-center justify-center mb-6 border-2 shadow-lg relative z-10 bg-white dark:bg-slate-800 ${accentColors[config.accent]}`}>
                  <step.icon size={36} />
                </div>
                <div className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full mb-4 shadow-sm">
                  Step {idx + 1}
                </div>
                <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">{step.title}</h3>
                <p className="text-gray-500 dark:text-gray-400">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* WHY CHOOSE US / TRUST SECTION */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-slate-800/50 border-t border-gray-100 dark:border-white/5 relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <h2 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white mb-6 tracking-tight">
                Why <span className={textColors[config.accent]}>RentXY</span> is the smart choice.
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-lg mb-8">
                We've eliminated the middlemen to bring you direct access to premium properties. Save money, save time, and rent with absolute confidence.
              </p>
              
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${accentColors[config.accent]}`}>
                    <ShieldCheck size={24} />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-1">100% Verified Listings</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Every property and owner is physically verified by our team to prevent fraud.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${accentColors[config.accent]}`}>
                    <Zap size={24} />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Zero Brokerage Fees</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Connect directly with property owners and keep your hard-earned money.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${accentColors[config.accent]}`}>
                    <Star size={24} />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Premium Support</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Our dedicated concierge team is available 24/7 to assist you with your move.</p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} className="relative">
              {/* Decorative elements */}
              <div className={`absolute -inset-4 bg-gradient-to-r rounded-3xl blur-2xl opacity-20 ${type === 'flat' ? 'from-blue-500 to-indigo-500' : type === 'office' ? 'from-emerald-500 to-teal-500' : type === 'warehouse' ? 'from-amber-500 to-orange-500' : 'from-purple-500 to-pink-500'}`} />
              
              <div className="bg-white dark:bg-slate-900 p-8 sm:p-10 rounded-3xl border border-gray-100 dark:border-white/10 shadow-2xl relative z-10">
                <div className="flex items-center gap-4 mb-8">
                  <div className="flex -space-x-4">
                    {[1,2,3,4].map(i => (
                      <img key={i} className="w-12 h-12 rounded-full border-4 border-white dark:border-slate-900 object-cover" src={`https://i.pravatar.cc/150?img=${i+10}`} alt="User" />
                    ))}
                  </div>
                  <div className="text-sm">
                    <p className="font-bold text-gray-900 dark:text-white">Trusted by 10,000+</p>
                    <p className="text-gray-500">Happy renters in your city</p>
                  </div>
                </div>
                
                <div className="bg-gray-50 dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-white/5 relative">
                  <div className="text-yellow-400 flex gap-1 mb-3">
                    {[1,2,3,4,5].map(i => <Star key={i} size={16} fill="currentColor" />)}
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 italic mb-4">"Found my dream space within 2 days of using RentXY. The zero brokerage feature saved me ₹45,000!"</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">— Priya S., Verified User</p>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </section>
    </div>
  );
};

export default PortalEnhancements;
