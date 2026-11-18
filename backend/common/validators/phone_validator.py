"""
Indian mobile phone number validator and normalizer.
"""
import re
from django.core.exceptions import ValidationError

# Indian mobile: 10 digits starting with 6, 7, 8, or 9; optionally prefixed with +91 or 0
INDIAN_PHONE_REGEX = re.compile(r'^(?:\+91|91|0)?[6-9]\d{9}$')


def normalize_phone(phone: str) -> str:
    """
    Normalizes any valid Indian phone number into E.164 format: +91XXXXXXXXXX
    """
    cleaned = re.sub(r'[\s\-\(\)]', '', phone.strip())
    if cleaned.startswith('+91'):
        cleaned = cleaned[3:]
    elif cleaned.startswith('91') and len(cleaned) == 12:
        cleaned = cleaned[2:]
    elif cleaned.startswith('0') and len(cleaned) == 11:
        cleaned = cleaned[1:]
        
    return f"+91{cleaned}"


def validate_indian_phone(value: str) -> str:
    """
    Validates that a string is a valid 10-digit Indian mobile number.
    Returns normalized E.164 phone string.
    """
    if not value:
        raise ValidationError("Phone number cannot be empty.")

    cleaned = re.sub(r'[\s\-\(\)]', '', str(value).strip())
    if not INDIAN_PHONE_REGEX.match(cleaned):
        raise ValidationError(
            f"'{value}' is not a valid 10-digit Indian mobile number. It must start with 6, 7, 8, or 9."
        )

    return normalize_phone(cleaned)
