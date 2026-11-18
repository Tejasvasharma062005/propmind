# PropVault — Real Estate Operating Platform (Indore, MP)

Full-lifecycle Real Estate Operating Platform managing property discovery, 5-pillar Digital Property Passport verification, AWS S3 multi-image marketplace listings, buyer lead CRM, site visits, offer/counter-offer negotiations, institutional escrow transactions, advocate 30-year title search reports, and micro-market analytics.

---

## 1. Architecture & Technology Stack

- **Backend**: Python 3.12 · Django 5 · Django REST Framework · SimpleJWT · Celery · Redis · PostgreSQL · `django-storages` (AWS S3) · `drf-spectacular` (OpenAPI 3 / Swagger UI)
- **Frontend**: React 19 · TypeScript · Vite · Tailwind CSS · TanStack React Query · React Router v7 · Axios JWT Interceptor
- **Deployment**: Multi-stage Dockerfiles (`backend/Dockerfile`, `frontend/Dockerfile`), Nginx reverse-proxy (`frontend/nginx.conf`), `docker-compose.yml` (development), `docker-compose.prod.yml` (AWS EC2 + RDS + ElastiCache + S3), and GitHub Actions CI/CD (`.github/workflows/ci-cd.yml`).

---

## 2. 16 Integrated Backend Modules (`/api/v1/`)

| Module | Base Endpoint | Capabilities |
|---|---|---|
| **Accounts** | `/api/v1/auth/` | Registration, OTP verification, JWT login/refresh/logout, password reset |
| **Users & KYC** | `/api/v1/users/` | Profile (`me/`), Aadhaar/PAN SHA-256 hashed KYC submission (`kyc/submit/`, `kyc/status/`), role assignment |
| **Properties** | `/api/v1/properties/` | Asset registry, ownership shares, legal documents, `mine/`, verification submission |
| **Listings** | `/api/v1/listings/` | Moderation gate, multi-photo AWS S3 upload with EXIF/GPS stripping & SHA-256 deduplication, fraud reporting |
| **Verification** | `/api/v1/verification/` | 5-Pillar Digital Property Passport (`IDENTITY`, `OWNERSHIP`, `LEGAL`, `PHYSICAL`, `FINANCIAL`) & queue (`queue/`) |
| **Legal** | `/api/v1/legal/` | 30-Year Advocate Title Search Reports (`title-reports/`) & Agreement to Sell / Sale Deeds (`deeds/`) |
| **Discovery** | `/api/v1/discovery/` | Saved searches (`saved-searches/`) & user favorites (`favorites/`) |
| **Leads CRM** | `/api/v1/leads/` | Buyer inquiry capture, owner notifications, CRM pipeline status updates |
| **Site Visits** | `/api/v1/visits/` | Visit scheduling, host confirmation, completion & cancellation |
| **Negotiations** | `/api/v1/negotiations/` | Offer initiation, counter-offers (`<id>/counter/`), acceptance (`<id>/respond/`) → auto-opens Escrow Transaction |
| **Transactions** | `/api/v1/transactions/` | 5-milestone Escrow & Conveyance workflow (`PAY_TOKEN` → `DRAFT_AGREEMENT` → `PAY_ADVANCE` → `SCHEDULE_REGISTRY` → `COMPLETE_REGISTRY`) |
| **Payments** | `/api/v1/payments/` | Escrow ledger & Razorpay HMAC-SHA256 signature verification (`verify-signature/`) |
| **Builders** | `/api/v1/builders/` | RERA-registered developer profiles & projects (`projects/`) |
| **Investments** | `/api/v1/investments/` | Fractional real estate investment pools (`pools/`) |
| **Communications** | `/api/v1/communications/` | In-app notification stream (`notifications/`) |
| **Analytics** | `/api/v1/analytics/` | Indore locality price/sq.ft trends (`trends/`), live platform stats (`platform-stats/`), role-aware dashboard summary (`dashboard-summary/`) |

---

## 3. Local Development Setup

### Option A: Docker Compose
```bash
cp .env.example .env
docker compose up --build -d
docker compose exec web python manage.py seed_indore
```

### Option B: Local Virtualenv + Node
```bash
# 1. Backend
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements/dev.txt
python manage.py migrate
python manage.py seed_indore
python manage.py runserver 0.0.0.0:8000

# 2. Frontend (in a second terminal)
cd frontend
npm install
npm run dev
```

### Default Seeded Accounts (`python manage.py seed_indore`)
- **Admin / Verifier / Seller**: `admin@propvault.in` / `Admin@123`
- **Buyer**: `buyer@propvault.in` / `Buyer@123`
- **Legal Advocate**: `advocate@propvault.in` / `Advocate@123`

---

## 4. AWS Production Deployment (`docker-compose.prod.yml`)

1. Provision:
   - **Amazon S3**: Private bucket with Block Public Access enabled.
   - **Amazon RDS (PostgreSQL 15+)** and **Amazon ElastiCache (Redis 7)**.
   - **Amazon EC2** instance (Ubuntu 24.04 LTS) with Docker & Docker Compose installed.
2. Configure `.env` on the server:
   ```env
   DEBUG=False
   SECRET_KEY=<strong-64-char-random-secret>
   ALLOWED_HOSTS=propvault.in,www.propvault.in,<ec2-ip-or-alb-dns>
   CORS_ALLOWED_ORIGINS=https://propvault.in,https://www.propvault.in

   DB_NAME=propvault_prod
   DB_USER=propvault
   DB_PASSWORD=<rds-password>
   DB_HOST=<rds-endpoint>.rds.amazonaws.com
   DB_PORT=5432

   REDIS_URL=redis://<elasticache-endpoint>:6379/0

   USE_S3=True
   AWS_ACCESS_KEY_ID=<iam-access-key>
   AWS_SECRET_ACCESS_KEY=<iam-secret-key>
   AWS_STORAGE_BUCKET_NAME=<s3-bucket-name>
   AWS_S3_REGION_NAME=ap-south-1
   AWS_QUERYSTRING_EXPIRE=3600
   ```
3. Build and launch the production stack:
   ```bash
   docker compose -f docker-compose.prod.yml up --build -d
   docker compose -f docker-compose.prod.yml exec web python manage.py seed_indore
   ```
4. Verify health and OpenAPI documentation:
   - Health Check: `GET /api/health/`
   - Swagger UI: `/api/schema/swagger-ui/`
