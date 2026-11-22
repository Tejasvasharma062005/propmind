import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

export const badgeVariants = cva(
  'inline-flex items-center font-medium rounded-full border transition-colors select-none tracking-wide',
  {
    variants: {
      variant: {
        default: 'bg-[#F3EBD8] text-[#373124] border-[#D8C9A7]',
        primary: 'bg-[#171715] text-[#F8F4E9] border-[#171715]',
        secondary: 'bg-[#F6F0DE] text-[#494431] border-[#D8C9A7]',
        success: 'bg-[#494431] text-[#F8F4E9] border-[#494431]',
        warning: 'bg-[#C3A66B] text-[#171715] border-[#B49456]',
        danger: 'bg-rose-50 text-rose-900 border-rose-200',
        outline: 'text-[#373124] border-[#D8C9A7] bg-transparent',
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
            variant === 'success' && 'bg-[#C3A66B]',
            variant === 'warning' && 'bg-[#171715]',
            variant === 'danger' && 'bg-rose-700',
            variant === 'primary' && 'bg-[#C3A66B]',
            (!variant || variant === 'default' || variant === 'secondary') && 'bg-[#494431]'
          )}
        />
      )}
      {children}
    </span>
  );
};
