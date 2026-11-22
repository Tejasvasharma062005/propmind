import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Building,
  PlusCircle,
  Users,
  CalendarCheck,
  FileCheck,
  CreditCard,
  Settings,
  Scale,
  ShieldCheck,
  TrendingUp,
  Tags,
  ShieldAlert,
  HardHat,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import type { UserRole } from '@/types/auth.types';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: UserRole[];
}

const navItems: NavItem[] = [
  {
    label: 'Overview',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'My Properties',
    href: '/dashboard/properties',
    icon: Building,
    roles: ['SELLER', 'BUILDER', 'ADMIN', 'AGENT'],
  },
  {
    label: 'Add Property',
    href: '/dashboard/properties/new',
    icon: PlusCircle,
    roles: ['SELLER', 'BUILDER', 'ADMIN'],
  },
  {
    label: 'My Listings',
    href: '/dashboard/listings',
    icon: Tags,
    roles: ['SELLER', 'BUILDER', 'AGENT', 'ADMIN'],
  },
  {
    label: 'Moderation Queue',
    href: '/dashboard/listings/moderation',
    icon: ShieldAlert,
    roles: ['ADMIN'],
  },
  {
    label: 'Leads & Inquiries',
    href: '/dashboard/leads',
    icon: Users,
    roles: ['SELLER', 'BUILDER', 'AGENT', 'ADMIN'],
  },
  {
    label: 'Site Visits',
    href: '/dashboard/visits',
    icon: CalendarCheck,
  },
  {
    label: 'Escrow & Transactions',
    href: '/dashboard/transactions',
    icon: CreditCard,
  },
  {
    label: 'Legal Verification',
    href: '/dashboard/verification',
    icon: Scale,
    roles: ['ADVOCATE', 'VERIFIER', 'ADMIN'],
  },
  {
    label: 'KYC & Compliance',
    href: '/dashboard/kyc',
    icon: ShieldCheck,
  },
  {
    label: 'Market Analytics',
    href: '/dashboard/analytics',
    icon: TrendingUp,
    roles: ['INVESTOR', 'ADMIN', 'BUILDER'],
  },
  {
    label: 'Builders & Investments',
    href: '/dashboard/ventures',
    icon: HardHat,
    roles: ['BUILDER', 'INVESTOR', 'ADMIN'],
  },
  {
    label: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
  },
];

export interface SidebarProps {
  className?: string;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ className, onClose }) => {
  const { user } = useAuth();
  const userRoles = user?.roles || [];

  const filteredNavItems = navItems.filter((item) => {
    if (!item.roles || item.roles.length === 0) return true;
    return item.roles.some((r) => userRoles.includes(r) || user?.is_staff);
  });

  return (
    <aside
      className={cn(
        'w-64 bg-[#F3EBD8] border-r border-[#D8C9A7] h-[calc(100vh-4.5rem)] sm:h-[calc(100vh-5rem)] sticky top-18 sm:top-20 flex flex-col justify-between shrink-0 select-none overflow-y-auto',
        className
      )}
    >
      <div className="p-4 space-y-1">
        <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#494431]">
          Workspace
        </div>
        <nav className="space-y-1">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.href}
                to={item.href}
                end={item.href === '/dashboard'}
                onClick={onClose}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group',
                    isActive
                      ? 'bg-[#171715] text-[#F8F4E9] font-semibold'
                      : 'text-[#373124] hover:bg-[#D8C9A7]/40'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={cn(
                        'w-4 h-4 transition-colors',
                        isActive ? 'text-[#C3A66B]' : 'text-[#494431] group-hover:text-[#171715]'
                      )}
                    />
                    <span>{item.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Indore PropMind Trust Badge in Sidebar Footer */}
      <div className="p-4 m-4 rounded-xl bg-[#171715] text-[#F8F4E9] border border-[#494431] text-xs">
        <div className="flex items-center gap-1.5 font-serif font-semibold text-sm text-[#C3A66B] mb-1">
          <FileCheck className="w-4 h-4 text-[#C3A66B]" />
          <span>PropMind Passport</span>
        </div>
        <p className="text-[11px] leading-relaxed text-[#D8C9A7]/85">
          Protected by PropMind AI-Powered Property Passport & MP RERA compliance.
        </p>
      </div>
    </aside>
  );
};
