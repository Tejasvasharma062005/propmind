import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  ShieldCheck,
  Building2,
  Users,
  ArrowRight,
  CheckCircle2,
  Lock,
  FileCheck2,
  BadgePercent,
  MapPin,
  Landmark,
  Star,
  Home,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { ListingCard } from '@/components/listings';
import { useListingSearch } from '@/hooks/useListings';
import { platformService } from '@/services/platform.service';
import { INDORE_LOCALITIES, PROPERTY_TYPES } from '@/lib/constants';
import heroVillaImage from '@/assets/hero.png';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedLocality, setSelectedLocality] = useState('');
  const [selectedPropertyType, setSelectedPropertyType] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: featuredListings, isLoading: loadingListings } = useListingSearch({
    page_size: 3,
    sort_by: 'newest',
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
    if (searchQuery.trim()) params.set('search', searchQuery.trim());
    navigate(`/listings?${params.toString()}`);
  };

  return (
    <div className="bg-[#FAF7F2] text-[#1C2420] pb-20">
      {/* 1. ARCHITECTURAL EDITORIAL HERO SECTION */}
      <section className="relative overflow-hidden bg-[#14231B] text-[#FAF7F2] min-h-[540px] lg:min-h-[610px] flex items-center">
        {/* Background Architectural Photography & Editorial Gradient Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src={heroVillaImage}
            alt="Indore Modern Architectural Residence"
            className="w-full h-full object-cover object-right opacity-55"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#111F18] via-[#14231B]/88 to-[#14231B]/35" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#111F18]/90 via-transparent to-[#111F18]/40" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 w-full">
          <div className="max-w-3xl space-y-6">
            {/* Eyebrow Label with Horizontal Rule */}
            <div className="inline-flex items-center gap-4 text-[11px] sm:text-xs uppercase tracking-[0.25em] text-[#E6E0D3]/90 font-medium">
              <span>INDORE&apos;S PREMIUM REAL ESTATE PLATFORM</span>
              <span className="h-px w-12 bg-[#C9A96E]/70" />
            </div>

            {/* Editorial Serif Display Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-serif font-normal tracking-tight leading-[1.06]">
              <span className="block text-[#FAF7F2]">Find. Verify. Invest.</span>
              <span className="block text-[#D8C29D] mt-1">with Confidence.</span>
            </h1>

            {/* Subtitle */}
            <p className="text-sm sm:text-base text-[#E6E0D3]/90 max-w-xl leading-relaxed font-normal">
              Discover verified properties, connect with trusted professionals,
              and complete your real estate journey — the smart way.
            </p>

            {/* Refined Pill-Shaped Ivory Search Bar */}
            <form
              onSubmit={handleHeroSearch}
              className="mt-8 p-2 sm:p-2.5 bg-[#FAF7F2]/95 backdrop-blur-md rounded-3xl sm:rounded-full shadow-2xl border border-white/20 flex flex-col md:flex-row items-stretch md:items-center gap-2 text-[#1C2420] max-w-3xl"
            >
              {/* Keyword Input */}
              <div className="flex-1 flex items-center gap-2.5 px-4 py-2">
                <Search className="w-4 h-4 text-[#5A625D] shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for properties in Indore..."
                  className="w-full bg-transparent text-sm text-[#1C2420] placeholder-[#7A827D] focus:outline-none"
                />
              </div>

              <div className="hidden md:block h-6 w-px bg-[#D5CCB9]" />

              {/* Indore Locality Selector */}
              <div className="flex items-center gap-1.5 px-3 py-2">
                <MapPin className="w-4 h-4 text-[#4E6B58] shrink-0" />
                <select
                  aria-label="Select Indore locality"
                  value={selectedLocality}
                  onChange={(e) => setSelectedLocality(e.target.value)}
                  className="bg-transparent text-xs sm:text-sm font-medium text-[#1C2420] focus:outline-none cursor-pointer pr-2"
                >
                  <option value="">Indore (All)</option>
                  {INDORE_LOCALITIES.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
              </div>

              <div className="hidden md:block h-6 w-px bg-[#D5CCB9]" />

              {/* Property Type Selector */}
              <div className="flex items-center gap-1.5 px-3 py-2">
                <Home className="w-4 h-4 text-[#4E6B58] shrink-0" />
                <select
                  aria-label="Select property type"
                  value={selectedPropertyType}
                  onChange={(e) => setSelectedPropertyType(e.target.value)}
                  className="bg-transparent text-xs sm:text-sm font-medium text-[#1C2420] focus:outline-none cursor-pointer pr-2"
                >
                  <option value="">Property Type</option>
                  {PROPERTY_TYPES.map((pt) => (
                    <option key={pt.value} value={pt.value}>
                      {pt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Deep Forest-Green Pill Search CTA */}
              <Button
                type="submit"
                variant="primary"
                size="md"
                className="px-7 py-3 rounded-full bg-[#1B3126] hover:bg-[#122119] text-[#FAF7F2] shrink-0"
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Search
              </Button>
            </form>

            {/* Popular Localities Quick Links */}
            <div className="pt-2 flex flex-wrap items-center gap-2 text-xs text-[#E6E0D3]/80">
              <span className="font-medium text-[#C9A96E]">Prime Corridors:</span>
              {['Vijay Nagar', 'Super Corridor', 'Scheme 54', 'Bypass Road', 'Bicholi Mardana'].map(
                (loc) => (
                  <Link
                    key={loc}
                    to={`/listings?locality=${encodeURIComponent(loc)}`}
                    className="px-3 py-1 rounded-full bg-white/10 hover:bg-[#C9A96E] hover:text-[#14231B] border border-white/15 text-[#FAF7F2] transition-colors"
                  >
                    {loc}
                  </Link>
                )
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 2. WARM CREAM TRUST & PROVENANCE RIBBON */}
      <section className="bg-[#F3EFE6] border-b border-[#E6E0D3]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 items-center divide-y sm:divide-y-0 lg:divide-x divide-[#E0D8C7]">
            {/* Pillar 1 */}
            <div className="flex items-center gap-3.5 pt-3 sm:pt-0">
              <div className="w-10 h-10 rounded-full bg-[#FAF7F2] border border-[#D5CCB9] flex items-center justify-center text-[#1B3126] shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-[#1C2420]">
                  100% Verified
                </div>
                <div className="text-xs text-[#5A625D]">
                  {stats?.verified_properties_count
                    ? `${stats.verified_properties_count} Properties Audited`
                    : 'Properties & Passports'}
                </div>
              </div>
            </div>

            {/* Pillar 2 */}
            <div className="flex items-center gap-3.5 pt-3 sm:pt-0 lg:pl-6">
              <div className="w-10 h-10 rounded-full bg-[#FAF7F2] border border-[#D5CCB9] flex items-center justify-center text-[#1B3126] shrink-0">
                <Landmark className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-[#1C2420]">Integrated with</div>
                <div className="text-xs text-[#5A625D]">6 MP Government Sources</div>
              </div>
            </div>

            {/* Pillar 3 */}
            <div className="flex items-center gap-3.5 pt-3 sm:pt-0 lg:pl-6">
              <div className="w-10 h-10 rounded-full bg-[#FAF7F2] border border-[#D5CCB9] flex items-center justify-center text-[#1B3126] shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-[#1C2420]">
                  {stats?.active_listings_count
                    ? `${stats.active_listings_count} Live Listings`
                    : 'Multi-Role Ecosystem'}
                </div>
                <div className="text-xs text-[#5A625D]">Buyers, Owners & Advocates</div>
              </div>
            </div>

            {/* Pillar 4 */}
            <div className="flex items-center gap-3.5 pt-3 sm:pt-0 lg:pl-6">
              <div className="w-10 h-10 rounded-full bg-[#FAF7F2] border border-[#D5CCB9] flex items-center justify-center text-[#1B3126] shrink-0">
                <Star className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-[#1C2420]">
                  +{stats?.top_locality_growth ?? 14.5}% YoY
                </div>
                <div className="text-xs text-[#5A625D]">
                  {stats?.top_locality || 'Super Corridor'} Growth
                </div>
              </div>
            </div>

            {/* Pillar 5: Editorial Italic Serif Tagline */}
            <div className="pt-3 sm:pt-0 lg:pl-6 flex items-center justify-between gap-3">
              <p className="font-serif italic text-base sm:text-lg text-[#1C2420] leading-snug">
                A smarter way to
                <span className="block">experience real estate</span>
              </p>
              <span className="h-px w-8 bg-[#C9A96E] shrink-0 hidden xl:block" />
            </div>
          </div>
        </div>
      </section>

      {/* 3. ASYMMETRIC FEATURED PROPERTIES & EDITORIAL CALLOUT SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 lg:pt-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left Column (3 cols): Editorial Heading & Explore All Pill CTA */}
          <div className="lg:col-span-3 flex flex-col justify-between space-y-6 py-2">
            <div className="space-y-4">
              <div className="eyebrow-label">
                <span>FEATURED PROPERTIES</span>
                <span className="h-px w-10 bg-[#8C8474]/60" />
              </div>

              <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-serif font-normal text-[#1C2420] leading-[1.12]">
                Discover the finest properties{' '}
                <span className="text-[#5A7363] block mt-1">in Indore</span>
              </h2>

              <p className="text-xs sm:text-sm text-[#5A625D] leading-relaxed">
                Every property is backed by an audited 5-pillar PropMind Digital Passport and verified title provenance.
              </p>
            </div>

            <div className="pt-2">
              <Link to="/listings">
                <Button
                  variant="primary"
                  size="md"
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                  className="rounded-full px-6 py-3"
                >
                  Explore All Properties
                </Button>
              </Link>
            </div>
          </div>

          {/* Center Column (6 cols): Live Marketplace Listing Cards */}
          <div className="lg:col-span-6">
            {loadingListings ? (
              <div className="h-full min-h-[320px] flex items-center justify-center bg-white rounded-2xl border border-[#E6E0D3]">
                <Spinner size="lg" className="text-[#1B3126]" />
              </div>
            ) : !featuredListings || featuredListings.data.length === 0 ? (
              <EmptyState
                icon={Building2}
                title="No live marketplace listings yet"
                description="Register your first authentic property or publish a verified listing from your PropMind dashboard."
                actionText="Publish a Listing"
                onAction={() => navigate('/dashboard/listings/new')}
                className="h-full justify-center"
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 h-full">
                {featuredListings.data.slice(0, 3).map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>
            )}
          </div>

          {/* Right Column (3 cols): Deep Forest-Green Editorial "Get Verified Property Updates" Card */}
          <div className="lg:col-span-3">
            <div className="h-full rounded-2xl bg-[#16281F] text-[#FAF7F2] p-6 sm:p-7 flex flex-col justify-between relative overflow-hidden border border-[#284436] shadow-md">
              {/* Subtle Botanical & Architectural Line Art SVG */}
              <div className="space-y-4 relative z-10">
                <span className="text-[10px] uppercase tracking-[0.22em] text-[#C9A96E] font-semibold block">
                  PROPMIND INTELLIGENCE
                </span>
                <h3 className="text-2xl sm:text-3xl font-serif font-normal text-[#FAF7F2] leading-snug">
                  Get Verified Property Updates
                </h3>
                <p className="text-xs sm:text-sm text-[#C5D7CB] leading-relaxed">
                  Be the first to know about new and government-verified listings across Indore.
                </p>
                <div className="pt-2">
                  <Link to="/register">
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#F3EFE6] hover:bg-[#C9A96E] text-[#14231B] text-xs font-semibold tracking-wide transition-colors shadow-xs"
                    >
                      <span>Subscribe Now</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </Link>
                </div>
              </div>

              {/* Decorative Indore Architectural Silhouette at Bottom */}
              <div className="mt-8 pt-4 border-t border-[#C9A96E]/25 relative z-10">
                <svg
                  viewBox="0 0 260 64"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-full h-14 text-[#C9A96E]/55"
                  aria-hidden="true"
                >
                  <path
                    d="M4 62H256M20 62V36L34 26L48 36V62M26 44H42M26 52H42M64 62V28H106V62M74 36H96M74 46H96M118 62V16L134 6L150 16V62M126 26H142M126 36H142M126 46H142M164 62V30L182 20L200 30V62M174 40H190M214 62V38H244V62"
                    stroke="currentColor"
                    strokeWidth="1.25"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. HOW PROPMIND WORKS — EDITORIAL 3-PILLAR PROTOCOL */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <div className="eyebrow-label mb-2">
              <span>OPERATING PROTOCOL</span>
              <span className="h-px w-10 bg-[#8C8474]/60" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-serif font-normal text-[#1C2420]">
              How PropMind Works
            </h2>
          </div>
          <p className="text-sm text-[#5A625D] max-w-md">
            An end-to-end real estate operating ecosystem engineered for Indore&apos;s buyers, owners, advocates, and developers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-7 rounded-2xl border border-[#E6E0D3] space-y-3 hover:border-[#C9A96E] transition-colors">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#C9A96E]">
              STEP 01
            </span>
            <h3 className="text-2xl font-serif font-bold text-[#1C2420]">Discover & Inspect</h3>
            <p className="text-sm text-[#5A625D] leading-relaxed">
              Explore curated residential and commercial properties across Indore&apos;s prime corridors with transparent carpet areas and pricing.
            </p>
          </div>

          <div className="bg-white p-7 rounded-2xl border border-[#E6E0D3] space-y-3 hover:border-[#C9A96E] transition-colors">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#4E6B58]">
              STEP 02
            </span>
            <h3 className="text-2xl font-serif font-bold text-[#1C2420]">Verify Property Passport</h3>
            <p className="text-sm text-[#5A625D] leading-relaxed">
              Audit the 5-pillar Digital Property Passport backed by MP Bhulekh, MP RERA, IGRS Sampada, IMC tax clearance, and 30-year advocate title reports.
            </p>
          </div>

          <div className="bg-white p-7 rounded-2xl border border-[#E6E0D3] space-y-3 hover:border-[#C9A96E] transition-colors">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#1B3126]">
              STEP 03
            </span>
            <h3 className="text-2xl font-serif font-bold text-[#1C2420]">Negotiate & Close in Escrow</h3>
            <p className="text-sm text-[#5A625D] leading-relaxed">
              Schedule site visits, exchange transparent counter-offers, and complete milestone-protected conveyance in the Transaction Room.
            </p>
          </div>
        </div>
      </section>

      {/* 5. THE PROPMIND DIFFERENCE — DEEP FOREST GREEN ARCHITECTURAL FEATURE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20">
        <div className="bg-[#14231B] text-[#FAF7F2] rounded-3xl p-8 sm:p-12 lg:p-16 border border-[#264133]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-3 text-xs uppercase tracking-[0.22em] text-[#C9A96E] font-semibold">
                <span>THE PROPMIND STANDARD</span>
                <span className="h-px w-10 bg-[#C9A96E]/60" />
              </div>
              <h2 className="text-3xl sm:text-5xl font-serif font-normal tracking-tight leading-tight">
                Central India&apos;s Benchmark for Trust & Provenance
              </h2>
              <p className="text-sm text-[#C5D7CB] leading-relaxed">
                Traditional real estate is plagued by disputed registries, hidden encumbrances, and
                unverified listings. PropMind replaces uncertainty with provenance-tracked government records and
                on-ground legal verification by licensed High Court advocates.
              </p>

              <div className="space-y-3 pt-1">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#C9A96E] shrink-0" />
                  <span className="text-sm text-[#FAF7F2]">
                    30-Year Chain of Title Deed audit on every verified listing
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#C9A96E] shrink-0" />
                  <span className="text-sm text-[#FAF7F2]">
                    Direct integration adapters for MP Bhulekh, MP RERA, IGRS Sampada & IMC Indore
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#C9A96E] shrink-0" />
                  <span className="text-sm text-[#FAF7F2]">
                    Escrow milestone payment protection until Sub-Registrar deed execution
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                <FileCheck2 className="w-7 h-7 text-[#C9A96E]" />
                <h4 className="font-serif font-bold text-[#FAF7F2] text-xl">Property Passport</h4>
                <p className="text-xs text-[#C5D7CB] leading-relaxed">
                  Tamper-proof 5-pillar audit certificate covering identity, title, legal, physical, and tax clearances.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                <Lock className="w-7 h-7 text-[#84A48E]" />
                <h4 className="font-serif font-bold text-[#FAF7F2] text-xl">Institutional Escrow</h4>
                <p className="text-xs text-[#C5D7CB] leading-relaxed">
                  5-stage conveyance milestones held securely until Sub-Registrar Indore execution.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                <ShieldCheck className="w-7 h-7 text-[#C9A96E]" />
                <h4 className="font-serif font-bold text-[#FAF7F2] text-xl">MP RERA & Bhulekh</h4>
                <p className="text-xs text-[#C5D7CB] leading-relaxed">
                  Authentic provenance tracking across 6 Madhya Pradesh & Indore government authorities.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                <BadgePercent className="w-7 h-7 text-[#84A48E]" />
                <h4 className="font-serif font-bold text-[#FAF7F2] text-xl">Transparent Deal Room</h4>
                <p className="text-xs text-[#C5D7CB] leading-relaxed">
                  Direct buyer-to-owner negotiation ledger with complete audit trail and zero hidden markups.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
