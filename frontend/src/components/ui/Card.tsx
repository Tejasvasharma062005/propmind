import React from 'react';
import { cn } from '@/lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverEffect?: boolean;
}

export const Card: React.FC<CardProps> = ({ className, hoverEffect = false, children, ...props }) => {
  return (
    <div
      className={cn(
        'bg-[#F8F4E9] rounded-2xl border border-[#D8C9A7] overflow-hidden',
        hoverEffect && 'transition-all duration-300 hover:border-[#C3A66B] hover:-translate-y-0.5',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => {
  return (
    <div className={cn('p-5 sm:p-6 border-b border-[#D8C9A7]/70 flex flex-col space-y-1.5', className)} {...props}>
      {children}
    </div>
  );
};

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  className,
  children,
  ...props
}) => {
  return (
    <h3 className={cn('text-xl font-serif font-semibold text-[#373124] leading-tight', className)} {...props}>
      {children}
    </h3>
  );
};

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  className,
  children,
  ...props
}) => {
  return (
    <p className={cn('text-sm text-[#494431]', className)} {...props}>
      {children}
    </p>
  );
};

export const CardBody: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => {
  return (
    <div className={cn('p-5 sm:p-6', className)} {...props}>
      {children}
    </div>
  );
};

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => {
  return (
    <div
      className={cn('p-5 sm:p-6 pt-0 bg-[#F3EBD8]/70 border-t border-[#D8C9A7]/70 flex items-center justify-between', className)}
      {...props}
    >
      {children}
    </div>
  );
};
