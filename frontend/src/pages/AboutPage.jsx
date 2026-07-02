import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, Users, Shield, Heart, MapPin, Phone, Mail, ArrowRight, Zap, BadgeCheck, Truck } from 'lucide-react';

const STATS = [
  { value: '2,500+', label: 'Properties Listed', icon: Building2 },
  { value: '10,000+', label: 'Happy Tenants', icon: Users },
  { value: '25+', label: 'Cities Covered', icon: MapPin },
  { value: '₹0', label: 'Brokerage Fee', icon: Shield },
];

const VALUES = [
  { icon: Shield, title: 'Zero Brokerage', desc: 'We believe renters shouldn\'t pay extra fees. Direct connections, always.', color: 'bg-blue-50 text-blue-600 border-blue-100' },
  { icon: BadgeCheck, title: 'Trust & Safety', desc: 'Every owner and mover is KYC-verified with government-issued ID.', color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
  { icon: Heart, title: 'Community First', desc: 'We\'re building more than listings — we\'re building neighbourhoods.', color: 'bg-rose-50 text-rose-600 border-rose-100' },
  { icon: Zap, title: 'Instant & Simple', desc: 'Find, compare and contact landlords in under 5 minutes.', color: 'bg-amber-50 text-amber-600 border-amber-100' },
];

const TEAM = [
  { name: 'Uddhav Gaware', role: 'Founder & CEO', avatar: '👨‍💻', bio: 'Full-stack engineer turned entrepreneur, passionate about making renting fair for everyone.' },
];

const AboutPage = () => {
  return (
    <div className="min-h-screen bg-white">

      {/* Hero */}
      <section className="relative py-24 sm:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900 via-primary-800 to-indigo-900" />
        <div className="absolute top-0 left-0 w-80 h-80 bg-white/5 rounded-full -translate-x-1/3 -translate-y-1/3 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full translate-x-1/3 translate-y-1/3 pointer-events-none" />

        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 border border-white/20 rounded-full text-white/80 text-xs font-bold uppercase tracking-widest mb-6">
            <Building2 size={14} /> About RentXY
          </div>
          <h1 className="text-4xl sm:text-6xl font-black text-white mb-6 leading-tight">
            Making Renting<br />
            <span className="text-primary-300">Simple & Fair</span>
          </h1>
          <p className="text-primary-100 text-base sm:text-xl max-w-2xl mx-auto leading-relaxed">
            RentXY is India's zero-brokerage rental platform — connecting property owners, tenants,
            roommates and movers directly, without the middleman.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-primary-600">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-primary-500">
            {STATS.map(({ value, label, icon: Icon }) => (
              <div key={label} className="py-8 px-6 text-center">
                <Icon size={22} className="text-primary-200 mx-auto mb-2" />
                <div className="text-2xl sm:text-3xl font-black text-white">{value}</div>
                <div className="text-primary-200 text-sm font-medium mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-20 sm:py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="section-badge mb-5">✦ Our Mission</div>
              <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-5 leading-tight">
                We're Removing the<br />Middleman from Renting
              </h2>
              <p className="text-gray-500 text-base sm:text-lg leading-relaxed mb-5">
                Traditional renting in India means paying 1–2 months' rent as brokerage, dealing with
                fake listings, and spending weeks searching. We built RentXY to fix all of that.
              </p>
              <p className="text-gray-500 text-base sm:text-lg leading-relaxed mb-8">
                Whether you're a student looking for a PG near college, a professional hunting a flat,
                or an owner wanting to rent out your property — RentXY makes it seamless, safe and free.
              </p>
              <Link to="/listings" className="btn-primary inline-flex items-center gap-2">
                Explore Listings <ArrowRight size={18} />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {VALUES.map(({ icon: Icon, title, desc, color }) => (
                <div key={title} className="bg-gray-50 rounded-2xl p-5 border border-gray-100 hover:shadow-md transition-all hover:-translate-y-1 duration-300">
                  <div className={`w-10 h-10 rounded-xl border flex items-center justify-center mb-3 ${color}`}>
                    <Icon size={18} />
                  </div>
                  <h3 className="font-bold text-gray-900 text-sm mb-1">{title}</h3>
                  <p className="text-gray-500 text-xs leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* What we offer */}
      <section className="py-20 sm:py-28 bg-gradient-to-br from-gray-50 to-primary-50/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <div className="section-badge mb-4">✦ Platform</div>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900">What RentXY Offers</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { icon: Building2, title: 'Properties', desc: 'Browse 2,500+ verified PGs, flats, apartments and villas across 25+ cities.', to: '/listings', cta: 'Browse Now', color: 'text-primary-600 bg-primary-50 border-primary-100' },
              { icon: Users, title: 'Roommates', desc: 'Find compatible roommates filtered by gender, diet, lifestyle and move-in date.', to: '/roommates', cta: 'Find Match', color: 'text-purple-600 bg-purple-50 border-purple-100' },
              { icon: Truck, title: 'Packers & Movers', desc: 'Book trusted, vetted movers directly from the platform — no haggling.', to: '/movers', cta: 'Book Movers', color: 'text-orange-600 bg-orange-50 border-orange-100' },
              { icon: BadgeCheck, title: 'KYC Verified', desc: 'All owners and vendors are verified with government ID. No fakes, ever.', to: '/about', cta: 'Learn More', color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
            ].map(({ icon: Icon, title, desc, to, cta, color }) => (
              <div key={title} className="bg-white rounded-2xl sm:rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 flex flex-col">
                <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center mb-4 ${color}`}>
                  <Icon size={22} />
                </div>
                <h3 className="font-black text-gray-900 text-lg mb-2">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed flex-1 mb-4">{desc}</p>
                <Link to={to} className="inline-flex items-center gap-1 text-sm font-bold text-primary-600 hover:text-primary-800 transition-colors">
                  {cta} <ArrowRight size={14} />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-20 sm:py-28 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="section-badge mb-5 mx-auto w-fit">✦ Contact</div>
          <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-4">Get in Touch</h2>
          <p className="text-gray-500 mb-12 text-base sm:text-lg">We're a small team that genuinely cares. Reach out anytime.</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="group flex flex-col items-center bg-gray-50 hover:bg-primary-50 rounded-2xl p-7 border border-gray-100 hover:border-primary-200 transition-all hover:-translate-y-1 hover:shadow-md duration-300">
              <div className="w-14 h-14 rounded-2xl bg-primary-50 border border-primary-100 flex items-center justify-center text-primary-600 mb-4 group-hover:bg-primary-600 group-hover:text-white transition-all">
                <Phone size={24} />
              </div>
              <span className="font-bold text-gray-900 mb-2">Call Us</span>
              <div className="flex flex-col items-center gap-1.5">
                <a href="tel:+918767532364" className="text-sm text-gray-500 font-medium hover:text-primary-600 transition-colors">+91 8767532364</a>
                <a href="tel:+918208022201" className="text-sm text-gray-500 font-medium hover:text-primary-600 transition-colors">+91 8208022201</a>
              </div>
            </div>
            <a href="mailto:rentxybookings@gmail.com" className="group flex flex-col items-center bg-gray-50 hover:bg-primary-50 rounded-2xl p-7 border border-gray-100 hover:border-primary-200 transition-all hover:-translate-y-1 hover:shadow-md duration-300">
              <div className="w-14 h-14 rounded-2xl bg-primary-50 border border-primary-100 flex items-center justify-center text-primary-600 mb-4 group-hover:bg-primary-600 group-hover:text-white transition-all">
                <Mail size={24} />
              </div>
              <span className="font-bold text-gray-900 mb-1">Email Us</span>
              <span className="text-sm text-gray-500 font-medium break-all">rentxybookings@gmail.com</span>
            </a>
            <div className="flex flex-col items-center bg-gray-50 rounded-2xl p-7 border border-gray-100">
              <div className="w-14 h-14 rounded-2xl bg-primary-50 border border-primary-100 flex items-center justify-center text-primary-600 mb-4">
                <MapPin size={24} />
              </div>
              <span className="font-bold text-gray-900 mb-1">Location</span>
              <span className="text-sm text-gray-500 font-medium text-center">Pune, Maharashtra, India</span>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default AboutPage;
