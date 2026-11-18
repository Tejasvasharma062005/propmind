"""
Management command to seed Indore real estate data across all 16 PropVault modules.
"""
from decimal import Decimal
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone
from apps.accounts.models import User, UserProfile, UserRole
from apps.analytics.models import LocalityTrend
from apps.properties.models import Property, PropertyAmenity, PropertyOwner
from apps.listings.models import Listing
from apps.verification.services.verification_service import VerificationService
from apps.verification.services.government_adapters import (
    MPBhulekhAdapter,
    MPReraAdapter,
    IMCPropertyTaxAdapter,
)
from apps.leads.models import Lead
from apps.visits.models import SiteVisit
from apps.negotiations.models import NegotiationSession, Offer
from apps.negotiations.views import create_default_transaction_tasks
from apps.transactions.models import Transaction
from apps.payments.models import Payment
from apps.legal.models import TitleSearchReport, LegalDeed
from apps.builders.models import BuilderProfile, Project, ProjectUnit
from apps.investments.models import InvestmentPool
from apps.communications.models import Notification
from common.constants.choices import (
    Role,
    PropertyType,
    PropertyCondition,
    OccupancyStatus,
    OwnershipType,
    PropertyStatus,
    ListingType,
    ListingStatus,
    VerificationTier,
    VerificationStatus,
    LeadStatus,
    VisitStatus,
    NegotiationStatus,
    TransactionStatus,
    PaymentStatus,
)


INDORE_LOCALITIES = [
    {"name": "Vijay Nagar", "avg_sqft": 7200.00, "growth": 9.5},
    {"name": "Palasia", "avg_sqft": 8500.00, "growth": 7.2},
    {"name": "AB Road", "avg_sqft": 7800.00, "growth": 6.8},
    {"name": "Super Corridor", "avg_sqft": 4850.00, "growth": 14.5},
    {"name": "Bypass Road", "avg_sqft": 5200.00, "growth": 11.8},
    {"name": "Scheme 54", "avg_sqft": 8400.00, "growth": 8.1},
    {"name": "Scheme 78", "avg_sqft": 6400.00, "growth": 7.5},
    {"name": "Mahalaxmi Nagar", "avg_sqft": 5800.00, "growth": 9.2},
    {"name": "Nipania", "avg_sqft": 4900.00, "growth": 12.0},
    {"name": "Bicholi Mardana", "avg_sqft": 5500.00, "growth": 9.8},
    {"name": "Rau", "avg_sqft": 3800.00, "growth": 12.0},
    {"name": "Annapurna", "avg_sqft": 6100.00, "growth": 5.4},
    {"name": "Sudama Nagar", "avg_sqft": 5400.00, "growth": 5.9},
    {"name": "Silicon City", "avg_sqft": 3600.00, "growth": 8.0},
    {"name": "Kanadia Road", "avg_sqft": 5300.00, "growth": 10.1},
    {"name": "Khandwa Road", "avg_sqft": 4800.00, "growth": 8.9},
    {"name": "Ujjain Road", "avg_sqft": 4200.00, "growth": 11.5},
    {"name": "Rajendra Nagar", "avg_sqft": 4900.00, "growth": 6.2},
    {"name": "Geeta Bhawan", "avg_sqft": 8600.00, "growth": 4.8},
    {"name": "Manoramaganj", "avg_sqft": 9200.00, "growth": 5.2},
]


