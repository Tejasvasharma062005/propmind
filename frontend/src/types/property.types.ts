export type PropertyType =
  | 'APARTMENT'
  | 'INDEPENDENT_HOUSE'
  | 'PLOT'
  | 'COMMERCIAL_OFFICE'
  | 'COMMERCIAL_SHOP'
  | 'AGRICULTURAL_LAND'
  | 'PENTHOUSE';

export type PropertyStatus =
  | 'DRAFT'
  | 'VERIFICATION_PENDING'
  | 'VERIFIED_ACTIVE'
  | 'ACTIVE'
  | 'UNDER_OFFER'
  | 'IN_ESCROW'
  | 'SOLD';

export interface PropertyMedia {
  id: string;
  property_id: string;
  media_type: 'IMAGE' | 'VIDEO' | 'FLOOR_PLAN' | 'VIRTUAL_TOUR';
  url: string;
  thumbnail_url?: string;
  caption?: string;
  is_featured: boolean;
  order: number;
}

export interface PropertyDocument {
  id: string;
  property_id: string;
  document_type: 'REGISTRY' | 'KHASRA_KHATONI' | 'NOC' | 'BUILDING_PERMISSION' | 'TAX_RECEIPT' | 'RERA_CERTIFICATE';
  title: string;
  file_url: string;
  is_verified: boolean;
  verified_at?: string;
  verifier_remarks?: string;
}

export interface PropertyOwner {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  ownership_percentage: number;
  is_primary: boolean;
}

export interface VerificationCategoryScore {
  name: 'Identity' | 'Ownership' | 'Legal' | 'Physical' | 'Financial';
  score: number; // 0-100
  status: 'VERIFIED' | 'PENDING' | 'FLAGGED';
  details: string[];
  verifier_name?: string;
}

export interface PropertyPassport {
  id: string;
  property_id: string;
  overall_score: number; // e.g. 96
  status: 'GREEN' | 'AMBER' | 'RED';
  categories: VerificationCategoryScore[];
  last_verified_on: string;
  certificate_url?: string;
}

export interface Property {
  id: string;
  title: string;
  description: string;
  property_type: PropertyType;
  status: PropertyStatus;
  price: number;
  maintenance_charge?: number;
  
  // Dimensions & Configuration
  carpet_area_sqft: number;
  super_builtup_area_sqft?: number;
  plot_area_sqft?: number;
  bhk_count?: number;
  bathrooms?: number;
  balconies?: number;
  floor_number?: number;
  total_floors?: number;
  furnishing_status?: 'UNFURNISHED' | 'SEMI_FURNISHED' | 'FULLY_FURNISHED';
  facing?: 'NORTH' | 'SOUTH' | 'EAST' | 'WEST' | 'NORTH_EAST' | 'NORTH_WEST';
  property_age_years?: number;

  // Location (Indore Centric)
  address: string;
  locality: string;
  city: string;
  state: string;
  pincode: string;
  latitude?: number;
  longitude?: number;
  landmark?: string;

  // Verification & Media
  is_verified: boolean;
  passport?: PropertyPassport;
  media: PropertyMedia[];
  documents?: PropertyDocument[];
  owners?: PropertyOwner[];
  amenities: string[];

  // Meta
  created_at: string;
  updated_at: string;
}

export interface PropertyFilters {
  search?: string;
  locality?: string;
  property_type?: PropertyType | '';
  min_price?: number;
  max_price?: number;
  bhk?: number | '';
  min_area?: number;
  max_area?: number;
  verified_only?: boolean;
  sort_by?: 'price_asc' | 'price_desc' | 'created_at_desc' | 'verification_score';
  page?: number;
  page_size?: number;
}

export interface CreatePropertyInput {
  title: string;
  description: string;
  property_type: PropertyType;
  price: number;
  carpet_area_sqft: number;
  super_builtup_area_sqft?: number;
  bhk_count?: number;
  bathrooms?: number;
  balconies?: number;
  floor_number?: number;
  total_floors?: number;
  furnishing_status?: 'UNFURNISHED' | 'SEMI_FURNISHED' | 'FULLY_FURNISHED';
  address: string;
  locality: string;
  city: string;
  state: string;
  pincode: string;
  amenities: string[];
  documents?: File[];
}
