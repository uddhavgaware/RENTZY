import React, { useState } from 'react';
import { ChevronDown, HelpCircle, Search } from 'lucide-react';

const faqs = [
  {
    category: 'Getting Started',
    items: [
      {
        q: 'How do I create an account on Rentzy?',
        a: 'Click the "Login / Signup" button in the top-right corner of the page. You can sign up using your email and password, your mobile number via OTP, or your Google account. After signing up, you\'ll need to complete your profile before accessing all features.'
      },
      {
        q: 'Is Rentzy free to use?',
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
        q: 'How do I become a mover on Rentzy?',
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
        a: 'You can reach us via WhatsApp at +91 8767532364, email at Udaygaware8@gmail.com, or use the contact details in the footer. We typically respond within 24 hours.'
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
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-sm mb-6">
            <HelpCircle size={16} /> Help Center
          </div>
          <h1 className="text-4xl font-bold mb-4">Frequently Asked Questions</h1>
          <p className="text-primary-100 mb-8">Everything you need to know about using Rentzy</p>
          <div className="relative max-w-lg mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search questions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30"
            />
          </div>
        </div>
      </div>

      {/* FAQ Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <HelpCircle size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">No results found</p>
            <p className="text-sm">Try searching with different keywords</p>
          </div>
        )}
        {filtered.map((category) => (
          <div key={category.category} className="mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-1 h-6 bg-primary-500 rounded-full"></span>
              {category.category}
            </h2>
            <div className="space-y-3">
              {category.items.map((item, j) => {
                const key = `${category.category}-${j}`;
                const isOpen = openIndex === key;
                return (
                  <div key={key} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    <button
                      onClick={() => toggle(key)}
                      className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors"
                    >
                      <span className="font-medium text-gray-900 pr-4">{item.q}</span>
                      <ChevronDown size={18} className={`text-gray-400 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isOpen && (
                      <div className="px-6 pb-4 text-gray-600 text-sm leading-relaxed border-t border-gray-50 pt-3">
                        {item.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FaqPage;
