import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Building2, Search, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { ListingCard, LISTING_TYPE_OPTIONS, getErrorMessage } from '@/components/listings';
import { useListingSearch } from '@/hooks/useListings';
import { INDORE_LOCALITIES } from '@/lib/constants';
import type { ListingFilters, ListingType } from '@/types/listing.types';

const PROPERTY_TYPE_OPTIONS = [
  { value: 'APARTMENT', label: 'Apartment / Flat' },
  { value: 'INDEPENDENT_HOUSE', label: 'Independent House' },
  { value: 'VILLA', label: 'Villa' },
  { value: 'PLOT', label: 'Plot' },
  { value: 'COMMERCIAL_OFFICE', label: 'Office Space' },
  { value: 'SHOP', label: 'Shop' },
  { value: 'INDUSTRIAL', label: 'Industrial' },
  { value: 'AGRICULTURAL', label: 'Agricultural Land' },
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
  { value: 'most_viewed', label: 'Most viewed' },
];

const FILTER_KEYS = ['listing_type', 'locality', 'property_type', 'min_price', 'max_price', 'bedrooms', 'search', 'sort_by', 'verified_only', 'page'] as const;

export const BrowseListingsPage: React.FC = () => {
  const [params, setParams] = useSearchParams();
  const [searchText, setSearchText] = useState(params.get('search') ?? '');
  const [showFilters, setShowFilters] = useState(false);

  // URL is the single source of truth for filters (shareable, back-button friendly)
  const filters: ListingFilters = useMemo(() => {
    const f: Record<string, unknown> = { page_size: 12 };
    FILTER_KEYS.forEach((key) => {
      const value = params.get(key);
      if (value === null || value === '') return;
      if (key === 'verified_only') f[key] = value === 'true';
      else if (['min_price', 'max_price', 'bedrooms', 'page'].includes(key)) f[key] = Number(value);
      else f[key] = value;
    });
    return f as ListingFilters;
  }, [params]);

  const { data, isLoading, isFetching, isError, error } = useListingSearch(filters);

  const setFilter = (key: string, value: string | boolean) => {
    const next = new URLSearchParams(params);
    if (value === '' || value === false) next.delete(key);
    else next.set(key, String(value));
    if (key !== 'page') next.delete('page');
    setParams(next);
  };

  const page = filters.page ?? 1;
  const pagination = data?.pagination;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <div className="eyebrow-label mb-1.5">
            <span>INDORE MARKETPLACE</span>
            <span className="h-px w-10 bg-[#C3A66B]" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-normal text-[#373124]">
            Curated Properties in Indore
          </h1>
          <p className="text-sm text-[#494431] mt-1">
            Every listing is reviewed by our verification team before it goes live.
            {pagination && ` ${pagination.total_count} listing${pagination.total_count === 1 ? '' : 's'} found.`}
          </p>
        </div>
        <div className="flex gap-2.5">
          <Select
            aria-label="Listing type"
            options={[{ value: '', label: 'Buy / Rent / Lease' }, ...LISTING_TYPE_OPTIONS]}
            value={filters.listing_type ?? ''}
            onChange={(e) => setFilter('listing_type', e.target.value as ListingType)}
          />
          <Select
            aria-label="Sort by"
            options={SORT_OPTIONS}
            value={filters.sort_by ?? 'newest'}
            onChange={(e) => setFilter('sort_by', e.target.value)}
          />
        </div>
      </div>

      <form
        className="flex flex-wrap sm:flex-nowrap gap-2.5 mb-6 p-2 bg-[#F8F4E9] rounded-2xl sm:rounded-full border border-[#D8C9A7]"
        onSubmit={(e) => { e.preventDefault(); setFilter('search', searchText.trim()); }}
      >
        <div className="flex-1 min-w-[200px]">
          <Input
            aria-label="Search listings"
            placeholder="Search by locality, project or keyword in Indore..."
            leftIcon={<Search className="w-4 h-4" />}
            value={searchText}
            maxLength={100}
            onChange={(e) => setSearchText(e.target.value)}
            className="border-0 focus:ring-0 bg-transparent rounded-full"
          />
        </div>
        <Button type="submit">Search</Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => setShowFilters((s) => !s)}
          leftIcon={<SlidersHorizontal className="w-4 h-4" />}
        >
          Filters
        </Button>
      </form>

      {showFilters && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 p-5 mb-8 bg-[#F8F4E9] border border-[#D8C9A7] rounded-2xl">
          <Select label="Locality" options={[{ value: '', label: 'Any' }, ...INDORE_LOCALITIES.map((l) => ({ value: l, label: l }))]}
            value={filters.locality ?? ''} onChange={(e) => setFilter('locality', e.target.value)} />
          <Select label="Property type" options={[{ value: '', label: 'Any' }, ...PROPERTY_TYPE_OPTIONS]}
            value={filters.property_type ?? ''} onChange={(e) => setFilter('property_type', e.target.value)} />
          <Select label="Bedrooms" options={[{ value: '', label: 'Any' }, ...[1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: `${n}+ BHK` }))]}
            value={filters.bedrooms ? String(filters.bedrooms) : ''} onChange={(e) => setFilter('bedrooms', e.target.value)} />
          <Input label="Min price (₹)" type="number" min={0} defaultValue={filters.min_price ?? ''}
            onBlur={(e) => setFilter('min_price', e.target.value)} />
          <Input label="Max price (₹)" type="number" min={0} defaultValue={filters.max_price ?? ''}
            onBlur={(e) => setFilter('max_price', e.target.value)} />
          <label className="flex items-end gap-2 pb-2.5 text-sm font-medium text-[#1C2420] cursor-pointer">
            <input type="checkbox" className="rounded border-[#D5CCB9] text-[#1B3126]" checked={Boolean(filters.verified_only)}
              onChange={(e) => setFilter('verified_only', e.target.checked)} />
            Verified only
          </label>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" className="text-[#171715]" /></div>
      ) : isError ? (
        <EmptyState icon={Building2} title="Couldn't load listings" description={getErrorMessage(error)} />
      ) : !data || data.data.length === 0 ? (
        <EmptyState icon={Building2} title="No listings match your filters"
          description="Try widening your price range or clearing some filters."
          actionText="Clear filters" onAction={() => { setSearchText(''); setParams(new URLSearchParams()); }} />
      ) : (
        <>
          <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 ${isFetching ? 'opacity-60' : ''}`}>
            {data.data.map((listing) => <ListingCard key={listing.id} listing={listing} />)}
          </div>
          {pagination && pagination.total_pages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-10">
              <Button variant="secondary" disabled={!pagination.has_previous} onClick={() => setFilter('page', String(page - 1))}>Previous</Button>
              <span className="text-sm text-[#5A625D]">Page {pagination.page} of {pagination.total_pages}</span>
              <Button variant="secondary" disabled={!pagination.has_next} onClick={() => setFilter('page', String(page + 1))}>Next</Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default BrowseListingsPage;
