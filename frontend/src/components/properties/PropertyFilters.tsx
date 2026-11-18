import React from 'react';
import { Filter, RotateCcw, ShieldCheck, Check } from 'lucide-react';
import type { PropertyFilters as FilterType, PropertyType } from '@/types/property.types';
import { INDORE_LOCALITIES, PROPERTY_TYPES, BHK_OPTIONS } from '@/lib/constants';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

export interface PropertyFiltersProps {
  filters: FilterType;
  onChange: (filters: FilterType) => void;
  onReset: () => void;
  className?: string;
}

export const PropertyFilters: React.FC<PropertyFiltersProps> = ({
  filters,
  onChange,
  onReset,
  className,
}) => {
  const handleLocalityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({ ...filters, locality: e.target.value || undefined, page: 1 });
  };

  const handleTypeChange = (type: PropertyType) => {
    onChange({
      ...filters,
      property_type: filters.property_type === type ? '' : type,
      page: 1,
    });
  };

  const handleBhkChange = (bhk: number) => {
    onChange({
      ...filters,
      bhk: filters.bhk === bhk ? '' : bhk,
      page: 1,
    });
  };

  const handleVerifiedToggle = () => {
    onChange({
      ...filters,
      verified_only: !filters.verified_only,
      page: 1,
    });
  };

  const handlePriceChange = (min?: number, max?: number) => {
    onChange({
      ...filters,
      min_price: min,
      max_price: max,
      page: 1,
    });
  };

  return (
    <div className={cn('bg-white p-5 sm:p-6 rounded-2xl border border-[#E6E0D3] space-y-6', className)}>
      <div className="flex items-center justify-between border-b border-[#EFEAE0] pb-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#1B3126]" />
          <h3 className="font-serif font-bold text-[#1C2420] text-lg">Refine Search</h3>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="text-xs text-[#5A625D] hover:text-[#1B3126] flex items-center gap-1 font-medium transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset All
        </button>
      </div>

      {/* PropMind Verified Only Toggle */}
      <div
        onClick={handleVerifiedToggle}
        className={cn(
          'p-3.5 rounded-xl border cursor-pointer select-none transition-all flex items-center justify-between',
          filters.verified_only
            ? 'bg-[#E6EDE8] border-[#6E8474] text-[#1B3126]'
            : 'bg-[#FAF7F2] border-[#E6E0D3] text-[#1C2420] hover:border-[#C9A96E]'
        )}
      >
        <div className="flex items-center gap-2.5">
          <ShieldCheck
            className={cn('w-5 h-5', filters.verified_only ? 'text-[#1B3126]' : 'text-[#7A827D]')}
          />
          <div>
            <div className="text-xs font-semibold">PropMind Verified Only</div>
            <div className="text-[11px] text-[#5A625D]">Legal title checked & clear</div>
          </div>
        </div>
        <div
          className={cn(
            'w-5 h-5 rounded-md flex items-center justify-center transition-colors',
            filters.verified_only ? 'bg-[#1B3126] text-[#FAF7F2]' : 'border border-[#D5CCB9] bg-white'
          )}
        >
          {filters.verified_only && <Check className="w-3.5 h-3.5 stroke-[3]" />}
        </div>
      </div>

      {/* Indore Locality Selector */}
      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-[#5A625D] block">
          Indore Locality
        </label>
        <select
          value={filters.locality || ''}
          onChange={handleLocalityChange}
          className="w-full text-sm rounded-xl border border-[#D5CCB9] bg-[#FAF7F2] p-2.5 text-[#1C2420] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1B3126]"
        >
          <option value="">All Indore Localities</option>
          {INDORE_LOCALITIES.map((loc) => (
            <option key={loc} value={loc}>
              {loc}
            </option>
          ))}
        </select>
      </div>

      {/* Property Type Filter */}
      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-[#5A625D] block">
          Property Type
        </label>
        <div className="grid grid-cols-1 gap-1.5">
          {PROPERTY_TYPES.map((t) => {
            const isSelected = filters.property_type === t.value;
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => handleTypeChange(t.value as PropertyType)}
                className={cn(
                  'w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all flex items-center justify-between',
                  isSelected
                    ? 'bg-[#1B3126] text-[#FAF7F2] font-semibold'
                    : 'text-[#4A544E] hover:bg-[#F3EFE6] border border-transparent'
                )}
              >
                <span>{t.label}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-[#C9A96E]" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* BHK Config Filter */}
      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-[#5A625D] block">
          BHK Bedrooms
        </label>
        <div className="grid grid-cols-5 gap-1.5">
          {BHK_OPTIONS.map((opt) => {
            const isSelected = filters.bhk === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleBhkChange(opt.value)}
                className={cn(
                  'py-2 text-center rounded-xl text-xs font-medium border transition-all',
                  isSelected
                    ? 'bg-[#1B3126] text-[#FAF7F2] border-[#1B3126] font-bold shadow-xs'
                    : 'bg-[#FAF7F2] text-[#1C2420] border-[#E6E0D3] hover:bg-[#EFEAE0]'
                )}
              >
                {opt.label.replace(' BHK', '')} BHK
              </button>
            );
          })}
        </div>
      </div>

      {/* Budget Range Presets */}
      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-[#5A625D] block">
          Budget Range
        </label>
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant={filters.max_price === 5000000 ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => handlePriceChange(undefined, 5000000)}
          >
            Under ₹50 L
          </Button>
          <Button
            type="button"
            variant={
              filters.min_price === 5000000 && filters.max_price === 10000000
                ? 'primary'
                : 'secondary'
            }
            size="sm"
            onClick={() => handlePriceChange(5000000, 10000000)}
          >
            ₹50 L - ₹1 Cr
          </Button>
          <Button
            type="button"
            variant={
              filters.min_price === 10000000 && filters.max_price === 20000000
                ? 'primary'
                : 'secondary'
            }
            size="sm"
            onClick={() => handlePriceChange(10000000, 20000000)}
          >
            ₹1 Cr - ₹2 Cr
          </Button>
          <Button
            type="button"
            variant={filters.min_price === 20000000 ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => handlePriceChange(20000000, undefined)}
          >
            Above ₹2 Cr
          </Button>
        </div>
      </div>
    </div>
  );
};
