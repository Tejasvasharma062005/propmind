# IMPLEMENTATION ROADMAP — PropVault Transformation Plan

**Audit Date:** 2026-11-18  
**Methodology:** Incremental, test-driven vertical slices (Part 11: Audit → Present → Plan → Preserve & Improve → Implement Incrementally → Integrate → Test → Production Readiness).

---

## Phase 1: Security, RBAC/ABAC Hardening & Immutable Audit Logging (Highest Priority / Risk Reduction)
1. **Immutable Audit Trail & Fraud Module**:
   - Add `AuditLog` model in `common` (actor, action, entity_type, entity_id, ip_address, payload_snapshot, created_at) and `AuditService.log(...)`.
   - Hook `AuditService.log` into all sensitive operations (login, role assignment, KYC review, passport verification, listing moderation, offer acceptance, escrow payment & milestone updates).
2. **Fix Critical Privacy & Auth Findings (`SEC-01`, `SEC-03`, `SEC-05`, `SEC-07`)**:
   - Split `PropertySerializer` so public callers (`AllowAny`) never receive `PropertyDocument` file URLs or `PropertyOwner` email/phone PII; only the property owner, assigned advocate/verifier, admin, or buyer in an active `Transaction` for that property can access legal documents.
   - Gate `dev_otp` strictly behind `settings.DEBUG` and add rate limiting (`ScopedRateThrottle`) on `/api/v1/auth/login/`, `/api/v1/auth/register/`, `/api/v1/auth/verify-otp/`, and `/api/v1/users/kyc/submit/`.
   - Fix `OTPPurpose` mismatch (`RESET_PASSWORD`) between frontend and backend.
   - Apply randomized UUID storage paths and SHA-256 checksums to `PropertyDocument`, `KYCRecord`, `VerificationItem`, and `TitleSearchReport`.
3. **Complete Admin KYC Review & Professional Profiles**:
   - Add `GET /api/v1/users/kyc/queue/` and `POST /api/v1/users/kyc/<id>/review/` (Approve/Reject KYC, setting `User.is_verified = True` and updating the user's properties' `IDENTITY` passport tier).
   - Add `GET/POST /api/v1/users/professional-profile/` for Advocates, Agents, Verifiers, and Negotiators.

---

## Phase 2: Government Integration Layer & Authentic Provenance Engine (Part 5 & Module 16)
1. **Data Authenticity & Provenance Taxonomy**:
   - Add `AuthenticityLevel` choices (`GOVERNMENT_VERIFIED`, `THIRD_PARTY_VERIFIED`, `PLATFORM_VERIFIED`, `USER_SUBMITTED`, `VERIFICATION_PENDING`, `UNABLE_TO_VERIFY`) to `common/constants/choices.py`.
   - Extend `VerificationItem` and `PropertyDocument` with provenance fields: `authenticity_level`, `source_authority`, `source_reference_number`, `verification_method`, `retrieved_at`, `freshness_expires_at`, and `risk_level`.
2. **Government Integration Module (`apps/government/` or `apps/verification/government_adapters.py`)**:
   - Implement clean adapter classes (`GovernmentSourceAdapter` interface) for:
     - `MPBhulekhAdapter` (`mpbhulekh.gov.in` — Khasra / B1 Khatauni / Tehsil / Village)
     - `MPReraAdapter` (`rera.mp.gov.in` — Project & Agent RERA registration verification)
     - `MPIGRSSampadaAdapter` (`mpigr.gov.in` — Sub-Registrar deed & guideline verification)
     - `IMCPropertyTaxAdapter` (`imcindore.mp.gov.in` — IMC Property ID & tax clearance NOC)
     - `IDASchemeAdapter` (`idaindore.org` — IDA scheme allotment & lease/freehold status)
     - `MPTNCPAdapter` (`mptownplan.gov.in` — T&CP layout sanction & land-use verification)
   - Store every check in `GovernmentVerificationRecord` with explicit `integration_mode` (`LIVE_AUTHORIZED_API` vs `PENDING_AUTHORIZATION_MANUAL_AUDIT`), official portal URL, reference number, timestamp, and reviewer.
   - Update `seed_indore.py` and the frontend (`PropertyPassport.tsx`, `VerificationPage.tsx`) so provenance badges accurately reflect *Platform Verified (Manual Audit against Official Reference)* vs *User Submitted* vs *Verification Pending*, never fabricating live government API responses.

