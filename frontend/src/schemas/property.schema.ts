import { z } from 'zod';

export const propertyStep1TypeSchema = z.object({
  property_type: z.enum(
    [
      'APARTMENT',
      'INDEPENDENT_HOUSE',
      'PLOT',
      'COMMERCIAL_OFFICE',
      'COMMERCIAL_SHOP',
      'AGRICULTURAL_LAND',
      'PENTHOUSE',
    ],
    { message: 'Please select a valid property type' }
  ),
});

export const propertyStep2LocationSchema = z.object({
  address: z.string().min(5, 'Address must be at least 5 characters'),
  locality: z.string().min(2, 'Locality is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  pincode: z.string().regex(/^[1-9][0-9]{5}$/, 'Enter a valid 6-digit Indian PIN code'),
  landmark: z.string().optional(),
});

export const propertyStep3DetailsSchema = z.object({
  title: z.string().min(10, 'Title must be at least 10 characters'),
  description: z.string().min(30, 'Provide a helpful description of at least 30 characters'),
  price: z.coerce.number().positive('Price must be greater than 0'),
  carpet_area_sqft: z.coerce.number().positive('Carpet area is required'),
  super_builtup_area_sqft: z.coerce.number().optional(),
  bhk_count: z.coerce.number().min(0).max(10).optional(),
  bathrooms: z.coerce.number().min(0).max(10).optional(),
  balconies: z.coerce.number().min(0).max(10).optional(),
  floor_number: z.coerce.number().optional(),
  total_floors: z.coerce.number().optional(),
  furnishing_status: z
    .enum(['UNFURNISHED', 'SEMI_FURNISHED', 'FULLY_FURNISHED'])
    .optional(),
  facing: z
    .enum(['NORTH', 'SOUTH', 'EAST', 'WEST', 'NORTH_EAST', 'NORTH_WEST'])
    .optional(),
  property_age_years: z.coerce.number().min(0).optional(),
});

export const propertyStep4MediaDocsSchema = z.object({
  amenities: z.array(z.string()),
});

export const fullPropertyCreateSchema = propertyStep1TypeSchema
  .merge(propertyStep2LocationSchema)
  .merge(propertyStep3DetailsSchema)
  .merge(propertyStep4MediaDocsSchema);

export type FullPropertyCreateFormData = z.infer<typeof fullPropertyCreateSchema>;
