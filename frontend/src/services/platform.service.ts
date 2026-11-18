import { api } from '@/lib/api';
import type { ApiResponse } from '@/types/common.types';
import type { KYCRecord, User } from '@/types/auth.types';

export interface LocalityTrendItem {
  id: string;
  city: string;
  locality: string;
  average_price_sqft: string;
  quarter: string;
  year: number;
  growth_percentage: string;
}

export interface LocalityTrendsResponse {
  trends: LocalityTrendItem[];
  summary: {
    city: string;
    average_price_sqft: number;
    average_growth_percentage: number;
    total_localities: number;
  };
}

export interface PlatformStats {
  verified_properties_count: number;
  active_listings_count: number;
  registered_users_count: number;
  top_locality: string;
  top_locality_growth: number;
  top_locality_rate: number;
}

export interface NotificationRecord {
  id: string;
  title: string;
  body: string;
  notification_type: string;
  is_read: boolean;
  action_url: string;
  created_at: string;
}

export interface DashboardSummary {
  active_listings_count: number;
  pending_moderation_count: number;
  leads_count: number;
  visits_count: number;
  escrow_volume: number;
  deals_count: number;
  audited_passports_count: number;
  saved_favorites_count: number;
  active_offers_count: number;
  notifications: NotificationRecord[];
  spotlight_trend: LocalityTrendItem | null;
}

export interface LeadInteractionRecord {
  id: string;
  lead: string;
  logged_by: string;
  logged_by_name: string;
  interaction_type: 'CALL' | 'MEETING' | 'WHATSAPP' | 'EMAIL' | 'NOTE';
  summary: string;
  next_follow_up_at: string | null;
  created_at: string;
}

export interface LeadRecord {
  id: string;
  property: string | null;
  property_title: string;
  property_locality: string;
  buyer: string;
  buyer_name: string;
  buyer_email: string;
  buyer_phone: string;
  assigned_agent: string | null;
  assigned_agent_name?: string;
  status: string;
  status_display: string;
  source: string;
  inquiry_message: string;
  budget_min: string | null;
  budget_max: string | null;
  next_follow_up_at?: string | null;
  interactions?: LeadInteractionRecord[];
  created_at: string;
  updated_at: string;
}

export interface AgentOption {
  id: string;
  name: string;
  email: string;
  phone: string;
}

export interface SiteVisitRecord {
  id: string;
  property: string;
  property_title: string;
  property_locality: string;
  visitor: string;
  visitor_name: string;
  visitor_phone: string;
  host: string | null;
  host_name: string;
  scheduled_at: string;
  status: string;
  status_display: string;
  visitor_notes: string;
  feedback_rating: number | null;
  feedback_comments: string;
  created_at: string;
}

export interface OfferRecord {
  id: string;
  session: string;
  offered_by: string;
  offered_by_name: string;
  amount: string;
  terms: string;
  expires_at?: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COUNTERED' | 'EXPIRED';
  created_at: string;
}

export interface NegotiationSessionRecord {
  id: string;
  property: string;
  property_title: string;
  property_locality: string;
  property_price: string;
  buyer: string;
  buyer_name: string;
  seller: string;
  seller_name: string;
  status: 'ACTIVE' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
  status_display: string;
  current_offer_amount: string;
  offers: OfferRecord[];
  created_at: string;
  updated_at: string;
}

export interface PaymentRecord {
  id: string;
  transaction: string | null;
  payer: string;
  payer_name: string;
  amount: string;
  purpose: string;
  payment_method: string;
  invoice_number?: string;
  utr_number?: string;
  gateway_order_id: string;
  gateway_payment_id: string;
  status: string;
  status_display: string;
  verified_by_name?: string;
  verified_at?: string | null;
  receipt_url: string;
  created_at: string;
}

export interface LegalDeedRecord {
  id: string;
  transaction: string;
  property_title: string;
  deed_type: string;
  draft_content: string;
  is_signed: boolean;
  signed_document: string | null;
  created_at: string;
}

export interface TransactionTaskRecord {
  id: string;
  transaction: string;
  order_index: number;
  title: string;
  assigned_role: string;
  assigned_role_display: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED';
  status_display: string;
  due_date: string | null;
  completed_by_name: string;
  completed_at: string | null;
  notes: string;
}

