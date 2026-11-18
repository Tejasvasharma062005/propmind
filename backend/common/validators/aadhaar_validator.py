"""
Aadhaar number validator using the Verhoeff algorithm.
"""
import re
from django.core.exceptions import ValidationError

# Verhoeff algorithm multiplication table d
_D = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
    [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
    [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
    [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
    [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
    [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
    [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
    [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
    [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]
]

# Permutation table p
_P = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
    [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
    [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
    [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
    [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
    [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
    [7, 0, 4, 6, 9, 1, 3, 2, 5, 8]
]

# Inverse table inv
_INV = [0, 4, 3, 2, 1, 5, 6, 7, 8, 9]


def _validate_verhoeff(num_str: str) -> bool:
    """Validates number using Verhoeff checksum."""
    c = 0
    reversed_digits = [int(x) for x in reversed(num_str)]
    for i, digit in enumerate(reversed_digits):
        c = _D[c][_P[i % 8][digit]]
    return c == 0


def validate_aadhaar_number(value: str) -> str:
    """
    Validates a 12-digit Aadhaar number with format and Verhoeff checksum.
    Returns stripped 12-digit string.
    """
    if not value:
        raise ValidationError("Aadhaar number cannot be empty.")

    cleaned = re.sub(r'[\s\-]', '', str(value).strip())

    if not re.match(r'^\d{12}$', cleaned):
        raise ValidationError("Aadhaar must be a 12-digit numeric code.")

    # Aadhaar cannot start with 0 or 1
    if cleaned[0] in ('0', '1'):
        raise ValidationError("Invalid Aadhaar number: cannot start with 0 or 1.")

    if not _validate_verhoeff(cleaned):
        raise ValidationError("Invalid Aadhaar number: checksum verification failed.")

    return cleaned
