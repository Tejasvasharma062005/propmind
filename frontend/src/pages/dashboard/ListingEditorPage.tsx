import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Eye,
  Info,
  PauseCircle,
  PlayCircle,
  Plus,
  RotateCcw,
  Save,
  Trash2,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Spinner } from '@/components/ui/Spinner';
import {
  LISTING_STATUS_META,
  LISTING_TYPE_OPTIONS,
  MediaUploader,
  getErrorMessage,
} from '@/components/listings';
import {
  useChangeListingStatus,
  useCreateListing,
  useDeleteListing,
  useListing,
  useMyProperties,
  useUpdateListing,
} from '@/hooks/useListings';
import type { ListingStatus, ListingType } from '@/types/listing.types';

const todayISO = () => new Date().toISOString().slice(0, 10);

export const ListingEditorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const { data: listing, isLoading: loadingListing } = useListing(id);
  const { data: properties = [], isLoading: loadingProps } = useMyProperties();

  const createMutation = useCreateListing();
  const updateMutation = useUpdateListing(id ?? '');
  const statusMutation = useChangeListingStatus();
  const deleteMutation = useDeleteListing();

  const [propertyId, setPropertyId] = useState('');
  const [listingType, setListingType] = useState<ListingType>('SALE');
  const [askingPrice, setAskingPrice] = useState('');
  const [securityDeposit, setSecurityDeposit] = useState('0');
  const [maintenanceCharges, setMaintenanceCharges] = useState('0');
  const [isNegotiable, setIsNegotiable] = useState(true);
  const [availableFrom, setAvailableFrom] = useState(todayISO());
  const [reraNumber, setReraNumber] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (listing) {
      setPropertyId(listing.property);
      setListingType(listing.listing_type);
      setAskingPrice(String(listing.asking_price));
      setSecurityDeposit(String(listing.security_deposit ?? '0'));
      setMaintenanceCharges(String(listing.maintenance_charges ?? '0'));
      setIsNegotiable(Boolean(listing.is_negotiable));
      setAvailableFrom(listing.available_from || todayISO());
      setReraNumber(listing.rera_number || '');
    }
  }, [listing]);

  if (isEdit && loadingListing) {
    return (
      <div className="flex justify-center py-24">
        <Spinner size="lg" className="text-primary-600" />
      </div>
    );
  }

  const isClosed = listing ? ['SOLD', 'WITHDRAWN'].includes(listing.status) : false;
  const isRental = listingType !== 'SALE';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      if (!isEdit) {
        const created = await createMutation.mutateAsync({
          property: propertyId,
          listing_type: listingType,
          asking_price: askingPrice,
          security_deposit: isRental ? securityDeposit || '0' : '0',
          maintenance_charges: maintenanceCharges || '0',
          is_negotiable: isNegotiable,
          available_from: availableFrom,
          rera_number: reraNumber.trim(),
        });
        navigate(`/dashboard/listings/${created.id}/edit`, { replace: true });
      } else if (id) {
        await updateMutation.mutateAsync({
          asking_price: askingPrice,
          security_deposit: isRental ? securityDeposit || '0' : '0',
          maintenance_charges: maintenanceCharges || '0',
          is_negotiable: isNegotiable,
          available_from: availableFrom,
          rera_number: reraNumber.trim(),
        });
        setSuccessMsg('Listing details saved.');
      }
    } catch (err) {
      setErrorMsg(getErrorMessage(err));
    }
  };

  const handleStatusChange = async (nextStatus: ListingStatus) => {
    if (!id) return;
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await statusMutation.mutateAsync({ id, status: nextStatus });
      setSuccessMsg(`Status updated to ${LISTING_STATUS_META[nextStatus].label}.`);
    } catch (err) {
      setErrorMsg(getErrorMessage(err));
    }
  };

  const handleDelete = async () => {
    if (!id || !window.confirm('Withdraw and remove this listing?')) return;
    try {
      await deleteMutation.mutateAsync(id);
      navigate('/dashboard/listings');
    } catch (err) {
      setErrorMsg(getErrorMessage(err));
    }
  };

  const propertyOptions = properties.map((p) => ({
    value: p.id,
    label: `${p.title} (${p.locality}) — ${p.property_type_display}`,
  }));

  const statusMeta = listing ? LISTING_STATUS_META[listing.status] : null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            to="/dashboard/listings"
            className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 mb-1"
          >
            <ArrowLeft className="w-4 h-4" /> Back to My Listings
          </Link>
          <h1 className="text-3xl font-serif font-bold text-[#1C2420]">
            {isEdit ? 'Manage Listing' : 'Create Marketplace Listing'}
          </h1>
        </div>
        {listing && statusMeta && (
          <div className="flex items-center gap-2">
            <Badge variant={statusMeta.variant} dot size="lg">
              {statusMeta.label}
            </Badge>
            <Link to={`/listings/${listing.id}`}>
              <Button variant="secondary" size="sm" leftIcon={<Eye className="w-4 h-4" />}>
                Preview
              </Button>
            </Link>
          </div>
        )}
      </div>

      {listing?.status === 'REJECTED' && listing.rejection_reason && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Moderator feedback — changes needed:</p>
            <p className="mt-1">{listing.rejection_reason}</p>
            <p className="text-xs text-rose-600 mt-1">
              Update the details or photos below and click Save to resubmit for approval.
            </p>
          </div>
        </div>
      )}

      {listing?.status === 'PENDING_APPROVAL' && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 flex items-start gap-3">
          <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Awaiting Trust & Safety Approval</p>
            <p className="mt-0.5">
              Upload at least one clear property photo below so our team can approve and publish your listing.
            </p>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          {successMsg}
        </div>
      )}

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          {!isEdit ? (
            <div className="space-y-2">
              <Select
                label="Select Property Asset"
                placeholder={loadingProps ? 'Loading your properties...' : 'Choose a property you own'}
                options={propertyOptions}
                value={propertyId}
                onChange={(e) => setPropertyId(e.target.value)}
                required
              />
              {!loadingProps && properties.length === 0 && (
                <p className="text-xs text-slate-500">
                  You haven&apos;t registered a property yet.{' '}
                  <Link to="/dashboard/properties/new" className="text-primary-600 font-semibold underline">
                    Add a property first
                  </Link>
                  .
                </p>
              )}
            </div>
          ) : (
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Property</p>
              <p className="text-base font-semibold text-slate-800">
                {listing?.property_summary.title} — {listing?.property_summary.locality}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Listing Type"
              options={LISTING_TYPE_OPTIONS}
              value={listingType}
              onChange={(e) => setListingType(e.target.value as ListingType)}
              disabled={isEdit}
              required
            />
            <Input
              label={isRental ? 'Monthly Rent (₹)' : 'Asking Price (₹)'}
              type="number"
              min={1}
              step="1"
              value={askingPrice}
              onChange={(e) => setAskingPrice(e.target.value)}
              disabled={isClosed}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {isRental && (
              <Input
                label="Security Deposit (₹)"
                type="number"
                min={0}
                value={securityDeposit}
                onChange={(e) => setSecurityDeposit(e.target.value)}
                disabled={isClosed}
              />
            )}
            <Input
              label="Monthly Maintenance (₹)"
              type="number"
              min={0}
              value={maintenanceCharges}
              onChange={(e) => setMaintenanceCharges(e.target.value)}
              disabled={isClosed}
            />
            <Input
              label="Available From"
              type="date"
              min={isEdit ? undefined : todayISO()}
              value={availableFrom}
              onChange={(e) => setAvailableFrom(e.target.value)}
              disabled={isClosed}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
            <Input
              label="MP RERA Registration No. (Optional)"
              placeholder="e.g. P-IND-24-12345"
              value={reraNumber}
              onChange={(e) => setReraNumber(e.target.value)}
              disabled={isClosed}
            />
            <label className="flex items-center gap-2 pb-2.5 text-sm text-slate-700">
              <input
                type="checkbox"
                className="rounded border-slate-300"
                checked={isNegotiable}
                onChange={(e) => setIsNegotiable(e.target.checked)}
                disabled={isClosed}
              />
              Asking price is negotiable
            </label>
          </div>

          {!isClosed && (
            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                isLoading={createMutation.isPending || updateMutation.isPending}
                leftIcon={isEdit ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              >
                {isEdit ? 'Save Changes' : 'Continue & Upload Photos'}
              </Button>
            </div>
          )}
        </form>
      </Card>

      {isEdit && listing && (
        <>
          <Card className="p-6 space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Property Photos</h2>
              <p className="text-xs text-slate-500">
                Upload multiple images (stored securely on AWS S3 with EXIF/GPS metadata stripped).
              </p>
            </div>
            <MediaUploader listingId={listing.id} media={listing.media} disabled={isClosed} />
          </Card>

          <Card className="p-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-800">Listing Controls</h3>
              <p className="text-xs text-slate-500">Pause, resume, mark sold, or withdraw your listing.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {listing.status === 'ACTIVE' && (
                <>
                  <Button
                    variant="secondary"
                    size="sm"
                    leftIcon={<PauseCircle className="w-4 h-4" />}
                    onClick={() => handleStatusChange('PAUSED')}
                    isLoading={statusMutation.isPending}
                  >
                    Pause
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    leftIcon={<CheckCircle2 className="w-4 h-4" />}
                    onClick={() => handleStatusChange('SOLD')}
                    isLoading={statusMutation.isPending}
                  >
                    Mark as Sold
                  </Button>
                </>
              )}
              {listing.status === 'PAUSED' && (
                <Button
                  variant="success"
                  size="sm"
                  leftIcon={<PlayCircle className="w-4 h-4" />}
                  onClick={() => handleStatusChange('ACTIVE')}
                  isLoading={statusMutation.isPending}
                >
                  Resume Listing
                </Button>
              )}
              {(listing.status === 'EXPIRED' || listing.status === 'REJECTED') && (
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<RotateCcw className="w-4 h-4" />}
                  onClick={() => handleStatusChange('PENDING_APPROVAL')}
                  isLoading={statusMutation.isPending}
                >
                  Resubmit for Approval
                </Button>
              )}
              {!isClosed && (
                <Button
                  variant="danger"
                  size="sm"
                  leftIcon={<Trash2 className="w-4 h-4" />}
                  onClick={handleDelete}
                  isLoading={deleteMutation.isPending}
                >
                  Withdraw
                </Button>
              )}
            </div>
          </Card>
        </>
      )}
    </div>
  );
};

export default ListingEditorPage;
