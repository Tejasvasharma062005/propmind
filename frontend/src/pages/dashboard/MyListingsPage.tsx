import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, Eye, Pencil, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Select } from '@/components/ui/Select';
import { Spinner } from '@/components/ui/Spinner';
import { ListingCard, getErrorMessage } from '@/components/listings';
import { useMyListings } from '@/hooks/useListings';
import type { ListingStatus } from '@/types/listing.types';

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: '', label: 'All Statuses' },
  { value: 'PENDING_APPROVAL', label: 'Under Review' },
  { value: 'ACTIVE', label: 'Live' },
  { value: 'PAUSED', label: 'Paused' },
  { value: 'REJECTED', label: 'Changes Needed' },
  { value: 'SOLD', label: 'Sold' },
  { value: 'EXPIRED', label: 'Expired' },
];

export const MyListingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<ListingStatus | undefined>(undefined);
  const { data, isLoading, isError, error } = useMyListings(statusFilter);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-[#1C2420]">My Marketplace Listings</h1>
          <p className="text-sm text-[#5A625D]">
            Manage pricing, S3 photo galleries, and availability for your listed properties.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select
            aria-label="Filter by status"
            options={STATUS_FILTERS}
            value={statusFilter ?? ''}
            onChange={(e) => setStatusFilter((e.target.value || undefined) as ListingStatus | undefined)}
          />
          <Button
            onClick={() => navigate('/dashboard/listings/new')}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            New Listing
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" className="text-primary-600" />
        </div>
      ) : isError ? (
        <EmptyState
          icon={Building2}
          title="Could not load your listings"
          description={getErrorMessage(error)}
        />
      ) : !data || data.data.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No listings yet"
          description="Publish a marketplace listing for one of your properties to start receiving verified buyer inquiries."
          actionText="Create Listing"
          onAction={() => navigate('/dashboard/listings/new')}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.data.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              showStatus
              to={`/dashboard/listings/${listing.id}/edit`}
              actions={
                <>
                  <Link to={`/dashboard/listings/${listing.id}/edit`} className="flex-1">
                    <Button variant="secondary" size="sm" fullWidth leftIcon={<Pencil className="w-3.5 h-3.5" />}>
                      Manage
                    </Button>
                  </Link>
                  <Link to={`/listings/${listing.id}`}>
                    <Button variant="ghost" size="sm" leftIcon={<Eye className="w-3.5 h-3.5" />}>
                      View
                    </Button>
                  </Link>
                </>
              }
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MyListingsPage;
