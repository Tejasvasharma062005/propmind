from decimal import Decimal, InvalidOperation
from django.db import transaction
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from common.utils.response import success_response, error_response
from common.services.audit_service import AuditService
from apps.investments.models import InvestmentPool, InvestorContribution
from apps.investments.serializers import (
    InvestmentPoolSerializer,
    InvestorContributionSerializer,
)


class InvestmentPoolListView(APIView):
    def get_permissions(self):
        return [AllowAny()] if self.request.method == 'GET' else [IsAuthenticated()]

    def get(self, request: Request) -> Response:
        qs = InvestmentPool.objects.all().select_related('property').prefetch_related('contributions__investor')
        return success_response(data=InvestmentPoolSerializer(qs, many=True).data)

    def post(self, request: Request) -> Response:
        serializer = InvestmentPoolSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(errors=serializer.errors)
        pool = serializer.save()
        AuditService.log(
            action='INVESTMENT_POOL_CREATED',
            target_type='InvestmentPool',
            target_id=pool.id,
            actor=request.user,
            request=request,
        )
        return success_response(
            data=InvestmentPoolSerializer(pool).data,
            message="Investment pool created.",
            status_code=status.HTTP_201_CREATED,
        )


class InvestmentPoolContributeView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request: Request, id: str) -> Response:
        pool = InvestmentPool.objects.select_for_update().filter(id=id).first()
        if not pool:
            return error_response("Investment pool not found.", status_code=status.HTTP_404_NOT_FOUND)
        if pool.status != 'OPEN':
            return error_response("This investment pool is closed.", status_code=status.HTTP_422_UNPROCESSABLE_ENTITY)

        try:
            amount = Decimal(str(request.data.get('amount')))
        except (InvalidOperation, TypeError, ValueError):
            return error_response("Valid contribution amount is required.")

        if amount < pool.minimum_investment:
            return error_response(f"Minimum contribution is ₹{pool.minimum_investment:,.0f}.")
        if pool.raised_amount + amount > pool.target_amount:
            return error_response("Contribution exceeds remaining target capacity of this pool.", status_code=status.HTTP_422_UNPROCESSABLE_ENTITY)

        units = int(amount // pool.minimum_investment)
        contribution = InvestorContribution.objects.create(
            pool=pool,
            investor=request.user,
            amount=amount,
            units_allocated=max(units, 1),
            status='CONFIRMED',
        )
        pool.raised_amount += amount
        if pool.raised_amount >= pool.target_amount:
            pool.status = 'FUNDED'
        pool.save(update_fields=['raised_amount', 'status', 'updated_at'])

        AuditService.log(
            action='INVESTMENT_CONTRIBUTION_CONFIRMED',
            target_type='InvestorContribution',
            target_id=contribution.id,
            actor=request.user,
            request=request,
            metadata={'pool_id': str(pool.id), 'amount': str(amount)},
        )
        return success_response(
            data=InvestorContributionSerializer(contribution).data,
            message="Investment contribution confirmed.",
            status_code=status.HTTP_201_CREATED,
        )
