import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Mail, Phone, Users } from 'lucide-react';
import { platformService } from '@/services/platform.service';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatCurrency, formatDate, getInitials } from '@/lib/utils';

const LEAD_STATUS_OPTIONS = [
  { value: 'NEW', label: 'New' },
  { value: 'CONTACTED', label: 'Contacted' },
  { value: 'QUALIFIED', label: 'Qualified' },
  { value: 'VISIT_SCHEDULED', label: 'Visit Scheduled' },
  { value: 'NEGOTIATING', label: 'Negotiating' },
  { value: 'CONVERTED', label: 'Converted' },
  { value: 'LOST', label: 'Lost' },
];

export const LeadsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ['leads', statusFilter],
    queryFn: () => platformService.getLeads(statusFilter || undefined),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      platformService.updateLead(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-[#1C2420]">Buyer Leads & Inquiries</h1>
          <p className="text-sm text-[#5A625D] mt-0.5">
            Manage verified buyer inquiries and update CRM pipeline status
          </p>
        </div>
        <Select
          aria-label="Filter leads by status"
          options={[{ value: '', label: 'All Statuses' }, ...LEAD_STATUS_OPTIONS]}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" className="text-primary-600" />
        </div>
      ) : leads.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No leads found"
          description="Inquiries submitted on property and listing detail pages will appear here."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {leads.map((lead) => (
            <Card key={lead.id} className="p-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-sm shrink-0">
                    {getInitials(lead.buyer_name)}
                  </div>
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900">{lead.buyer_name}</h3>
                      <Badge
                        variant={
                          lead.status === 'NEW'
                            ? 'primary'
                            : lead.status === 'LOST'
                            ? 'danger'
                            : 'success'
                        }
                        size="sm"
                      >
                        {lead.status_display || lead.status}
                      </Badge>
                      <span className="text-xs text-slate-400">{formatDate(lead.created_at)}</span>
                    </div>
                    {lead.property_title && (
                      <p className="text-xs text-slate-500">
                        Property:{' '}
                        <strong className="text-slate-700">
                          {lead.property_title} ({lead.property_locality})
                        </strong>
                      </p>
                    )}
                    <p className="text-sm text-slate-700">{lead.inquiry_message}</p>

                    <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-slate-600">
                      {lead.buyer_phone && (
                        <a
                          href={`tel:${lead.buyer_phone}`}
                          className="flex items-center gap-1 hover:text-primary-600"
                        >
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          {lead.buyer_phone}
                        </a>
                      )}
                      {lead.buyer_email && (
                        <a
                          href={`mailto:${lead.buyer_email}`}
                          className="flex items-center gap-1 hover:text-primary-600"
                        >
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          {lead.buyer_email}
                        </a>
                      )}
                      {lead.budget_max && (
                        <span className="text-slate-500">
                          Max Budget: {formatCurrency(Number(lead.budget_max))}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-center">
                  <Select
                    aria-label="Update lead status"
                    options={LEAD_STATUS_OPTIONS}
                    value={lead.status}
                    onChange={(e) =>
                      updateMutation.mutate({ id: lead.id, status: e.target.value })
                    }
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
