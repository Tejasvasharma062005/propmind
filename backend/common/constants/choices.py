"""
Enumerations and TextChoices for the PropVault Real Estate Operating Platform.
"""
from django.db import models


class Role(models.TextChoices):
    """User roles supported across PropVault."""
    BUYER = 'BUYER', 'Buyer'
    SELLER = 'SELLER', 'Seller'
    AGENT = 'AGENT', 'Real Estate Agent'
    ADVOCATE = 'ADVOCATE', 'Legal Advocate'
    BUILDER = 'BUILDER', 'Builder / Developer'
    INVESTOR = 'INVESTOR', 'Investor'
    ADMIN = 'ADMIN', 'Platform Administrator'
    NEGOTIATOR = 'NEGOTIATOR', 'Certified Negotiator'
    VERIFIER = 'VERIFIER', 'Field Verifier'


class OTPPurpose(models.TextChoices):
    """Purposes for OTP verification records."""
    REGISTRATION = 'REGISTRATION', 'Registration Verification'
    LOGIN = 'LOGIN', 'Passwordless Login'
    RESET_PASSWORD = 'RESET_PASSWORD', 'Password Reset'
    TRANSACTION = 'TRANSACTION', 'Transaction Confirmation'


class KYCDocumentType(models.TextChoices):
    """Recognized identity documents for KYC."""
    AADHAAR = 'AADHAAR', 'Aadhaar Card'
    PAN = 'PAN', 'PAN Card'
    PASSPORT = 'PASSPORT', 'Passport'
    VOTER_ID = 'VOTER_ID', 'Voter Identity Card'


class KYCStatus(models.TextChoices):
    """Lifecycle status for user KYC."""
    PENDING = 'PENDING', 'Pending Submission'
    UNDER_REVIEW = 'UNDER_REVIEW', 'Under Review'
    APPROVED = 'APPROVED', 'Approved'
    REJECTED = 'REJECTED', 'Rejected'


class ProfessionType(models.TextChoices):
    """Professional categories on the platform."""
    AGENT = 'AGENT', 'Real Estate Agent'
    ADVOCATE = 'ADVOCATE', 'Legal Advocate / Lawyer'
    VERIFIER = 'VERIFIER', 'Property Verifier / Surveyor'
    NEGOTIATOR = 'NEGOTIATOR', 'Deal Negotiator'


class PropertyType(models.TextChoices):
    """Types of real estate assets."""
    APARTMENT = 'APARTMENT', 'Apartment / Flat'
    INDEPENDENT_HOUSE = 'INDEPENDENT_HOUSE', 'Independent House'
    VILLA = 'VILLA', 'Villa'
    PLOT = 'PLOT', 'Residential / Commercial Plot'
    COMMERCIAL_OFFICE = 'COMMERCIAL_OFFICE', 'Commercial Office Space'
    SHOP = 'SHOP', 'Retail Shop'
    INDUSTRIAL = 'INDUSTRIAL', 'Industrial Property'
    AGRICULTURAL = 'AGRICULTURAL', 'Agricultural Land'


class PropertyCondition(models.TextChoices):
    """Condition / readiness of property."""
    UNDER_CONSTRUCTION = 'UNDER_CONSTRUCTION', 'Under Construction'
    READY_TO_MOVE = 'READY_TO_MOVE', 'Ready to Move'
    RESALE = 'RESALE', 'Resale'
    OLD_RENOVATED = 'OLD_RENOVATED', 'Renovated Old Construction'


class OccupancyStatus(models.TextChoices):
    """Current occupancy."""
    VACANT = 'VACANT', 'Vacant'
    OWNER_OCCUPIED = 'OWNER_OCCUPIED', 'Owner Occupied'
    TENANT_OCCUPIED = 'TENANT_OCCUPIED', 'Tenant Occupied'


class OwnershipType(models.TextChoices):
    """Legal ownership nature."""
    FREEHOLD = 'FREEHOLD', 'Freehold'
    LEASEHOLD = 'LEASEHOLD', 'Leasehold'
    COOPERATIVE = 'COOPERATIVE', 'Co-operative Society'
    POWER_OF_ATTORNEY = 'POWER_OF_ATTORNEY', 'Power of Attorney (POA)'


class PropertyStatus(models.TextChoices):
    """Lifecycle status of property record."""
    DRAFT = 'DRAFT', 'Draft'
    ACTIVE = 'ACTIVE', 'Active'
    UNDER_VERIFICATION = 'UNDER_VERIFICATION', 'Under Verification'
    VERIFIED = 'VERIFIED', 'Verified'
    SOLD = 'SOLD', 'Sold'
    WITHDRAWN = 'WITHDRAWN', 'Withdrawn'


