import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Search } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) { return twMerge(clsx(inputs)); }

const PremiumHero = ({ 
  title, 
  subtitle, 
  highlightText, 
  highlightColorClass = "text-primary-600",
  buttonText = "Search",
  buttonColorClass = "bg-primary-600 hover:bg-primary-500",
  searchType = "",
  features = [],
  icon: Icon = Search,
  videoSrc,
  fallbackImg,
  children
}) => {
  const navigate = useNavigate();
  const [location, setLocation] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchType) params.set('type', searchType);
    if (location.trim()) params.set('location', location.trim());
    navigate(`/listings?${params.toString()}`);
  };

  const hasVideo = !!videoSrc;

  return (
    <section className={cn(
      "relative min-h-[85vh] flex items-center justify-center overflow-hidden pt-24 pb-20 w-full",
      hasVideo ? "bg-gray-950 text-white" : "bg-gradient-to-br from-primary-50 via-white to-purple-50 text-gray-900"
    )}>
      {hasVideo ? (
        <>
          {/* Background Video */}
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover z-0"
            poster={fallbackImg}
          >
            <source src={videoSrc} type="video/mp4" />
          </video>
          {/* Dark Overlay */}
          <div className="absolute inset-0 bg-black/40 bg-gradient-to-t from-gray-950 via-black/20 to-black/60 z-10" />
        </>
      ) : (
        <>
          {/* Animated gradient background mesh */}
          <div className="absolute top-16 left-8 w-72 h-72 sm:w-96 sm:h-96 bg-primary-300 rounded-full mix-blend-multiply filter blur-[100px] opacity-35 animate-blob pointer-events-none" />
          <div className="absolute top-32 right-8 w-72 h-72 sm:w-96 sm:h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-[100px] opacity-35 animate-blob animation-delay-2000 pointer-events-none" />
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-72 h-72 sm:w-96 sm:h-96 bg-pink-200 rounded-full mix-blend-multiply filter blur-[100px] opacity-30 animate-blob animation-delay-4000 pointer-events-none" />
        </>
      )}

      <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center w-full z-20 relative">

        {/* Headline */}
        <h1 className={cn(
          "text-4xl sm:text-6xl md:text-7xl font-black tracking-tight leading-[1.05] mb-5 animate-slide-up animation-delay-100",
          hasVideo ? "text-white" : "text-gray-900"
        )}>
          {title}{' '}
          <span className="relative inline-block">
            <span className={cn("gradient-text", highlightColorClass)}>{highlightText}</span>
            <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2 9C60 3 180 3 298 9" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" className={cn("opacity-40", highlightColorClass)} />
            </svg>
          </span>
        </h1>

        {/* Subheadline */}
        <p className={cn(
          "text-base sm:text-xl max-w-2xl mx-auto mb-10 animate-slide-up animation-delay-200 leading-relaxed font-medium",
          hasVideo ? "text-gray-200 drop-shadow-sm" : "text-gray-500"
        )}>
          {subtitle}
        </p>

        {/* Main interactive area */}
        {children ? (
          <div className="w-full max-w-4xl mx-auto animate-slide-up animation-delay-300">
            {children}
          </div>
        ) : (
          /* Search box form */
          <form onSubmit={handleSearch} className="max-w-3xl mx-auto glass-premium rounded-2xl sm:rounded-3xl p-2.5 sm:p-3 flex flex-col sm:flex-row gap-2.5 animate-slide-up animation-delay-300 shadow-xl border border-white/60">
            {/* Location input */}
            <div className="flex-1 flex items-center bg-white/95 rounded-xl sm:rounded-2xl px-4 py-3.5 gap-3 border border-white/50 focus-within:ring-2 focus-within:ring-primary-400 transition-all">
              <MapPin size={20} className={cn("flex-shrink-0", highlightColorClass)} />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Enter city or locality..."
                className="bg-transparent border-none outline-none w-full text-gray-900 placeholder-gray-400 font-semibold text-base sm:text-lg"
              />
            </div>

            <button type="submit" className={cn("text-white rounded-xl sm:rounded-2xl px-8 py-3.5 sm:py-4 font-bold text-base sm:text-lg transition-all hover:scale-[1.02] active:scale-95 shadow-lg flex items-center justify-center gap-2 min-w-[140px]", buttonColorClass)}>
              <Icon size={20} /> <span className="sm:hidden lg:inline">{buttonText}</span>
            </button>
          </form>
        )}

        {/* Features Row */}
        {features.length > 0 && (
          <div className={cn(
            "flex flex-wrap justify-center gap-4 sm:gap-6 mt-10 animate-slide-up animation-delay-400 text-sm font-semibold",
            hasVideo ? "text-white/90" : "text-gray-600"
          )}>
            {features.map((feature, idx) => (
              <div key={idx} className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full border shadow-sm",
                hasVideo 
                  ? "bg-white/10 backdrop-blur-md border-white/10" 
                  : "bg-white/40 backdrop-blur border-gray-200/50"
              )}>
                <span className={highlightColorClass}>{feature.icon}</span> {feature.text}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default PremiumHero;
