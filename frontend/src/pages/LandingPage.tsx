import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  ShieldCheck,
  Building2,
  ArrowUpRight,
  ChevronDown,
  MapPin,
  BedDouble,
  Maximize2,
  Eye,
  Landmark,
  CheckCircle2,
} from 'lucide-react';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { ListingCard, formatPrice } from '@/components/listings';
import { useListingSearch } from '@/hooks/useListings';
import { platformService } from '@/services/platform.service';
import { INDORE_LOCALITIES, PROPERTY_TYPES } from '@/lib/constants';
import { cn } from '@/lib/utils';
import heroVillaImage from '@/assets/hero.png';

const CATEGORY_TABS = [
  { value: '', label: 'All Properties' },
  { value: 'APARTMENT', label: 'Apartments' },
  { value: 'INDEPENDENT_HOUSE', label: 'Villas / Houses' },
  { value: 'PLOT', label: 'Plots & Land' },
  { value: 'COMMERCIAL_OFFICE', label: 'Offices' },
  { value: 'SHOP', label: 'Commercial' },
  { value: 'PENTHOUSE', label: 'Penthouses' },
];

const PRICE_RANGES = [
  { value: '', label: 'Any Budget' },
  { value: '0-5000000', label: 'Under ₹50 L' },
  { value: '5000000-10000000', label: '₹50 L – ₹1 Cr' },
  { value: '10000000-20000000', label: '₹1 Cr – ₹2 Cr' },
  { value: '20000000-', label: 'Above ₹2 Cr' },
];

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedLocality, setSelectedLocality] = useState('');
  const [selectedPropertyType, setSelectedPropertyType] = useState('');
  const [selectedPriceRange, setSelectedPriceRange] = useState('');
  const [activeCategoryTab, setActiveCategoryTab] = useState('');

  const { data: featuredListings } = useListingSearch({
    page_size: 1,
    sort_by: 'newest',
  });

  const { data: categoryListings, isLoading: loadingCategoryListings } = useListingSearch({
    page_size: 3,
    sort_by: 'newest',
    property_type: activeCategoryTab || undefined,
  });

  const { data: stats } = useQuery({
    queryKey: ['platform-stats'],
    queryFn: () => platformService.getPlatformStats(),
  });

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (selectedLocality) params.set('locality', selectedLocality);
    if (selectedPropertyType) params.set('property_type', selectedPropertyType);
    if (selectedPriceRange) {
      const [minP, maxP] = selectedPriceRange.split('-');
      if (minP) params.set('min_price', minP);
      if (maxP) params.set('max_price', maxP);
    }
    navigate(`/listings?${params.toString()}`);
  };

  const spotlightListing = featuredListings?.data?.[0];

  return (
    <div className="bg-[#F6F0DE] text-[#373124] pb-24">
      {/* 1. HERO SECTION — DEEP CHARCOAL ARCHITECTURAL COMPOSITION */}
      <section className="relative overflow-hidden bg-[#171715] text-[#F8F4E9] min-h-[580px] lg:min-h-[640px] flex flex-col justify-between">
        {/* Background Architectural Image & Charcoal Gradient Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src={heroVillaImage}
            alt="Indore Architectural Residence"
            className="w-full h-full object-cover object-right opacity-55"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#171715] via-[#171715]/85 to-[#171715]/35" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#171715] via-transparent to-[#171715]/40" />
        </div>

        {/* Hero Headline Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20 pb-8 w-full">
          <div className="max-w-2xl space-y-5">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-serif font-normal tracking-tight leading-[1.04]">
              <span className="block text-[#F8F4E9]">Refining the</span>
              <span className="block text-[#F8F4E9]">
                Art of <span className="text-[#C3A66B]">Verified</span> Living
              </span>
            </h1>

            <p className="text-sm sm:text-base text-[#D8C9A7] max-w-md leading-relaxed font-normal">
              PropMind delivers audited Digital Property Passports, government-source provenance,
              and escrow-protected real estate transactions across Indore.
            </p>

            <div className="flex items-center gap-2 text-xs text-[#D8C9A7]/90 pt-1">
              <MapPin className="w-3.5 h-3.5 text-[#C3A66B]" />
              <span>Indore, Madhya Pradesh</span>
            </div>
          </div>
        </div>

        {/* Bottom-Positioned Warm Ivory Search Panel */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10 sm:pb-12 w-full">
          <form
            onSubmit={handleHeroSearch}
            className="bg-[#F6F0DE] text-[#373124] rounded-2xl sm:rounded-full border border-[#D8C9A7] p-3 sm:pl-7 sm:pr-2.5 sm:py-2.5 grid grid-cols-1 md:grid-cols-4 items-center gap-3 md:gap-0 shadow-xl"
          >
            {/* Col 1: LOCATION */}
            <div className="md:pr-5 md:border-r border-[#D8C9A7] text-left">
              <label className="flex items-center gap-1 text-[10px] uppercase tracking-[0.18em] font-semibold text-[#494431]">
                LOCATION <ChevronDown className="w-3 h-3" />
              </label>
              <select
                aria-label="Select Indore location"
                value={selectedLocality}
                onChange={(e) => setSelectedLocality(e.target.value)}
                className="w-full bg-transparent text-sm font-medium text-[#373124] focus:outline-none cursor-pointer mt-0.5"
              >
                <option value="">All Indore Localities</option>
                {INDORE_LOCALITIES.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>

            {/* Col 2: PROPERTY TYPE */}
            <div className="md:px-5 md:border-r border-[#D8C9A7] text-left">
              <label className="flex items-center gap-1 text-[10px] uppercase tracking-[0.18em] font-semibold text-[#494431]">
                PROPERTY TYPE <ChevronDown className="w-3 h-3" />
              </label>
              <select
                aria-label="Select property type"
                value={selectedPropertyType}
                onChange={(e) => setSelectedPropertyType(e.target.value)}
                className="w-full bg-transparent text-sm font-medium text-[#373124] focus:outline-none cursor-pointer mt-0.5"
              >
                <option value="">All Property Types</option>
                {PROPERTY_TYPES.map((pt) => (
                  <option key={pt.value} value={pt.value}>
                    {pt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Col 3: PRICE RANGE */}
            <div className="md:px-5 text-left">
              <label className="flex items-center gap-1 text-[10px] uppercase tracking-[0.18em] font-semibold text-[#494431]">
                PRICE RANGE <ChevronDown className="w-3 h-3" />
              </label>
              <select
                aria-label="Select price range"
                value={selectedPriceRange}
                onChange={(e) => setSelectedPriceRange(e.target.value)}
                className="w-full bg-transparent text-sm font-medium text-[#373124] focus:outline-none cursor-pointer mt-0.5"
              >
                {PRICE_RANGES.map((pr) => (
                  <option key={pr.value} value={pr.value}>
                    {pr.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Col 4: Deep Charcoal Pill CTA */}
            <div className="flex justify-end">
              <button
                type="submit"
                className="w-full md:w-auto inline-flex items-center justify-center gap-3 pl-5 pr-2 py-2.5 rounded-full bg-[#171715] hover:bg-[#494431] text-[#F8F4E9] text-xs font-medium tracking-wide transition-colors"
              >
                <span>Search Property</span>
                <span className="w-7 h-7 rounded-full bg-[#F8F4E9] text-[#171715] flex items-center justify-center">
                  <Search className="w-3.5 h-3.5" />
                </span>
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* 2. ABOUT / INTRODUCTION SECTION — ASYMMETRIC EDITORIAL "WHY PROPMIND" */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 lg:pt-24">
        <h2 className="text-4xl sm:text-5xl font-serif font-normal text-[#373124] mb-10">
          Why PropMind
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
          {/* Left Column (6 cols): Large Architectural Photo + Editorial Introduction */}
          <div className="lg:col-span-6 space-y-6">
            <div className="aspect-[4/3] rounded-2xl overflow-hidden border border-[#D8C9A7] bg-[#F3EBD8]">
              <img
                src={heroVillaImage}
                alt="PropMind Verified Architecture in Indore"
                className="w-full h-full object-cover object-center"
              />
            </div>

            <p className="text-sm text-[#494431] leading-relaxed max-w-lg">
              Welcome to <strong className="text-[#373124]">PropMind</strong>, Central India&apos;s
              AI-Powered Property Passport ecosystem. Every property undergoes a 5-pillar legal,
              title, physical, and municipal tax audit backed by Madhya Pradesh government source
              provenance before entering escrow.
            </p>
          </div>

          {/* Right Column (6 cols): Key Platform Statistics + Secondary Editorial Card */}
          <div className="lg:col-span-6 space-y-8">
            <div className="grid grid-cols-3 gap-6 border-b border-[#D8C9A7] pb-8">
              <div>
                <div className="text-4xl sm:text-5xl font-serif font-normal text-[#373124]">
                  {stats?.verified_properties_count ?? 0}+
                </div>
                <div className="text-xs text-[#494431] mt-1">Passports Audited</div>
              </div>
              <div>
                <div className="text-4xl sm:text-5xl font-serif font-normal text-[#373124]">
                  6
                </div>
                <div className="text-xs text-[#494431] mt-1">MP Gov Sources</div>
              </div>
              <div>
                <div className="text-4xl sm:text-5xl font-serif font-normal text-[#373124]">
                  {stats?.active_listings_count ?? 0}+
                </div>
                <div className="text-xs text-[#494431] mt-1">Live Listings</div>
              </div>
            </div>

            {/* Secondary Architectural Verification Card */}
            <div className="rounded-2xl bg-[#F3EBD8] border border-[#D8C9A7] p-6 sm:p-8 space-y-5">
              <div className="flex items-center justify-between">
                <span className="eyebrow-label">
                  <span>DIGITAL PROPERTY PASSPORT</span>
                  <span className="h-px w-8 bg-[#C3A66B]" />
                </span>
                <Landmark className="w-5 h-5 text-[#494431]" />
              </div>

              <h3 className="text-2xl sm:text-3xl font-serif font-normal text-[#373124] leading-snug">
                30-Year Title Verification &amp; Institutional Escrow Protection
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-[#373124]">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#C3A66B] shrink-0" />
                  <span>MP Bhulekh &amp; Khasra Audit</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#C3A66B] shrink-0" />
                  <span>MP RERA &amp; IGRS Sampada</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#C3A66B] shrink-0" />
                  <span>IMC Tax &amp; IDA Scheme NOC</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#C3A66B] shrink-0" />
                  <span>Advocate Title Search Ledger</span>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  to="/properties"
                  className="inline-flex items-center gap-2 text-xs font-semibold text-[#171715] hover:text-[#494431] transition-colors"
                >
                  <span>Explore Verified Property Registry</span>
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. FEATURED PROPERTIES SHOWCASE — ARCHITECTURAL FLOATING CARD */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 lg:pt-24">
        <div className="relative rounded-3xl overflow-hidden bg-[#171715] border border-[#494431] min-h-[460px] flex flex-col items-center justify-center px-4 py-14 sm:py-16">
          {/* Split Architectural Backdrop */}
          <div className="absolute inset-0 z-0 opacity-35">
            <img
              src={spotlightListing?.primary_image || heroVillaImage}
              alt="Featured Indore Residence"
              className="w-full h-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-[#171715]/60" />
          </div>

          {/* Centered Editorial Heading */}
          <div className="relative z-10 text-center mb-8">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-normal text-[#F8F4E9]">
              Featured Properties
            </h2>
          </div>

          {/* Centered Floating Warm Ivory Card */}
          {spotlightListing ? (
            <div className="relative z-10 w-full max-w-md bg-[#F6F0DE] text-[#373124] rounded-2xl border border-[#D8C9A7] p-6 sm:p-7 shadow-2xl space-y-5">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-[#F8F4E9] border border-[#D8C9A7] text-[11px] font-medium text-[#373124]">
                  {spotlightListing.listing_type_display || 'For Sale'}
                </span>
                <span className="px-3 py-1 rounded-full bg-[#F3EBD8] border border-[#D8C9A7] text-[11px] font-medium text-[#494431]">
                  {spotlightListing.property_summary.property_type_display || 'Residence'}
                </span>
              </div>

              <div>
                <h3 className="text-2xl sm:text-3xl font-serif font-semibold text-[#373124] leading-tight">
                  {spotlightListing.property_summary.title}
                </h3>
                <p className="text-xs text-[#494431] mt-1">
                  {spotlightListing.property_summary.locality}, {spotlightListing.property_summary.city}
                </p>
              </div>

              <p className="text-2xl font-bold text-[#171715] tracking-tight">
                {formatPrice(spotlightListing.asking_price, spotlightListing.listing_type)}
              </p>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#D8C9A7] text-xs text-[#373124]">
                <div className="flex items-center gap-2">
                  <Maximize2 className="w-3.5 h-3.5 text-[#494431]" />
                  <span>
                    {Number(
                      spotlightListing.property_summary.carpet_area ||
                        spotlightListing.property_summary.built_up_area ||
                        spotlightListing.property_summary.plot_area ||
                        0
                    ).toLocaleString('en-IN')}{' '}
                    sq ft
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <BedDouble className="w-3.5 h-3.5 text-[#494431]" />
                  <span>
                    {spotlightListing.property_summary.bedrooms > 0
                      ? `${spotlightListing.property_summary.bedrooms} BHK`
                      : spotlightListing.property_summary.property_type_display}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#C3A66B]" />
                  <span>
                    {spotlightListing.property_summary.is_verified ? 'Passport Verified' : 'Under Audit'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Eye className="w-3.5 h-3.5 text-[#494431]" />
                  <span>{spotlightListing.views_count} Views</span>
                </div>
              </div>

              <Link
                to={`/listings/${spotlightListing.id}`}
                className="w-full inline-flex items-center justify-between pl-5 pr-2 py-2.5 rounded-full bg-[#F8F4E9] hover:bg-[#171715] text-[#373124] hover:text-[#F8F4E9] border border-[#D8C9A7] text-xs font-semibold transition-all group"
              >
                <span>See Our Property Listing</span>
                <span className="w-7 h-7 rounded-full bg-[#171715] group-hover:bg-[#C3A66B] text-[#F8F4E9] group-hover:text-[#171715] flex items-center justify-center transition-colors">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </span>
              </Link>
            </div>
          ) : (
            <div className="relative z-10 w-full max-w-md bg-[#F6F0DE] text-[#373124] rounded-2xl border border-[#D8C9A7] p-6 sm:p-7 shadow-2xl space-y-4 text-center">
              <span className="inline-block px-3 py-1 rounded-full bg-[#F3EBD8] border border-[#D8C9A7] text-[11px] font-medium text-[#494431]">
                Indore Verified Showcase
              </span>
              <h3 className="text-2xl font-serif font-semibold text-[#373124]">
                Publish Your First Verified Listing
              </h3>
              <p className="text-xs text-[#494431] leading-relaxed">
                No live marketplace listings have been published yet. Register a property and submit
                your Digital Property Passport to feature it here.
              </p>
              <Link
                to="/dashboard/listings/new"
                className="w-full inline-flex items-center justify-between pl-5 pr-2 py-2.5 rounded-full bg-[#171715] hover:bg-[#494431] text-[#F8F4E9] text-xs font-semibold transition-all"
              >
                <span>Create Marketplace Listing</span>
                <span className="w-7 h-7 rounded-full bg-[#C3A66B] text-[#171715] flex items-center justify-center">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </span>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* 4. PROPERTIES BY TYPE — CATEGORY TABS & LIVE LISTING GRID */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 lg:pt-24">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <h2 className="text-4xl sm:text-5xl font-serif font-normal text-[#373124]">
            Properties by Type
          </h2>
          <Link
            to="/listings"
            className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-[#494431] hover:text-[#171715] transition-colors"
          >
            <span>View Full Marketplace</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Clean Bordered Category Tab Strip */}
        <div className="flex items-center gap-1 overflow-x-auto pb-2 mb-8 border-b border-[#D8C9A7]">
          {CATEGORY_TABS.map((tab) => {
            const isActive = activeCategoryTab === tab.value;
            return (
              <button
                key={tab.label}
                type="button"
                onClick={() => setActiveCategoryTab(tab.value)}
                className={cn(
                  'px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all',
                  isActive
                    ? 'bg-[#F3EBD8] text-[#171715] border border-[#D8C9A7] font-semibold'
                    : 'text-[#494431] hover:text-[#171715] hover:bg-[#F3EBD8]/50'
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {loadingCategoryListings ? (
          <div className="flex justify-center py-16">
            <Spinner size="lg" className="text-[#171715]" />
          </div>
        ) : !categoryListings || categoryListings.data.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="No listings in this category yet"
            description="Try selecting another property category or publish a verified listing from your dashboard."
            actionText="Explore All Listings"
            onAction={() => navigate('/listings')}
          />
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {categoryListings.data.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>

            <div className="flex items-center justify-between pt-2 text-xs text-[#494431]">
              <div className="flex items-center gap-3">
                <span className="font-mono font-semibold text-[#373124]">
                  01 / {String(Math.max(categoryListings.pagination?.total_pages ?? 1, 1)).padStart(2, '0')}
                </span>
                <span className="h-px w-16 bg-[#373124]" />
              </div>

              <Link
                to={`/listings${activeCategoryTab ? `?property_type=${activeCategoryTab}` : ''}`}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-[#D8C9A7] bg-[#F8F4E9] hover:bg-[#171715] hover:text-[#F8F4E9] text-[#373124] font-medium transition-colors"
              >
                <span>Browse All</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
