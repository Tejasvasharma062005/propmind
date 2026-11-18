from django.contrib import admin
from apps.investments.models import InvestmentPool, InvestorContribution

admin.site.register(InvestmentPool)
admin.site.register(InvestorContribution)
