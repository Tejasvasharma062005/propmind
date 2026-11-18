from django.contrib import admin
from apps.negotiations.models import NegotiationSession, Offer

admin.site.register(NegotiationSession)
admin.site.register(Offer)
