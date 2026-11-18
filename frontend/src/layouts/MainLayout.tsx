import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Navbar, PropMindCrest } from '@/components/navigation/Navbar';
import { ShieldCheck, Mail, MapPin, Heart } from 'lucide-react';

export const MainLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F2] text-[#1C2420]">
      <Navbar />

      <main className="flex-1">
        <Outlet />
      </main>

      {/* Editorial Forest-Green Footer */}
      <footer className="bg-[#122119] text-[#D8D2C5] border-t border-[#243D30]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-12">
            {/* Col 1: Brand & Bio */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center gap-2.5">
                <PropMindCrest className="w-8 h-8" />
                <span className="text-2xl font-serif font-semibold tracking-tight text-[#FAF7F2]">
                  PropMind
                </span>
              </div>
              <p className="text-sm text-[#B5B0A4] max-w-sm leading-relaxed">
                PropMind: AI-Powered Property Passport for Real Estate.
                Digitally verifying property titles, registries, and encumbrances for transparent,
                fraud-free property dealings in Indore.
              </p>
              <div className="flex items-center gap-2 text-xs text-[#C9A96E] font-medium bg-white/5 border border-[#C9A96E]/30 w-fit px-3.5 py-1.5 rounded-full">
                <ShieldCheck className="w-4 h-4 text-[#C9A96E]" />
                <span>RERA MP Compliant & Title Deed Verified</span>
              </div>
            </div>

            {/* Col 2: Indore Prime Localities */}
            <div>
              <h4 className="text-xs font-semibold text-[#C9A96E] uppercase tracking-[0.18em] mb-4">
                Indore Hotspots
              </h4>
              <ul className="space-y-2.5 text-sm text-[#C2BDB2]">
                <li>
                  <Link to="/properties?locality=Vijay%20Nagar" className="hover:text-[#FAF7F2] transition-colors">
                    Vijay Nagar
                  </Link>
                </li>
                <li>
                  <Link to="/properties?locality=Super%20Corridor" className="hover:text-[#FAF7F2] transition-colors">
                    Super Corridor
                  </Link>
                </li>
                <li>
                  <Link to="/properties?locality=Palasia" className="hover:text-[#FAF7F2] transition-colors">
                    New & Old Palasia
                  </Link>
                </li>
                <li>
                  <Link to="/properties?locality=Bypass%20Road" className="hover:text-[#FAF7F2] transition-colors">
                    Bypass Road
                  </Link>
                </li>
                <li>
                  <Link to="/properties?locality=Scheme%2054" className="hover:text-[#FAF7F2] transition-colors">
                    Scheme 54 & 78
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 3: Platform */}
            <div>
              <h4 className="text-xs font-semibold text-[#C9A96E] uppercase tracking-[0.18em] mb-4">
                Platform
              </h4>
              <ul className="space-y-2.5 text-sm text-[#C2BDB2]">
                <li>
                  <Link to="/properties" className="hover:text-[#FAF7F2] transition-colors">
                    Browse All Properties
                  </Link>
                </li>
                <li>
                  <Link to="/listings" className="hover:text-[#FAF7F2] transition-colors">
                    Verified Marketplace
                  </Link>
                </li>
                <li>
                  <Link to="/dashboard/properties" className="hover:text-[#FAF7F2] transition-colors">
                    List Your Property
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="hover:text-[#FAF7F2] transition-colors">
                    Sign In
                  </Link>
                </li>
                <li>
                  <Link to="/register" className="hover:text-[#FAF7F2] transition-colors">
                    Register as Broker/Partner
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 4: Contact & Indore Office */}
            <div>
              <h4 className="text-xs font-semibold text-[#C9A96E] uppercase tracking-[0.18em] mb-4">
                Contact Office
              </h4>
              <ul className="space-y-3 text-sm text-[#C2BDB2]">
                <li className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-[#C9A96E] mt-1 shrink-0" />
                  <span>Shree Sampada Row Houses and Bungalows, Near Airport Road, Indore</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-[#C9A96E] shrink-0" />
                  <span>sharmatejasva7@gmail.com</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#8D948E]">
            <p>© {new Date().getFullYear()} PropMind: AI-Powered Property Passport for Real Estate. All rights reserved.</p>
            <p className="flex items-center gap-1">
              Built with <Heart className="w-3.5 h-3.5 text-[#C9A96E] fill-[#C9A96E]" /> for Indore&apos;s Real Estate Community
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
