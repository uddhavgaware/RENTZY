import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase } from 'lucide-react';
import PremiumHero from '../components/PremiumHero';

const OfficeSpacePortal = () => {
  const navigate = useNavigate();

  const handleBrowseAll = () => {
    navigate('/listings?type=office');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <PremiumHero
        title="Scale Your"
        highlightText="Startup"
        highlightColorClass="text-emerald-400"
        buttonText="Find Office"
        buttonColorClass="bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20"
        searchType="office"
        subtitle="Premium office spaces and co-working environments designed for modern teams and growing businesses."
        videoSrc="https://videos.pexels.com/video-files/7534210/7534210-uhd_2560_1440_25fps.mp4"
        fallbackImg="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1920&q=80"
        features={[
          { icon: '💻', text: 'Plug & Play Setup' },
          { icon: '🚀', text: 'High-Speed Internet' },
          { icon: '🤝', text: 'Direct with Owners' }
        ]}
      />
      
      <section className="py-20 px-4 bg-white dark:bg-slate-900 text-center">
        <Briefcase size={48} className="mx-auto text-emerald-500 mb-6" />
        <h2 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white mb-4">Elevate your work environment.</h2>
        <p className="text-gray-500 dark:text-gray-400 text-lg max-w-2xl mx-auto mb-8">
          From private cabins to full floor plates, find the right space for your team.
        </p>
        <button onClick={handleBrowseAll} className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 text-lg rounded-full font-bold transition-all hover:scale-105 active:scale-95 shadow-lg shadow-emerald-500/20">
          Browse Workspaces
        </button>
      </section>
    </div>
  );
};

export default OfficeSpacePortal;
