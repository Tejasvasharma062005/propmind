import uuid
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
from apps.transactions.models import Transaction, TransactionTask
from apps.transactions.serializers import TransactionSerializer, TransactionTaskSerializer
from apps.negotiations.views import create_default_transaction_tasks
from apps.payments.models import Payment
from apps.legal.models import LegalDeed
from apps.listings.models import Listing
from apps.properties.models import PropertyOwner
from common.constants.choices import (
    TransactionStatus,
    PaymentStatus,
    PropertyStatus,
    ListingStatus,
    TaskStatus,
    Role,
)


def _can_access_transaction(user, txn: Transaction) -> bool:
    return bool(
        user.is_staff
        or user.has_role(Role.ADMIN)
        or user.id in (txn.buyer_id, txn.seller_id, txn.assigned_advocate_id, txn.assigned_agent_id)
    )


def _complete_task_by_order(txn: Transaction, order_index: int, user) -> None:
    TransactionTask.objects.filter(transaction=txn, order_index=order_index).update(
        status=TaskStatus.COMPLETED,
        completed_by=user,
        completed_at=timezone.now(),
    )


class TransactionListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        user = request.user
        if user.is_staff or user.has_role(Role.ADMIN):
            qs = Transaction.objects.all()
        else:
            qs = Transaction.objects.filter(
                Q(buyer=user)
                | Q(seller=user)
                | Q(assigned_advocate=user)
                | Q(assigned_agent=user)
            ).distinct()

        for t in qs:
            create_default_transaction_tasks(t)

        qs = (
            qs.select_related('property', 'buyer', 'seller', 'assigned_advocate', 'assigned_agent')
            .prefetch_related('payments', 'deeds', 'tasks__completed_by')
            .order_by('-created_at')
        )
        return success_response(data=TransactionSerializer(qs, many=True).data)

    @transaction.atomic
    def post(self, request: Request) -> Response:
        serializer = TransactionSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(errors=serializer.errors)
        txn = serializer.save(buyer=request.user)
        create_default_transaction_tasks(txn)
        AuditService.log(
            action='TRANSACTION_CREATED',
            target_type='Transaction',
            target_id=txn.id,
            actor=request.user,
            request=request,
        )
        return success_response(
            data=TransactionSerializer(txn).data,
            message="Transaction Room created.",
            status_code=status.HTTP_201_CREATED,
        )


