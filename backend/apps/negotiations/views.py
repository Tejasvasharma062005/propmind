from decimal import Decimal, InvalidOperation
from django.db import transaction
from django.db.models import Q
from django.utils import timezone
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from common.utils.response import success_response, error_response
from common.services.audit_service import AuditService
from apps.negotiations.models import NegotiationSession, Offer
from apps.negotiations.serializers import NegotiationSessionSerializer
from apps.properties.models import Property
from apps.transactions.models import Transaction, TransactionTask
from apps.communications.models import Notification
from common.constants.choices import (
    NegotiationStatus,
    TransactionStatus,
    TaskStatus,
    Role,
)


def create_default_transaction_tasks(txn: Transaction) -> None:
    if txn.tasks.exists():
        return
    today = timezone.localdate()
    default_tasks = [
        (1, 'Verify Buyer & Seller KYC Identity Records', Role.ADMIN, today + timezone.timedelta(days=2)),
        (2, 'Deposit 10% Token (Bayana) into Escrow & Reconcile UTR', Role.BUYER, today + timezone.timedelta(days=5)),
        (3, 'Advocate 30-Year Title Check & Agreement to Sell Execution', Role.ADVOCATE, today + timezone.timedelta(days=12)),
        (4, 'Deposit 20% Advance Consideration Installment', Role.BUYER, today + timezone.timedelta(days=25)),
        (5, 'Sub-Registrar Indore Deed Execution & Possession Handover', Role.SELLER, today + timezone.timedelta(days=45)),
    ]
    TransactionTask.objects.bulk_create([
        TransactionTask(
            transaction=txn,
            order_index=idx,
            title=title,
            assigned_role=role,
            status=TaskStatus.PENDING,
            due_date=due,
        )
        for idx, title, role, due in default_tasks
    ])


class NegotiationSessionListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        user = request.user
        if user.is_staff or user.has_role(Role.ADMIN):
            qs = NegotiationSession.objects.all()
        else:
            qs = NegotiationSession.objects.filter(
                Q(buyer=user) | Q(seller=user) | Q(assigned_negotiator=user)
            ).distinct()
        qs = (
            qs.select_related('property', 'buyer', 'seller', 'assigned_negotiator')
            .prefetch_related('offers', 'offers__offered_by')
            .order_by('-updated_at')
        )
        return success_response(data=NegotiationSessionSerializer(qs, many=True).data)

    @transaction.atomic
    def post(self, request: Request) -> Response:
        property_id = request.data.get('property_id')
        raw_amount = request.data.get('amount')
        terms = request.data.get('terms', '')

        if not property_id or raw_amount is None:
            return error_response("Both 'property_id' and 'amount' are required.")
        try:
            amount = Decimal(str(raw_amount))
            if amount <= 0:
                raise ValueError
        except (InvalidOperation, ValueError):
            return error_response("Offer amount must be a positive number.")

        prop = Property.objects.select_related('created_by').filter(id=property_id).first()
        if not prop:
            return error_response("Property not found.", status_code=status.HTTP_404_NOT_FOUND)
        if prop.created_by_id == request.user.id:
            return error_response("You cannot place an offer on your own property.", status_code=status.HTTP_422_UNPROCESSABLE_ENTITY)

        session = NegotiationSession.objects.filter(
            property=prop,
            buyer=request.user,
            status=NegotiationStatus.ACTIVE,
        ).first()

        if session:
            session.offers.filter(status='PENDING').update(status='COUNTERED')
            session.current_offer_amount = amount
            session.save(update_fields=['current_offer_amount', 'updated_at'])
        else:
            session = NegotiationSession.objects.create(
                property=prop,
                buyer=request.user,
                seller=prop.created_by,
                status=NegotiationStatus.ACTIVE,
                current_offer_amount=amount,
            )

        Offer.objects.create(
            session=session,
            offered_by=request.user,
            amount=amount,
            terms=terms,
            status='PENDING',
        )
        AuditService.log(
            action='OFFER_SUBMITTED',
            target_type='NegotiationSession',
            target_id=session.id,
            actor=request.user,
            request=request,
            metadata={'property_id': str(prop.id), 'amount': str(amount)},
        )

        Notification.objects.create(
            user=prop.created_by,
            title=f"New Purchase Offer: {prop.title}",
            body=f"{request.user.name} offered ₹{amount:,.0f}.",
            notification_type="NEGOTIATION",
            action_url="/dashboard/transactions",
        )
        return success_response(
            data=NegotiationSessionSerializer(session).data,
            message="Offer submitted successfully.",
            status_code=status.HTTP_201_CREATED,
        )


