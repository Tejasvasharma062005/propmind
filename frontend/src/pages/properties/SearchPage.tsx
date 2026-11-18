import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { SlidersHorizontal, ArrowUpDown, Building2 } from 'lucide-react';
import { propertyService } from '@/services/property.service';
import type { PropertyFilters as FilterType } from '@/types/property.types';
import { PropertyCard } from '@/components/properties/PropertyCard';
import { PropertyFilters } from '@/components/properties/PropertyFilters';
import { EmptyState } from '@/components/ui/EmptyState';
import { Spinner } from '@/components/ui/Spinner';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

export const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  const [filters, setFilters] = useState<FilterType>({
    search: searchParams.get('search') || '',
    locality: searchParams.get('locality') || undefined,
    property_type: (searchParams.get('type') as FilterType['property_type']) || '',
    bhk: searchParams.get('bhk') ? Number(searchParams.get('bhk')) : '',
    verified_only: searchParams.get('verified') === 'true',
    sort_by: (searchParams.get('sort') as FilterType['sort_by']) || 'created_at_desc',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['properties', filters],
    queryFn: async () => {
      return await propertyService.getProperties(filters);
    },
  });

  const properties = (data?.results || []).filter((prop) => {
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const match =
        prop.title.toLowerCase().includes(q) ||
        prop.locality.toLowerCase().includes(q) ||
        prop.description.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (filters.verified_only && !prop.is_verified) {
      return false;
    }
    return true;
  });

  const handleFilterChange = (updated: FilterType) => {
    setFilters(updated);
    const params = new URLSearchParams();
    if (updated.search) params.set('search', updated.search);
    if (updated.locality) params.set('locality', updated.locality);
    if (updated.property_type) params.set('type', updated.property_type);
    if (updated.bhk) params.set('bhk', String(updated.bhk));
    if (updated.verified_only) params.set('verified', 'true');
    if (updated.sort_by) params.set('sort', updated.sort_by);
    setSearchParams(params);
  };

  const handleResetFilters = () => {
    const clean: FilterType = {
      search: '',
      locality: undefined,
      property_type: '',
      bhk: '',
      min_price: undefined,
      max_price: undefined,
      verified_only: false,
      sort_by: 'created_at_desc',
    };
    setFilters(clean);
    setSearchParams(new URLSearchParams());
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <div className="eyebrow-label mb-1.5">
            <span>INDORE PROPERTY REGISTRY</span>
            <span className="h-px w-10 bg-[#8C8474]/60" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#1C2420]">
            Verified Property Passports
          </h1>
          <p className="text-sm text-[#5A625D] mt-1">
            Showing <span className="font-semibold text-[#1C2420]">{properties.length}</span>{' '}
            registered properties in Indore, Madhya Pradesh
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            className="lg:hidden"
            leftIcon={<SlidersHorizontal className="w-4 h-4" />}
            onClick={() => setIsMobileFilterOpen(true)}
          >
            Filters
          </Button>

          <div className="flex items-center gap-2 bg-white border border-[#D5CCB9] rounded-full px-4 py-2 shadow-2xs">
            <ArrowUpDown className="w-4 h-4 text-[#5A625D]" />
            <select
              value={filters.sort_by || 'created_at_desc'}
              onChange={(e) =>
                handleFilterChange({
                  ...filters,
                  sort_by: e.target.value as FilterType['sort_by'],
                })
              }
              className="text-xs sm:text-sm font-medium text-[#1C2420] bg-transparent focus:outline-none cursor-pointer"
            >
              <option value="created_at_desc">Newest First</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        <div className="hidden lg:block lg:col-span-1 sticky top-24">
          <PropertyFilters
            filters={filters}
            onChange={handleFilterChange}
            onReset={handleResetFilters}
          />
        </div>

        <div className="lg:col-span-3">
          {isLoading ? (
            <div className="min-h-[400px] flex flex-col items-center justify-center bg-white rounded-2xl border border-[#E6E0D3] p-12">
              <Spinner size="lg" className="text-[#1B3126] mb-3" />
              <p className="text-sm font-medium text-[#5A625D]">
                Fetching verified properties in Indore...
              </p>
            </div>
          ) : properties.length === 0 ? (
            <EmptyState
              icon={Building2}
              title="No matching properties found"
              description="We couldn't find any properties matching your filter criteria. Try clearing filters or registering a property."
              actionText="Reset All Filters"
              onAction={handleResetFilters}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {properties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={isMobileFilterOpen}
        onClose={() => setIsMobileFilterOpen(false)}
        title="Filter Properties"
        size="md"
      >
        <PropertyFilters
          filters={filters}
          onChange={(updated: FilterType) => {
            handleFilterChange(updated);
          }}
          onReset={() => {
            handleResetFilters();
            setIsMobileFilterOpen(false);
          }}
        />
      </Modal>
    </div>
  );
};
