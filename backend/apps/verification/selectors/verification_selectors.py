from apps.verification.models import PropertyPassport
from typing import Optional

def get_passport_by_property_id(property_id: str) -> Optional[PropertyPassport]:
    return PropertyPassport.objects.filter(property_id=property_id).prefetch_related('items').first()
