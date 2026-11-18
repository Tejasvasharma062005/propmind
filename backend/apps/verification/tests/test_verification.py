from django.test import TestCase

class VerificationSmokeTests(TestCase):
    def test_imports(self):
        from apps.verification.models import PropertyPassport
        self.assertIsNotNone(PropertyPassport)
