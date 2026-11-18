import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarCheck, CheckCircle2, Clock, User, XCircle } from 'lucide-react';
import { platformService } from '@/services/platform.service';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDate } from '@/lib/utils';

export const VisitsPage: React.FC = () => {
  const queryClient = useQueryClient();

  const { data: visits = [], isLoading } = useQuery({
    queryKey: ['visits'],
    queryFn: () => platformService.getVisits(),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      platformService.updateVisit(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visits'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif font-bold text-[#1C2420]">Scheduled Site Visits</h1>
        <p className="text-sm text-[#5A625D] mt-0.5">
          On-ground property viewings with buyer and host confirmation tracking
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" className="text-primary-600" />
        </div>
      ) : visits.length === 0 ? (
        <EmptyState
          icon={CalendarCheck}
          title="No site visits scheduled"
          description="Schedule a site visit from any property detail page to track it here."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {visits.map((v) => (
            <Card key={v.id} className="p-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <CalendarCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900">
                        {v.property_title} ({v.property_locality})
                      </h3>
                      <Badge
                        variant={
                          v.status === 'CONFIRMED' || v.status === 'COMPLETED'
                            ? 'success'
                            : v.status === 'CANCELLED'
                            ? 'danger'
                            : 'warning'
                        }
                        size="sm"
                      >
                        {v.status_display || v.status}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-600">
                      <span className="flex items-center gap-1 font-semibold text-slate-800">
                        <Clock className="w-3.5 h-3.5 text-primary-600" />
                        {formatDate(v.scheduled_at)}{' '}
                        {new Date(v.scheduled_at).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        Visitor: {v.visitor_name} ({v.visitor_phone})
                      </span>
                    </div>
                    {v.visitor_notes && (
                      <p className="text-xs text-slate-500 mt-1">Notes: {v.visitor_notes}</p>
                    )}
                    {v.host_name && (
                      <p className="text-xs text-slate-400 mt-0.5">Host: {v.host_name}</p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 self-end md:self-center">
                  {v.status === 'SCHEDULED' && (
                    <Button
                      variant="success"
                      size="sm"
                      leftIcon={<CheckCircle2 className="w-4 h-4" />}
                      onClick={() => updateMutation.mutate({ id: v.id, status: 'CONFIRMED' })}
                      isLoading={updateMutation.isPending}
                    >
                      Confirm
                    </Button>
                  )}
                  {v.status === 'CONFIRMED' && (
                    <Button
                      variant="primary"
                      size="sm"
                      leftIcon={<CheckCircle2 className="w-4 h-4" />}
                      onClick={() => updateMutation.mutate({ id: v.id, status: 'COMPLETED' })}
                      isLoading={updateMutation.isPending}
                    >
                      Mark Completed
                    </Button>
                  )}
                  {v.status !== 'CANCELLED' && v.status !== 'COMPLETED' && (
                    <Button
                      variant="danger"
                      size="sm"
                      leftIcon={<XCircle className="w-4 h-4" />}
                      onClick={() => updateMutation.mutate({ id: v.id, status: 'CANCELLED' })}
                      isLoading={updateMutation.isPending}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