---

## Phase 3: Fix Property Creation Contract, Document Vault & Geographic/Map Discovery (Modules 2, 5, 10)
1. **Fix `CreatePropertyPage.tsx` ↔ Backend Contract**:
   - Align `CreatePropertyPage.tsx` and `PropertyCreateUpdateSerializer` field names (`built_up_area`, `carpet_area`, `bedrooms`, `property_type` enums, `amenities_list`) and GPS coordinates (`latitude`, `longitude`).
   - Connect Step 4 of `CreatePropertyPage.tsx` to upload real `PropertyDocument` files (`SALE_DEED`, `KHASRA_KHATONI`, `TAX_RECEIPT`, `RERA_REGISTRATION`) via `/api/v1/properties/<id>/documents/` (fixing `file` vs `document_file` field name in `property.service.ts`) and initiate the verification case.
2. **Geographic Search & Map Discovery + Saved Searches/Favorites**:
   - Add spatial bounding-box (`min_lat`, `max_lat`, `min_lng`, `max_lng`) and radius (`lat`, `lng`, `radius_km`) filtering on `/api/v1/listings/` and `/api/v1/properties/`.
   - Add an interactive Map View toggle on `BrowseListingsPage.tsx` and connect Favorite (`UserFavorite`) & Save Search (`SavedSearch`) buttons to `/api/v1/discovery/`.

---

## Phase 4: End-to-End CRM, Site Visits, Negotiations, Transaction Room & Verified Payments (Modules 6–11 & Part 9)
1. **Leads CRM & Site Visits Completion**:
   - Add `LeadInteraction` follow-up notes and `assigned_agent` assignment in `apps.leads` + `LeadsPage.tsx`.
   - Add Reschedule modal and Post-Visit Feedback Rating (1–5 stars + comments) in `VisitsPage.tsx`.
2. **Offer Expiration & Transaction Room**:
   - Add `expires_at` on `Offer` and prevent accepting expired offers.
   - Add `TransactionTask` checklist items, `assigned_advocate`, `assigned_agent`, `sub_registrar_office`, and `deed_registration_number` to `Transaction`.
3. **Two-Step Payment Order & Escrow Verification (`SEC-02`)**:
   - Replace instant simulated `PaymentStatus.SUCCESS` with a real 2-step flow:
     - Step A: Buyer initiates payment order (`POST /api/v1/payments/orders/`) → creates `Payment` in `INITIATED` (with Razorpay Order API integration when `RAZORPAY_KEY_ID` is configured, or bank escrow NEFT/RTGS UTR submission in `PENDING_VERIFICATION`).
     - Step B: Payment transitions to `SUCCESS` (and unlocks `TOKEN_PAID` / `ADVANCE_PAID`) only upon valid Razorpay HMAC-SHA256 signature verification (`POST /api/v1/payments/verify-signature/`) or Admin/Escrow Officer UTR reconciliation (`POST /api/v1/payments/<id>/reconcile/`).
   - Require Sub-Registrar Deed Number and party/advocate confirmation before `COMPLETE_REGISTRY` marks the transaction `COMPLETED` and transfers property status to `SOLD`.

---

## Phase 5: Builder Operations, Investments, Admin Oversight & Full Automated Test Suite (Modules 12, 14, 15, 17 & Part 10)
1. **Builder & Investor Modules**:
   - Add CRUD endpoints for `BuilderProfile`, `Project`, `ProjectUnit`, `InvestmentPool`, and `InvestorContribution`, plus dashboard views for Builders and Investors.
2. **Admin User/KYC/Audit Oversight & Operational Analytics**:
   - Add Admin User, KYC Approval, Fraud Report Resolution, and Audit Log view in the dashboard, plus live database funnel metrics on `AnalyticsPage.tsx`.
3. **Comprehensive Automated Testing & `TEST_EXECUTION_REPORT.md`**:
   - Expand backend tests across all 16 apps (unit, API, RBAC/ABAC negative tests, full 24-step Seller→Verification→Listing→Buyer→Lead→Visit→Negotiation→Transaction Room→Payment→Handover workflow).
   - Add frontend component & workflow tests with Vitest, execute all suites, and generate `TEST_EXECUTION_REPORT.md`.