export interface TransactionRecord {
  id: string;
  property: string;
  property_title: string;
  property_locality: string;
  buyer: string;
  buyer_name: string;
  seller: string;
  seller_name: string;
  final_sale_price: string;
  token_amount: string;
  advance_amount: string;
  status:
    | 'TOKEN_PENDING'
    | 'TOKEN_PAID'
    | 'AGREEMENT_DRAFTED'
    | 'ADVANCE_PAID'
    | 'REGISTRATION_SCHEDULED'
    | 'COMPLETED'
    | 'CANCELLED';
  status_display: string;
  sub_registrar_office?: string;
  deed_registration_number?: string;
  token_paid_at: string | null;
  agreement_signed_at: string | null;
  registration_date: string | null;
  handover_completed_at?: string | null;
  payments: PaymentRecord[];
  deeds: LegalDeedRecord[];
  tasks?: TransactionTaskRecord[];
  created_at: string;
  updated_at: string;
}

export interface VerificationItemRecord {
  id: string;
  tier: 'IDENTITY' | 'OWNERSHIP' | 'LEGAL' | 'PHYSICAL' | 'FINANCIAL';
  tier_display: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'VERIFIED' | 'FLAGGED' | 'REJECTED';
  status_display: string;
  authenticity_level?: string;
  authenticity_level_display?: string;
  source_authority?: string;
  source_reference?: string;
  verification_method?: string;
  retrieved_at?: string | null;
  freshness_expires_at?: string | null;
  risk_level?: string;
  verifier: string | null;
  verifier_name: string;
  notes: string;
  evidence_document: string | null;
  verified_at: string | null;
}

export interface GovernmentSourceInfo {
  authority: string;
  official_domain: string;
  official_portal_url: string;
  responsible_department: string;
  mapped_tier: string;
  reference_label: string;
  permitted_fields: string[];
  freshness_days: number;
  is_live_api_configured: boolean;
  integration_mode: string;
  status_note: string;
}

export interface GovernmentVerificationRecord {
  id: string;
  property: string;
  authority: string;
  authority_display: string;
  official_domain: string;
  responsible_department: string;
  integration_mode: string;
  integration_mode_display: string;
  reference_number: string;
  authenticity_level: string;
  authenticity_level_display: string;
  mapped_tier: string;
  verified_data_json: Record<string, unknown>;
  verified_by_name: string;
  retrieved_at: string;
  freshness_expires_at: string | null;
  notes: string;
}

export interface PropertyPassportRecord {
  id: string;
  property: string;
  property_title: string;
  property_locality: string;
  property_type_display: string;
  property_status: string;
  owner_name: string;
  overall_score: number;
  is_verified: boolean;
  authenticity_summary?: string;
  authenticity_summary_display?: string;
  risk_level?: string;
  identity_status: string;
  ownership_status: string;
  legal_status: string;
  physical_status: string;
  financial_status: string;
  last_verified_at: string | null;
  items: VerificationItemRecord[];
  government_checks?: GovernmentVerificationRecord[];
  updated_at: string;
}

export interface TitleSearchReportRecord {
  id: string;
  property: string;
  property_title: string;
  property_locality: string;
  advocate: string | null;
  advocate_name: string;
  search_period_years: number;
  khasra_details: string;
  encumbrances_found: string;
  legal_opinion: string;
  is_clear_title: boolean;
  report_file: string | null;
  created_at: string;
}

export interface ProjectUnitRecord {
  id: string;
  project: string;
  unit_number: string;
  tower_or_block: string;
  floor_number: number;
  configuration: string;
  carpet_area_sqft: string;
  base_price: string;
  status: 'AVAILABLE' | 'BOOKED' | 'SOLD';
  created_at: string;
}

export interface BuilderProjectRecord {
  id: string;
  builder: string;
  builder_name: string;
  builder_rera: string;
  name: string;
  locality: string;
  city: string;
  rera_registration_number: string;
  total_units: number;
  available_units: number;
  status: string;
  authenticity_level: string;
  units: ProjectUnitRecord[];
  created_at: string;
}

export interface InvestmentPoolRecord {
  id: string;
  property: string;
  property_title: string;
  property_locality: string;
  title: string;
  target_amount: string;
  raised_amount: string;
  minimum_investment: string;
  expected_roi_percentage: string;
  holding_period_months: number;
  status: string;
  created_at: string;
}

export interface AuditLogRecord {
  id: string;
  actor: string | null;
  actor_email: string;
  action: string;
  target_type: string;
  target_id: string;
  ip_address: string | null;
  metadata_json: Record<string, unknown>;
  created_at: string;
}

