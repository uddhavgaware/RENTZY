import React from 'react';
import { ChevronDown } from 'lucide-react';

const CinematicHero = ({ videoSrc, title, subtitle, fallbackImg, children }) => {
  const scrollToContent = () => {
    window.scrollTo({
      top: window.innerHeight,
      behavior: 'smooth'
    });
  };

  return (
    <div className="relative w-full h-screen overflow-hidden flex items-center justify-center bg-gray-900">
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

      {/* Cinematic Overlay (Dark Gradient) — uses hero-overlay for Oppo/older browser fallback */}
      <div
        className="absolute inset-0 hero-overlay z-10"
        style={{
          backgroundColor: 'rgba(0,0,0,0.55)',
          backgroundImage: 'linear-gradient(to top, rgba(2,6,23,0.95) 0%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.5) 100%)'
        }}
      />

      {/* Content */}
      <div className="relative z-20 w-full max-w-6xl mx-auto px-4 sm:px-6 flex flex-col items-center text-center mt-16 animate-slide-up">
        <h1 className="text-5xl sm:text-7xl md:text-8xl font-black text-white tracking-tight leading-[1.05] mb-6 drop-shadow-2xl">
          {title}
        </h1>
        {subtitle && (
          <p className="text-lg sm:text-2xl text-gray-200 mb-10 max-w-2xl drop-shadow-md font-medium leading-relaxed">
            {subtitle}
          </p>
        )}
        
        {/* Slot for specific UI (Search bar, buttons, etc) */}
        <div className="w-full max-w-4xl animate-slide-up animation-delay-200">
          {children}
        </div>
      </div>

      {/* Scroll Down Indicator */}
      <button 
        onClick={scrollToContent}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 animate-bounce flex flex-col items-center text-white/70 hover:text-white transition-colors cursor-pointer"
      >
        <span className="text-[10px] uppercase tracking-[0.3em] font-bold mb-2 opacity-80">Explore</span>
        <ChevronDown size={28} className="opacity-80" />
      </button>
    </div>
  );
};

export default CinematicHero;
