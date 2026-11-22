import React, { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SelectOption } from '@/types/common.types';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options?: SelectOption[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, helperText, options = [], placeholder, id, required, children, ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label htmlFor={selectId} className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-[#494431]">
            {label}
            {required && <span className="text-rose-700 ml-1">*</span>}
          </label>
        )}
        <div className="relative rounded-xl">
          <select
            id={selectId}
            ref={ref}
            className={cn(
              'block w-full appearance-none rounded-xl border text-sm text-[#373124] bg-[#F8F4E9] pl-3.5 pr-10 py-2.5 focus:outline-none focus:ring-2 focus:border-transparent transition-all',
              error
                ? 'border-rose-300 text-rose-900 focus:ring-rose-500 focus:border-rose-500'
                : 'border-[#D8C9A7] focus:ring-[#494431] focus:border-[#494431]',
              'disabled:bg-[#F3EBD8] disabled:text-[#494431]/70 disabled:cursor-not-allowed cursor-pointer',
              className
            )}
            aria-invalid={!!error}
            aria-describedby={error ? `${selectId}-error` : helperText ? `${selectId}-helper` : undefined}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={String(opt.value)} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))}
            {children}
          </select>
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-[#494431]">
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
        {error && (
          <p id={`${selectId}-error`} className="text-xs text-rose-700 font-medium mt-1">
            {error}
          </p>
        )}
        {!error && helperText && (
          <p id={`${selectId}-helper`} className="text-xs text-[#494431]/80 mt-1">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
