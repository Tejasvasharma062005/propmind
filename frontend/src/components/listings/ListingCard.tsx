import React from 'react';
import { Link } from 'react-router-dom';
import { BadgeCheck, BedDouble, Building2, Eye, ImageOff, MapPin, Maximize2, Star } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import type { Listing } from '@/types/listing.types';
import { LISTING_STATUS_META, formatPrice } from './listingUtils';

export interface ListingCardProps {
  listing: Listing;
  showStatus?: boolean;
  to?: string;
  actions?: React.ReactNode;
  className?: string;
}

export const ListingCard: React.FC<ListingCardProps> = ({
  listing,
  showStatus = false,
  to,
  actions,
  className,
}) => {
  const p = listing.property_summary;
  const status = LISTING_STATUS_META[listing.status];
  const area = p.carpet_area || p.built_up_area || p.plot_area;
  const isRental = listing.listing_type !== 'SALE';

  return (
    <div
      className={cn(
        'group bg-[#F8F4E9] rounded-xl border border-[#D8C9A7] overflow-hidden hover:border-[#C3A66B] transition-all duration-300 flex flex-col',
        className
      )}
    >
      {/* Consistent 4:3 Architectural Image Container */}
      <Link
        to={to ?? `/listings/${listing.id}`}
        className="block relative aspect-[4/3] bg-[#F3EBD8] overflow-hidden"
      >
        {listing.primary_image ? (
          <img
            src={listing.primary_image}
            alt={p.title}
            loading="lazy"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-[#494431]/70 gap-1.5 bg-[#F3EBD8]">
            <ImageOff className="w-7 h-7 text-[#494431]/60" />
            <span className="text-xs font-medium">Architectural Photo Pending</span>
          </div>
        )}

        {/* Top-Left: Featured or Status Pill */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          {listing.is_featured && (
            <Badge variant="warning" size="sm">
              <Star className="w-3 h-3" /> Featured
            </Badge>
          )}
          {showStatus && (
            <Badge variant={status.variant} size="sm" dot>
              {status.label}
            </Badge>
          )}
        </div>

        {/* Top-Right: Minimalist Listing Type Pill */}
        <div className="absolute top-3 right-3">
          <span
            className={cn(
              'px-3 py-1 rounded-full text-[11px] font-medium tracking-wide border',
              isRental
                ? 'bg-[#C3A66B] text-[#171715] border-[#B49456]'
                : 'bg-[#F8F4E9]/95 text-[#373124] border-[#D8C9A7]'
            )}
          >
            {listing.listing_type_display || (isRental ? 'For Rent' : 'For Sale')}
          </span>
        </div>
      </Link>

      {/* Card Editorial Content */}
      <div className="p-4 sm:p-5 flex flex-col gap-2 flex-1">
        {/* Title & Category Subtitle */}
        <div className="space-y-0.5">
          <div className="flex items-start justify-between gap-2">
            <Link
              to={to ?? `/listings/${listing.id}`}
              className="text-xl font-serif font-semibold text-[#373124] hover:text-[#171715] transition-colors line-clamp-1 leading-snug"
            >
              {p.title}
            </Link>
            {p.is_verified && (
              <span
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#494431] shrink-0 mt-1"
                title="PropMind verified property"
              >
                <BadgeCheck className="w-4 h-4 text-[#C3A66B]" />
              </span>
            )}
          </div>
          <p className="text-xs text-[#494431]/80">
            {p.property_type_display || 'Property'}
            {p.is_verified ? ' • Passport Verified' : ''}
          </p>
        </div>

        {/* Bold Price */}
        <div className="pt-1">
          <p className="text-lg font-bold text-[#373124] tracking-tight">
            {formatPrice(listing.asking_price, listing.listing_type)}
          </p>
        </div>

        {/* Locality Row */}
        <p className="flex items-center gap-1.5 text-xs text-[#494431]">
          <MapPin className="w-3.5 h-3.5 text-[#C3A66B] shrink-0" />
          <span className="truncate">
            {p.locality}, {p.city}
          </span>
        </p>

        {/* Bottom Bordered Spec Chips (Reference Style) */}
        <div className="flex flex-wrap items-center gap-2 pt-2.5 mt-auto border-t border-[#D8C9A7]/60 text-[11px] text-[#373124]">
          {area && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-[#D8C9A7] bg-[#F6F0DE]">
              <Maximize2 className="w-3 h-3 text-[#494431]" />
              {Number(area).toLocaleString('en-IN')} sq ft
            </span>
          )}
          {p.bedrooms > 0 ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-[#D8C9A7] bg-[#F6F0DE]">
              <BedDouble className="w-3 h-3 text-[#494431]" />
              {p.bedrooms} BHK
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-[#D8C9A7] bg-[#F6F0DE]">
              <Building2 className="w-3 h-3 text-[#494431]" />
              {p.property_type_display || 'Commercial'}
            </span>
          )}
          <span className="inline-flex items-center gap-1 ml-auto text-[#494431]/75">
            <Eye className="w-3.5 h-3.5" /> {listing.views_count}
          </span>
        </div>

        {actions && (
          <div className="pt-3 mt-1 border-t border-[#D8C9A7]/60 flex flex-wrap gap-2">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};
