import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

export const badgeVariants = cva(
  'inline-flex items-center font-medium rounded-full border transition-colors select-none tracking-wide',
  {
    variants: {
      variant: {
        default: 'bg-[#F3EFE6] text-[#1C2420] border-[#E0D8C7]',
        primary: 'bg-[#1B3126] text-[#FAF7F2] border-[#1B3126]',
        secondary: 'bg-[#E6EDE8] text-[#2D4737] border-[#C5D7CB]',
        success: 'bg-[#6F8575] text-white border-[#5D7363]',
        warning: 'bg-[#C9A96E] text-[#1C2420] border-[#B99659]',
        danger: 'bg-rose-50 text-rose-800 border-rose-200',
        outline: 'text-[#1C2420] border-[#D5CCB9] bg-transparent',
      },
      size: {
        sm: 'text-[11px] px-2.5 py-0.5 gap-1',
        md: 'text-xs px-3 py-1 gap-1.5',
        lg: 'text-sm px-3.5 py-1.5 gap-2',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant,
  size,
  dot,
  children,
  ...props
}) => {
  return (
    <span className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {dot && (
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full',
            variant === 'success' && 'bg-white',
            variant === 'warning' && 'bg-[#1C2420]',
            variant === 'danger' && 'bg-rose-600',
            variant === 'primary' && 'bg-[#C9A96E]',
            (!variant || variant === 'default' || variant === 'secondary') && 'bg-[#4E6B58]'
          )}
        />
      )}
      {children}
    </span>
  );
};
