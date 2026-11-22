import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, MapPin, BedDouble, Bath, Maximize2, ArrowRight, ImageOff } from 'lucide-react';
import type { Property } from '@/types/property.types';
import { formatCurrency, formatArea, truncateText } from '@/lib/utils';
import { Card } from '@/components/ui/Card';

export interface PropertyCardProps {
  property: Property;
  className?: string;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({ property, className }) => {
  const featuredImage =
    property.media?.find((m) => m.is_featured)?.url ||
    property.media?.[0]?.url ||
    null;

  const typeLabels: Record<string, string> = {
    APARTMENT: 'Apartment',
    INDEPENDENT_HOUSE: 'Villa / House',
    PLOT: 'Plot / Land',
    COMMERCIAL_OFFICE: 'Office',
    COMMERCIAL_SHOP: 'Shop',
    AGRICULTURAL_LAND: 'Farm Land',
    PENTHOUSE: 'Penthouse',
  };

  return (
    <Card hoverEffect className={className}>
      {/* Consistent 4:3 Architectural Image Container */}
      <Link
        to={`/properties/${property.id}`}
        className="block relative aspect-[4/3] overflow-hidden bg-[#F3EBD8] group"
      >
        {featuredImage ? (
          <img
            src={featuredImage}
            alt={property.title}
            className="w-full h-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-[#494431]/70 gap-1.5 bg-[#F3EBD8]">
            <ImageOff className="w-7 h-7 text-[#494431]/60" />
            <span className="text-xs font-medium">No photos uploaded</span>
          </div>
        )}

        {/* Top-Left: PropMind Verified Badge */}
        {property.is_verified && (
          <div className="absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#171715]/90 text-[#F8F4E9] text-[11px] font-medium border border-[#494431]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#C3A66B]" />
            <span>PropMind Verified</span>
          </div>
        )}

        {/* Top-Right: Property Type Pill */}
        <div className="absolute top-3 right-3">
          <span className="px-3 py-1 rounded-full bg-[#F8F4E9]/95 text-[#373124] border border-[#D8C9A7] text-[11px] font-medium">
            {typeLabels[property.property_type] || property.property_type}
          </span>
        </div>
      </Link>

      {/* Editorial Card Body */}
      <div className="p-4 sm:p-5 flex flex-col justify-between space-y-2.5">
        <div className="space-y-0.5">
          <Link to={`/properties/${property.id}`} className="group">
            <h3
              title={property.title}
              className="text-xl font-serif font-semibold text-[#373124] group-hover:text-[#171715] transition-colors line-clamp-1 leading-snug"
            >
              {truncateText(property.title, 55)}
            </h3>
          </Link>
          <p className="text-xs text-[#494431]/80">
            {typeLabels[property.property_type] || property.property_type} • Indore Registry
          </p>
        </div>

        {/* Asking Price Row */}
        <div className="flex items-baseline justify-between pt-0.5">
          <span className="text-lg font-bold text-[#373124] tracking-tight">
            {formatCurrency(property.price)}
          </span>
          {property.carpet_area_sqft && (
            <span className="text-xs font-medium text-[#494431]">
              ₹{Math.round(property.price / property.carpet_area_sqft).toLocaleString('en-IN')}/sq.ft
            </span>
          )}
        </div>

        {/* Location */}
        <div className="flex items-center gap-1.5 text-xs text-[#494431]">
          <MapPin className="w-3.5 h-3.5 text-[#C3A66B] shrink-0" />
          <span className="truncate">
            {property.locality}, {property.city}
          </span>
        </div>

        {/* Specs Chips Row */}
        <div className="flex flex-wrap items-center gap-2 py-2.5 border-y border-[#D8C9A7]/60 text-[11px] text-[#373124] font-medium">
          {property.carpet_area_sqft && (
            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-[#D8C9A7] bg-[#F6F0DE]">
              <Maximize2 className="w-3 h-3 text-[#494431]" />
              <span>{formatArea(property.carpet_area_sqft)}</span>
            </div>
          )}

          {property.bhk_count !== undefined && property.bhk_count > 0 && (
            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-[#D8C9A7] bg-[#F6F0DE]">
              <BedDouble className="w-3 h-3 text-[#494431]" />
              <span>{property.bhk_count} BHK</span>
            </div>
          )}

          {property.bathrooms !== undefined && property.bathrooms > 0 && (
            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-[#D8C9A7] bg-[#F6F0DE]">
              <Bath className="w-3 h-3 text-[#494431]" />
              <span>{property.bathrooms} Baths</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-0.5 flex items-center justify-between">
          <div className="text-[11px] text-[#494431]">
            {property.passport ? (
              <span className="font-semibold text-[#373124]">
                Passport: {property.passport.overall_score}% Verified
              </span>
            ) : (
              <span>Indore Registry Record</span>
            )}
          </div>

          <Link
            to={`/properties/${property.id}`}
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#171715] hover:text-[#494431] transition-colors"
          >
            <span>Explore Passport</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </Card>
  );
};
