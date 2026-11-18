"""
Testing settings for PropVault.
"""
from .base import *  # noqa

DEBUG = True
TESTING = True

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
    }
}

# Fast password hashing for tests
PASSWORD_HASHERS = [
    'django.contrib.auth.hashers.MD5PasswordHasher',
]

# Disable cache in tests
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
    }
}

# Use console email backend
EMAIL_BACKEND = 'django.core.mail.backends.locmem.EmailBackend'

# Disable Celery in tests (run tasks eagerly)
CELERY_TASK_ALWAYS_EAGER = True
CELERY_TASK_EAGER_PROPAGATES = True

# Never touch S3 or local disk in tests
USE_S3 = False
STORAGES = {
    'default': {'BACKEND': 'django.core.files.storage.InMemoryStorage'},
    'staticfiles': {'BACKEND': 'django.contrib.staticfiles.storage.StaticFilesStorage'},
}

# Disable throttling side effects in tests
REST_FRAMEWORK = {**REST_FRAMEWORK, 'DEFAULT_THROTTLE_RATES': {  # noqa: F405
    'auth_register': '1000/min',
    'auth_login': '1000/min',
    'auth_otp': '1000/min',
    'kyc_submit': '1000/min',
    'listing_create': '1000/min',
    'listing_media_upload': '1000/min',
    'listing_report': '1000/min',
}}
