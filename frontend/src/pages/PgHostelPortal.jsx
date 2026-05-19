import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users } from 'lucide-react';
import PremiumHero from '../components/PremiumHero';

const PgHostelPortal = () => {
  const navigate = useNavigate();

  const handleBrowseAll = () => {
    navigate('/listings?type=pg');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <PremiumHero
        title="Your Campus"
        highlightText="Home"
        highlightColorClass="text-purple-400"
        buttonText="Find PG"
        buttonColorClass="bg-purple-600 hover:bg-purple-500 shadow-purple-500/20"
        searchType="pg"
        subtitle="Discover student-friendly PGs and Hostels near your college. Safe, vibrant, and packed with amenities."
        videoSrc="https://cdn.pixabay.com/video/2019/03/20/22137-325251662_large.mp4"
        fallbackImg="https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=1920&q=80"
        features={[
          { icon: '📶', text: 'WiFi & Meals Included' },
          { icon: '🛡️', text: 'CCTV Security' },
          { icon: '🚫', text: 'No Brokerage' }
        ]}
      />
      
      <section className="py-20 px-4 bg-white text-center">
        <Users size={48} className="mx-auto text-purple-500 mb-6" />
        <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-4">Start your student journey right.</h2>
        <p className="text-gray-500 text-lg max-w-2xl mx-auto mb-8">
          Find the perfect PG to study, relax, and make lifelong friends.
        </p>
        <button onClick={handleBrowseAll} className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 text-lg rounded-full font-bold transition-all hover:scale-105 active:scale-95 shadow-lg shadow-purple-500/20">
          Browse PGs & Hostels
        </button>
      </section>
    </div>
  );
};

export default PgHostelPortal;