class AmenityCategory(models.TextChoices):
    """Category classification of amenities."""
    BASIC = 'BASIC', 'Basic Utilities'
    SECURITY = 'SECURITY', 'Safety & Security'
    LIFESTYLE = 'LIFESTYLE', 'Lifestyle & Leisure'
    SPORTS = 'SPORTS', 'Sports & Fitness'
    ECO_FRIENDLY = 'ECO_FRIENDLY', 'Eco-friendly & Green'


class PropertyDocumentType(models.TextChoices):
    """Types of property title and legal deeds."""
    SALE_DEED = 'SALE_DEED', 'Sale Deed / Conveyance Deed'
    KHASRA_KHATONI = 'KHASRA_KHATONI', 'Khasra / Khatoni (Revenue Records)'
    REGISTRATION_RECEIPT = 'REGISTRATION_RECEIPT', 'Registration Receipt'
    BUILDING_PLAN_APPROVAL = 'BUILDING_PLAN_APPROVAL', 'Approved Building Plan (TNCP/Nagar Nigam)'
    OCCUPANCY_CERTIFICATE = 'OCCUPANCY_CERTIFICATE', 'Occupancy Certificate (OC)'
    COMPLETION_CERTIFICATE = 'COMPLETION_CERTIFICATE', 'Completion Certificate (CC)'
    TAX_RECEIPT = 'TAX_RECEIPT', 'Property Tax Receipt'
    ENCUMBRANCE_CERTIFICATE = 'ENCUMBRANCE_CERTIFICATE', 'Encumbrance Certificate (13/30 yrs)'
    NOC = 'NOC', 'No Objection Certificate (Society/Bank)'
    RERA_REGISTRATION = 'RERA_REGISTRATION', 'RERA Registration Certificate'
    MUTATION_CERTIFICATE = 'MUTATION_CERTIFICATE', 'Nagar Nigam Mutation (Namantaran)'
    ELECTRICITY_BILL = 'ELECTRICITY_BILL', 'Latest Electricity Bill'
    OTHER = 'OTHER', 'Other Supporting Document'


class ListingType(models.TextChoices):
    """Types of listing."""
    SALE = 'SALE', 'For Sale'
    RENT = 'RENT', 'For Rent'
    LEASE = 'LEASE', 'For Commercial Lease'


class ListingStatus(models.TextChoices):
    """Status of marketplace listing."""
    ACTIVE = 'ACTIVE', 'Active'
    PENDING_APPROVAL = 'PENDING_APPROVAL', 'Pending Approval'
    PAUSED = 'PAUSED', 'Paused'
    EXPIRED = 'EXPIRED', 'Expired'
    SOLD = 'SOLD', 'Sold'
    REJECTED = 'REJECTED', 'Rejected by Moderator'
    WITHDRAWN = 'WITHDRAWN', 'Withdrawn by Owner'


class VerificationTier(models.TextChoices):
    """Tiers of Property Passport verification."""
    IDENTITY = 'IDENTITY', 'Owner Identity Verified'
    OWNERSHIP = 'OWNERSHIP', 'Chain of Title & Ownership Verified'
    LEGAL = 'LEGAL', 'Legal & Encumbrance Verified'
    PHYSICAL = 'PHYSICAL', 'Physical Site Verified'
    FINANCIAL = 'FINANCIAL', 'Tax & Dues Cleared'


class VerificationStatus(models.TextChoices):
    """Status of verification request or category."""
    NOT_STARTED = 'NOT_STARTED', 'Not Started'
    IN_PROGRESS = 'IN_PROGRESS', 'In Progress'
    VERIFIED = 'VERIFIED', 'Verified / Cleared'
    FLAGGED = 'FLAGGED', 'Discrepancy Flagged'
    REJECTED = 'REJECTED', 'Rejected'


class LeadStatus(models.TextChoices):
    """CRM lead status."""
    NEW = 'NEW', 'New'
    CONTACTED = 'CONTACTED', 'Contacted'
    QUALIFIED = 'QUALIFIED', 'Qualified'
    VISIT_SCHEDULED = 'VISIT_SCHEDULED', 'Site Visit Scheduled'
    NEGOTIATING = 'NEGOTIATING', 'Negotiating'
    CONVERTED = 'CONVERTED', 'Converted'
    LOST = 'LOST', 'Lost'


class VisitStatus(models.TextChoices):
    """Status of site visits."""
    SCHEDULED = 'SCHEDULED', 'Scheduled'
    CONFIRMED = 'CONFIRMED', 'Confirmed by Owner'
    COMPLETED = 'COMPLETED', 'Visit Completed'
    CANCELLED = 'CANCELLED', 'Cancelled'
    RESCHEDULED = 'RESCHEDULED', 'Rescheduled'


