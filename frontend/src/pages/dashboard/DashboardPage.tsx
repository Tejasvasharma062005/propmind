import React from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Building2,
  Users,
  CalendarCheck,
  CreditCard,
  PlusCircle,
  ShieldCheck,
  TrendingUp,
  Bell,
  CheckCheck,
  Eye,
  Tags,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { platformService } from '@/services/platform.service';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { formatCurrency, formatDate } from '@/lib/utils';

export const DashboardPage: React.FC = () => {
  const { user, hasRole } = useAuth();
  const queryClient = useQueryClient();
  const isSeller = hasRole(['SELLER', 'BUILDER', 'AGENT', 'ADMIN']);

  const { data: summary, isLoading } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: () => platformService.getDashboardSummary(),
  });

  const markReadMutation = useMutation({
    mutationFn: () => platformService.markAllNotificationsRead(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] }),
  });

  return (
    <div className="space-y-8">
      {/* Editorial Forest-Green Welcome Banner */}
      <div className="bg-[#14231B] rounded-3xl p-6 sm:p-9 text-[#FAF7F2] border border-[#284436] shadow-md relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <span className="px-3 py-1 rounded-full bg-white/10 text-[#C9A96E] text-[11px] uppercase tracking-[0.18em] font-semibold border border-[#C9A96E]/30">
              Indore Real Estate Operations Hub
            </span>
            {user?.is_verified && (
              <span className="flex items-center gap-1 text-[#84A48E] text-xs font-medium">
                <ShieldCheck className="w-4 h-4 text-[#C9A96E]" /> KYC Verified
              </span>
            )}
          </div>

          <h1 className="text-3xl sm:text-4xl font-serif font-normal tracking-tight text-[#FAF7F2]">
            Welcome back, <span className="text-[#D8C29D]">{user?.name || 'Partner'}</span>
          </h1>

          <p className="text-sm text-[#C5D7CB] leading-relaxed">
            {isSeller
              ? 'Manage your Indore property assets, review verified buyer inquiries, and monitor escrow transaction milestones.'
              : 'Track your scheduled property visits in Indore, active purchase offers, and legal title verification audits.'}
          </p>

          <div className="pt-2 flex flex-wrap gap-3">
            {isSeller ? (
              <>
                <Link to="/dashboard/properties/new">
                  <Button
                    variant="secondary"
                    size="md"
                    leftIcon={<PlusCircle className="w-4 h-4 text-[#1B3126]" />}
                  >
                    Register Property
                  </Button>
                </Link>
                <Link to="/dashboard/listings/new">
                  <Button
                    variant="outline"
                    size="md"
                    className="bg-white/10 text-[#FAF7F2] border-[#C9A96E]/50 hover:bg-[#C9A96E] hover:text-[#14231B]"
                    leftIcon={<Tags className="w-4 h-4" />}
                  >
                    Publish Marketplace Listing
                  </Button>
                </Link>
              </>
            ) : (
              <Link to="/listings">
                <Button variant="secondary" size="md">
                  Browse Marketplace Listings
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Live Metric Cards */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" className="text-[#1B3126]" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {isSeller ? (
            <>
              <Card className="p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#F3EFE6] text-[#1B3126] flex items-center justify-center shrink-0 border border-[#E6E0D3]">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs text-[#5A625D] font-medium block">Active Listings</span>
                  <span className="text-2xl font-serif font-bold text-[#1C2420]">
                    {summary?.active_listings_count ?? 0}
                  </span>
                  <span className="text-[11px] text-[#8D6032] block mt-0.5 font-medium">
                    {summary?.pending_moderation_count ?? 0} awaiting moderation
                  </span>
                </div>
              </Card>

              <Card className="p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#F5EEDC] text-[#8D6032] flex items-center justify-center shrink-0 border border-[#EADAB8]">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs text-[#5A625D] font-medium block">Buyer Leads</span>
                  <span className="text-2xl font-serif font-bold text-[#1C2420]">
                    {summary?.leads_count ?? 0}
                  </span>
                  <Link to="/dashboard/leads" className="text-[11px] text-[#1B3126] block mt-0.5 font-semibold hover:underline">
                    Manage CRM inquiries →
                  </Link>
                </div>
              </Card>

              <Card className="p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#E6EDE8] text-[#2D4737] flex items-center justify-center shrink-0 border border-[#C5D7CB]">
                  <CalendarCheck className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs text-[#5A625D] font-medium block">Site Visits</span>
                  <span className="text-2xl font-serif font-bold text-[#1C2420]">
                    {summary?.visits_count ?? 0}
                  </span>
                  <Link to="/dashboard/visits" className="text-[11px] text-[#4E6B58] block mt-0.5 font-semibold hover:underline">
                    View visit schedule →
                  </Link>
                </div>
              </Card>

              <Card className="p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#1B3126] text-[#C9A96E] flex items-center justify-center shrink-0">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs text-[#5A625D] font-medium block">Escrow Volume</span>
                  <span className="text-2xl font-serif font-bold text-[#1C2420]">
                    {formatCurrency(summary?.escrow_volume ?? 0)}
                  </span>
                  <span className="text-[11px] text-[#5A625D] block mt-0.5 font-medium">
                    {summary?.deals_count ?? 0} deal(s) in escrow
                  </span>
                </div>
              </Card>
            </>
          ) : (
            <>
              <Card className="p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#F3EFE6] text-[#1B3126] flex items-center justify-center shrink-0 border border-[#E6E0D3]">
                  <CalendarCheck className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs text-[#5A625D] font-medium block">Scheduled Visits</span>
                  <span className="text-2xl font-serif font-bold text-[#1C2420]">
                    {summary?.visits_count ?? 0}
                  </span>
                  <Link to="/dashboard/visits" className="text-[11px] text-[#4E6B58] block mt-0.5 font-semibold hover:underline">
                    Manage visits →
                  </Link>
                </div>
              </Card>

              <Card className="p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#E6EDE8] text-[#2D4737] flex items-center justify-center shrink-0 border border-[#C5D7CB]">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs text-[#5A625D] font-medium block">Audited Passports</span>
                  <span className="text-2xl font-serif font-bold text-[#1C2420]">
                    {summary?.audited_passports_count ?? 0}
                  </span>
                  <span className="text-[11px] text-[#5A625D] block mt-0.5 font-medium">
                    Title-checked properties
                  </span>
                </div>
              </Card>

              <Card className="p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#F5EEDC] text-[#8D6032] flex items-center justify-center shrink-0 border border-[#EADAB8]">
                  <Eye className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs text-[#5A625D] font-medium block">My Inquiries</span>
                  <span className="text-2xl font-serif font-bold text-[#1C2420]">
                    {summary?.leads_count ?? 0}
                  </span>
                  <Link to="/dashboard/leads" className="text-[11px] text-[#1B3126] block mt-0.5 font-semibold hover:underline">
                    View inquiry status →
                  </Link>
                </div>
              </Card>

              <Card className="p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#1B3126] text-[#C9A96E] flex items-center justify-center shrink-0">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs text-[#5A625D] font-medium block">Active Offers</span>
                  <span className="text-2xl font-serif font-bold text-[#1C2420]">
                    {summary?.active_offers_count ?? 0}
                  </span>
                  <Link to="/dashboard/transactions" className="text-[11px] text-[#8D6032] block mt-0.5 font-semibold hover:underline">
                    Open Deal Room →
                  </Link>
                </div>
              </Card>
            </>
          )}
        </div>
      )}

      {/* Main 2-Column Section: Live Notifications & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Live Platform Notifications & Activity</CardTitle>
                <p className="text-xs text-[#5A625D] mt-0.5">
                  Real-time alerts from verification audits, buyer inquiries, offers, and escrow
                </p>
              </div>
              {(summary?.notifications?.length ?? 0) > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => markReadMutation.mutate()}
                  leftIcon={<CheckCheck className="w-4 h-4" />}
                >
                  Mark all read
                </Button>
              )}
            </CardHeader>
            <CardBody className="p-0">
              {!summary?.notifications || summary.notifications.length === 0 ? (
                <div className="p-10 text-center text-sm text-[#5A625D]">
                  <Bell className="w-8 h-8 text-[#8C8474] mx-auto mb-2" />
                  No notifications yet. Activity on your listings, visits, and deals will appear here.
                </div>
              ) : (
                <div className="divide-y divide-[#EFEAE0]">
                  {summary.notifications.map((n) => (
                    <Link
                      key={n.id}
                      to={n.action_url || '/dashboard'}
                      className={`p-4 flex items-center justify-between hover:bg-[#FAF7F2] transition-colors block ${
                        !n.is_read ? 'bg-[#F3EFE6]/60' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#E6EDE8] text-[#1B3126] flex items-center justify-center shrink-0">
                          <Bell className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[#1C2420]">{n.title}</p>
                          <p className="text-xs text-[#5A625D]">{n.body}</p>
                        </div>
                      </div>
                      <span className="text-xs text-[#7A827D] shrink-0">
                        {formatDate(n.created_at)}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6 space-y-4">
            <h3 className="text-xl font-serif font-bold text-[#1C2420]">Quick Actions</h3>
            <div className="space-y-2.5">
              <Link to="/dashboard/listings/new" className="block">
                <Button variant="primary" fullWidth size="md" leftIcon={<PlusCircle className="w-4 h-4" />}>
                  Create Marketplace Listing
                </Button>
              </Link>
              <Link to="/dashboard/properties/new" className="block">
                <Button variant="outline" fullWidth size="md" leftIcon={<Building2 className="w-4 h-4" />}>
                  Register New Property Asset
                </Button>
              </Link>
              <Link to="/listings" className="block">
                <Button variant="secondary" fullWidth size="md" leftIcon={<Tags className="w-4 h-4 text-[#5A625D]" />}>
                  Browse Marketplace
                </Button>
              </Link>
            </div>
          </Card>

          {summary?.spotlight_trend && (
            <Card className="p-6 bg-[#14231B] text-[#FAF7F2] border-[#284436] space-y-3">
              <div className="flex items-center gap-2 text-[#C9A96E] text-xs font-semibold uppercase tracking-wider">
                <TrendingUp className="w-4 h-4" />
                <span>Indore Top Growth Corridor</span>
              </div>
              <h4 className="text-xl font-serif font-bold">
                {summary.spotlight_trend.locality}, {summary.spotlight_trend.city}
              </h4>
              <p className="text-xs text-[#C5D7CB] leading-relaxed">
                Capital values in {summary.spotlight_trend.locality} have appreciated +
                {summary.spotlight_trend.growth_percentage}% YoY in {summary.spotlight_trend.quarter}{' '}
                {summary.spotlight_trend.year}.
              </p>
              <div className="pt-2 text-xs text-[#C9A96E] font-medium">
                Avg. Rate: ₹{Number(summary.spotlight_trend.average_price_sqft).toLocaleString('en-IN')}/sq.ft
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
