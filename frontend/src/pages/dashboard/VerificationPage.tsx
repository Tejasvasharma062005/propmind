import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle2,
  ExternalLink,
  FileText,
  Landmark,
  Plus,
  Scale,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import {
  platformService,
  type GovernmentSourceInfo,
  type PropertyPassportRecord,
} from '@/services/platform.service';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { getErrorMessage } from '@/components/listings';
import { formatDate } from '@/lib/utils';

const TIERS = [
  { key: 'IDENTITY', label: 'Owner Identity', field: 'identity_status' as const },
  { key: 'OWNERSHIP', label: 'Title & Ownership', field: 'ownership_status' as const },
  { key: 'LEGAL', label: 'Legal & Encumbrance', field: 'legal_status' as const },
  { key: 'PHYSICAL', label: 'Physical Site Survey', field: 'physical_status' as const },
  { key: 'FINANCIAL', label: 'Tax & Dues Clearance', field: 'financial_status' as const },
];

export const VerificationPage: React.FC = () => {
  const { hasRole } = useAuth();
  const queryClient = useQueryClient();
  const canVerify = hasRole(['ADMIN', 'VERIFIER', 'ADVOCATE']);

  const { data: passports = [], isLoading: loadingPassports } = useQuery({
    queryKey: ['verification-queue'],
    queryFn: () => platformService.getVerificationQueue(),
  });

  const { data: govSources = [] } = useQuery({
    queryKey: ['government-sources'],
    queryFn: () => platformService.getGovernmentSources(),
  });

  const { data: reports = [], isLoading: loadingReports } = useQuery({
    queryKey: ['title-reports'],
    queryFn: () => platformService.getTitleReports(),
  });

  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [govModalOpen, setGovModalOpen] = useState(false);
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [selectedAuthority, setSelectedAuthority] = useState('MP_RERA');
  const [govReferenceNo, setGovReferenceNo] = useState('');
  const [govNotes, setGovNotes] = useState('');
  const [hasSignedCert, setHasSignedCert] = useState(false);

  const [searchYears, setSearchYears] = useState('30');
  const [khasra, setKhasra] = useState('');
  const [encumbrances, setEncumbrances] = useState('None');
  const [opinion, setOpinion] = useState('');
  const [isClear, setIsClear] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const verifyTierMutation = useMutation({
    mutationFn: ({
      propertyId,
      tier,
      status,
    }: {
      propertyId: string;
      tier: string;
      status: string;
    }) =>
      platformService.verifyTier(propertyId, {
        tier,
        status,
        authenticity_level: 'PLATFORM_VERIFIED',
        verification_method: 'MANUAL_PLATFORM_AUDIT',
        notes: `Verified via PropMind Verification Desk`,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['verification-queue'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    },
    onError: (err) => setErrorMsg(getErrorMessage(err)),
  });

  const recordGovCheckMutation = useMutation({
    mutationFn: () =>
      platformService.recordGovernmentCheck(selectedPropertyId, {
        authority: selectedAuthority,
        reference_number: govReferenceNo.trim(),
        notes: govNotes.trim(),
        is_verified: canVerify,
        has_signed_gov_certificate: hasSignedCert,
      }),
    onSuccess: () => {
      setGovModalOpen(false);
      setGovReferenceNo('');
      setGovNotes('');
      setHasSignedCert(false);
      queryClient.invalidateQueries({ queryKey: ['verification-queue'] });
    },
    onError: (err) => setErrorMsg(getErrorMessage(err)),
  });

  const createReportMutation = useMutation({
    mutationFn: () =>
      platformService.createTitleReport({
        property: selectedPropertyId,
        search_period_years: Number(searchYears) || 30,
        khasra_details: khasra,
        encumbrances_found: encumbrances,
        legal_opinion: opinion,
        is_clear_title: isClear,
      }),
    onSuccess: () => {
      setReportModalOpen(false);
      setKhasra('');
      setOpinion('');
      queryClient.invalidateQueries({ queryKey: ['title-reports'] });
      queryClient.invalidateQueries({ queryKey: ['verification-queue'] });
    },
    onError: (err) => setErrorMsg(getErrorMessage(err)),
  });

  if (loadingPassports || loadingReports) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" className="text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-[#1C2420]">
            Property Passport, Government Provenance & Legal Desk
          </h1>
          <p className="text-sm text-[#5A625D] mt-0.5">
            5-pillar Property Passport audits, official MP government source checks, and 30-year title search reports
          </p>
        </div>
        {passports.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setSelectedPropertyId(passports[0].property);
                setGovModalOpen(true);
              }}
              leftIcon={<Landmark className="w-4 h-4 text-primary-600" />}
            >
              Record Official Gov Reference Check
            </Button>
            {canVerify && (
              <Button
                onClick={() => {
                  setSelectedPropertyId(passports[0].property);
                  setReportModalOpen(true);
                }}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                File 30-Yr Title Search Report
              </Button>
            )}
          </div>
        )}
      </div>

      {errorMsg && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          {errorMsg}
        </div>
      )}

      {/* 1. Madhya Pradesh & Indore Official Government Source Adapters */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Landmark className="w-5 h-5 text-primary-600" />
          Madhya Pradesh & Indore Government Source Registry ({govSources.length} Authorities)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {govSources.map((src: GovernmentSourceInfo) => (
            <Card key={src.authority} className="p-4 space-y-2 text-xs">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-bold text-slate-900 text-sm block">{src.authority.replace(/_/g, ' ')}</span>
                  <a
                    href={src.official_portal_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary-600 hover:underline inline-flex items-center gap-1"
                  >
                    {src.official_domain} <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <Badge
                  variant={src.is_live_api_configured ? 'success' : 'warning'}
                  size="sm"
                >
                  {src.is_live_api_configured ? 'Live API' : 'Manual Audit Mode'}
                </Badge>
              </div>
              <p className="text-slate-600">{src.responsible_department}</p>
              <p className="text-[11px] text-slate-400">
                Required Key: <strong>{src.reference_label}</strong> • Freshness: {src.freshness_days}d
              </p>
            </Card>
          ))}
        </div>
      </section>

      {/* 2. 5-Pillar Property Passports with Provenance */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          Property Passports & Provenance Ledger ({passports.length})
        </h2>

        {passports.length === 0 ? (
          <EmptyState
            icon={ShieldCheck}
            title="No property passports yet"
            description="Register a property to initialize its 5-pillar PropMind Digital Passport."
          />
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {passports.map((p: PropertyPassportRecord) => (
              <Card key={p.id} className="p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900">
                        {p.property_title} ({p.property_locality})
                      </h3>
                      <Badge variant={p.is_verified ? 'success' : 'warning'} size="sm">
                        Passport Score: {p.overall_score}%
                      </Badge>
                      {p.authenticity_summary_display && (
                        <Badge variant="primary" size="sm">
                          Provenance: {p.authenticity_summary_display}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Owner: <strong>{p.owner_name}</strong> • Asset Type: {p.property_type_display}
                    </p>
                  </div>
                  {p.last_verified_at && (
                    <span className="text-xs text-slate-400">
                      Last verified: {formatDate(p.last_verified_at)}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
                  {TIERS.map((tier) => {
                    const statusVal = p[tier.field];
                    const isVerified = statusVal === 'VERIFIED';
                    const itemDetail = p.items?.find((i) => i.tier === tier.key);
                    return (
                      <div
                        key={tier.key}
                        className={`p-3 rounded-xl border text-xs flex flex-col justify-between gap-2 ${
                          isVerified
                            ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                            : 'bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="font-semibold flex items-center justify-between gap-1">
                            <span>{tier.label}</span>
                            {isVerified && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                          </div>
                          <span className="text-[11px] font-medium block">
                            {itemDetail?.authenticity_level_display || statusVal}
                          </span>
                          {itemDetail?.source_reference && (
                            <span className="text-[10px] font-mono text-slate-500 block truncate">
                              Ref: {itemDetail.source_reference}
                            </span>
                          )}
                        </div>

                        {canVerify && (
                          <Button
                            size="sm"
                            variant={isVerified ? 'secondary' : 'primary'}
                            onClick={() =>
                              verifyTierMutation.mutate({
                                propertyId: p.property,
                                tier: tier.key,
                                status: isVerified ? 'FLAGGED' : 'VERIFIED',
                              })
                            }
                            isLoading={verifyTierMutation.isPending}
                          >
                            {isVerified ? 'Flag' : 'Verify'}
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>

                {p.government_checks && p.government_checks.length > 0 && (
                  <div className="bg-slate-50 rounded-xl p-3 space-y-1.5 text-xs">
                    <p className="font-semibold text-slate-600 uppercase tracking-wider text-[10px]">
                      Official Source Provenance Log
                    </p>
                    {p.government_checks.map((chk) => (
                      <div
                        key={chk.id}
                        className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/60 last:border-none pb-1 last:pb-0"
                      >
                        <span>
                          <strong>{chk.authority}</strong> ({chk.official_domain}) • Ref:{' '}
                          <span className="font-mono font-semibold">{chk.reference_number}</span>
                        </span>
                        <span className="text-slate-500">
                          {chk.authenticity_level_display} • {formatDate(chk.retrieved_at)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* 3. Advocate Title Search Reports */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Scale className="w-5 h-5 text-indigo-600" />
          Advocate Title Search Reports ({reports.length})
        </h2>

        {reports.length === 0 ? (
          <Card className="p-6 text-sm text-slate-500">
            No advocate title search reports filed yet.
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {reports.map((r) => (
              <Card
                key={r.id}
                className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900">
                        {r.property_title} — {r.search_period_years}-Year Chain of Title Report
                      </h3>
                      <Badge variant={r.is_clear_title ? 'success' : 'danger'} size="sm">
                        {r.is_clear_title ? 'Clear Marketable Title' : 'Encumbrance Flagged'}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-600">{r.legal_opinion}</p>
                    {r.khasra_details && (
                      <p className="text-xs text-slate-500">
                        <strong>Revenue / Khasra:</strong> {r.khasra_details} •{' '}
                        <strong>Encumbrances:</strong> {r.encumbrances_found}
                      </p>
                    )}
                    <span className="text-[11px] text-slate-400 block">
                      Filed by: {r.advocate_name || 'Verified Advocate'} • {formatDate(r.created_at)}
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Modal: Record Official Government Source Check */}
      <Modal
        isOpen={govModalOpen}
        onClose={() => setGovModalOpen(false)}
        title="Record Official Government Source Check"
        description="Log a provenance-tracked verification against MP Bhulekh, MP RERA, IGRS SAMPADA, IMC Indore, IDA, or T&CP."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            recordGovCheckMutation.mutate();
          }}
          className="space-y-4"
        >
          <Select
            label="Property"
            options={passports.map((p) => ({
              value: p.property,
              label: `${p.property_title} (${p.property_locality})`,
            }))}
            value={selectedPropertyId}
            onChange={(e) => setSelectedPropertyId(e.target.value)}
            required
          />
          <Select
            label="Government Authority"
            options={govSources.map((s) => ({
              value: s.authority,
              label: `${s.authority.replace(/_/g, ' ')} (${s.official_domain})`,
            }))}
            value={selectedAuthority}
            onChange={(e) => setSelectedAuthority(e.target.value)}
            required
          />
          <Input
            label="Official Reference / Registration Number"
            placeholder="e.g. P-IND-24-09821 or Khasra 412/2 or IMC-TAX-452010"
            value={govReferenceNo}
            onChange={(e) => setGovReferenceNo(e.target.value)}
            required
          />
          <Input
            label="Verification Observations / Notes"
            placeholder="Record exact findings from the official portal or certified copy"
            value={govNotes}
            onChange={(e) => setGovNotes(e.target.value)}
          />
          {canVerify && (
            <label className="flex items-center gap-2 text-xs text-slate-700">
              <input
                type="checkbox"
                checked={hasSignedCert}
                onChange={(e) => setHasSignedCert(e.target.checked)}
                className="rounded border-slate-300"
              />
              Digitally signed official government certificate verified (marks as Government Verified)
            </label>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setGovModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={recordGovCheckMutation.isPending}>
              Save Provenance Record
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: File 30-Year Title Search Report */}
      <Modal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        title="File 30-Year Title Search Report"
        description="Submitting a clear title report automatically verifies the LEGAL pillar on the Property Passport."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createReportMutation.mutate();
          }}
          className="space-y-4"
        >
          <Select
            label="Property"
            options={passports.map((p) => ({
              value: p.property,
              label: `${p.property_title} (${p.property_locality})`,
            }))}
            value={selectedPropertyId}
            onChange={(e) => setSelectedPropertyId(e.target.value)}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Search Period (Years)"
              type="number"
              min={13}
              max={100}
              value={searchYears}
              onChange={(e) => setSearchYears(e.target.value)}
              required
            />
            <Input
              label="Encumbrances Found"
              value={encumbrances}
              onChange={(e) => setEncumbrances(e.target.value)}
              required
            />
          </div>
          <Input
            label="Khasra / Khatoni & Mutation Details"
            placeholder="e.g. Khasra No. 412/2, Tehsil Indore — MP Bhulekh verified"
            value={khasra}
            onChange={(e) => setKhasra(e.target.value)}
            required
          />
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Advocate Legal Opinion
            </label>
            <textarea
              rows={3}
              required
              value={opinion}
              onChange={(e) => setOpinion(e.target.value)}
              placeholder="Summarize chain of title and Sub-Registrar book verification..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={isClear}
              onChange={(e) => setIsClear(e.target.checked)}
              className="rounded border-slate-300"
            />
            Title is clear, marketable, and free from encumbrances
          </label>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setReportModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={createReportMutation.isPending}>
              Submit Legal Report
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