class NegotiationCounterView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request: Request, id: str) -> Response:
        session = NegotiationSession.objects.select_related('property', 'buyer', 'seller').filter(id=id).first()
        if not session:
            return error_response("Negotiation session not found.", status_code=status.HTTP_404_NOT_FOUND)

        user = request.user
        if user.id not in (session.buyer_id, session.seller_id, session.assigned_negotiator_id) and not user.is_staff:
            return error_response("Not authorized for this negotiation.", status_code=status.HTTP_403_FORBIDDEN)
        if session.status != NegotiationStatus.ACTIVE:
            return error_response("Negotiation session is already closed.", status_code=status.HTTP_422_UNPROCESSABLE_ENTITY)

        try:
            amount = Decimal(str(request.data.get('amount')))
            if amount <= 0:
                raise ValueError
        except (InvalidOperation, ValueError, TypeError):
            return error_response("Counter-offer amount must be a positive number.")

        terms = request.data.get('terms', '')
        session.offers.filter(status='PENDING').update(status='COUNTERED')
        Offer.objects.create(
            session=session,
            offered_by=user,
            amount=amount,
            terms=terms,
            status='PENDING',
        )
        session.current_offer_amount = amount
        session.save(update_fields=['current_offer_amount', 'updated_at'])

        AuditService.log(
            action='COUNTER_OFFER_SUBMITTED',
            target_type='NegotiationSession',
            target_id=session.id,
            actor=user,
            request=request,
            metadata={'amount': str(amount)},
        )

        counterparty = session.buyer if user.id == session.seller_id else session.seller
        Notification.objects.create(
            user=counterparty,
            title=f"Counter-Offer on {session.property.title}",
            body=f"{user.name} counter-offered ₹{amount:,.0f}.",
            notification_type="NEGOTIATION",
            action_url="/dashboard/transactions",
        )
        return success_response(
            data=NegotiationSessionSerializer(session).data,
            message="Counter-offer submitted.",
        )


class NegotiationRespondView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request: Request, id: str) -> Response:
        session = NegotiationSession.objects.select_related('property', 'buyer', 'seller').filter(id=id).first()
        if not session:
            return error_response("Negotiation session not found.", status_code=status.HTTP_404_NOT_FOUND)

        user = request.user
        if user.id not in (session.buyer_id, session.seller_id) and not user.is_staff:
            return error_response("Not authorized for this negotiation.", status_code=status.HTTP_403_FORBIDDEN)
        if session.status != NegotiationStatus.ACTIVE:
            return error_response("Negotiation session is already closed.", status_code=status.HTTP_422_UNPROCESSABLE_ENTITY)

        decision = request.data.get('decision')
        if decision not in ('accept', 'reject'):
            return error_response("Decision must be 'accept' or 'reject'.")

        latest_offer = session.offers.filter(status='PENDING').order_by('-created_at').first()
        if latest_offer and latest_offer.offered_by_id == user.id and not user.is_staff:
            return error_response("You cannot accept or reject your own offer; wait for the counterparty.", status_code=status.HTTP_422_UNPROCESSABLE_ENTITY)

        if latest_offer and latest_offer.expires_at and latest_offer.expires_at <= timezone.now():
            latest_offer.status = 'EXPIRED'
            latest_offer.save(update_fields=['status', 'updated_at'])
            session.status = NegotiationStatus.EXPIRED
            session.save(update_fields=['status', 'updated_at'])
            return error_response("This offer has expired. Submit a fresh offer to continue.", status_code=status.HTTP_422_UNPROCESSABLE_ENTITY)

        if decision == 'accept':
            session.status = NegotiationStatus.ACCEPTED
            session.save(update_fields=['status', 'updated_at'])
            if latest_offer:
                latest_offer.status = 'ACCEPTED'
                latest_offer.save(update_fields=['status', 'updated_at'])

            agreed_price = session.current_offer_amount
            token_amount = (agreed_price * Decimal('0.10')).quantize(Decimal('0.01'))
            txn = Transaction.objects.create(
                property=session.property,
                negotiation_session=session,
                buyer=session.buyer,
                seller=session.seller,
                final_sale_price=agreed_price,
                token_amount=token_amount,
                status=TransactionStatus.TOKEN_PENDING,
            )
            create_default_transaction_tasks(txn)
            AuditService.log(
                action='OFFER_ACCEPTED_TRANSACTION_OPENED',
                target_type='Transaction',
                target_id=txn.id,
                actor=user,
                request=request,
                metadata={'session_id': str(session.id), 'final_sale_price': str(agreed_price)},
            )

            counterparty = session.buyer if user.id == session.seller_id else session.seller
            Notification.objects.create(
                user=counterparty,
                title=f"Offer Accepted: {session.property.title}",
                body=f"Offer of ₹{agreed_price:,.0f} accepted! Transaction Room #{str(txn.id)[:8].upper()} opened.",
                notification_type="TRANSACTION",
                action_url="/dashboard/transactions",
            )
            return success_response(
                data=NegotiationSessionSerializer(session).data,
                message="Offer accepted and Transaction Room created.",
            )
        else:
            session.status = NegotiationStatus.REJECTED
            session.save(update_fields=['status', 'updated_at'])
            if latest_offer:
                latest_offer.status = 'REJECTED'
                latest_offer.save(update_fields=['status', 'updated_at'])
            AuditService.log(
                action='OFFER_REJECTED',
                target_type='NegotiationSession',
                target_id=session.id,
                actor=user,
                request=request,
            )
            return success_response(
                data=NegotiationSessionSerializer(session).data,
                message="Offer rejected.",
            )