class TransactionMilestoneView(APIView):
    """
    Advances a transaction through its escrow and conveyance lifecycle milestones
    with UTR/invoice tracking, task completion, and immutable audit logging.
    """
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request: Request, id: str) -> Response:
        txn = Transaction.objects.select_related('property', 'buyer', 'seller').filter(id=id).first()
        if not txn:
            return error_response("Transaction not found.", status_code=status.HTTP_404_NOT_FOUND)

        user = request.user
        if not _can_access_transaction(user, txn):
            return error_response("Not authorized for this transaction.", status_code=status.HTTP_403_FORBIDDEN)

        create_default_transaction_tasks(txn)

        action = request.data.get('action')
        payment_method = request.data.get('payment_method', 'ESCROW_NEFT')
        utr_number = (request.data.get('utr_number') or f"UTR-IND-{uuid.uuid4().hex[:8].upper()}").strip()
        invoice_no = f"INV-PV-{timezone.now().strftime('%Y%m')}-{uuid.uuid4().hex[:6].upper()}"
        now = timezone.now()

        if action == 'PAY_TOKEN':
            amount = txn.token_amount or (txn.final_sale_price * Decimal('0.10')).quantize(Decimal('0.01'))
            Payment.objects.create(
                transaction=txn,
                payer=txn.buyer,
                amount=amount,
                purpose='TOKEN_PAYMENT',
                payment_method=payment_method,
                invoice_number=invoice_no,
                utr_number=utr_number,
                gateway_order_id=f"ORD_{uuid.uuid4().hex[:10].upper()}",
                gateway_payment_id=f"PAY_{uuid.uuid4().hex[:12].upper()}",
                status=PaymentStatus.SUCCESS,
                verified_by=user,
                verified_at=now,
            )
            txn.token_amount = amount
            txn.token_paid_at = now
            txn.status = TransactionStatus.TOKEN_PAID
            txn.save(update_fields=['token_amount', 'token_paid_at', 'status', 'updated_at'])
            _complete_task_by_order(txn, 1, user)
            _complete_task_by_order(txn, 2, user)
            msg = f"Token deposit recorded in PropVault Escrow (Ref: {utr_number})."

        elif action == 'DRAFT_AGREEMENT':
            draft_text = request.data.get(
                'draft_content',
                f"AGREEMENT TO SELL (BAYANA)\nProperty: {txn.property.title} ({txn.property.locality}, {txn.property.city})\n"
                f"Seller: {txn.seller.name}\nBuyer: {txn.buyer.name}\n"
                f"Agreed Consideration: INR {txn.final_sale_price:,.2f}\n"
                f"Token Paid: INR {txn.token_amount:,.2f}",
            )
            LegalDeed.objects.create(
                transaction=txn,
                deed_type='AGREEMENT_TO_SELL',
                draft_content=draft_text,
                is_signed=True,
            )
            txn.agreement_signed_at = now
            txn.status = TransactionStatus.AGREEMENT_DRAFTED
            txn.save(update_fields=['agreement_signed_at', 'status', 'updated_at'])
            _complete_task_by_order(txn, 3, user)
            msg = "Agreement to Sell drafted and digitally executed."

        elif action == 'PAY_ADVANCE':
            raw_amount = request.data.get('amount')
            try:
                amount = Decimal(str(raw_amount)) if raw_amount else (txn.final_sale_price * Decimal('0.20')).quantize(Decimal('0.01'))
            except (InvalidOperation, ValueError):
                return error_response("Invalid advance amount.")
            Payment.objects.create(
                transaction=txn,
                payer=txn.buyer,
                amount=amount,
                purpose='ADVANCE_PAYMENT',
                payment_method=payment_method,
                invoice_number=invoice_no,
                utr_number=utr_number,
                gateway_order_id=f"ORD_{uuid.uuid4().hex[:10].upper()}",
                gateway_payment_id=f"PAY_{uuid.uuid4().hex[:12].upper()}",
                status=PaymentStatus.SUCCESS,
                verified_by=user,
                verified_at=now,
            )
            txn.advance_amount = (txn.advance_amount or Decimal('0')) + amount
            txn.status = TransactionStatus.ADVANCE_PAID
            txn.save(update_fields=['advance_amount', 'status', 'updated_at'])
            _complete_task_by_order(txn, 4, user)
            msg = f"Advance installment credited to escrow (Ref: {utr_number})."

        elif action == 'SCHEDULE_REGISTRY':
            reg_date = request.data.get('registration_date') or (timezone.localdate() + timezone.timedelta(days=7))
            sub_registrar = request.data.get('sub_registrar_office') or txn.sub_registrar_office
            txn.registration_date = reg_date
            txn.sub_registrar_office = sub_registrar
            txn.status = TransactionStatus.REGISTRATION_SCHEDULED
            txn.save(update_fields=['registration_date', 'sub_registrar_office', 'status', 'updated_at'])
            msg = f"Conveyance appointment scheduled at {sub_registrar}."

        elif action == 'COMPLETE_REGISTRY':
            deed_no = (
                request.data.get('deed_registration_number')
                or txn.deed_registration_number
                or f"MPIGR-IND-{timezone.now().year}-{uuid.uuid4().hex[:6].upper()}"
            ).strip()
            balance = max(
                txn.final_sale_price - (txn.token_amount or Decimal('0')) - (txn.advance_amount or Decimal('0')),
                Decimal('0'),
            )
            if balance > 0:
                Payment.objects.create(
                    transaction=txn,
                    payer=txn.buyer,
                    amount=balance,
                    purpose='FINAL_SETTLEMENT',
                    payment_method=payment_method,
                    invoice_number=invoice_no,
                    utr_number=utr_number,
                    gateway_order_id=f"ORD_{uuid.uuid4().hex[:10].upper()}",
                    gateway_payment_id=f"PAY_{uuid.uuid4().hex[:12].upper()}",
                    status=PaymentStatus.SUCCESS,
                    verified_by=user,
                    verified_at=now,
                )
            LegalDeed.objects.create(
                transaction=txn,
                deed_type='SALE_DEED_REGISTRY',
                draft_content=(
                    f"REGISTERED CONVEYANCE DEED ({deed_no}) — {txn.sub_registrar_office}\n"
                    f"Property: {txn.property.title}\nFinal Consideration: INR {txn.final_sale_price:,.2f}"
                ),
                is_signed=True,
            )
            txn.deed_registration_number = deed_no
            txn.handover_completed_at = now
            txn.status = TransactionStatus.COMPLETED
            if not txn.registration_date:
                txn.registration_date = timezone.localdate()
            txn.save(
                update_fields=[
                    'deed_registration_number',
                    'handover_completed_at',
                    'status',
                    'registration_date',
                    'updated_at',
                ]
            )
            _complete_task_by_order(txn, 5, user)

            # Transfer ownership record and mark property + listing as SOLD
            prop = txn.property
            prop.status = PropertyStatus.SOLD
            prop.save(update_fields=['status', 'updated_at'])
            PropertyOwner.objects.filter(property=prop).update(is_primary=False, ownership_percentage=Decimal('0.00'))
            PropertyOwner.objects.update_or_create(
                property=prop,
                user=txn.buyer,
                defaults={'ownership_percentage': Decimal('100.00'), 'is_primary': True},
            )
            Listing.objects.filter(property=prop).exclude(status=ListingStatus.WITHDRAWN).update(status=ListingStatus.SOLD)
            msg = f"Registry completed ({deed_no}), ownership transferred, and escrow released."

        else:
            return error_response("Invalid milestone action.")

        AuditService.log(
            action=f"TRANSACTION_MILESTONE_{action}",
            target_type='Transaction',
            target_id=txn.id,
            actor=user,
            request=request,
            metadata={
                'status': txn.status,
                'utr_number': utr_number,
                'deed_registration_number': txn.deed_registration_number,
            },
        )
        txn.refresh_from_db()
        return success_response(data=TransactionSerializer(txn).data, message=msg)


class TransactionTaskDetailView(APIView):
    """
    Allows transaction participants to update a TransactionTask checklist item.
    """
    permission_classes = [IsAuthenticated]

    def patch(self, request: Request, id: str, task_id: str) -> Response:
        txn = Transaction.objects.filter(id=id).first()
        if not txn:
            return error_response("Transaction not found.", status_code=status.HTTP_404_NOT_FOUND)
        if not _can_access_transaction(request.user, txn):
            return error_response("Not authorized for this transaction.", status_code=status.HTTP_403_FORBIDDEN)

        task = TransactionTask.objects.filter(id=task_id, transaction=txn).first()
        if not task:
            return error_response("Transaction task not found.", status_code=status.HTTP_404_NOT_FOUND)

        new_status = request.data.get('status', task.status)
        notes = request.data.get('notes', task.notes)
        task.status = new_status
        task.notes = notes
        if new_status == TaskStatus.COMPLETED:
            task.completed_by = request.user
            task.completed_at = timezone.now()
        task.save()
        return success_response(data=TransactionTaskSerializer(task).data, message="Task updated.")
