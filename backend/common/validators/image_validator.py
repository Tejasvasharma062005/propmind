"""
Secure image validation and sanitisation for user uploads.

- Enforces size, format (by decoding, not by extension/MIME header) and dimension limits.
- Rejects decompression bombs and corrupt/polyglot files.
- Re-encodes the image, which strips ALL metadata (EXIF incl. GPS location,
  camera serials, embedded thumbnails) to protect owner privacy.
- Computes a SHA-256 checksum of the original bytes for duplicate detection.
"""
import hashlib
from dataclasses import dataclass
from io import BytesIO

from django.core.files.base import ContentFile
from PIL import Image, ImageOps, UnidentifiedImageError

from common.exceptions import ValidationError

MAX_IMAGE_BYTES = 10 * 1024 * 1024  # 10 MB
MIN_DIMENSION = 200
MAX_DIMENSION = 8000
MAX_PIXELS = 40_000_000

# Pillow format name -> (MIME type, file extension)
ALLOWED_IMAGE_FORMATS = {
    'JPEG': ('image/jpeg', 'jpg'),
    'PNG': ('image/png', 'png'),
    'WEBP': ('image/webp', 'webp'),
}


@dataclass
class ProcessedImage:
    content: ContentFile
    content_type: str
    extension: str
    size: int
    width: int
    height: int
    checksum_sha256: str


def process_uploaded_image(uploaded_file) -> ProcessedImage:
    """Validate, sanitise and re-encode an uploaded image file."""
    name = getattr(uploaded_file, 'name', 'image')

    if uploaded_file.size > MAX_IMAGE_BYTES:
        raise ValidationError(f"'{name}' exceeds the maximum size of {MAX_IMAGE_BYTES // (1024 * 1024)} MB.")

    raw = uploaded_file.read()
    checksum = hashlib.sha256(raw).hexdigest()

    try:
        with Image.open(BytesIO(raw)) as probe:
            probe.verify()  # structural integrity check
        img = Image.open(BytesIO(raw))
        img_format = img.format
        if img_format not in ALLOWED_IMAGE_FORMATS:
            raise ValidationError(f"'{name}' must be a JPEG, PNG or WebP image.")
        width, height = img.size
        if width * height > MAX_PIXELS:
            raise ValidationError(f"'{name}' has too many pixels.")
        img.load()
    except ValidationError:
        raise
    except (UnidentifiedImageError, OSError, SyntaxError, ValueError, Image.DecompressionBombError):
        raise ValidationError(f"'{name}' is not a valid image file.")

    # Apply camera orientation before metadata is discarded
    img = ImageOps.exif_transpose(img)
    width, height = img.size
    if min(width, height) < MIN_DIMENSION:
        raise ValidationError(f"'{name}' is too small (minimum {MIN_DIMENSION}px on each side).")
    if max(width, height) > MAX_DIMENSION:
        raise ValidationError(f"'{name}' is too large (maximum {MAX_DIMENSION}px on each side).")

    content_type, ext = ALLOWED_IMAGE_FORMATS[img_format]
    out = BytesIO()
    if img_format == 'JPEG':
        img.convert('RGB').save(out, format='JPEG', quality=88, optimize=True)
    elif img_format == 'PNG':
        img.save(out, format='PNG', optimize=True)
    else:
        img.save(out, format='WEBP', quality=88)
    data = out.getvalue()

    return ProcessedImage(
        content=ContentFile(data),
        content_type=content_type,
        extension=ext,
        size=len(data),
        width=width,
        height=height,
        checksum_sha256=checksum,
    )
