/**
 * Listing types — mirror backend/apps/listings/serializers.py exactly.
 */

export type ListingType = 'SALE' | 'RENT' | 'LEASE';

export type ListingStatus =
  | 'PENDING_APPROVAL'
  | 'ACTIVE'
  | 'PAUSED'
  | 'EXPIRED'
  | 'SOLD'
  | 'REJECTED'
  | 'WITHDRAWN';

export type ListingReportReason =
  | 'FRAUD'
  | 'FAKE_PHOTOS'
  | 'WRONG_PRICE'
  | 'ALREADY_SOLD'
  | 'NOT_OWNER'
  | 'DUPLICATE'
  | 'OTHER';

export interface ListingMedia {
  id: string;
  url: string;
  caption: string;
  display_order: number;
  is_primary: boolean;
  width: number;
  height: number;
  created_at: string;
}

/** Privacy-safe property summary (no address, documents, owners or exact GPS). */
export interface ListingPropertySummary {
  id: string;
  title: string;
  description: string;
  property_type: string;
  property_type_display: string;
  locality: string;
  city: string;
  state: string;
  pincode: string;
  built_up_area: string | null;
  carpet_area: string | null;
  plot_area: string | null;
  bedrooms: number;
  bathrooms: number;
  parking_count: number;
  construction_year: number | null;
  property_condition: string;
  property_condition_display: string;
  is_verified: boolean;
  approx_latitude: number | null;
  approx_longitude: number | null;
}

export interface Listing {
  id: string;
  property: string;
  property_summary: ListingPropertySummary;
  listed_by_name: string;
  listing_type: ListingType;
  listing_type_display: string;
  status: ListingStatus;
  status_display: string;
  asking_price: string;
  security_deposit: string;
  maintenance_charges: string;
  is_negotiable: boolean;
  is_featured: boolean;
  available_from: string;
  rera_number: string;
  published_at: string | null;
  expires_at: string | null;
  views_count: number;
  media: ListingMedia[];
  primary_image: string | null;
  is_owner: boolean;
  created_at: string;
  updated_at: string;
  /** Present only for the lister / staff */
  rejection_reason?: string;
  reviewed_at?: string | null;
  report_count?: number;
}

export interface ListingFilters {
  listing_type?: ListingType | '';
  locality?: string;
  property_type?: string;
  min_price?: number | '';
  max_price?: number | '';
  bedrooms?: number | '';
  verified_only?: boolean;
  search?: string;
  sort_by?: 'newest' | 'price_asc' | 'price_desc' | 'most_viewed';
  page?: number;
  page_size?: number;
}

export interface ListingCreateInput {
  property: string;
  listing_type: ListingType;
  asking_price: string;
  security_deposit?: string;
  maintenance_charges?: string;
  is_negotiable?: boolean;
  available_from?: string;
  rera_number?: string;
}

export type ListingUpdateInput = Partial<Omit<ListingCreateInput, 'property' | 'listing_type'>>;

export interface Pagination {
  total_count: number;
  page: number;
  page_size: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface PaginatedListings {
  data: Listing[];
  pagination: Pagination;
}

export interface OwnedPropertyOption {
  id: string;
  title: string;
  property_type: string;
  property_type_display: string;
  locality: string;
  city: string;
  status: string;
}

export interface Lead {
  id: string;
  property_id: string;
  property_title: string;
  buyer_name: string;
  buyer_phone: string;
  buyer_email: string;
  message?: string;
  status: 'NEW' | 'CONTACTED' | 'VISIT_SCHEDULED' | 'NEGOTIATION' | 'CLOSED' | 'DROPPED';
  created_at: string;
}

export interface Visit {
  id: string;
  property_id: string;
  property_title: string;
  visitor_name: string;
  visitor_phone: string;
  scheduled_at: string;
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  feedback?: string;
}
