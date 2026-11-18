import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowUpRight, MapPin, TrendingUp } from 'lucide-react';
import { platformService } from '@/services/platform.service';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';

export const AnalyticsPage: React.FC = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['locality-trends', 'Indore'],
    queryFn: () => platformService.getLocalityTrends('Indore'),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" className="text-primary-600" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <EmptyState
        icon={TrendingUp}
        title="Could not load market analytics"
        description="Unable to fetch locality price trends from the analytics service."
      />
    );
  }

  const { trends, summary } = data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif font-bold text-[#1C2420]">Indore Real Estate Analytics</h1>
        <p className="text-sm text-[#5A625D] mt-0.5">
          Live micro-market trends, capital value movements, and price per sq.ft across {summary.total_localities} Indore localities
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card className="p-5">
          <span className="text-xs text-slate-500 font-medium">City-Wide YoY Appreciation</span>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-2xl font-extrabold text-slate-900">
              +{summary.average_growth_percentage}%
            </span>
            <span className="text-xs font-semibold text-emerald-600 flex items-center">
              <ArrowUpRight className="w-3.5 h-3.5" /> {summary.city} Corridor Avg
            </span>
          </div>
        </Card>

        <Card className="p-5">
          <span className="text-xs text-slate-500 font-medium">Average Residential Rate</span>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-2xl font-extrabold text-slate-900">
              ₹{Number(summary.average_price_sqft).toLocaleString('en-IN')}
            </span>
            <span className="text-xs text-slate-500">per sq.ft</span>
          </div>
        </Card>

        <Card className="p-5">
          <span className="text-xs text-slate-500 font-medium">Tracked Micro-Markets</span>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-2xl font-extrabold text-slate-900">{summary.total_localities}</span>
            <span className="text-xs text-slate-500">active localities</span>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-base font-bold text-slate-900 mb-4">Indore Micro-Market Performance</h3>
        {trends.length === 0 ? (
          <p className="text-sm text-slate-500 py-8 text-center">
            No locality trends recorded yet. Run <code className="font-mono">python manage.py seed_indore</code> to populate market data.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="pb-3">Locality</th>
                  <th className="pb-3">Avg Rate / sq.ft</th>
                  <th className="pb-3">YoY Appreciation</th>
                  <th className="pb-3">Period</th>
                  <th className="pb-3">Market Tier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {trends.map((row) => {
                  const growth = Number(row.growth_percentage);
                  return (
                    <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 font-semibold text-slate-800 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-primary-500" />
                        {row.locality}
                      </td>
                      <td className="py-3.5 text-slate-700">
                        ₹{Number(row.average_price_sqft).toLocaleString('en-IN')}/sq.ft
                      </td>
                      <td className="py-3.5 text-emerald-600 font-bold">+{row.growth_percentage}%</td>
                      <td className="py-3.5 text-slate-500">
                        {row.quarter} {row.year}
                      </td>
                      <td className="py-3.5">
                        <Badge variant={growth >= 10 ? 'success' : 'primary'} size="sm">
                          {growth >= 10 ? 'High Growth' : 'Prime Corridor'}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
