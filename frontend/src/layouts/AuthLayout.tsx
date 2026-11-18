import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { ShieldCheck, CheckCircle2 } from 'lucide-react';
import { PropMindCrest } from '@/components/navigation/Navbar';

export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center px-4">
        <Link to="/" className="inline-flex items-center gap-2.5 group mb-4">
          <div className="w-11 h-11 rounded-2xl bg-[#1B3126] flex items-center justify-center shadow-md group-hover:bg-[#122119] transition-colors">
            <PropMindCrest className="w-7 h-7" />
          </div>
          <span className="text-3xl font-serif font-bold tracking-tight text-[#1C2420]">
            PropMind
          </span>
        </Link>
        <div className="flex items-center justify-center gap-2 text-[11px] uppercase tracking-[0.2em] text-[#5A625D] font-semibold mb-1">
          <span>Indore&apos;s Premier Real Estate Platform</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-serif font-semibold tracking-tight text-[#1C2420]">
          AI-Powered Property Passport
        </h2>
        <p className="mt-1.5 text-xs text-[#5A625D]">
          Direct verified transactions • Escrow protection • MP RERA & Bhulekh provenance
        </p>
      </div>

      {/* Main Form Outlet Box */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-sm rounded-2xl border border-[#E6E0D3]">
          <Outlet />
        </div>

        {/* Trust Badges */}
        <div className="mt-6 flex items-center justify-center gap-6 text-xs text-[#5A625D]">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#4E6B58]" />
            <span>Title-Deed Verified</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-[#C9A96E]" />
            <span>256-Bit Encrypted</span>
          </div>
        </div>
      </div>
    </div>
  );
};
