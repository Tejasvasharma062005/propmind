export interface PropertyTypeConfig {
  value: string;
  label: string;
  icon: string;
  description: string;
}

export const PROPERTY_TYPES: PropertyTypeConfig[] = [
  { value: 'APARTMENT', label: 'Apartment / Flat', icon: 'Building2', description: 'Multistory residential apartment or flat' },
  { value: 'INDEPENDENT_HOUSE', label: 'Independent House / Villa', icon: 'Home', description: 'Standalone house, villa, or kothi' },
  { value: 'PLOT', label: 'Residential Plot / Land', icon: 'LandPlot', description: 'Approved vacant residential plot ready for construction' },
  { value: 'COMMERCIAL_OFFICE', label: 'Commercial Office', icon: 'Briefcase', description: 'Office space in tech park or business center' },
  { value: 'COMMERCIAL_SHOP', label: 'Commercial Shop / Showroom', icon: 'Store', description: 'Retail shop or high-street showroom' },
  { value: 'AGRICULTURAL_LAND', label: 'Agricultural Land', icon: 'Trees', description: 'Farmhouse land or agricultural parcel' },
  { value: 'PENTHOUSE', label: 'Penthouse', icon: 'Crown', description: 'Luxury top-floor unit with private terrace' },
];

export interface RoleConfig {
  value: string;
  label: string;
  description: string;
  icon: string;
}

export const ROLES: RoleConfig[] = [
  { value: 'BUYER', label: 'Property Buyer', description: 'Looking to purchase residential or commercial properties', icon: 'UserCheck' },
  { value: 'SELLER', label: 'Property Owner / Seller', description: 'Wanting to list and sell properties securely with PropMind', icon: 'Building' },
  { value: 'AGENT', label: 'Channel Partner / Broker', description: 'Verified RERA agent facilitating deals and client visits', icon: 'Briefcase' },
  { value: 'ADVOCATE', label: 'Legal Advocate', description: 'Legal specialist verifying title deeds and encumbrances', icon: 'Scale' },
  { value: 'BUILDER', label: 'Builder / Developer', description: 'Promoting new residential schemes and township projects', icon: 'HardHat' },
  { value: 'INVESTOR', label: 'Real Estate Investor', description: 'Seeking high-yield commercial or land investments', icon: 'TrendingUp' },
];

export interface ListingStatusConfig {
  value: string;
  label: string;
  badgeClass: string;
  dotColor: string;
}

export const LISTING_STATUSES: Record<string, ListingStatusConfig> = {
  DRAFT: { value: 'DRAFT', label: 'Draft', badgeClass: 'bg-slate-100 text-slate-700 border-slate-300', dotColor: 'bg-slate-400' },
  VERIFICATION_PENDING: { value: 'VERIFICATION_PENDING', label: 'Verification In-Progress', badgeClass: 'bg-amber-100 text-amber-800 border-amber-300', dotColor: 'bg-amber-500' },
  VERIFIED_ACTIVE: { value: 'VERIFIED_ACTIVE', label: 'PropMind Verified', badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300', dotColor: 'bg-emerald-500' },
  ACTIVE: { value: 'ACTIVE', label: 'Active', badgeClass: 'bg-blue-100 text-blue-800 border-blue-300', dotColor: 'bg-blue-500' },
  UNDER_OFFER: { value: 'UNDER_OFFER', label: 'Offer Received', badgeClass: 'bg-purple-100 text-purple-800 border-purple-300', dotColor: 'bg-purple-500' },
  IN_ESCROW: { value: 'IN_ESCROW', label: 'Transaction In-Escrow', badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-300', dotColor: 'bg-indigo-500' },
  SOLD: { value: 'SOLD', label: 'Sold Out', badgeClass: 'bg-rose-100 text-rose-800 border-rose-300', dotColor: 'bg-rose-500' },
};

export const INDORE_LOCALITIES: string[] = [
  'Vijay Nagar',
  'Palasia (Old & New)',
  'AB Road',
  'Scheme 54',
  'Scheme 78',
  'Super Corridor',
  'Bypass Road',
  'Nipania',
  'Mahalaxmi Nagar',
  'Rau / Silicon City',
  'Bhawarkua',
  'Rajendra Nagar',
  'Bengali Square',
  'Annapurna Road',
  'Sudama Nagar',
  'Kanadia Road',
  'Khandwa Road',
  'MR 10 Road',
  'Bicholi Mardana',
  'Tilak Nagar',
  'Geeta Bhawan',
  'Pipliyahana',
  'Ujjain Road',
  'Pithampur SEZ Corridor',
];

export const INDIAN_STATES: string[] = [
  'Madhya Pradesh',
  'Maharashtra',
  'Delhi',
  'Gujarat',
  'Karnataka',
  'Rajasthan',
  'Uttar Pradesh',
  'Telangana',
  'Tamil Nadu',
  'Haryana',
  'Punjab',
  'Chhattisgarh',
  'Goa',
  'West Bengal',
];

export const BHK_OPTIONS = [
  { value: 1, label: '1 BHK' },
  { value: 2, label: '2 BHK' },
  { value: 3, label: '3 BHK' },
  { value: 4, label: '4 BHK' },
  { value: 5, label: '5+ BHK' },
];

export const AMENITIES_LIST = [
  'Gated Security & CCTV',
  'Reserved Car Parking',
  'Power Backup (100%)',
  'Clubhouse & Gym',
  'Swimming Pool',
  'Children Play Area',
  'Lush Landscaped Garden',
  'Elevator / Lift',
  'Intercom Facility',
  'Rainwater Harvesting',
  'Solar Water Heating',
  'EV Charging Station',
  'Vastu Compliant',
];
