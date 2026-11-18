# EXISTING DATABASE ANALYSIS — PropVault

**Audit Date:** 2026-11-18

---

## 1. Core Domain Separation Audit

The specification requires **Property**, **Listing**, **Verification Case**, and **Transaction** to remain separate domain concepts.

| Concept | Existing Model(s) | Assessment | Identified Deficiencies |
|---|---|---|---|
| **Property** | `properties.Property`, `PropertyOwner`, `PropertyAmenity`, `PropertyDocument` | Separate concept maintained (`UUID` PK, soft-delete via `BaseModel`). | 1. `Property.price` duplicates pricing on the asset record instead of treating `Listing.asking_price` as the commercial offer.<br>2. `PropertyDocument` lacks `version`, `review_status` (`PENDING`, `APPROVED`, `REJECTED`), `reviewed_by`, `review_notes`, `checksum_sha256`, and `authenticity_level`.<br>3. Geographic location is stored as nullable `latitude`/`longitude` `DecimalField`s without spatial/bounding-box indexes. |
| **Listing** | `listings.Listing`, `ListingMedia`, `ListingReport` | Separate concept maintained (`ForeignKey` to `Property` with `on_delete=PROTECT` and conditional unique constraint `uniq_live_listing_per_property_type`). | 1. Missing `ListingHistory` table to track price adjustments and status transitions over time. |
| **Verification Case** | `verification.PropertyPassport`, `VerificationItem` | Separate concept maintained (`OneToOneField` `PropertyPassport` → `Property`, plus 5 `VerificationItem` rows). | 1. Only supports a single static `PropertyPassport` per property rather than traceable **Verification Cases / Inspections** with history.<br>2. Missing provenance columns on `VerificationItem`: `authenticity_level` (`GOVERNMENT_VERIFIED`, `THIRD_PARTY_VERIFIED`, `PLATFORM_VERIFIED`, `USER_SUBMITTED`, `VERIFICATION_PENDING`, `UNABLE_TO_VERIFY`), `source_authority`, `source_reference_number`, `verification_method`, `retrieved_at`, `expires_at`, `risk_flag`. |
| **Transaction** | `transactions.Transaction`, `payments.Payment`, `legal.LegalDeed` | Separate concept maintained (`ForeignKey` to `Property`, `buyer`, `seller`). | 1. No link to the originating `NegotiationSession` (`negotiation_session` FK) or `Listing` (`listing` FK).<br>2. Missing stakeholder assignments (`assigned_advocate`, `assigned_agent`).<br>3. Missing `TransactionTask` model to track mandatory pre-registration tasks, deadlines, and responsible roles.<br>4. Missing `sub_registrar_office`, `deed_registration_number`, and `handover_completed_at` fields for final conveyance and possession handover. |

---

## 2. Model-by-Model Schema & Constraint Review

| App | Model | Primary Key | Financial Types | Missing Fields / Constraints / Indexes |
|---|---|---|---|---|
| `accounts` | `User`, `UserProfile`, `UserRole`, `LoginSession`, `OTPRecord` | UUID v4 | N/A | Good constraints (`unique_together = ('user', 'role')`). `OTPRecord` stores plaintext 6-digit `otp_code` instead of a hashed code. |
| `users` | `KYCRecord`, `ProfessionalProfile` | UUID v4 | N/A | `KYCRecord` hashes document number with SHA-256 (`document_number_hash`), but uses predictable upload paths (`kyc/front/%Y/%m/`) instead of randomized UUID keys. |
| `properties` | `Property`, `PropertyOwner`, `PropertyAmenity`, `PropertyDocument` | UUID v4 | `DecimalField(14, 2)` | `PropertyDocument` needs randomized UUID upload paths, `checksum_sha256`, `version`, `review_status`, `reviewed_by`, `authenticity_level`. Add composite index on `(city, locality, property_type, status)` and `(latitude, longitude)`. |
| `listings` | `Listing`, `ListingMedia`, `ListingReport` | UUID v4 | `DecimalField(14, 2)` | Well-constrained (`uniq_live_listing_per_property_type`, `uniq_media_checksum_per_listing`, `uniq_report_per_user_listing`). Needs `ListingHistory` for price/status audit trail. |
| `verification` | `PropertyPassport`, `VerificationItem` | UUID v4 | N/A | Needs provenance fields (`authenticity_level`, `source_authority`, `source_reference`, `verification_method`, `retrieved_at`, `freshness_expires_at`, `risk_indicator`) and `GovernmentVerificationRecord` link. |
| `leads` | `Lead` | UUID v4 | `DecimalField(14, 2)` | Missing `listing` FK, `next_follow_up_at`, and child `LeadInteraction` model for CRM call/note history. |
| `visits` | `SiteVisit` | UUID v4 | N/A | Missing `assigned_agent`, `checked_in_at`, and `reschedule_reason`. |
| `negotiations` | `NegotiationSession`, `Offer` | UUID v4 | `DecimalField(14, 2)` | Missing `listing` FK, `assigned_negotiator` FK, and `Offer.expires_at` timestamp. |
| `transactions` | `Transaction` | UUID v4 | `DecimalField(14, 2)` | Missing `listing` FK, `negotiation` FK, `assigned_advocate` FK, `assigned_agent` FK, `deed_registration_number`, `sub_registrar_office`, `handover_notes`, and child `TransactionTask` model. |
| `legal` | `TitleSearchReport`, `LegalDeed` | UUID v4 | N/A | `LegalDeed` needs `version`, `approved_by_advocate` FK, `buyer_signed_at`, `seller_signed_at`, and `authenticity_level`. |
| `payments` | `Payment` | UUID v4 | `DecimalField(14, 2)` | Missing `invoice_number`, `utr_or_reference_number`, `verified_by` FK, `verified_at`, and `refunded_at`. |
| `builders` | `BuilderProfile`, `Project` | UUID v4 | N/A | Missing `ProjectUnit` model for unit-level inventory (tower, floor, unit number, carpet area, price, availability status) and RERA verification provenance status. |
| `common` / `fraud` | *(Missing)* | UUID v4 | N/A | Missing `AuditLog` model for immutable platform audit trails and `GovernmentVerificationRecord` for government portal provenance. |
