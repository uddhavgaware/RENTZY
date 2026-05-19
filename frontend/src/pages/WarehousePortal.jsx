import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PackageSearch } from 'lucide-react';
import PremiumHero from '../components/PremiumHero';

const WarehousePortal = () => {
  const navigate = useNavigate();

  const handleBrowseAll = () => {
    navigate('/listings?type=warehouse');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <PremiumHero
        title="Smart"
        highlightText="Logistics"
        highlightColorClass="text-amber-400"
        buttonText="Find Warehouse"
        buttonColorClass="bg-amber-600 hover:bg-amber-500 shadow-amber-500/20"
        searchType="warehouse"
        subtitle="Secure, high-capacity warehouses and commercial storage solutions for seamless supply chain operations."
        videoSrc="https://cdn.pixabay.com/video/2021/04/18/71485-538600109_large.mp4"
        fallbackImg="https://images.unsplash.com/photo-1586528116311-ad8ed7c83a7f?auto=format&fit=crop&w=1920&q=80"
        features={[
          { icon: '🚛', text: 'Heavy Truck Access' },
          { icon: '⏱️', text: '24/7 Operations' },
          { icon: '🔥', text: 'Fire Compliant' }
        ]}
      />
      
      <section className="py-20 px-4 bg-white text-center">
        <PackageSearch size={48} className="mx-auto text-amber-500 mb-6" />
        <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-4">Streamline your supply chain.</h2>
        <p className="text-gray-500 text-lg max-w-2xl mx-auto mb-8">
          Find the perfect warehouse location to optimize your storage and distribution network.
        </p>
        <button onClick={handleBrowseAll} className="bg-amber-600 hover:bg-amber-700 text-white px-8 py-4 text-lg rounded-full font-bold transition-all hover:scale-105 active:scale-95 shadow-lg shadow-amber-500/20">
          Browse Storage Spaces
        </button>
      </section>
    </div>
  );
};

export default WarehousePortal;
