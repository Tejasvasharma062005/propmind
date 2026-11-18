import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { listingService } from '@/services/listing.service';
import type {
  ListingCreateInput,
  ListingFilters,
  ListingReportReason,
  ListingStatus,
  ListingUpdateInput,
} from '@/types/listing.types';

export const listingKeys = {
  all: ['listings'] as const,
  search: (filters: ListingFilters) => ['listings', 'search', filters] as const,
  mine: (status?: ListingStatus) => ['listings', 'mine', status ?? 'all'] as const,
  moderation: (page: number) => ['listings', 'moderation', page] as const,
  detail: (id: string) => ['listings', 'detail', id] as const,
  myProperties: ['properties', 'mine'] as const,
};

export const useListingSearch = (filters: ListingFilters) =>
  useQuery({
    queryKey: listingKeys.search(filters),
    queryFn: () => listingService.search(filters),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });

export const useMyListings = (status?: ListingStatus) =>
  useQuery({ queryKey: listingKeys.mine(status), queryFn: () => listingService.mine(status) });

export const useModerationQueue = (page = 1) =>
  useQuery({ queryKey: listingKeys.moderation(page), queryFn: () => listingService.moderationQueue(page) });

export const useListing = (id?: string) =>
  useQuery({
    queryKey: listingKeys.detail(id ?? ''),
    queryFn: () => listingService.get(id as string),
    enabled: Boolean(id),
    staleTime: 0, // always fresh: image URLs are short-lived pre-signed links
    retry: false,
  });

export const useMyProperties = () =>
  useQuery({ queryKey: listingKeys.myProperties, queryFn: listingService.myProperties });

/** Invalidate every listing query after a write. */
const useInvalidateListings = () => {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: listingKeys.all });
};

export const useCreateListing = () => {
  const invalidate = useInvalidateListings();
  return useMutation({
    mutationFn: (input: ListingCreateInput) => listingService.create(input),
    onSuccess: invalidate,
  });
};

export const useUpdateListing = (id: string) => {
  const invalidate = useInvalidateListings();
  return useMutation({
    mutationFn: (input: ListingUpdateInput) => listingService.update(id, input),
    onSuccess: invalidate,
  });
};

export const useDeleteListing = () => {
  const invalidate = useInvalidateListings();
  return useMutation({ mutationFn: (id: string) => listingService.remove(id), onSuccess: invalidate });
};

export const useChangeListingStatus = () => {
  const invalidate = useInvalidateListings();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: ListingStatus }) => listingService.changeStatus(id, status),
    onSuccess: invalidate,
  });
};

export const useModerateListing = () => {
  const invalidate = useInvalidateListings();
  return useMutation({
    mutationFn: ({ id, decision, reason }: { id: string; decision: 'approve' | 'reject'; reason?: string }) =>
      listingService.moderate(id, decision, reason),
    onSuccess: invalidate,
  });
};

export const useReportListing = (id: string) =>
  useMutation({
    mutationFn: ({ reason, details }: { reason: ListingReportReason; details?: string }) =>
      listingService.report(id, reason, details),
  });

export const useListingMedia = (id: string) => {
  const invalidate = useInvalidateListings();
  const upload = useMutation({
    mutationFn: ({ files, onProgress }: { files: File[]; onProgress?: (p: number) => void }) =>
      listingService.uploadMedia(id, files, onProgress),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: (mediaId: string) => listingService.deleteMedia(id, mediaId),
    onSuccess: invalidate,
  });
  const setPrimary = useMutation({
    mutationFn: (mediaId: string) => listingService.setPrimaryMedia(id, mediaId),
    onSuccess: invalidate,
  });
  return { upload, remove, setPrimary };
};
