"""
Development settings for PropVault.
"""
from .base import *  # noqa

DEBUG = True

ALLOWED_HOSTS = ['*']

# Development Database (uses PostgreSQL when USE_POSTGRES=True or inside Docker, otherwise local SQLite)
if env.bool('USE_POSTGRES', default=False) or env('DB_HOST', default='localhost') == 'db':
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': env('DB_NAME', default='propvault_dev'),
            'USER': env('DB_USER', default='propvault'),
            'PASSWORD': env('DB_PASSWORD', default='propvault123'),
            'HOST': env('DB_HOST', default='localhost'),
            'PORT': env('DB_PORT', default='5432'),
        }
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }

CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
    }
}

# Debug Toolbar
INSTALLED_APPS += ['debug_toolbar']  # noqa
MIDDLEWARE = ['debug_toolbar.middleware.DebugToolbarMiddleware'] + MIDDLEWARE  # noqa
INTERNAL_IPS = ['127.0.0.1', 'localhost']

# Email — use real SMTP if EMAIL_HOST_USER and EMAIL_HOST_PASSWORD are set in .env; otherwise print to console
if env('EMAIL_HOST_USER', default='') and env('EMAIL_HOST_PASSWORD', default=''):  # noqa
    EMAIL_BACKEND = env('EMAIL_BACKEND', default='django.core.mail.backends.smtp.EmailBackend')  # noqa
else:
    EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

# CORS — allow all in dev
CORS_ALLOW_ALL_ORIGINS = True

# Disable S3 in dev
USE_S3 = False
