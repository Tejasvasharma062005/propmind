import { api } from '@/lib/api';
import type {
  Property,
  PropertyFilters,
  CreatePropertyInput,
  PropertyDocument,
  PropertyMedia,
} from '@/types/property.types';
import type { ApiResponse, PaginatedResponse } from '@/types/common.types';

export const propertyService = {
  async getProperties(filters?: PropertyFilters): Promise<PaginatedResponse<Property>> {
    const params: Record<string, string | number | boolean> = {};

    if (filters?.search) params.search = filters.search;
    if (filters?.locality) params.locality = filters.locality;
    if (filters?.property_type) params.property_type = filters.property_type;
    if (filters?.min_price) params.min_price = filters.min_price;
    if (filters?.max_price) params.max_price = filters.max_price;
    if (filters?.bhk) params.bhk = filters.bhk;
    if (filters?.min_area) params.min_area = filters.min_area;
    if (filters?.max_area) params.max_area = filters.max_area;
    if (filters?.verified_only) params.verified_only = true;
    if (filters?.sort_by) params.sort_by = filters.sort_by;
    if (filters?.page) params.page = filters.page;
    if (filters?.page_size) params.page_size = filters.page_size;

    const response = await api.get('/properties/', { params });
    // DRF may return array directly or paginated structure
    if (Array.isArray(response.data)) {
      return {
        count: response.data.length,
        next: null,
        previous: null,
        results: response.data,
      };
    }
    if (response.data?.results) {
      return response.data;
    }
    if (response.data?.data) {
      return response.data.data;
    }
    return { count: 0, next: null, previous: null, results: [] };
  },

  async getPropertyById(id: string): Promise<ApiResponse<Property>> {
    const response = await api.get(`/properties/${id}/`);
    return response.data;
  },

  async createProperty(data: CreatePropertyInput): Promise<ApiResponse<Property>> {
    const response = await api.post('/properties/', data);
    return response.data;
  },

  async updateProperty(id: string, data: Partial<CreatePropertyInput>): Promise<ApiResponse<Property>> {
    const response = await api.patch(`/properties/${id}/`, data);
    return response.data;
  },

  async deleteProperty(id: string): Promise<ApiResponse<void>> {
    const response = await api.delete(`/properties/${id}/`);
    return response.data;
  },

  async uploadDocument(
    propertyId: string,
    file: File,
    documentType: string,
    title: string,
    sourceReference = ''
  ): Promise<ApiResponse<PropertyDocument>> {
    const formData = new FormData();
    formData.append('document_file', file);
    formData.append('document_type', documentType);
    formData.append('title', title);
    if (sourceReference) formData.append('source_reference', sourceReference);

    const response = await api.post(`/properties/${propertyId}/documents/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async uploadMedia(
    propertyId: string,
    file: File,
    mediaType: string = 'IMAGE',
    isFeatured: boolean = false
  ): Promise<ApiResponse<PropertyMedia>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('media_type', mediaType);
    formData.append('is_featured', String(isFeatured));

    const response = await api.post(`/properties/${propertyId}/media/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async submitVerification(propertyId: string): Promise<ApiResponse<{ message: string }>> {
    const response = await api.post(`/properties/${propertyId}/submit-verification/`);
    return response.data;
  },
};
