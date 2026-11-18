# TEST EXECUTION REPORT — PropVault Real Estate Operations Platform

**Execution Date:** 2026-11-18  
**Test Environment:** Python 3.12.9 (`Django 5.0.8`, `djangorestframework 3.15.2`, `config.settings.testing` with in-memory storage & SQLite) + Node.js (`TypeScript 7.0`, `Vite 8.3.8`, `React 19.3`).

---

## 1. Execution Summary

| Metric | Count / Result |
|---|---|
| **Total Backend Automated Test Cases Executed** | **39** |
| **Passed Tests** | **39** |
| **Failed Tests** | **0** |
| **Skipped Tests** | **0** |
| **Backend Test Suite Execution Duration** | **2.819s** (`Ran 39 tests in 2.819s — OK`) |
| **Django System & Migration Drift Check** | **0 issues** (`manage.py check` & `makemigrations --check --dry-run`) |
| **Frontend TypeScript + Production Bundle Build** | **PASSED** (`tsc -b && vite build` — 2,353 modules transformed, Exit Code 0) |

---

## 2. Executed Test Breakdown by Module & Category

### A. Identity, Authentication, RBAC & KYC (`apps.accounts`, `apps.users`, `apps.analytics`)
1. `test_register_user` — Multi-role user registration (`BUYER`, `SELLER`, etc.) and OTP creation.
2. `test_login_user` — Credential verification, JWT token pair issuance, and `LoginSession` tracking.
3. `test_sec03_dev_otp_hidden_when_debug_false` — Verifies that `dev_otp` is stripped from registration responses when `DEBUG=False`.
4. `test_get_current_user_profile` — Authenticated `/api/v1/users/me/` hydration.
5. `test_update_user_profile` — Profile and display name update with `AuditLog` recording.

### B. Property Registry, Document Vault & Privacy Redaction (`apps.properties`, `apps.analytics`)
6. `test_create_property` — Property asset creation and primary `PropertyOwner` initialization.
7. `test_list_properties` — Public catalog query and pagination.
8. `test_sec01_public_property_detail_redacts_documents_and_owner_pii` — Verifies that unauthenticated callers to `GET /api/v1/properties/<id>/` cannot read `document_file` download URLs, owner emails/phones, or exact door/plot numbers, while authorized advocates/owners receive full access.
9. `test_frontend_wizard_property_creation_and_document_review` — Tests creating a property using frontend wizard field aliases (`carpet_area_sqft`, `super_builtup_area_sqft`, `bhk_count`, `amenities`, `COMMERCIAL_SHOP` → `SHOP`), uploading a legal deed (`KHASRA_KHATONI`) with randomized UUID storage key and SHA-256 hash, and Advocate review/approval (`review_status = APPROVED`, `authenticity_level = PLATFORM_VERIFIED`).

### C. Marketplace Listings, Moderation Gate & Media Security (`apps.listings` — 23 Tests)
10. `test_new_listing_enters_moderation_and_is_hidden` — New listings start in `PENDING_APPROVAL` and are hidden from public search/detail.
11. `test_unverified_user_cannot_list` — Unverified users receive HTTP 403.
12. `test_cannot_list_someone_elses_property` — Non-owners receive HTTP 403.
13. `test_duplicate_live_listing_blocked` — Conditional unique constraint returns HTTP 422 on duplicate live listing.
14. `test_can_relist_after_previous_listing_closed` — Relisting succeeds after a prior listing is marked `SOLD`.
15. `test_client_cannot_set_featured_or_status` — Mass-assignment protection for `is_featured` and `status`.
16. `test_deposit_rejected_for_sale` — Security deposit validation on `SALE` listings.
17. `test_non_admin_cannot_moderate` — Non-admin moderation attempt returns HTTP 403.
18. `test_approval_requires_photo` — Approving a listing without photos returns HTTP 422.
19. `test_approved_listing_is_public_with_expiry` — Approval sets `ACTIVE`, `published_at`, and 90-day `expires_at`.
20. `test_reject_requires_reason_and_edit_resubmits` — Rejection requires reason; owner edit resubmits to `PENDING_APPROVAL`.
21. `test_expired_listing_hidden` — Expired listings are automatically excluded from public queries.
22. `test_public_payload_hides_sensitive_data` — Public listing serializer hides exact street address, legal documents, owner PII, and rounds GPS coordinates to ~110 m.
23. `test_other_user_cannot_edit_delete_or_upload` — Ownership enforcement on `PATCH`, `DELETE`, and `/media/`.
24. `test_owner_cannot_self_approve_via_status` — State machine prevents owner self-approval.
25. `test_pause_and_resume` — Owner can pause and resume an approved, non-expired listing.
26. `test_multiple_images_upload_and_primary` — Multi-image upload, cover photo selection, randomized UUID storage key, and 64-char SHA-256 checksum.
27. `test_gps_exif_is_stripped` — Confirms uploaded JPEG with embedded `GPSInfo` EXIF tags has all EXIF metadata stripped on storage.
28. `test_non_image_rejected` — PHP/script payload disguised as `.jpg` is rejected with HTTP 400.
29. `test_tiny_image_rejected` — Images smaller than 200×200 px are rejected with HTTP 400.
30. `test_duplicate_image_rejected` — Uploading an identical image (same SHA-256 hash) to the same listing is rejected with HTTP 400.
31. `test_report_once_and_not_own` — Owners cannot report their own listing; users cannot submit duplicate reports.
32. `test_heavily_reported_listing_auto_hidden` — Reaching 5 fraud reports automatically transitions an `ACTIVE` listing back to `PENDING_APPROVAL`.