export const platformService = {
  // Analytics & Dashboard
  async getLocalityTrends(city = 'Indore'): Promise<LocalityTrendsResponse> {
    const { data } = await api.get<ApiResponse<LocalityTrendsResponse>>('/analytics/trends/', {
      params: { city },
    });
    return data.data;
  },

  async getPlatformStats(): Promise<PlatformStats> {
    const { data } = await api.get<ApiResponse<PlatformStats>>('/analytics/platform-stats/');
    return data.data;
  },

  async getDashboardSummary(): Promise<DashboardSummary> {
    const { data } = await api.get<ApiResponse<DashboardSummary>>('/analytics/dashboard-summary/');
    return data.data;
  },

  // Leads CRM
  async getLeads(status?: string): Promise<LeadRecord[]> {
    const { data } = await api.get<ApiResponse<LeadRecord[]>>('/leads/', {
      params: status ? { status } : {},
    });
    return data.data;
  },

  async getLeadAgents(): Promise<AgentOption[]> {
    const { data } = await api.get<ApiResponse<AgentOption[]>>('/leads/agents/');
    return data.data;
  },

  async createLead(input: {
    property: string;
    inquiry_message: string;
    budget_min?: string | number;
    budget_max?: string | number;
  }): Promise<LeadRecord> {
    const { data } = await api.post<ApiResponse<LeadRecord>>('/leads/', input);
    return data.data;
  },

  async updateLead(
    id: string,
    input: { status?: string; assigned_agent?: string | null }
  ): Promise<LeadRecord> {
    const { data } = await api.patch<ApiResponse<LeadRecord>>(`/leads/${id}/`, input);
    return data.data;
  },

  async addLeadInteraction(
    leadId: string,
    input: { interaction_type: string; summary: string; next_follow_up_at?: string }
  ): Promise<LeadInteractionRecord> {
    const { data } = await api.post<ApiResponse<LeadInteractionRecord>>(
      `/leads/${leadId}/interactions/`,
      input
    );
    return data.data;
  },

  // Site Visits
  async getVisits(): Promise<SiteVisitRecord[]> {
    const { data } = await api.get<ApiResponse<SiteVisitRecord[]>>('/visits/');
    return data.data;
  },

  async scheduleVisit(input: {
    property: string;
    scheduled_at: string;
    visitor_notes?: string;
  }): Promise<SiteVisitRecord> {
    const { data } = await api.post<ApiResponse<SiteVisitRecord>>('/visits/', input);
    return data.data;
  },

  async updateVisit(
    id: string,
    input: {
      status?: string;
      scheduled_at?: string;
      visitor_notes?: string;
      feedback_rating?: number;
      feedback_comments?: string;
    }
  ): Promise<SiteVisitRecord> {
    const { data } = await api.patch<ApiResponse<SiteVisitRecord>>(`/visits/${id}/`, input);
    return data.data;
  },

  // Negotiations
  async getNegotiations(): Promise<NegotiationSessionRecord[]> {
    const { data } = await api.get<ApiResponse<NegotiationSessionRecord[]>>('/negotiations/');
    return data.data;
  },

  async startNegotiation(input: {
    property_id: string;
    amount: string | number;
    terms?: string;
  }): Promise<NegotiationSessionRecord> {
    const { data } = await api.post<ApiResponse<NegotiationSessionRecord>>('/negotiations/', input);
    return data.data;
  },

  async counterOffer(
    sessionId: string,
    input: { amount: string | number; terms?: string }
  ): Promise<NegotiationSessionRecord> {
    const { data } = await api.post<ApiResponse<NegotiationSessionRecord>>(
      `/negotiations/${sessionId}/counter/`,
      input
    );
    return data.data;
  },

  async respondOffer(
    sessionId: string,
    decision: 'accept' | 'reject'
  ): Promise<NegotiationSessionRecord> {
    const { data } = await api.post<ApiResponse<NegotiationSessionRecord>>(
      `/negotiations/${sessionId}/respond/`,
      { decision }
    );
    return data.data;
  },

  // Escrow Transactions & Tasks
  async getTransactions(): Promise<TransactionRecord[]> {
    const { data } = await api.get<ApiResponse<TransactionRecord[]>>('/transactions/');
    return data.data;
  },

  async advanceTransactionMilestone(
    id: string,
    action:
      | 'PAY_TOKEN'
      | 'DRAFT_AGREEMENT'
      | 'PAY_ADVANCE'
      | 'SCHEDULE_REGISTRY'
      | 'COMPLETE_REGISTRY',
    payload: Record<string, unknown> = {}
  ): Promise<TransactionRecord> {
    const { data } = await api.post<ApiResponse<TransactionRecord>>(
      `/transactions/${id}/milestone/`,
      { action, ...payload }
    );
    return data.data;
  },

  async updateTransactionTask(
    transactionId: string,
    taskId: string,
    input: { status: string; notes?: string }
  ): Promise<TransactionTaskRecord> {
    const { data } = await api.patch<ApiResponse<TransactionTaskRecord>>(
      `/transactions/${transactionId}/tasks/${taskId}/`,
      input
    );
    return data.data;
  },

  // Verification, Government Sources & Legal
  async getVerificationQueue(): Promise<PropertyPassportRecord[]> {
    const { data } = await api.get<ApiResponse<PropertyPassportRecord[]>>('/verification/queue/');
    return data.data;
  },

  async getGovernmentSources(): Promise<GovernmentSourceInfo[]> {
    const { data } = await api.get<ApiResponse<GovernmentSourceInfo[]>>(
      '/verification/government-sources/'
    );
    return data.data;
  },

  async recordGovernmentCheck(
    propertyId: string,
    input: {
      authority: string;
      reference_number: string;
      notes?: string;
      is_verified?: boolean;
      has_signed_gov_certificate?: boolean;
      metadata?: Record<string, unknown>;
    }
  ): Promise<GovernmentVerificationRecord> {
    const { data } = await api.post<ApiResponse<GovernmentVerificationRecord>>(
      `/verification/properties/${propertyId}/government-checks/`,
      input
    );
    return data.data;
  },

  async getPropertyPassport(propertyId: string): Promise<PropertyPassportRecord> {
    const { data } = await api.get<ApiResponse<PropertyPassportRecord>>(
      `/verification/properties/${propertyId}/passport/`
    );
    return data.data;
  },

  async verifyTier(
    propertyId: string,
    input: {
      tier: string;
      status: string;
      notes?: string;
      authenticity_level?: string;
      source_authority?: string;
      source_reference?: string;
      verification_method?: string;
    }
  ): Promise<PropertyPassportRecord> {
    const { data } = await api.post<ApiResponse<PropertyPassportRecord>>(
      `/verification/properties/${propertyId}/verify-tier/`,
      input
    );
    return data.data;
  },

  async getTitleReports(propertyId?: string): Promise<TitleSearchReportRecord[]> {
    const { data } = await api.get<ApiResponse<TitleSearchReportRecord[]>>('/legal/title-reports/', {
      params: propertyId ? { property_id: propertyId } : {},
    });
    return data.data;
  },

  async createTitleReport(input: {
    property: string;
    search_period_years: number;
    khasra_details: string;
    encumbrances_found: string;
    legal_opinion: string;
    is_clear_title: boolean;
  }): Promise<TitleSearchReportRecord> {
    const { data } = await api.post<ApiResponse<TitleSearchReportRecord>>(
      '/legal/title-reports/',
      input
    );
    return data.data;
  },

  // Builders & Investments
  async getBuilderProjects(): Promise<BuilderProjectRecord[]> {
    const { data } = await api.get<ApiResponse<BuilderProjectRecord[]>>('/builders/projects/');
    return data.data;
  },

  async createBuilderProject(input: {
    name: string;
    locality: string;
    rera_registration_number: string;
    total_units: number;
    available_units: number;
    status: string;
  }): Promise<BuilderProjectRecord> {
    const { data } = await api.post<ApiResponse<BuilderProjectRecord>>('/builders/projects/', input);
    return data.data;
  },

  async getInvestmentPools(): Promise<InvestmentPoolRecord[]> {
    const { data } = await api.get<ApiResponse<InvestmentPoolRecord[]>>('/investments/pools/');
    return data.data;
  },

  async contributeToPool(poolId: string, amount: string | number): Promise<void> {
    await api.post(`/investments/pools/${poolId}/contribute/`, { amount });
  },

  // Admin KYC & Audit Logs
  async getAdminKYCQueue(): Promise<(KYCRecord & { user_name?: string; user_email?: string })[]> {
    const { data } = await api.get<
      ApiResponse<(KYCRecord & { user_name?: string; user_email?: string })[]>
    >('/users/kyc/queue/');
    return data.data;
  },

  async reviewKYC(
    kycId: string,
    decision: 'approve' | 'reject',
    rejection_reason = ''
  ): Promise<KYCRecord> {
    const { data } = await api.post<ApiResponse<KYCRecord>>(`/users/kyc/${kycId}/review/`, {
      decision,
      rejection_reason,
    });
    return data.data;
  },

  async getAdminUsers(): Promise<User[]> {
    const { data } = await api.get<ApiResponse<User[]>>('/users/admin/list/');
    return data.data;
  },

  async getAdminAuditLogs(): Promise<AuditLogRecord[]> {
    const { data } = await api.get<ApiResponse<AuditLogRecord[]>>('/users/audit-logs/');
    return data.data;
  },

  // Notifications
  async markAllNotificationsRead(): Promise<void> {
    await api.patch('/communications/notifications/');
  },
};
