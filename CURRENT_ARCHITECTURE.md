# CURRENT ARCHITECTURE AUDIT — PropVault

**Audit Date:** 2026-11-18

---

## 1. Current Repository Structure

```
Real Estate/
├── backend/                     # Django 5.0.8 + DRF 3.15.2 Modular Monolith
│   ├── apps/
│   │   ├── accounts/            # Custom User, UserProfile, UserRole, LoginSession, OTPRecord
│   │   ├── users/               # KYCRecord, ProfessionalProfile
│   │   ├── properties/          # Property, PropertyOwner, PropertyAmenity, PropertyDocument
│   │   ├── listings/            # Listing, ListingMedia, ListingReport
│   │   ├── verification/        # PropertyPassport, VerificationItem
│   │   ├── discovery/           # SavedSearch, UserFavorite
│   │   ├── leads/               # Lead
│   │   ├── visits/              # SiteVisit
│   │   ├── negotiations/        # NegotiationSession, Offer
│   │   ├── transactions/        # Transaction
│   │   ├── legal/               # TitleSearchReport, LegalDeed
│   │   ├── payments/            # Payment
│   │   ├── builders/            # BuilderProfile, Project
│   │   ├── investments/         # InvestmentPool, InvestorContribution
│   │   ├── communications/      # Notification
│   │   └── analytics/           # LocalityTrend + seed_indore command
│   ├── common/                  # BaseModel, custom exceptions, RBAC permissions, validators
│   └── config/                  # Settings (base, development, testing, production), urls, celery, asgi, wsgi
├── frontend/                    # React 19 + TypeScript + Vite 8 + Tailwind CSS 3.4
│   ├── src/
│   │   ├── app/Router.tsx       # React Router v7 routes
│   │   ├── components/          # UI primitives, navigation, properties, listings
│   │   ├── contexts/            # AuthContext (JWT storage & user hydration)
│   │   ├── hooks/               # useAuth, useListings
│   │   ├── layouts/             # MainLayout, DashboardLayout, AuthLayout
│   │   ├── lib/                 # Axios client with 401 refresh interceptor, constants, utils
│   │   ├── pages/               # Public pages, Auth pages, Dashboard pages
│   │   ├── schemas/             # Zod validation schemas (auth, property)
│   │   ├── services/            # auth, user, property, listing, platform services
│   │   └── types/               # TypeScript domain interfaces
│   ├── Dockerfile
│   └── nginx.conf
├── docker-compose.yml           # Local PostGIS + Redis + Django + Celery stack
├── docker-compose.prod.yml      # Production Gunicorn + Celery + Nginx stack
└── .github/workflows/ci-cd.yml  # GitHub Actions CI pipeline
```

---

## 2. Target Stack vs. Existing Stack Comparison

| Layer | Target Specification | Existing Implementation | Gap / Required Action |
|---|---|---|---|
| **Frontend** | React.js + TypeScript + Tailwind CSS | React 19.3 + TypeScript 7.0 + Tailwind CSS 3.4 + TanStack Query 5 | Matches target stack. Missing automated frontend tests (Vitest) and interactive map component (Leaflet). |
| **Backend** | Python + Django + DRF (Modular Monolith) | Python 3.12 + Django 5.0.8 + DRF 3.15.2 | Matches target stack. However, 10 of the 16 apps put business logic directly inside `APIView` methods (`views.py`) while their `services/` and `selectors/` files are empty 30-byte stubs. |
| **Database** | PostgreSQL + PostGIS | PostgreSQL 15 (`postgis/postgis:15-3.3` in Docker) / SQLite fallback for local non-Docker dev | `Property` currently uses `DecimalField` (`latitude`, `longitude`) instead of spatial indexing / geographic distance & bounding-box queries. |
| **Cache & Async** | Redis + Celery + Django Channels | `django-redis`, `celery`, `channels` installed in `requirements/base.txt`; `config/celery.py` configured | No Celery tasks (`tasks.py`) are actually defined in any app (e.g., listing expiry, email/OTP dispatch, government verification polling). |
| **Object Storage** | Secure object storage (AWS S3) with signed URLs | `django-storages` (`S3Storage`) with `AWS_QUERYSTRING_AUTH = True`, `AES256` encryption, and EXIF/GPS stripping on `ListingMedia` | `PropertyDocument`, `KYCRecord`, `VerificationItem.evidence_document`, and `LegalDeed.signed_document` do not yet use randomized UUID upload paths or SHA-256 file integrity checksums. |

---

## 3. Architectural & Design Pattern Gaps (OOP / SOLID)

1. **Inconsistent Service & Selector Layering**:
   - `accounts`, `users`, `properties`, `listings`, and `verification` properly separate `views.py` → `services/` → `selectors/` → `models.py`.
   - `leads`, `visits`, `negotiations`, `transactions`, `legal`, `payments`, `builders`, `investments`, `communications`, and `analytics` have empty 1-line placeholder files in `services/` and `selectors/`, placing database mutations and cross-module side effects directly inside `views.py`.
2. **Missing Government Adapter Layer (Dependency Inversion)**:
   - There is no abstraction or adapter pattern (`GovernmentSourceAdapter`) isolating external government verification providers (MP RERA, MP Bhulekh, MP IGRS, IMC Indore, IDA, MP T&CP) from core domain models.
3. **Missing Cross-Cutting Audit Trail**:
   - Domain mutations (KYC review, role assignment, passport tier verification, listing moderation, offer acceptance, escrow milestone execution) do not emit structured, immutable `AuditLog` entries.