### D. Government Integration Layer, Provenance & End-to-End 24-Step Deal Lifecycle (`apps.analytics.tests.test_platform_flow`)
33. `test_seed_and_public_analytics` — Verifies `seed_indore`, 20 Indore locality price/sq.ft trends, and public platform statistics.
34. `test_dashboard_summary_and_verification_queue` — Verifies role-aware dashboard summary metrics and Property Passport verification queue.
35. `test_government_adapters_and_provenance_engine` — Verifies the 6 official MP/Indore government adapters (`MP_BHULEKH`, `MP_RERA`, `MP_IGRS_SAMPADA`, `IMC_INDORE`, `IDA_INDORE`, `MP_TNCP`), ensuring `PENDING_AUTHORIZATION_MANUAL_AUDIT` and `PLATFORM_VERIFIED` provenance are recorded without fabricating live government API responses.
36. `test_lead_and_visit_lifecycle_with_interactions` — Buyer lead creation, owner notification, status update (`CONTACTED`), and CRM `LeadInteraction` call note logging.
37. `test_negotiation_to_escrow_conveyance_completion` — Executes the full offer → seller counter-offer → buyer acceptance → automatic `Transaction` & 5 `TransactionTask` creation → 5 escrow milestones (`PAY_TOKEN` → `DRAFT_AGREEMENT` → `PAY_ADVANCE` → `SCHEDULE_REGISTRY` → `COMPLETE_REGISTRY` with Sub-Registrar Deed Number `MPIGR-IND-2026-8812`) → verifies `Transaction.status == COMPLETED`, all 5 tasks `COMPLETED`, `Property.status == SOLD`, and `PropertyOwner` transferred to the buyer.
38. `test_builders_investments_and_audit_logs` — Verifies RERA project creation (`/api/v1/builders/projects/`), fractional investment pool contribution (`/api/v1/investments/pools/<id>/contribute/`), and immutable `AuditLog` persistence (`/api/v1/users/audit-logs/`).
39. `test_payment_signature_verification` — Verifies Razorpay HMAC-SHA256 payment signature verification (`/api/v1/payments/verify-signature/`).

---

## 3. Security Findings Remediation Status

| Finding ID | Description | Status | Verified By |
|---|---|---|---|
| **SEC-01** | Public disclosure of `PropertyDocument` file URLs and `PropertyOwner` email/phone PII on `GET /api/v1/properties/<id>/` | **RESOLVED** | `test_sec01_public_property_detail_redacts_documents_and_owner_pii` |
| **SEC-02** | Untracked escrow milestone transitions & missing UTR/invoice/task verification | **RESOLVED** | `test_negotiation_to_escrow_conveyance_completion` |
| **SEC-03** | `dev_otp` returned in registration response when `DEBUG=False` | **RESOLVED** | `test_sec03_dev_otp_hidden_when_debug_false` |
| **SEC-04** | Unqualified verification badges without provenance level or official source reference | **RESOLVED** | `test_government_adapters_and_provenance_engine` |
| **SEC-05** | Predictable file upload paths and missing SHA-256 checksums on `PropertyDocument` & `KYCRecord` | **RESOLVED** | `test_sec01_public_property_detail_redacts_documents_and_owner_pii` |
| **SEC-06** | Missing immutable database audit log (`AuditLog`) | **RESOLVED** | `test_builders_investments_and_audit_logs` |
| **SEC-07** | Missing rate-limiting throttle scopes on `/api/v1/auth/*` and `/api/v1/users/kyc/submit/` | **RESOLVED** | Configured in `config/settings/base.py` & views |

---

## 4. Outstanding External Dependencies

| External Dependency | Current Mode | Requirement to Enable Live API Mode |
|---|---|---|
| **MP Bhulekh (`mpbhulekh.gov.in`)** | `PENDING_AUTHORIZATION_MANUAL_AUDIT` | Institutional API key (`MP_BHULEKH_API_KEY`) from Commissioner Land Records (CLR), Govt. of MP |
| **MP RERA (`rera.mp.gov.in`)** | `PENDING_AUTHORIZATION_MANUAL_AUDIT` | Authorized partner API key (`MP_RERA_API_KEY`) from MP RERA |
| **MP IGRS / SAMPADA (`mpigr.gov.in`)** | `PENDING_AUTHORIZATION_MANUAL_AUDIT` | Licensed Service Provider API key (`MP_IGRS_SAMPADA_API_KEY`) from IGRS MP |
| **IMC Indore (`imcindore.mp.gov.in`)** | `PENDING_AUTHORIZATION_MANUAL_AUDIT` | e-NagarPalika partner API key (`IMC_INDORE_API_KEY`) |
| **Razorpay Checkout / Webhooks** | HMAC-SHA256 verification active | Set live/sandbox `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in `.env` |
| **AWS S3 Media & Document Vault** | Configured via `django-storages` (`S3Storage`) | Set `USE_S3=True`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_STORAGE_BUCKET_NAME` in `.env` |
