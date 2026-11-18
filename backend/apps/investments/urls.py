from django.urls import path
from apps.investments.views import InvestmentPoolListView, InvestmentPoolContributeView

app_name = 'investments'

urlpatterns = [
    path('pools/', InvestmentPoolListView.as_view(), name='pool-list'),
    path('pools/<uuid:id>/contribute/', InvestmentPoolContributeView.as_view(), name='pool-contribute'),
]