class Command(BaseCommand):
    help = 'Seeds Indore real estate dataset across all PropVault modules'

    @transaction.atomic
    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE("Starting Indore Real Estate platform seeding..."))
        now = timezone.now()

        # 1. Seed Users (Admin, Buyer, Advocate)
        admin_user, created = User.objects.get_or_create(
            email="admin@propvault.in",
            defaults={
                "phone": "+919999999999",
                "name": "PropVault Administrator",
                "is_staff": True,
                "is_superuser": True,
                "is_verified": True,
                "is_active": True,
            },
        )
        if created:
            admin_user.set_password("Admin@123")
            admin_user.save()
        UserProfile.objects.get_or_create(user=admin_user, defaults={"city": "Indore", "state": "Madhya Pradesh"})
        for role_code in (Role.ADMIN, Role.SELLER, Role.VERIFIER, Role.ADVOCATE):
            UserRole.objects.get_or_create(user=admin_user, role=role_code, is_active=True)

        buyer_user, b_created = User.objects.get_or_create(
            email="buyer@propvault.in",
            defaults={
                "phone": "+919826011223",
                "name": "Priya Sharma",
                "is_verified": True,
                "is_active": True,
            },
        )
        if b_created:
            buyer_user.set_password("Buyer@123")
            buyer_user.save()
        UserProfile.objects.get_or_create(user=buyer_user, defaults={"city": "Indore", "state": "Madhya Pradesh"})
        UserRole.objects.get_or_create(user=buyer_user, role=Role.BUYER, is_active=True)

        advocate_user, a_created = User.objects.get_or_create(
            email="advocate@propvault.in",
            defaults={
                "phone": "+919425088776",
                "name": "Adv. Suresh Verma",
                "is_verified": True,
                "is_active": True,
            },
        )
        if a_created:
            advocate_user.set_password("Advocate@123")
            advocate_user.save()
        UserProfile.objects.get_or_create(user=advocate_user, defaults={"city": "Indore", "state": "Madhya Pradesh"})
        UserRole.objects.get_or_create(user=advocate_user, role=Role.ADVOCATE, is_active=True)

        # 2. Seed Locality Trends
        for loc in INDORE_LOCALITIES:
            LocalityTrend.objects.update_or_create(
                city="Indore",
                locality=loc["name"],
                quarter="Q4",
                year=2026,
                defaults={
                    "average_price_sqft": loc["avg_sqft"],
                    "growth_percentage": loc["growth"],
                },
            )

        # 3. Seed Properties, Passports, and Listings
        sample_props = [
            {
                "title": "Luxury 3 BHK Apartment in Scheme 54 Vijay Nagar",
                "property_type": PropertyType.APARTMENT,
                "price": Decimal("13500000.00"),
                "locality": "Scheme 54",
                "address": "Plot 42, Near Medanta Hospital, Scheme No. 54",
                "pincode": "452010",
                "latitude": Decimal("22.753412"),
                "longitude": Decimal("75.893456"),
                "built_up_area": Decimal("2200.00"),
                "carpet_area": Decimal("1850.00"),
                "bedrooms": 3,
                "bathrooms": 3,
                "parking_count": 2,
                "construction_year": 2024,
                "description": "Corner 3 BHK apartment with unhindered Vijay Nagar skyline views, Italian marble flooring, modular kitchen, and 24/7 security.",
                "rera": "P-IND-24-09821",
                "amenities": ["Gated Security & CCTV", "Reserved Car Parking", "Power Backup (100%)", "Clubhouse & Gym"],
            },
            {
                "title": "Modern 4 BHK Duplex Villa in Super Corridor IT Zone",
                "property_type": PropertyType.VILLA,
                "price": Decimal("24500000.00"),
                "locality": "Super Corridor",
                "address": "Villa 12, Silver Spring Enclave, Near TCS Square, Super Corridor",
                "pincode": "452005",
                "latitude": Decimal("22.771240"),
                "longitude": Decimal("75.814120"),
                "built_up_area": Decimal("3800.00"),
                "carpet_area": Decimal("3200.00"),
                "plot_area": Decimal("2400.00"),
                "bedrooms": 4,
                "bathrooms": 5,
                "parking_count": 2,
                "construction_year": 2025,
                "description": "Independent gated duplex villa with private landscaped garden, solar rooftop setup, 5 minutes from TCS & Infosys campuses.",
                "rera": "P-IND-25-11204",
                "amenities": ["Gated Security & CCTV", "Solar Water Heating", "EV Charging Station", "Clubhouse & Gym"],
            },
            {
                "title": "Prime Grade-A Commercial Office on AB Road Palasia",
                "property_type": PropertyType.COMMERCIAL_OFFICE,
                "price": Decimal("18000000.00"),
                "locality": "AB Road",
                "address": "5th Floor, Apollo Premier, AB Road Vijay Nagar",
                "pincode": "452010",
                "latitude": Decimal("22.749810"),
                "longitude": Decimal("75.895510"),
                "built_up_area": Decimal("2500.00"),
                "carpet_area": Decimal("2100.00"),
                "bedrooms": 0,
                "bathrooms": 2,
                "parking_count": 3,
                "construction_year": 2023,
                "description": "Grade-A commercial office space with glass facade, double-height reception, 100% DG backup, and direct BRTS connectivity.",
                "rera": "P-IND-23-07741",
                "amenities": ["Elevator / Lift", "Power Backup (100%)", "Reserved Car Parking", "Gated Security & CCTV"],
            },
            {
                "title": "TNCP Approved 2400 sq.ft Residential Plot in Nipania",
                "property_type": PropertyType.PLOT,
                "price": Decimal("9600000.00"),
                "locality": "Nipania",
                "address": "Plot 88, Emerald Enclave, Nipania Main Road",
                "pincode": "452016",
                "latitude": Decimal("22.762190"),
                "longitude": Decimal("75.918200"),
                "built_up_area": Decimal("2400.00"),
                "carpet_area": Decimal("2400.00"),
                "plot_area": Decimal("2400.00"),
                "bedrooms": 0,
                "bathrooms": 0,
                "parking_count": 0,
                "construction_year": 2024,
                "description": "Immediate registry and diversion-completed residential plot in a secured gated township in Nipania, Indore.",
                "rera": "P-IND-24-06512",
                "amenities": ["Gated Security & CCTV", "Rainwater Harvesting", "Vastu Compliant"],
            },
        ]

        created_props = []
        for p_item in sample_props:
            rera = p_item.pop("rera")
            amenities = p_item.pop("amenities")
            prop, _ = Property.objects.update_or_create(
                title=p_item["title"],
                defaults={
                    "created_by": admin_user,
                    "city": "Indore",
                    "state": "Madhya Pradesh",
                    "status": PropertyStatus.VERIFIED,
                    "property_condition": PropertyCondition.READY_TO_MOVE,
                    "occupancy_status": OccupancyStatus.VACANT,
                    "ownership_type": OwnershipType.FREEHOLD,
                    **p_item,
                },
            )
            PropertyOwner.objects.get_or_create(
                property=prop,
                user=admin_user,
                defaults={"ownership_percentage": Decimal("100.00"), "is_primary": True},
            )
            for am in amenities:
                PropertyAmenity.objects.get_or_create(property=prop, amenity_name=am)

            # Verify all 5 tiers on Property Passport with explicit provenance
            for tier in VerificationTier.values:
                VerificationService.update_tier_status(
                    property_id=str(prop.id),
                    tier=tier,
                    status_val=VerificationStatus.VERIFIED,
                    verifier=advocate_user if tier == VerificationTier.LEGAL else admin_user,
                    notes=f"Verified via PropVault Indore audit protocol ({tier}).",
                    source_authority="MP_RERA" if tier == VerificationTier.LEGAL else "MP_BHULEKH" if tier == VerificationTier.OWNERSHIP else "IMC_INDORE",
                    source_reference=rera if tier == VerificationTier.LEGAL else f"KHASRA-IND-{prop.pincode}",
                    verification_method="MANUAL_OFFICIAL_PORTAL_REFERENCE_AUDIT",
                )

            if not prop.government_verifications.exists():
                MPReraAdapter.record_verification(
                    property_obj=prop,
                    reference_number=rera,
                    submitted_metadata={"rera_number": rera, "project_name": prop.title, "registration_status": "ACTIVE"},
                    actor=advocate_user,
                    is_verified_by_reviewer=True,
                    notes="Cross-checked against MP RERA portal registration number.",
                )
                MPBhulekhAdapter.record_verification(
                    property_obj=prop,
                    reference_number=f"KHASRA-412-{prop.pincode}",
                    submitted_metadata={"district": "Indore", "tehsil": "Indore", "village": prop.locality},
                    actor=admin_user,
                    is_verified_by_reviewer=True,
                    notes="Cross-checked B1 Khatauni / Khasra mutation reference.",
                )
                IMCPropertyTaxAdapter.record_verification(
                    property_obj=prop,
                    reference_number=f"IMC-TAX-{prop.pincode}-01",
                    submitted_metadata={"zone": "Zone 10", "outstanding_dues_inr": 0, "noc_issued": True},
                    actor=admin_user,
                    is_verified_by_reviewer=True,
                    notes="IMC property tax clearance receipt verified.",
                )

            Listing.objects.update_or_create(
                property=prop,
                listing_type=ListingType.SALE,
                defaults={
                    "listed_by": admin_user,
                    "status": ListingStatus.ACTIVE,
                    "asking_price": prop.price,
                    "is_featured": True,
                    "rera_number": rera,
                    "reviewed_by": admin_user,
                    "reviewed_at": now,
                    "published_at": now,
                    "expires_at": now + timezone.timedelta(days=90),
                },
            )
            created_props.append(prop)

        # 4. Seed Title Search Report, Lead, Site Visit, Negotiation, Escrow Transaction & Payment
        primary_prop = created_props[0]
        TitleSearchReport.objects.get_or_create(
            property=primary_prop,
            defaults={
                "advocate": advocate_user,
                "search_period_years": 30,
                "khasra_details": "Khasra No. 412/2, Tehsil Juni Indore — Mutation updated in MP Bhulekh",
                "encumbrances_found": "None (No bank lien or litigation recorded)",
                "legal_opinion": "30-year chain of title examined at Sub-Registrar Indore. Clear and marketable freehold title.",
                "is_clear_title": True,
            },
        )

        Lead.objects.get_or_create(
            property=primary_prop,
            buyer=buyer_user,
            defaults={
                "status": LeadStatus.VISIT_SCHEDULED,
                "source": "WEBSITE",
                "inquiry_message": "Interested in the Scheme 54 3 BHK flat. Looking for early possession and bank loan assistance.",
                "budget_min": Decimal("12500000.00"),
                "budget_max": Decimal("13500000.00"),
            },
        )

        SiteVisit.objects.get_or_create(
            property=primary_prop,
            visitor=buyer_user,
            defaults={
                "host": admin_user,
                "scheduled_at": now + timezone.timedelta(days=2),
                "status": VisitStatus.CONFIRMED,
                "visitor_notes": "Will arrive with family at 11:00 AM.",
            },
        )

        session, _ = NegotiationSession.objects.get_or_create(
            property=created_props[1],
            buyer=buyer_user,
            seller=admin_user,
            defaults={
                "status": NegotiationStatus.ACTIVE,
                "current_offer_amount": Decimal("23800000.00"),
            },
        )
        Offer.objects.get_or_create(
            session=session,
            offered_by=buyer_user,
            amount=Decimal("23800000.00"),
            defaults={"terms": "10% token within 48 hours, balance via HDFC home loan in 30 days.", "status": "PENDING"},
        )

        txn, txn_created = Transaction.objects.get_or_create(
            property=primary_prop,
            buyer=buyer_user,
            seller=admin_user,
            defaults={
                "final_sale_price": Decimal("13500000.00"),
                "token_amount": Decimal("1350000.00"),
                "status": TransactionStatus.TOKEN_PAID,
                "token_paid_at": now - timezone.timedelta(days=1),
                "assigned_advocate": advocate_user,
            },
        )
        create_default_transaction_tasks(txn)
        if txn_created:
            Payment.objects.create(
                transaction=txn,
                payer=buyer_user,
                amount=Decimal("1350000.00"),
                purpose="TOKEN_PAYMENT",
                payment_method="ESCROW_NEFT",
                invoice_number="INV-PV-202611-IND001",
                utr_number="UTR-HDFC-26111800981",
                gateway_order_id="ORD_INDORE001",
                gateway_payment_id="PAY_INDORE001",
                status=PaymentStatus.SUCCESS,
                verified_by=admin_user,
                verified_at=now - timezone.timedelta(days=1),
            )
            LegalDeed.objects.create(
                transaction=txn,
                deed_type="AGREEMENT_TO_SELL",
                draft_content="AGREEMENT TO SELL (BAYANA) — Plot 42, Scheme No. 54, Vijay Nagar, Indore. Agreed Consideration: INR 1,35,00,000.",
                is_signed=True,
            )
            Notification.objects.create(
                user=admin_user,
                title="Property Passport Audit Completed",
                body=f"{primary_prop.title} achieved 100% PropVault verification score.",
                notification_type="VERIFICATION",
                action_url="/dashboard/verification",
            )
            Notification.objects.create(
                user=admin_user,
                title="Escrow Token Deposit Received",
                body=f"₹13,50,000 token credited in escrow for {primary_prop.title}.",
                notification_type="TRANSACTION",
                action_url="/dashboard/transactions",
            )

        # 5. Seed Builder Profile, Project, Units & Investment Pool
        builder_prof, _ = BuilderProfile.objects.get_or_create(
            user=admin_user,
            defaults={
                "company_name": "Malwa Skyline Developers Pvt. Ltd.",
                "rera_number": "P-IND-24-09821",
                "established_year": 2012,
                "total_projects_delivered": 9,
                "website": "https://propvault.in",
            },
        )
        project_obj, _ = Project.objects.get_or_create(
            builder=builder_prof,
            name="Skyline Grandeur Super Corridor",
            defaults={
                "locality": "Super Corridor",
                "city": "Indore",
                "rera_registration_number": "P-IND-25-11204",
                "total_units": 120,
                "available_units": 48,
                "status": "UNDER_CONSTRUCTION",
            },
        )
        for u_no, cfg, area, price in (
            ("A-101", "3 BHK", Decimal("1850.00"), Decimal("12500000.00")),
            ("A-102", "3 BHK", Decimal("1920.00"), Decimal("13100000.00")),
            ("B-401", "4 BHK Penthouse", Decimal("3100.00"), Decimal("22000000.00")),
        ):
            ProjectUnit.objects.get_or_create(
                project=project_obj,
                tower_or_block="Tower A",
                unit_number=u_no,
                defaults={
                    "floor_number": 1,
                    "configuration": cfg,
                    "carpet_area_sqft": area,
                    "base_price": price,
                    "status": "AVAILABLE",
                },
            )

        InvestmentPool.objects.get_or_create(
            property=created_props[2],
            title="AB Road Grade-A Commercial Office Yield Pool",
            defaults={
                "target_amount": Decimal("18000000.00"),
                "raised_amount": Decimal("7500000.00"),
                "minimum_investment": Decimal("250000.00"),
                "expected_roi_percentage": Decimal("13.20"),
                "holding_period_months": 36,
                "status": "OPEN",
            },
        )

        self.stdout.write(self.style.SUCCESS("Indore Real Estate Platform Seeding Complete!"))
