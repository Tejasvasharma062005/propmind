import React, { useState } from 'react';
import {
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Award,
  FileCheck2,
} from 'lucide-react';
import type { PropertyPassport as PassportType } from '@/types/property.types';
import type { PropertyPassportRecord } from '@/services/platform.service';
import { formatDate, cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';

export interface PropertyPassportProps {
  passport?: PassportType | PropertyPassportRecord | null;
  className?: string;
}

export const PropertyPassport: React.FC<PropertyPassportProps> = ({ passport, className }) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  if (!passport) {
    return (
      <div
        className={cn(
          'rounded-2xl border border-[#E6E0D3] bg-[#F3EFE6] p-6 text-sm text-[#5A625D]',
          className
        )}
      >
        PropMind Digital Passport audit has not been initialized for this property yet.
      </div>
    );
  }

  const raw = passport as unknown as PropertyPassportRecord & PassportType;
  const overallScore = raw.overall_score ?? 0;
  const lastVerified = raw.last_verified_at || raw.last_verified_on;

  const pillars =
    raw.items && raw.items.length > 0
      ? raw.items.map((item) => ({
          name: item.tier_display || item.tier,
          status: item.status,
          score: item.status === 'VERIFIED' ? 100 : 0,
          notes: item.notes || 'Verification audit record logged in PropMind provenance ledger.',
          verifier_name: item.verifier_name,
        }))
      : [
          { name: 'Owner Identity', status: raw.identity_status || 'NOT_STARTED', score: raw.identity_status === 'VERIFIED' ? 100 : 0, notes: 'Identity & KYC verification', verifier_name: '' },
          { name: 'Title & Ownership', status: raw.ownership_status || 'NOT_STARTED', score: raw.ownership_status === 'VERIFIED' ? 100 : 0, notes: 'Chain of title & Sale Deed audit', verifier_name: '' },
          { name: 'Legal & Encumbrance', status: raw.legal_status || 'NOT_STARTED', score: raw.legal_status === 'VERIFIED' ? 100 : 0, notes: '30-year Sub-Registrar encumbrance search', verifier_name: '' },
          { name: 'Physical Site Survey', status: raw.physical_status || 'NOT_STARTED', score: raw.physical_status === 'VERIFIED' ? 100 : 0, notes: 'On-site carpet area & boundary inspection', verifier_name: '' },
          { name: 'Tax & Dues Clearance', status: raw.financial_status || 'NOT_STARTED', score: raw.financial_status === 'VERIFIED' ? 100 : 0, notes: 'Municipal tax & utility NOC verification', verifier_name: '' },
        ];

  const getStatusIcon = (status: string) => {
    if (status === 'VERIFIED') return <CheckCircle2 className="w-4 h-4 text-[#4E6B58]" />;
    if (status === 'FLAGGED' || status === 'REJECTED')
      return <AlertTriangle className="w-4 h-4 text-rose-600" />;
    return <Clock className="w-4 h-4 text-[#C9A96E]" />;
  };

  return (
    <div
      className={cn(
        'rounded-2xl border border-[#D5CCB9] bg-white shadow-xs overflow-hidden',
        className
      )}
    >
      <div className="p-5 sm:p-6 bg-[#16281F] text-[#FAF7F2] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#C9A96E]/15 border border-[#C9A96E]/40 flex items-center justify-center text-[#C9A96E]">
            <Award className="w-7 h-7" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-xl font-serif font-bold text-[#FAF7F2]">PropMind Digital Passport</h3>
              <Badge
                variant={overallScore === 100 ? 'success' : 'warning'}
                size="sm"
              >
                {overallScore === 100 ? 'Fully Verified' : 'Audit In Progress'}
              </Badge>
            </div>
            <p className="text-xs text-[#C5D7CB] mt-0.5">
              5-Pillar Legal, Title, Physical & Financial Verification Ledger
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-white/10 border border-[#C9A96E]/30 px-4 py-2 rounded-xl backdrop-blur-xs self-stretch sm:self-auto justify-between sm:justify-start">
          <div className="text-right">
            <span className="text-[10px] text-[#E6E0D3] uppercase tracking-[0.16em] block">
              Trust Score
            </span>
            <span className="text-2xl font-serif font-bold text-[#C9A96E] leading-none">
              {overallScore}%
            </span>
          </div>
          <ShieldCheck className="w-7 h-7 text-[#C9A96E]" />
        </div>
      </div>

      <div className="p-5 sm:p-6 space-y-3 bg-[#FAF7F2]/60">
        <div className="text-[11px] font-semibold text-[#5A625D] uppercase tracking-[0.18em] mb-2">
          5-Pillar Legal & Physical Verification Audit
        </div>

        <div className="space-y-2">
          {pillars.map((cat, idx) => {
            const isExpanded = expandedIndex === idx;
            return (
              <div
                key={cat.name}
                className="border border-[#E6E0D3] rounded-xl bg-white overflow-hidden transition-all duration-150"
              >
                <div
                  onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                  className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-[#FAF7F2] select-none"
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(cat.status)}
                    <span className="text-sm font-semibold text-[#1C2420]">{cat.name}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        'text-xs font-bold px-2.5 py-0.5 rounded-full',
                        cat.status === 'VERIFIED'
                          ? 'text-[#2D4737] bg-[#E6EDE8]'
                          : 'text-[#7A5C29] bg-[#F5EEDC]'
                      )}
                    >
                      {cat.status}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-[#7A827D]" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-[#7A827D]" />
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-4 pb-4 pt-2 border-t border-[#EFEAE0] bg-[#FAF7F2] space-y-2 text-xs text-[#5A625D]">
                    <p>{cat.notes}</p>
                    {cat.verifier_name && (
                      <div className="pt-1 flex items-center gap-1.5 text-[11px] text-[#5A625D]">
                        <FileCheck2 className="w-3.5 h-3.5 text-[#4E6B58]" />
                        <span>Verified by: {cat.verifier_name}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-[#5A625D] border-t border-[#E6E0D3]">
          <span>
            Last audit update:{' '}
            <strong className="text-[#1C2420]">
              {lastVerified ? formatDate(lastVerified) : 'Pending'}
            </strong>
          </span>
          <span className="text-[#1B3126] font-semibold">
            Certificate ID: PM-IND-{(raw.id || '').slice(0, 8).toUpperCase()}
          </span>
        </div>
      </div>
    </div>
  );
};
