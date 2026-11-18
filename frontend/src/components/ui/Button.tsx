import React, { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Spinner } from './Spinner';

export const buttonVariants = cva(
  'inline-flex items-center justify-center font-medium rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98] tracking-wide',
  {
    variants: {
      variant: {
        primary:
          'bg-[#1B3126] text-[#FAF7F2] hover:bg-[#122119] focus:ring-[#1B3126] shadow-xs',
        secondary:
          'bg-[#FAF7F2] text-[#1C2420] hover:bg-[#EFEAE0] border border-[#D5CCB9] focus:ring-[#84A48E]',
        outline:
          'border border-[#1B3126] text-[#1B3126] hover:bg-[#1B3126] hover:text-[#FAF7F2] focus:ring-[#1B3126]',
        ghost:
          'text-[#4A544E] hover:text-[#1B3126] hover:bg-[#EFEAE0]/70 focus:ring-[#84A48E]',
        danger:
          'bg-rose-700 text-white hover:bg-rose-800 focus:ring-rose-600 shadow-xs',
        success:
          'bg-[#4E6B58] text-white hover:bg-[#405648] focus:ring-[#4E6B58] shadow-xs',
      },
      size: {
        sm: 'text-xs px-3.5 py-1.5 gap-1.5',
        md: 'text-sm px-5 py-2.5 gap-2',
        lg: 'text-sm sm:text-base px-7 py-3 gap-2.5 font-semibold',
        icon: 'h-9 w-9 p-0',
      },
      fullWidth: {
        true: 'w-full',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      fullWidth: false,
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      fullWidth,
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size, fullWidth, className }))}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Spinner size={size === 'lg' ? 'md' : 'sm'} />}
        {!isLoading && leftIcon}
        {children}
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = 'Button';
