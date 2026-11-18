import React, { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { useReportListing } from '@/hooks/useListings';
import type { ListingReportReason } from '@/types/listing.types';
import { REPORT_REASON_OPTIONS, getErrorMessage } from './listingUtils';

export interface ReportListingModalProps {
  listingId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ReportListingModal: React.FC<ReportListingModalProps> = ({ listingId, isOpen, onClose }) => {
  const [reason, setReason] = useState<ListingReportReason | ''>('');
  const [details, setDetails] = useState('');
  const report = useReportListing(listingId);

  const handleClose = () => {
    report.reset();
    setReason('');
    setDetails('');
    onClose();
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (reason) report.mutate({ reason, details: details.trim() });
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Report this listing" size="md"
      description="Reports are confidential. Our trust & safety team reviews every report.">
      {report.isSuccess ? (
        <div className="text-center py-6 space-y-3">
          <CheckCircle2 className="w-12 h-12 text-[#4E6B58] mx-auto" />
          <p className="font-medium text-[#1C2420]">Thank you for keeping PropMind safe.</p>
          <Button variant="secondary" onClick={handleClose}>Close</Button>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <Select
            label="Reason"
            placeholder="Select a reason"
            options={REPORT_REASON_OPTIONS}
            value={reason}
            onChange={(e) => setReason(e.target.value as ListingReportReason)}
            required
          />
          <div>
            <label htmlFor="report-details" className="block text-sm font-medium text-slate-700 mb-1">
              Details (optional)
            </label>
            <textarea
              id="report-details"
              rows={4}
              maxLength={2000}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="What looks wrong?"
            />
          </div>
          {report.isError && <p className="text-sm text-rose-600">{getErrorMessage(report.error)}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={handleClose}>Cancel</Button>
            <Button type="submit" variant="danger" disabled={!reason} isLoading={report.isPending}>Submit report</Button>
          </div>
        </form>
      )}
    </Modal>
  );
};
