import React from 'react';
import { Building2, Users, Shield, Heart, MapPin, Phone, Mail } from 'lucide-react';

const AboutPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 text-white py-20 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-primary-300 rounded-full blur-3xl"></div>
        </div>
        <div className="max-w-5xl mx-auto px-4 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-sm mb-6">
            <Building2 size={16} /> About Rentzy
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
            Making Renting <span className="text-primary-200">Simple & Secure</span>
          </h1>
          <p className="text-lg text-primary-100 max-w-2xl mx-auto leading-relaxed">
            Rentzy is a premium marketplace that connects property owners with tenants, 
            roommates with compatible matches, and movers with those who need help relocating.
          </p>
        </div>
      </div>

      {/* Mission Section */}
      <div className="max-w-5xl mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Mission</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              We believe finding a home should be as easy as ordering food online. Rentzy was built
              to eliminate the hassle of traditional rental hunting — no brokers, no hidden fees, 
              just direct connections between owners and tenants.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Whether you're a student looking for a PG near your college, a professional searching 
              for a flat near your office, or a family looking for a spacious villa — Rentzy has you covered.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: Users, label: 'Direct Connect', desc: 'No middlemen, no brokers' },
              { icon: Shield, label: 'KYC Verified', desc: 'All users are verified' },
              { icon: Heart, label: 'Roommate Match', desc: 'Find compatible roommates' },
              { icon: MapPin, label: 'Local Search', desc: 'Neighborhood-aware search' },
            ].map((item, i) => (
              <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600 mb-3">
                  <item.icon size={20} />
                </div>
                <h3 className="font-semibold text-gray-900 text-sm">{item.label}</h3>
                <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-white py-12 border-y border-gray-100">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: '500+', label: 'Properties Listed' },
            { value: '1000+', label: 'Happy Tenants' },
            { value: '50+', label: 'Cities Covered' },
            { value: '24/7', label: 'Customer Support' },
          ].map((stat, i) => (
            <div key={i}>
              <div className="text-3xl font-bold text-primary-600 mb-1">{stat.value}</div>
              <div className="text-sm text-gray-500">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Contact Section */}
      <div className="max-w-5xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Get in Touch</h2>
        <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto">
          <a href="tel:+918767532364" className="flex flex-col items-center bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow text-center">
            <Phone className="text-primary-600 mb-3" size={24} />
            <span className="font-medium text-gray-900">Phone</span>
            <span className="text-sm text-gray-500 mt-1">+91 8767532364</span>
          </a>
          <a href="mailto:Udaygaware8@gmail.com" className="flex flex-col items-center bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow text-center">
            <Mail className="text-primary-600 mb-3" size={24} />
            <span className="font-medium text-gray-900">Email</span>
            <span className="text-sm text-gray-500 mt-1">Udaygaware8@gmail.com</span>
          </a>
          <div className="flex flex-col items-center bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
            <MapPin className="text-primary-600 mb-3" size={24} />
            <span className="font-medium text-gray-900">Location</span>
            <span className="text-sm text-gray-500 mt-1">Pune, Maharashtra, India</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
