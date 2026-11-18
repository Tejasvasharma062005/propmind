import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  MapPin,
  BedDouble,
  Bath,
  Maximize2,
  Building,
  ShieldCheck,
  FileText,
  Download,
  Phone,
  Send,
  ChevronRight,
  CheckCircle2,
  Sparkles,
  CalendarCheck,
  IndianRupee,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { propertyService } from '@/services/property.service';
import { platformService } from '@/services/platform.service';
import { ImageGallery } from '@/components/properties/ImageGallery';
import { PropertyPassport } from '@/components/properties/PropertyPassport';
import { formatCurrency, formatArea } from '@/lib/utils';
import { getErrorMessage } from '@/components/listings';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';

export const PropertyDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [activeModal, setActiveModal] = useState<'INQUIRY' | 'VISIT' | 'OFFER' | null>(null);
  const [inquiryMessage, setInquiryMessage] = useState(
    'I am interested in this property. Please share further details.'
  );
  const [visitDate, setVisitDate] = useState('');
  const [visitNotes, setVisitNotes] = useState('');
  const [offerAmount, setOfferAmount] = useState('');
  const [offerTerms, setOfferTerms] = useState(
    '10% token deposit in escrow upon acceptance, balance within 45 days.'
  );
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalSuccess, setModalSuccess] = useState<string | null>(null);

  const { data: propertyResponse, isLoading, isError } = useQuery({
    queryKey: ['property', id],
    queryFn: async () => {
      if (!id) throw new Error('No id provided');
      return await propertyService.getPropertyById(id);
    },
    enabled: !!id,
    retry: false,
  });

  const property = propertyResponse?.data;

  const requireAuth = (modal: 'INQUIRY' | 'VISIT' | 'OFFER') => {
    setModalError(null);
    setModalSuccess(null);
    if (!isAuthenticated) {
      navigate(`/login?redirect=${encodeURIComponent(`/properties/${id}`)}`);
      return;
    }
    if (modal === 'OFFER' && property) {
      setOfferAmount(String(property.price));
    }
    setActiveModal(modal);
  };

  const leadMutation = useMutation({
    mutationFn: () =>
      platformService.createLead({
        property: id!,
        inquiry_message: inquiryMessage,
        budget_max: property?.price,
      }),
    onSuccess: () => setModalSuccess('Inquiry sent! Track responses in your Leads dashboard.'),
    onError: (err) => setModalError(getErrorMessage(err)),
  });

  const visitMutation = useMutation({
    mutationFn: () =>
      platformService.scheduleVisit({
        property: id!,
        scheduled_at: new Date(visitDate).toISOString(),
        visitor_notes: visitNotes,
      }),
    onSuccess: () => setModalSuccess('Site visit scheduled! View status in your Visits dashboard.'),
    onError: (err) => setModalError(getErrorMessage(err)),
  });

  const offerMutation = useMutation({
    mutationFn: () =>
      platformService.startNegotiation({
        property_id: id!,
        amount: offerAmount,
        terms: offerTerms,
      }),
    onSuccess: () =>
      setModalSuccess('Purchase offer submitted! Track negotiation in Deal Room & Escrow.'),
    onError: (err) => setModalError(getErrorMessage(err)),
  });

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <Spinner size="lg" className="text-[#1B3126] mb-3" />
        <p className="text-[#5A625D] text-sm">Loading PropMind Property Passport...</p>
      </div>
    );
  }

  if (isError || !property) {
    return (
      <div className="max-w-3xl mx-auto py-20 px-4">
        <EmptyState
          icon={Building}
          title="Property not found"
          description="The requested property record does not exist or has been removed."
          actionText="Browse Properties"
          onAction={() => navigate('/properties')}
        />
      </div>
    );
  }

  const rawAmenities = (property.amenities || []) as unknown as Array<
    string | { id?: string; amenity_name?: string }
  >;
  const amenityLabels = rawAmenities
    .map((a) => (typeof a === 'string' ? a : a?.amenity_name || ''))
    .filter(Boolean);

  const rawDocs = (property.documents || []) as unknown as Array<{
    id: string;
    title?: string;
    document_type: string;
    document_type_display?: string;
    file_url?: string;
    document_file?: string;
  }>;

  const carpetSqft = Number(
    property.carpet_area_sqft ||
      (property as unknown as { carpet_area?: number }).carpet_area ||
      (property as unknown as { built_up_area?: number }).built_up_area ||
      1
  );
  const bhkCount =
    property.bhk_count ?? (property as unknown as { bedrooms?: number }).bedrooms ?? 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Breadcrumb Nav */}
      <nav className="flex items-center gap-2 text-xs font-medium text-[#5A625D]">
        <Link to="/" className="hover:text-[#1C2420] transition-colors">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-[#888F8A]" />
        <Link to="/properties" className="hover:text-[#1C2420] transition-colors">
          Indore Properties
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-[#888F8A]" />
        <span className="text-[#1C2420] truncate max-w-xs">{property.title}</span>
      </nav>

      {/* Media Gallery Section */}
      <ImageGallery media={property.media} />

      {/* Main Content & Pricing Sticky Sidebar Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-8">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="primary" size="md">
                {property.property_type.replace(/_/g, ' ')}
              </Badge>
              {property.is_verified && (
                <Badge variant="success" size="md" dot>
                  PropMind Verified
                </Badge>
              )}
              <Badge variant="outline" size="md">
                ID: #{property.id.slice(0, 8).toUpperCase()}
              </Badge>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-[#1C2420] tracking-tight">
              {property.title}
            </h1>

            <div className="flex items-center gap-1.5 text-[#5A625D] text-sm">
              <MapPin className="w-4 h-4 text-[#4E6B58] shrink-0" />
              <span>
                {property.address}, <strong className="text-[#1C2420]">{property.locality}</strong>, {property.city},{' '}
                {property.state} - {property.pincode}
              </span>
            </div>
          </div>

          {/* Core Specs Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-5 bg-white rounded-2xl border border-[#E6E0D3] shadow-2xs">
            {bhkCount > 0 && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#F3EFE6] text-[#1B3126] flex items-center justify-center shrink-0">
                  <BedDouble className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] text-[#7A827D] font-semibold block uppercase tracking-wider">
                    Configuration
                  </span>
                  <span className="text-sm font-bold text-[#1C2420]">{bhkCount} BHK</span>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#F3EFE6] text-[#1B3126] flex items-center justify-center shrink-0">
                <Maximize2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] text-[#7A827D] font-semibold block uppercase tracking-wider">
                  Carpet Area
                </span>
                <span className="text-sm font-bold text-[#1C2420]">{formatArea(carpetSqft)}</span>
              </div>
            </div>

            {property.bathrooms !== undefined && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#F3EFE6] text-[#1B3126] flex items-center justify-center shrink-0">
                  <Bath className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] text-[#7A827D] font-semibold block uppercase tracking-wider">
                    Bathrooms
                  </span>
                  <span className="text-sm font-bold text-[#1C2420]">
                    {property.bathrooms} Baths
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* About Description */}
          <Card className="p-6 space-y-3">
            <h2 className="text-2xl font-serif font-bold text-[#1C2420]">About This Property</h2>
            <p className="text-sm text-[#5A625D] leading-relaxed whitespace-pre-line">
              {property.description}
            </p>
          </Card>

          {/* Property Passport Trust Component */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#C9A96E]" />
              <h2 className="text-2xl font-serif font-bold text-[#1C2420]">
                PropMind Digital Verification Passport
              </h2>
            </div>
            <PropertyPassport passport={property.passport} />
          </div>

          {/* Amenities Grid */}
          {amenityLabels.length > 0 && (
            <Card className="p-6 space-y-4">
              <h2 className="text-2xl font-serif font-bold text-[#1C2420]">Features & Amenities</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {amenityLabels.map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-2.5 p-3 rounded-xl bg-[#FAF7F2] border border-[#E6E0D3] text-sm font-medium text-[#1C2420]"
                  >
                    <CheckCircle2 className="w-4 h-4 text-[#4E6B58] shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Legal Documents Vault */}
          {rawDocs.length > 0 && (
            <Card className="p-6 space-y-4">
              <div>
                <h2 className="text-2xl font-serif font-bold text-[#1C2420]">Audited Legal Document Vault</h2>
                <p className="text-xs text-[#5A625D] mt-0.5">
                  Verified copies of registration deeds and municipal clearances
                </p>
              </div>

              <div className="divide-y divide-[#EFEAE0]">
                {rawDocs.map((doc) => (
                  <div
                    key={doc.id}
                    className="py-3.5 flex items-center justify-between gap-4 first:pt-0 last:pb-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#E6EDE8] text-[#1B3126] flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#1C2420]">
                          {doc.title || doc.document_type_display || doc.document_type}
                        </p>
                        <span className="text-xs text-[#7A827D]">{doc.document_type}</span>
                      </div>
                    </div>

                    {(doc.file_url || doc.document_file) && (
                      <a
                        href={doc.file_url || doc.document_file}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <Button
                          variant="secondary"
                          size="sm"
                          leftIcon={<Download className="w-3.5 h-3.5" />}
                        >
                          View
                        </Button>
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Right Column: Sticky Pricing & Action Sidebar */}
        <div className="lg:col-span-1 sticky top-24 space-y-6">
          <Card className="p-6 space-y-6 shadow-sm border-[#D5CCB9]">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7A827D]">
                Listed Price
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-serif font-bold text-[#1C2420]">
                  {formatCurrency(Number(property.price))}
                </span>
              </div>
              <span className="text-xs text-[#5A625D] mt-1 block">
                Approx. ₹{Math.round(Number(property.price) / Math.max(carpetSqft, 1)).toLocaleString('en-IN')}{' '}
                / sq.ft
              </span>
            </div>

            <div className="p-4 rounded-xl bg-[#16281F] text-[#FAF7F2] border border-[#284436] flex items-start gap-2.5">
              <ShieldCheck className="w-5 h-5 text-[#C9A96E] shrink-0 mt-0.5" />
              <div className="text-xs text-[#C5D7CB] leading-relaxed">
                <strong className="text-[#C9A96E]">PropMind Escrow Protected:</strong> Token & milestone funds held safely
                until physical registry execution at Indore Sub-Registrar.
              </div>
            </div>

            <div className="space-y-3">
              <Button
                variant="primary"
                size="lg"
                fullWidth
                leftIcon={<CalendarCheck className="w-4 h-4" />}
                onClick={() => requireAuth('VISIT')}
              >
                Schedule Site Visit
              </Button>

              <Button
                variant="outline"
                size="lg"
                fullWidth
                leftIcon={<IndianRupee className="w-4 h-4" />}
                onClick={() => requireAuth('OFFER')}
              >
                Make Purchase Offer
              </Button>

              <Button
                variant="secondary"
                size="md"
                fullWidth
                leftIcon={<Phone className="w-4 h-4" />}
                onClick={() => requireAuth('INQUIRY')}
              >
                Send Buyer Inquiry
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Interactive Modal for Inquiry / Visit / Offer */}
      <Modal
        isOpen={Boolean(activeModal)}
        onClose={() => setActiveModal(null)}
        title={
          activeModal === 'VISIT'
            ? 'Schedule Assisted Site Visit'
            : activeModal === 'OFFER'
            ? 'Submit Purchase Offer'
            : 'Send Buyer Inquiry'
        }
        description={property.title}
        size="md"
      >
        {modalSuccess ? (
          <div className="py-6 text-center space-y-4">
            <CheckCircle2 className="w-12 h-12 text-[#4E6B58] mx-auto" />
            <p className="text-sm font-semibold text-[#1C2420]">{modalSuccess}</p>
            <div className="flex justify-center gap-2">
              <Button variant="secondary" onClick={() => setActiveModal(null)}>
                Close
              </Button>
              <Button
                variant="primary"
                onClick={() =>
                  navigate(
                    activeModal === 'VISIT'
                      ? '/dashboard/visits'
                      : activeModal === 'OFFER'
                      ? '/dashboard/transactions'
                      : '/dashboard/leads'
                  )
                }
              >
                Open Dashboard
              </Button>
            </div>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setModalError(null);
              if (activeModal === 'VISIT') visitMutation.mutate();
              else if (activeModal === 'OFFER') offerMutation.mutate();
              else leadMutation.mutate();
            }}
            className="space-y-4"
          >
            {modalError && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                {modalError}
              </div>
            )}

            {activeModal === 'VISIT' && (
              <>
                <Input
                  label="Preferred Date & Time"
                  type="datetime-local"
                  value={visitDate}
                  onChange={(e) => setVisitDate(e.target.value)}
                  required
                />
                <Input
                  label="Visitor Notes (Optional)"
                  placeholder="e.g. Visiting with family, need parking access"
                  value={visitNotes}
                  onChange={(e) => setVisitNotes(e.target.value)}
                />
              </>
            )}

            {activeModal === 'OFFER' && (
              <>
                <Input
                  label="Offer Amount (₹)"
                  type="number"
                  min={1}
                  value={offerAmount}
                  onChange={(e) => setOfferAmount(e.target.value)}
                  required
                />
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#4A544E] mb-1">
                    Payment & Closing Terms
                  </label>
                  <textarea
                    rows={3}
                    value={offerTerms}
                    onChange={(e) => setOfferTerms(e.target.value)}
                    className="w-full p-2.5 bg-white border border-[#D5CCB9] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3126]"
                  />
                </div>
              </>
            )}

            {activeModal === 'INQUIRY' && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#4A544E] mb-1">
                  Your Message
                </label>
                <textarea
                  rows={4}
                  required
                  value={inquiryMessage}
                  onChange={(e) => setInquiryMessage(e.target.value)}
                  className="w-full p-2.5 bg-white border border-[#D5CCB9] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3126]"
                />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setActiveModal(null)}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                leftIcon={<Send className="w-4 h-4" />}
                isLoading={
                  leadMutation.isPending || visitMutation.isPending || offerMutation.isPending
                }
              >
                Confirm & Submit
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
