import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, BadgeCheck, Bath, BedDouble, CalendarDays, Car, Eye, Flag, ImageOff,
  Info, MapPin, Maximize2, Pencil, ShieldCheck,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { LISTING_STATUS_META, ReportListingModal, formatPrice } from '@/components/listings';
import { useListing } from '@/hooks/useListings';
import { useAuth } from '@/hooks/useAuth';
import { formatDate } from '@/lib/utils';

export const ListingDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { data: listing, isLoading, isError } = useListing(id);
  const [activeImage, setActiveImage] = useState(0);
  const [reportOpen, setReportOpen] = useState(false);

  if (isLoading) {
    return <div className="flex justify-center py-32"><Spinner size="lg" className="text-[#1B3126]" /></div>;
  }
  if (isError || !listing) {
    return (
      <div className="max-w-3xl mx-auto py-20 px-4">
        <EmptyState icon={Info} title="Listing not available"
          description="This listing may have been sold, withdrawn, or is still under review."
          actionText="Browse listings" onAction={() => navigate('/listings')} />
      </div>
    );
  }

  const p = listing.property_summary;
  const media = listing.media;
  const current = media[Math.min(activeImage, media.length - 1)];
  const statusMeta = LISTING_STATUS_META[listing.status];
  const isRental = listing.listing_type !== 'SALE';

  const onReport = () => {
    if (!isAuthenticated) navigate(`/login?redirect=${encodeURIComponent(`/listings/${listing.id}`)}`);
    else setReportOpen(true);
  };

  const facts = [
    p.bedrooms > 0 && { icon: BedDouble, label: 'Bedrooms', value: `${p.bedrooms} BHK` },
    p.bathrooms > 0 && { icon: Bath, label: 'Bathrooms', value: p.bathrooms },
    p.carpet_area && { icon: Maximize2, label: 'Carpet area', value: `${Number(p.carpet_area).toLocaleString('en-IN')} sq.ft` },
    p.built_up_area && { icon: Maximize2, label: 'Built-up area', value: `${Number(p.built_up_area).toLocaleString('en-IN')} sq.ft` },
    p.plot_area && { icon: Maximize2, label: 'Plot area', value: `${Number(p.plot_area).toLocaleString('en-IN')} sq.ft` },
    p.parking_count > 0 && { icon: Car, label: 'Parking', value: p.parking_count },
    { icon: CalendarDays, label: 'Available from', value: formatDate(listing.available_from) },
  ].filter(Boolean) as { icon: React.ComponentType<{ className?: string }>; label: string; value: React.ReactNode }[];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link to="/listings" className="inline-flex items-center gap-1.5 text-sm text-[#5A625D] hover:text-[#1C2420] mb-5">
        <ArrowLeft className="w-4 h-4" /> Back to Marketplace Listings
      </Link>

      {listing.is_owner && listing.status !== 'ACTIVE' && (
        <div className="mb-5 rounded-xl border border-[#E4D1AC] bg-[#F5EEDC] p-3.5 text-sm text-[#7A5C29] flex items-start gap-2.5">
          <Info className="w-4 h-4 mt-0.5 shrink-0" />
          <span><strong>{statusMeta.label}:</strong> {statusMeta.hint} Only you can see this page.</span>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Consistent 16:10 Architectural Gallery */}
          <div className="space-y-3">
            <div className="aspect-[16/10] bg-[#F3EBD8] rounded-2xl border border-[#D8C9A7] overflow-hidden">
              {current ? (
                <img src={current.url} alt={current.caption || p.title} className="w-full h-full object-cover object-center" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-[#494431] gap-1.5">
                  <ImageOff className="w-10 h-10 text-[#494431]/70" />
                  <span className="text-xs font-medium">No photos uploaded</span>
                </div>
              )}
            </div>
            {media.length > 1 && (
              <div className="flex gap-2.5 overflow-x-auto pb-1">
                {media.map((m, i) => (
                  <button key={m.id} type="button" onClick={() => setActiveImage(i)}
                    className={`w-24 h-16 shrink-0 rounded-xl overflow-hidden border-2 transition-all ${i === activeImage ? 'border-[#C3A66B] ring-2 ring-[#494431]/30' : 'border-transparent opacity-70 hover:opacity-100'}`}>
                    <img src={m.url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              <Badge variant={isRental ? 'warning' : 'success'}>{listing.listing_type_display}</Badge>
              <Badge>{p.property_type_display}</Badge>
              {p.is_verified && <Badge variant="primary"><BadgeCheck className="w-3.5 h-3.5 text-[#C3A66B]" /> PropMind Verified</Badge>}
            </div>
            <h1 className="text-3xl sm:text-4xl font-serif font-normal text-[#373124]">{p.title}</h1>
            <p className="flex items-center gap-1.5 text-sm text-[#494431]">
              <MapPin className="w-4 h-4 text-[#C3A66B]" /> {p.locality}, {p.city}, {p.state} {p.pincode}
            </p>
            <p className="text-xs text-[#494431]/75">Exact street address is shared after you connect with the owner.</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {facts.map((f) => (
              <div key={f.label} className="p-4 rounded-xl bg-[#F8F4E9] border border-[#D8C9A7]">
                <f.icon className="w-4 h-4 text-[#171715] mb-1.5" />
                <p className="text-[11px] uppercase tracking-wider text-[#494431]">{f.label}</p>
                <p className="font-semibold text-[#373124] text-sm mt-0.5">{f.value}</p>
              </div>
            ))}
          </div>

          <div className="bg-[#F8F4E9] p-6 rounded-2xl border border-[#D8C9A7]">
            <h2 className="text-xl font-serif font-bold text-[#373124] mb-2">About this property</h2>
            {/* Rendered as plain text: React escapes it, so user content cannot inject HTML */}
            <p className="text-sm text-[#494431] whitespace-pre-line leading-relaxed">{p.description}</p>
          </div>
        </div>

        {/* Price / action panel */}
        <aside className="space-y-4">
          <div className="sticky top-24 space-y-4">
            <div className="p-6 rounded-2xl border border-[#D8C9A7] bg-[#F8F4E9] space-y-4">
              <div>
                <span className="text-[11px] uppercase tracking-[0.18em] text-[#494431] font-semibold">
                  {isRental ? 'Monthly Rent' : 'Asking Price'}
                </span>
                <p className="text-3xl font-serif font-bold text-[#373124] mt-1">
                  {formatPrice(listing.asking_price, listing.listing_type)}
                </p>
                {listing.is_negotiable && <p className="text-xs text-[#494431] font-semibold mt-1">Price negotiable</p>}
              </div>

              <dl className="text-sm space-y-2 text-[#494431] border-t border-[#D8C9A7]/70 pt-3">
                {isRental && Number(listing.security_deposit) > 0 && (
                  <div className="flex justify-between"><dt>Security deposit</dt><dd className="font-semibold text-[#373124]">{formatPrice(listing.security_deposit)}</dd></div>
                )}
                {Number(listing.maintenance_charges) > 0 && (
                  <div className="flex justify-between"><dt>Maintenance</dt><dd className="font-semibold text-[#373124]">{formatPrice(listing.maintenance_charges)}/mo</dd></div>
                )}
                <div className="flex justify-between"><dt>Listed by</dt><dd className="font-semibold text-[#373124]">{listing.listed_by_name}</dd></div>
                {listing.rera_number && (
                  <div className="flex justify-between"><dt>RERA No.</dt><dd className="font-mono text-xs text-[#373124]">{listing.rera_number}</dd></div>
                )}
                {listing.published_at && (
                  <div className="flex justify-between"><dt>Listed on</dt><dd>{formatDate(listing.published_at)}</dd></div>
                )}
                <div className="flex justify-between"><dt>Views</dt><dd className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" />{listing.views_count}</dd></div>
              </dl>

              {listing.is_owner ? (
                <Button fullWidth variant="secondary" leftIcon={<Pencil className="w-4 h-4" />}
                  onClick={() => navigate(`/dashboard/listings/${listing.id}/edit`)}>
                  Manage listing
                </Button>
              ) : (
                <Button fullWidth variant="primary" leftIcon={<ShieldCheck className="w-4 h-4 text-[#C3A66B]" />}
                  onClick={() => navigate(`/properties/${listing.property}`)}>
                  View Passport, Book Visit or Make Offer
                </Button>
              )}
            </div>

            <div className="p-4 rounded-2xl bg-[#171715] text-[#F8F4E9] border border-[#494431] text-xs space-y-1.5">
              <p className="flex items-center gap-1.5 font-serif font-semibold text-sm text-[#C3A66B]">
                <ShieldCheck className="w-4 h-4 text-[#C3A66B]" /> PropMind Escrow Advisory
              </p>
              <p className="text-[#D8C9A7] leading-relaxed">
                Never pay a token amount before visiting the property and verifying its Digital Property Passport. PropMind will never ask you to pay outside the escrow transaction room.
              </p>
            </div>

            {!listing.is_owner && (
              <button type="button" onClick={onReport} className="flex items-center gap-1.5 text-xs text-[#5A625D] hover:text-rose-700 mx-auto">
                <Flag className="w-3.5 h-3.5" /> Report this listing
              </button>
            )}
          </div>
        </aside>
      </div>

      <ReportListingModal listingId={listing.id} isOpen={reportOpen} onClose={() => setReportOpen(false)} />
    </div>
  );
};

export default ListingDetailPage;
