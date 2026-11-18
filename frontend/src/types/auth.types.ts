export type UserRole =
  | 'BUYER'
  | 'SELLER'
  | 'AGENT'
  | 'ADVOCATE'
  | 'BUILDER'
  | 'INVESTOR'
  | 'ADMIN'
  | 'NEGOTIATOR'
  | 'VERIFIER';

export interface UserProfile {
  id: string;
  avatar?: string;
  bio?: string;
  city: string;
  state: string;
  address?: string;
}

export interface User {
  id: string;
  email: string;
  phone: string;
  name: string;
  is_active: boolean;
  is_staff: boolean;
  is_verified: boolean;
  roles: UserRole[];
  profile?: UserProfile;
  created_at: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

export interface LoginRequest {
  email_or_phone: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  phone: string;
  password: string;
  password_confirm?: string;
  roles: UserRole[];
}

export interface OTPRequest {
  user_id: string;
  otp: string;
  purpose: 'REGISTRATION' | 'LOGIN' | 'RESET';
}

export interface PasswordResetRequest {
  email_or_phone: string;
}

export interface PasswordResetConfirmRequest {
  user_id: string;
  otp: string;
  new_password: string;
}

export interface KYCRecord {
  id: string;
  user_id: string;
  document_type: 'AADHAAR' | 'PAN' | 'PASSPORT' | 'VOTER_ID';
  document_number_masked?: string;
  status: 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';
  rejection_reason?: string;
  created_at: string;
}

export interface ProfessionalProfile {
  id: string;
  user_id: string;
  profession: 'AGENT' | 'ADVOCATE' | 'VERIFIER' | 'NEGOTIATOR';
  license_number?: string;
  agency_name?: string;
  years_experience?: number;
  is_verified: boolean;
}
