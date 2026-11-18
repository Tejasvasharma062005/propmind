import { api } from '@/lib/api';
import type { ApiResponse } from '@/types/common.types';
import type {
  Listing,
  ListingCreateInput,
  ListingFilters,
  ListingMedia,
  ListingReportReason,
  ListingStatus,
  ListingUpdateInput,
  OwnedPropertyOption,
  PaginatedListings,
} from '@/types/listing.types';

/** Strip empty values so they are not sent as filters. */
const cleanParams = (filters: object = {}): Record<string, string | number | boolean> => {
  const params: Record<string, string | number | boolean> = {};
  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '' || value === false) return;
    params[key] = value as string | number | boolean;
  });
  return params;
};

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const MAX_FILES_PER_UPLOAD = 10;
export const MAX_MEDIA_PER_LISTING = 20;
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const listingService = {
  async search(filters?: ListingFilters): Promise<PaginatedListings> {
    const { data } = await api.get('/listings/', { params: cleanParams(filters) });
    return { data: data.data, pagination: data.pagination };
  },

  async mine(status?: ListingStatus, page = 1): Promise<PaginatedListings> {
    const { data } = await api.get('/listings/mine/', { params: cleanParams({ status, page }) });
    return { data: data.data, pagination: data.pagination };
  },

  async moderationQueue(page = 1): Promise<PaginatedListings> {
    const { data } = await api.get('/listings/moderation/', { params: { page } });
    return { data: data.data, pagination: data.pagination };
  },

  async get(id: string): Promise<Listing> {
    const { data } = await api.get<ApiResponse<Listing>>(`/listings/${id}/`);
    return data.data;
  },

  async create(input: ListingCreateInput): Promise<Listing> {
    const { data } = await api.post<ApiResponse<Listing>>('/listings/', cleanParams(input));
    return data.data;
  },

  async update(id: string, input: ListingUpdateInput): Promise<Listing> {
    const { data } = await api.patch<ApiResponse<Listing>>(`/listings/${id}/`, input);
    return data.data;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/listings/${id}/`);
  },

  async changeStatus(id: string, status: ListingStatus): Promise<Listing> {
    const { data } = await api.post<ApiResponse<Listing>>(`/listings/${id}/status/`, { status });
    return data.data;
  },

  async moderate(id: string, decision: 'approve' | 'reject', reason = ''): Promise<Listing> {
    const { data } = await api.post<ApiResponse<Listing>>(`/listings/${id}/moderate/`, { decision, reason });
    return data.data;
  },

  async report(id: string, reason: ListingReportReason, details = ''): Promise<void> {
    await api.post(`/listings/${id}/report/`, { reason, details });
  },

  async uploadMedia(
    id: string,
    files: File[],
    onProgress?: (percent: number) => void
  ): Promise<ListingMedia[]> {
    const form = new FormData();
    files.forEach((file) => form.append('images', file));
    const { data } = await api.post<ApiResponse<ListingMedia[]>>(`/listings/${id}/media/`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000,
      onUploadProgress: (evt) => {
        if (onProgress && evt.total) onProgress(Math.round((evt.loaded / evt.total) * 100));
      },
    });
    return data.data;
  },

  async deleteMedia(id: string, mediaId: string): Promise<void> {
    await api.delete(`/listings/${id}/media/${mediaId}/`);
  },

  async setPrimaryMedia(id: string, mediaId: string): Promise<void> {
    await api.post(`/listings/${id}/media/${mediaId}/primary/`);
  },

  async myProperties(): Promise<OwnedPropertyOption[]> {
    const { data } = await api.get<ApiResponse<OwnedPropertyOption[]>>('/properties/mine/');
    return data.data;
  },
};

/** Client-side pre-check (the server re-validates everything). */
export const validateImageFile = (file: File): string | null => {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) return `${file.name}: only JPEG, PNG or WebP images are allowed.`;
  if (file.size > MAX_IMAGE_BYTES) return `${file.name}: must be 10 MB or smaller.`;
  return null;
};
