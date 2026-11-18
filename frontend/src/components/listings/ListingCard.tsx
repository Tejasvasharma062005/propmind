import React from 'react';
import { Link } from 'react-router-dom';
import { BadgeCheck, BedDouble, Building2, Eye, Heart, ImageOff, MapPin, Maximize2, Star } from 'lucide-react';
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
        'group bg-white rounded-2xl border border-[#E6E0D3] overflow-hidden shadow-2xs hover:shadow-md hover:border-[#C9A96E]/60 transition-all duration-300 flex flex-col',
        className
      )}
    >
      {/* Consistent 4:3 Architectural Image Container */}
      <Link
        to={to ?? `/listings/${listing.id}`}
        className="block relative aspect-[4/3] bg-[#EFEAE0] overflow-hidden"
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
          <div className="w-full h-full flex flex-col items-center justify-center text-[#7A827D] gap-1.5 bg-gradient-to-br from-[#F3EFE6] to-[#E6E0D3]">
            <ImageOff className="w-7 h-7 text-[#8C8474]" />
            <span className="text-xs font-medium">Architectural Photo Pending</span>
          </div>
        )}

        {/* Top-Left: Featured or Status Pill */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          {listing.is_featured && (
            <Badge variant="warning" size="sm" className="shadow-xs">
              <Star className="w-3 h-3" /> Featured
            </Badge>
          )}
          {showStatus && (
            <Badge variant={status.variant} size="sm" dot className="bg-white/95 shadow-xs">
              {status.label}
            </Badge>
          )}
        </div>

        {/* Top-Right: Luma-Inspired Muted Sage "For Sale" or Champagne Gold "For Rent" Pill */}
        <div className="absolute top-3 right-3">
          <span
            className={cn(
              'px-3 py-1 rounded-full text-xs font-medium tracking-wide shadow-xs backdrop-blur-xs',
              isRental
                ? 'bg-[#C9A96E]/95 text-[#1C2420]'
                : 'bg-[#6E8474]/95 text-[#FAF7F2]'
            )}
          >
            {listing.listing_type_display || (isRental ? 'For Rent' : 'For Sale')}
          </span>
        </div>
      </Link>

      {/* Card Editorial Content */}
      <div className="p-4 sm:p-5 flex flex-col gap-2 flex-1">
        {/* Row 1: Editorial Serif Title + Heart / Verified Icon */}
        <div className="flex items-start justify-between gap-2">
          <Link
            to={to ?? `/listings/${listing.id}`}
            className="text-lg font-serif font-bold text-[#1C2420] hover:text-[#1B3126] transition-colors line-clamp-1 leading-snug"
          >
            {p.title}
          </Link>
          {p.is_verified ? (
            <span
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#4E6B58] shrink-0 mt-0.5"
              title="PropMind verified property"
            >
              <BadgeCheck className="w-4 h-4 text-[#4E6B58]" />
            </span>
          ) : (
            <Heart className="w-4 h-4 text-[#888F8A] shrink-0 mt-1 group-hover:text-[#1B3126] transition-colors" />
          )}
        </div>

        {/* Row 2: Locality */}
        <p className="flex items-center gap-1.5 text-xs text-[#5A625D]">
          <MapPin className="w-3.5 h-3.5 text-[#6E8474] shrink-0" />
          <span className="truncate">
            {p.locality}, {p.city}
          </span>
        </p>

        {/* Row 3: Price */}
        <div className="pt-0.5 flex items-baseline justify-between gap-2">
          <p className="text-lg font-bold text-[#1C2420] tracking-tight">
            {formatPrice(listing.asking_price, listing.listing_type)}
          </p>
          {p.is_verified && (
            <span className="text-[11px] font-medium text-[#4E6B58]">Passport Verified</span>
          )}
        </div>

        {/* Row 4: Specs Footer Bar */}
        <div className="flex items-center gap-4 text-xs text-[#5A625D] pt-2.5 mt-1 border-t border-[#EFEAE0]">
          {area && (
            <span className="flex items-center gap-1.5">
              <Maximize2 className="w-3.5 h-3.5 text-[#7A827D]" />
              {Number(area).toLocaleString('en-IN')} sq ft
            </span>
          )}
          {p.bedrooms > 0 ? (
            <span className="flex items-center gap-1.5">
              <BedDouble className="w-3.5 h-3.5 text-[#7A827D]" />
              {p.bedrooms} BHK
            </span>
          ) : (
            <span className="flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-[#7A827D]" />
              {p.property_type_display || 'Commercial'}
            </span>
          )}
          <span className="flex items-center gap-1 ml-auto text-[#888F8A]">
            <Eye className="w-3.5 h-3.5" /> {listing.views_count}
          </span>
        </div>

        {actions && (
          <div className="pt-3 mt-auto border-t border-[#EFEAE0] flex flex-wrap gap-2">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};
