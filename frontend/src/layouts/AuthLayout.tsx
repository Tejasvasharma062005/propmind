import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { ShieldCheck, CheckCircle2 } from 'lucide-react';
import { PropMindCrest } from '@/components/navigation/Navbar';

export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F6F0DE] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center px-4">
        <Link to="/" className="inline-flex items-center gap-2.5 group mb-4">
          <div className="w-11 h-11 rounded-2xl bg-[#171715] flex items-center justify-center border border-[#494431] group-hover:border-[#C3A66B] transition-colors">
            <PropMindCrest className="w-7 h-7" />
          </div>
          <span className="text-3xl font-serif font-semibold tracking-tight text-[#373124]">
            PropMind
          </span>
        </Link>
        <div className="flex items-center justify-center gap-2 text-[11px] uppercase tracking-[0.2em] text-[#494431] font-semibold mb-1">
          <span>Indore&apos;s Premier Real Estate Platform</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-serif font-semibold tracking-tight text-[#373124]">
          AI-Powered Property Passport
        </h2>
        <p className="mt-1.5 text-xs text-[#494431]">
          Direct verified transactions • Escrow protection • MP RERA & Bhulekh provenance
        </p>
      </div>

      {/* Main Form Outlet Box */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-[#F8F4E9] py-8 px-6 sm:px-10 rounded-2xl border border-[#D8C9A7]">
          <Outlet />
        </div>

        {/* Trust Badges */}
        <div className="mt-6 flex items-center justify-center gap-6 text-xs text-[#494431]">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#494431]" />
            <span>Title-Deed Verified</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-[#C3A66B]" />
            <span>256-Bit Encrypted</span>
          </div>
        </div>
      </div>
    </div>
  );
};