class NegotiationStatus(models.TextChoices):
    """Status of offer / counteroffer session."""
    ACTIVE = 'ACTIVE', 'In Negotiation'
    ACCEPTED = 'ACCEPTED', 'Offer Accepted'
    REJECTED = 'REJECTED', 'Offer Rejected'
    EXPIRED = 'EXPIRED', 'Offer Expired'


class TransactionStatus(models.TextChoices):
    """Status of property transaction lifecycle."""
    TOKEN_PENDING = 'TOKEN_PENDING', 'Token (Bayana) Pending'
    TOKEN_PAID = 'TOKEN_PAID', 'Token Paid'
    AGREEMENT_DRAFTED = 'AGREEMENT_DRAFTED', 'Agreement to Sell Drafted'
    ADVANCE_PAID = 'ADVANCE_PAID', 'Advance Amount Paid'
    REGISTRATION_SCHEDULED = 'REGISTRATION_SCHEDULED', 'Registry Date Scheduled'
    COMPLETED = 'COMPLETED', 'Registry Completed'
    CANCELLED = 'CANCELLED', 'Transaction Cancelled'


class PaymentStatus(models.TextChoices):
    """Payment transaction status."""
    PENDING = 'PENDING', 'Pending'
    INITIATED = 'INITIATED', 'Initiated'
    SUCCESS = 'SUCCESS', 'Successful'
    FAILED = 'FAILED', 'Failed'
    REFUNDED = 'REFUNDED', 'Refunded'



class AuthenticityLevel(models.TextChoices):
    """Data authenticity and provenance classification required by Part 5."""
    GOVERNMENT_VERIFIED = 'GOVERNMENT_VERIFIED', 'Government Verified'
    THIRD_PARTY_VERIFIED = 'THIRD_PARTY_VERIFIED', 'Third-Party Verified'
    PLATFORM_VERIFIED = 'PLATFORM_VERIFIED', 'Platform Verified'
    USER_SUBMITTED = 'USER_SUBMITTED', 'User Submitted'
    VERIFICATION_PENDING = 'VERIFICATION_PENDING', 'Verification Pending'
    UNABLE_TO_VERIFY = 'UNABLE_TO_VERIFY', 'Unable to Verify'


class DocumentReviewStatus(models.TextChoices):
    """Advocate/Verifier review status for uploaded property legal documents."""
    PENDING = 'PENDING', 'Pending Review'
    APPROVED = 'APPROVED', 'Approved'
    REVISION_REQUIRED = 'REVISION_REQUIRED', 'Revision Required'
    REJECTED = 'REJECTED', 'Rejected'


class GovernmentSourceAuthority(models.TextChoices):
    """Recognized Madhya Pradesh & Indore government portals/authorities."""
    MP_BHULEKH = 'MP_BHULEKH', 'MP Bhulekh (Commissioner Land Records, MP)'
    MP_RERA = 'MP_RERA', 'Madhya Pradesh RERA (rera.mp.gov.in)'
    MP_IGRS_SAMPADA = 'MP_IGRS_SAMPADA', 'MP Registration & Stamps / IGRS (SAMPADA)'
    IMC_INDORE = 'IMC_INDORE', 'Indore Municipal Corporation (e-NagarPalika)'
    IDA_INDORE = 'IDA_INDORE', 'Indore Development Authority (IDA)'
    MP_TNCP = 'MP_TNCP', 'MP Town & Country Planning (T&CP / ABPAS)'


class IntegrationMode(models.TextChoices):
    """Mode of verification against an official government authority."""
    LIVE_AUTHORIZED_API = 'LIVE_AUTHORIZED_API', 'Live Authorized Government API'
    PENDING_AUTHORIZATION_MANUAL_AUDIT = (
        'PENDING_AUTHORIZATION_MANUAL_AUDIT',
        'Pending API Authorization (Manual Official Reference Audit)',
    )


class RiskLevel(models.TextChoices):
    """Fraud & compliance risk classification."""
    LOW = 'LOW', 'Low Risk'
    MEDIUM = 'MEDIUM', 'Medium Risk'
    HIGH = 'HIGH', 'High Risk'
    CRITICAL = 'CRITICAL', 'Critical Risk'


class TaskStatus(models.TextChoices):
    """Transaction Room checklist task status."""
    PENDING = 'PENDING', 'Pending'
    IN_PROGRESS = 'IN_PROGRESS', 'In Progress'
    COMPLETED = 'COMPLETED', 'Completed'
    BLOCKED = 'BLOCKED', 'Blocked'
