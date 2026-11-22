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
          'bg-[#171715] text-[#F8F4E9] hover:bg-[#494431] focus:ring-[#494431]',
        secondary:
          'bg-[#F3EBD8] text-[#373124] hover:bg-[#D8C9A7]/60 border border-[#D8C9A7] focus:ring-[#C3A66B]',
        outline:
          'border border-[#373124] text-[#373124] hover:bg-[#171715] hover:text-[#F8F4E9] focus:ring-[#494431]',
        ghost:
          'text-[#494431] hover:text-[#171715] hover:bg-[#F3EBD8] focus:ring-[#D8C9A7]',
        danger:
          'bg-rose-800 text-[#F8F4E9] hover:bg-rose-900 focus:ring-rose-700',
        success:
          'bg-[#494431] text-[#F8F4E9] hover:bg-[#373124] focus:ring-[#494431]',
      },
      size: {
        sm: 'text-xs px-3.5 py-1.5 gap-1.5',
        md: 'text-sm px-5 py-2.5 gap-2',
        lg: 'text-sm sm:text-base px-7 py-3 gap-2.5 font-medium',
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
