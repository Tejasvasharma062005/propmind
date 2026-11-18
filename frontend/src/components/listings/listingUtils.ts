import { ApiError } from '@/lib/api';
import type { ListingStatus } from '@/types/listing.types';

type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'outline';

export const LISTING_STATUS_META: Record<ListingStatus, { label: string; variant: BadgeVariant; hint: string }> = {
  PENDING_APPROVAL: { label: 'Under Review', variant: 'warning', hint: 'Our team is reviewing this listing before it goes live.' },
  ACTIVE: { label: 'Live', variant: 'success', hint: 'Visible to buyers on the marketplace.' },
  PAUSED: { label: 'Paused', variant: 'default', hint: 'Hidden from buyers. Resume anytime.' },
  EXPIRED: { label: 'Expired', variant: 'outline', hint: 'Listing validity ended. Renew to resubmit for review.' },
  SOLD: { label: 'Sold', variant: 'primary', hint: 'Marked as sold.' },
  REJECTED: { label: 'Changes Needed', variant: 'danger', hint: 'Fix the issues noted below and save to resubmit.' },
  WITHDRAWN: { label: 'Withdrawn', variant: 'outline', hint: 'Removed by you.' },
};

export const LISTING_TYPE_OPTIONS = [
  { value: 'SALE', label: 'For Sale' },
  { value: 'RENT', label: 'For Rent' },
  { value: 'LEASE', label: 'Commercial Lease' },
];

export const REPORT_REASON_OPTIONS = [
  { value: 'FRAUD', label: 'Suspected fraud / scam' },
  { value: 'FAKE_PHOTOS', label: 'Fake or misleading photos' },
  { value: 'WRONG_PRICE', label: 'Incorrect price' },
  { value: 'ALREADY_SOLD', label: 'Already sold / rented' },
  { value: 'NOT_OWNER', label: 'Lister is not the owner' },
  { value: 'DUPLICATE', label: 'Duplicate listing' },
  { value: 'OTHER', label: 'Other' },
];

export const formatPrice = (value: string | number, listingType?: string): string => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return '—';
  let text: string;
  if (amount >= 1_00_00_000) text = `₹${(amount / 1_00_00_000).toFixed(2).replace(/\.00$/, '')} Cr`;
  else if (amount >= 1_00_000) text = `₹${(amount / 1_00_000).toFixed(2).replace(/\.00$/, '')} L`;
  else text = `₹${amount.toLocaleString('en-IN')}`;
  return listingType === 'RENT' || listingType === 'LEASE' ? `${text}/mo` : text;
};

/** Turn an API error into a single readable message. */
export const getErrorMessage = (error: unknown, fallback = 'Something went wrong. Please try again.'): string => {
  if (error instanceof ApiError) {
    const fieldErrors = error.errors && typeof error.errors === 'object' ? Object.values(error.errors).flat() : [];
    const first = fieldErrors.find((e) => typeof e === 'string');
    if (first) return first;
    if (error.statusCode === 429) return 'Too many requests. Please wait a while and try again.';
    return error.message || fallback;
  }
  if (error instanceof Error) return error.message;
  return fallback;
};
