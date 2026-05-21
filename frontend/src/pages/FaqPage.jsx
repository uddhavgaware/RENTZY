import React, { useState } from 'react';
import { ChevronDown, HelpCircle, Search } from 'lucide-react';

const faqs = [
  {
    category: 'Getting Started',
    items: [
      {
        q: 'How do I create an account on RentXY?',
        a: 'Click the "Login / Signup" button in the top-right corner of the page. You can sign up using your email and password, your mobile number via OTP, or your Google account. After signing up, you\'ll need to complete your profile before accessing all features.'
      },
      {
        q: 'Is RentXY free to use?',
        a: 'Yes! Browsing properties, finding roommates, and creating an account is completely free. Property owners can list their properties at no cost. We only charge a small service fee when a booking is confirmed through our platform.'
      },
      {
        q: 'What is KYC verification?',
        a: 'KYC (Know Your Customer) verification is our identity verification process. You can upload a government-issued ID (Aadhaar, PAN, or Driving License) from your Dashboard. Once our admin team verifies it, you\'ll get a green "Verified" badge next to your name, increasing trust with other users.'
      },
    ]
  },
  {
    category: 'For Tenants',
    items: [
      {
        q: 'How do I find a property?',
        a: 'Go to the "Properties" page from the navigation bar. You can search by location, filter by property type (PG, Flat, Hostel, Villa, etc.), configuration (1BHK, 2BHK), and furnishing type. Our smart search also looks in nearby neighborhoods.'
      },
      {
        q: 'How does the roommate matching work?',
        a: 'Visit the "Roommates" page to browse roommate posts from other users. You can filter by location and preferences. Each post shows the user\'s lifestyle preferences, budget, and contact details so you can connect directly.'
      },
      {
        q: 'Can I save properties I like?',
        a: 'Yes! Click the heart icon on any property card to add it to your wishlist. You can view all your saved properties from the "Saved & Shortlisted" tab in your Dashboard.'
      },
    ]
  },
  {
    category: 'For Property Owners',
    items: [
      {
        q: 'How do I list my property?',
        a: 'Click "Post Property" in the navigation bar (you need to be logged in). Fill in your property details including title, location, price, type, configuration, amenities, and upload up to 5 photos. Your listing will be live immediately.'
      },
      {
        q: 'Can I edit or delete my listing?',
        a: 'Yes, go to your Dashboard and find the "My Properties" tab. From there, you can edit any listing details or remove it entirely.'
      },
      {
        q: 'How many photos can I upload?',
        a: 'You can upload up to 5 photos per property listing. We recommend uploading high-quality images of all rooms, the exterior, and common areas to attract more tenants.'
      },
    ]
  },
  {
    category: 'Movers & Packers',
    items: [
      {
        q: 'How does the moving service work?',
        a: 'Visit the "Movers" page to submit a moving request with your current location, destination, moving date, and property size. Registered movers on our platform will be able to view and accept your request, providing quotes for the service.'
      },
      {
        q: 'How do I become a mover on RentXY?',
        a: 'Register with the "Mover" role during signup. Once your profile is complete, you\'ll have access to the Mover Dashboard where you can view and manage incoming moving requests.'
      },
    ]
  },
  {
    category: 'Account & Security',
    items: [
      {
        q: 'I forgot my password. How do I reset it?',
        a: 'Click "Forgot Password" on the login page. Enter your registered email address and we\'ll send you a password reset link via email. The link is valid for 30 minutes.'
      },
      {
        q: 'How do I contact support?',
        a: 'You can reach us via WhatsApp at +91 8767532364, email at rentxybookings@gmail.com, or use the contact details in the footer. We typically respond within 24 hours.'
      },
    ]
  },
];

