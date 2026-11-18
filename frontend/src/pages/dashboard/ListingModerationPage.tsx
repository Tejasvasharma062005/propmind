import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, Eye, ShieldCheck, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';
import { ListingCard, getErrorMessage } from '@/components/listings';
import { useModerateListing, useModerationQueue } from '@/hooks/useListings';

export const ListingModerationPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, error } = useModerationQueue(page);
  const moderateMutation = useModerateListing();

  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);

  const handleApprove = async (id: string) => {
    setActionError(null);
    try {
      await moderateMutation.mutateAsync({ id, decision: 'approve' });
    } catch (err) {
      setActionError(getErrorMessage(err));
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectId || !rejectReason.trim()) return;
    setActionError(null);
    try {
      await moderateMutation.mutateAsync({ id: rejectId, decision: 'reject', reason: rejectReason.trim() });
      setRejectId(null);
      setRejectReason('');
    } catch (err) {
      setActionError(getErrorMessage(err));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif font-bold text-[#1C2420]">Listing Moderation Queue</h1>
        <p className="text-sm text-[#5A625D]">
          Review pending or flagged listings before they become publicly visible on PropMind.
        </p>
      </div>

      {actionError && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          {actionError}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" className="text-primary-600" />
        </div>
      ) : isError ? (
        <EmptyState
          icon={ShieldCheck}
          title="Could not load moderation queue"
          description={getErrorMessage(error)}
        />
      ) : !data || data.data.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="Moderation queue is clear"
          description="All submitted listings have been reviewed."
        />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.data.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                showStatus
                actions={
                  <div className="w-full space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>Photos: {listing.media.length}</span>
                      {(listing.report_count ?? 0) > 0 && (
                        <Badge variant="danger" size="sm">
                          <AlertTriangle className="w-3 h-3" /> {listing.report_count} reports
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="success"
                        size="sm"
                        className="flex-1"
                        leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                        onClick={() => handleApprove(listing.id)}
                        isLoading={moderateMutation.isPending}
                      >
                        Approve
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        className="flex-1"
                        leftIcon={<XCircle className="w-3.5 h-3.5" />}
                        onClick={() => {
                          setRejectId(listing.id);
                          setRejectReason('');
                        }}
                      >
                        Reject
                      </Button>
                      <Link to={`/listings/${listing.id}`}>
                        <Button variant="ghost" size="sm" leftIcon={<Eye className="w-3.5 h-3.5" />}>
                          Inspect
                        </Button>
                      </Link>
                    </div>
                  </div>
                }
              />
            ))}
          </div>

          {data.pagination.total_pages > 1 && (
            <div className="flex justify-center gap-3 pt-6">
              <Button
                variant="secondary"
                disabled={!data.pagination.has_previous}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <span className="text-sm text-slate-600 self-center">
                Page {data.pagination.page} of {data.pagination.total_pages}
              </span>
              <Button
                variant="secondary"
                disabled={!data.pagination.has_next}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}

      <Modal
        isOpen={Boolean(rejectId)}
        onClose={() => setRejectId(null)}
        title="Reject Listing"
        description="Provide clear instructions so the owner can fix the issue and resubmit."
      >
        <form onSubmit={handleRejectSubmit} className="space-y-4">
          <textarea
            rows={4}
            required
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="e.g. Please upload actual interior photos and verify asking price."
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setRejectId(null)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="danger"
              disabled={!rejectReason.trim()}
              isLoading={moderateMutation.isPending}
            >
              Confirm Rejection
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ListingModerationPage;
