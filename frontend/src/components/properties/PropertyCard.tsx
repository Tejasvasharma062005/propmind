import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, MapPin, BedDouble, Bath, Maximize2, ArrowRight, ImageOff, Heart } from 'lucide-react';
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
        className="block relative aspect-[4/3] overflow-hidden bg-[#EFEAE0] group"
      >
        {featuredImage ? (
          <img
            src={featuredImage}
            alt={property.title}
            className="w-full h-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-[#7A827D] gap-1.5 bg-gradient-to-br from-[#F3EFE6] to-[#E6E0D3]">
            <ImageOff className="w-7 h-7 text-[#8C8474]" />
            <span className="text-xs font-medium">No photos uploaded</span>
          </div>
        )}

        {/* Top-Left: PropMind Verified Badge */}
        {property.is_verified && (
          <div className="absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1B3126]/90 text-[#FAF7F2] text-[11px] font-medium backdrop-blur-xs shadow-xs">
            <ShieldCheck className="w-3.5 h-3.5 text-[#C9A96E]" />
            <span>PropMind Verified</span>
          </div>
        )}

        {/* Top-Right: Property Type Pill */}
        <div className="absolute top-3 right-3">
          <span className="px-3 py-1 rounded-full bg-[#6E8474]/95 text-[#FAF7F2] text-xs font-medium backdrop-blur-xs shadow-xs">
            {typeLabels[property.property_type] || property.property_type}
          </span>
        </div>
      </Link>

      {/* Editorial Card Body */}
      <div className="p-4 sm:p-5 flex flex-col justify-between space-y-2.5">
        <div className="space-y-1">
          <div className="flex items-start justify-between gap-2">
            <Link to={`/properties/${property.id}`} className="group">
              <h3
                title={property.title}
                className="text-lg font-serif font-bold text-[#1C2420] group-hover:text-[#1B3126] transition-colors line-clamp-1 leading-snug"
              >
                {truncateText(property.title, 55)}
              </h3>
            </Link>
            <Heart className="w-4 h-4 text-[#888F8A] shrink-0 mt-1" />
          </div>

          {/* Location */}
          <div className="flex items-center gap-1.5 text-xs text-[#5A625D]">
            <MapPin className="w-3.5 h-3.5 text-[#6E8474] shrink-0" />
            <span className="truncate">
              {property.locality}, {property.city}
            </span>
          </div>
        </div>

        {/* Asking Price Row */}
        <div className="flex items-baseline justify-between pt-0.5">
          <span className="text-lg font-bold text-[#1C2420] tracking-tight">
            {formatCurrency(property.price)}
          </span>
          {property.carpet_area_sqft && (
            <span className="text-xs font-medium text-[#5A625D]">
              ₹{Math.round(property.price / property.carpet_area_sqft).toLocaleString('en-IN')}/sq.ft
            </span>
          )}
        </div>

        {/* Specs Row */}
        <div className="flex items-center gap-4 py-2.5 border-y border-[#EFEAE0] text-xs text-[#5A625D] font-medium">
          {property.carpet_area_sqft && (
            <div className="flex items-center gap-1.5">
              <Maximize2 className="w-3.5 h-3.5 text-[#7A827D]" />
              <span>{formatArea(property.carpet_area_sqft)}</span>
            </div>
          )}

          {property.bhk_count !== undefined && property.bhk_count > 0 && (
            <div className="flex items-center gap-1.5">
              <BedDouble className="w-3.5 h-3.5 text-[#7A827D]" />
              <span>{property.bhk_count} BHK</span>
            </div>
          )}

          {property.bathrooms !== undefined && property.bathrooms > 0 && (
            <div className="flex items-center gap-1.5">
              <Bath className="w-3.5 h-3.5 text-[#7A827D]" />
              <span>{property.bathrooms} Baths</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-0.5 flex items-center justify-between">
          <div className="text-[11px] text-[#5A625D]">
            {property.passport ? (
              <span className="font-semibold text-[#4E6B58]">
                Passport: {property.passport.overall_score}% Verified
              </span>
            ) : (
              <span>Indore Registry Record</span>
            )}
          </div>

          <Link
            to={`/properties/${property.id}`}
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#1B3126] hover:text-[#4E6B58] transition-colors"
          >
            <span>Explore Passport</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </Card>
  );
};
