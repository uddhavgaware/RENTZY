import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, Phone, Mail, MapPin, Instagram, Twitter, Facebook } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="col-span-1 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white shadow-lg">
                <Building2 size={24} />
              </div>
              <span className="font-bold text-2xl tracking-tight text-white">
                RentXY
              </span>
            </Link>
            <p className="text-gray-400 text-sm mb-6 leading-relaxed">
              Premium marketplace for PGs, flats, and hostels. Find your perfect stay or the ideal roommate with ease.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Instagram size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Twitter size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Facebook size={20} />
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold tracking-wider uppercase mb-4 text-gray-300">Quick Links</h3>
            <ul className="space-y-3">
              <li><Link to="/listings" className="text-gray-400 hover:text-primary-400 transition-colors">Browse Properties</Link></li>
              <li><Link to="/roommates" className="text-gray-400 hover:text-primary-400 transition-colors">Find Roommates</Link></li>
              <li><Link to="/post-property" className="text-gray-400 hover:text-primary-400 transition-colors">List your Property</Link></li>
              <li><Link to="/about" className="text-gray-400 hover:text-primary-400 transition-colors">About Us</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold tracking-wider uppercase mb-4 text-gray-300">Support</h3>
            <ul className="space-y-3">
              <li><Link to="/faq" className="text-gray-400 hover:text-primary-400 transition-colors">FAQ</Link></li>
              <li><a href="https://wa.me/918767532364" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-green-400 transition-colors flex items-center gap-2">WhatsApp Support (FAQs)</a></li>
              <li><Link to="/terms" className="text-gray-400 hover:text-primary-400 transition-colors">Terms of Service</Link></li>
              <li><a href="/privacy.pdf" download className="text-gray-400 hover:text-primary-400 transition-colors">Privacy Policy (PDF)</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold tracking-wider uppercase mb-4 text-gray-300">Contact Us</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <Phone className="text-primary-400 mt-1 flex-shrink-0" size={18} />
                <span className="text-gray-400 hover:text-white transition-colors cursor-pointer">
                  +91 8767532364
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Mail className="text-primary-400 mt-1 flex-shrink-0" size={18} />
                <span className="text-gray-400 hover:text-white transition-colors cursor-pointer break-all">
                  Udaygaware8@gmail.com
                </span>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="text-primary-400 mt-1 flex-shrink-0" size={18} />
                <span className="text-gray-400">
                  Pune, Maharashtra<br/>India
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-500 text-sm text-center md:text-left mb-4 md:mb-0">
            &copy; {new Date().getFullYear()} RentXY. All rights reserved.
          </p>
          <div className="flex space-x-6 text-sm text-gray-500">
            <span>Built with React & Spring Boot</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
