import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ListingCard from './ListingCard';
import api from '../services/api';

const FeaturedListings = ({ type, title = "Featured Properties", subtitle, badge = "Top Rated" }) => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchListings = async () => {
      try {
        const res = await api.get('/listings', { params: { type, size: 6 } });
        setListings(res.data?.content || res.data || []);
      } catch (err) {
        console.error('Failed to fetch featured listings', err);
      } finally {
        setLoading(false);
      }
    };
    fetchListings();
  }, [type]);

  if (loading) {
    return (
      <div className="py-16 flex justify-center">
        <div className="animate-spin w-10 h-10 border-4 border-gray-200 border-t-primary-600 rounded-full"></div>
      </div>
    );
  }

  if (listings.length === 0) return null;

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-white dark:bg-slate-900 border-y border-gray-100 dark:border-white/5">
      <div className="max-w-7xl mx-auto relative z-10">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400 text-xs font-bold tracking-wider uppercase mb-4 border border-primary-200 dark:border-primary-800">
              <Sparkles size={14} /> {badge}
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 dark:text-white tracking-tight">
              {title}
            </h2>
            {subtitle && <p className="text-gray-500 dark:text-gray-400 text-lg mt-3">{subtitle}</p>}
          </div>
          <button 
            onClick={() => navigate(`/listings?type=${type}`)}
            className="group flex items-center gap-2 font-bold text-primary-600 hover:text-primary-700 dark:text-primary-400"
          >
            Explore All 
            <span className="w-8 h-8 rounded-full bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center group-hover:bg-primary-100 transition-colors">
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </span>
          </button>
        </div>

        {/* Scrollable Container */}
        <div className="flex overflow-x-auto gap-6 pb-8 hide-scrollbar snap-x snap-mandatory px-4 -mx-4 sm:px-0 sm:mx-0">
          {listings.map((listing, idx) => (
            <motion.div 
              key={listing.id}
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: idx * 0.1, ease: 'easeOut' }}
              className="min-w-[320px] max-w-[320px] sm:min-w-[380px] sm:max-w-[380px] snap-start"
            >
              <ListingCard listing={listing} />
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default FeaturedListings;
