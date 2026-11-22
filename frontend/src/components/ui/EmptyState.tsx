import React from 'react';
import { LucideIcon, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './Button';

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  className?: string;
  children?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = HelpCircle,
  title,
  description,
  actionText,
  onAction,
  className,
  children,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-10 sm:p-14 text-center bg-[#F8F4E9] rounded-2xl border border-[#D8C9A7]',
        className
      )}
    >
      <div className="w-14 h-14 rounded-full bg-[#F3EBD8] border border-[#D8C9A7] flex items-center justify-center text-[#373124] mb-4">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-2xl font-serif font-bold text-[#373124] mb-1.5">{title}</h3>
      <p className="text-sm text-[#494431] max-w-md mb-6 leading-relaxed">{description}</p>
      {actionText && onAction && (
        <Button variant="primary" size="md" onClick={onAction}>
          {actionText}
        </Button>
      )}
      {children}
    </div>
  );
};