const FaqPage = () => {
  const [openIndex, setOpenIndex] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const toggle = (key) => setOpenIndex(openIndex === key ? null : key);

  const filtered = faqs.map(cat => ({
    ...cat,
    items: cat.items.filter(item =>
      item.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.a.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(cat => cat.items.length > 0);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors duration-300">

      {/* Hero */}
      <div className="relative overflow-hidden pt-20 pb-16 bg-gradient-to-br from-primary-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900">
        {/* Floating blobs */}
        <div className="absolute top-8 left-8 w-64 h-64 bg-primary-300 dark:bg-primary-900 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[80px] opacity-30 animate-blob pointer-events-none" />
        <div className="absolute top-16 right-8 w-64 h-64 bg-purple-300 dark:bg-purple-900 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[80px] opacity-30 animate-blob animation-delay-2000 pointer-events-none" />

        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/60 dark:bg-white/5 backdrop-blur-sm rounded-full text-xs font-semibold text-primary-700 dark:text-primary-300 border border-primary-100 dark:border-primary-800/50 shadow-sm mb-6 animate-slide-up">
            <HelpCircle size={14} className="text-primary-600 dark:text-primary-400" /> Help Center
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-gray-900 dark:text-white mb-4 tracking-tight animate-slide-up animation-delay-100">
            Frequently Asked{' '}
            <span className="relative inline-block">
              <span className="gradient-text text-primary-600 dark:text-primary-400">Questions</span>
              <svg className="absolute -bottom-1 left-0 w-full" viewBox="0 0 300 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2 9C60 3 180 3 298 9" stroke="#4f46e5" strokeWidth="3" strokeLinecap="round" className="opacity-30" />
              </svg>
            </span>
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mb-8 font-medium animate-slide-up animation-delay-200">
            Everything you need to know about using RentXY
          </p>
          <div className="relative max-w-lg mx-auto animate-slide-up animation-delay-300">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
            <input
              type="text"
              placeholder="Search questions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-sm font-semibold transition-colors"
            />
          </div>
        </div>
      </div>

      {/* FAQ Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        {filtered.length === 0 && (
          <div className="text-center py-12">
            <HelpCircle size={48} className="mx-auto mb-4 text-gray-300 dark:text-gray-600" />
            <p className="text-lg font-medium text-gray-500 dark:text-gray-400">No results found</p>
            <p className="text-sm text-gray-400 dark:text-gray-500">Try searching with different keywords</p>
          </div>
        )}
        {filtered.map((category) => (
          <div key={category.category} className="mb-8">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-1 h-6 bg-primary-500 rounded-full" />
              {category.category}
            </h2>
            <div className="space-y-3">
              {category.items.map((item, j) => {
                const key = `${category.category}-${j}`;
                const isOpen = openIndex === key;
                return (
                  <div
                    key={key}
                    className="bg-white dark:bg-slate-800/80 rounded-xl border border-gray-100 dark:border-slate-700/60 shadow-sm dark:shadow-slate-900/30 overflow-hidden transition-all duration-200"
                  >
                    <button
                      onClick={() => toggle(key)}
                      className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
                    >
                      <span className="font-medium text-gray-900 dark:text-white pr-4">{item.q}</span>
                      <ChevronDown
                        size={18}
                        className={`text-gray-400 dark:text-gray-500 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-6 pb-5 text-gray-600 dark:text-gray-300 text-sm leading-relaxed border-t border-gray-100 dark:border-slate-700/60 pt-4">
                        {item.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Still need help CTA */}
        <div className="mt-12 rounded-2xl bg-gradient-to-br from-primary-600 to-indigo-600 dark:from-primary-700 dark:to-indigo-700 p-8 text-center text-white shadow-xl shadow-primary-600/20">
          <div className="w-14 h-14 bg-white/15 rounded-full flex items-center justify-center mx-auto mb-4">
            <HelpCircle size={28} />
          </div>
          <h3 className="text-xl font-bold mb-2">Still have questions?</h3>
          <p className="text-primary-100 text-sm mb-6">
            Can't find the answer you're looking for? Our support team is happy to help.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="mailto:rentxybookings@gmail.com"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-primary-700 font-bold rounded-xl text-sm hover:bg-primary-50 transition-colors shadow-sm"
            >
              Email Support
            </a>
            <a
              href="https://wa.me/918767532364"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/15 hover:bg-white/25 text-white font-bold rounded-xl text-sm border border-white/20 transition-colors"
            >
              WhatsApp Us
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FaqPage;
