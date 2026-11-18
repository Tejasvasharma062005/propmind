import hashlib
import hmac
import uuid
from django.conf import settings
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
from apps.payments.models import Payment
from apps.payments.serializers import PaymentSerializer
from common.constants.choices import PaymentStatus, Role


def _generate_invoice_number() -> str:
    return f"INV-PV-{timezone.now().strftime('%Y%m')}-{uuid.uuid4().hex[:6].upper()}"


class PaymentListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        user = request.user
        if user.is_staff or user.has_role(Role.ADMIN):
            qs = Payment.objects.all()
        else:
            qs = Payment.objects.filter(
                Q(payer=user) | Q(transaction__seller=user) | Q(transaction__buyer=user)
            ).distinct()
        return success_response(
            data=PaymentSerializer(qs.select_related('payer', 'transaction', 'verified_by'), many=True).data
        )

    @transaction.atomic
    def post(self, request: Request) -> Response:
        """
        Initiates a payment order (`INITIATED`) or submits a bank escrow NEFT/RTGS UTR (`PENDING` / verified).
        """
        amount = request.data.get('amount')
        purpose = request.data.get('purpose', 'TOKEN_PAYMENT')
        transaction_id = request.data.get('transaction')
        payment_method = request.data.get('payment_method', 'ESCROW_NEFT')
        utr_number = (request.data.get('utr_number') or '').strip()

        order_id = f"ORD_{uuid.uuid4().hex[:10].upper()}"
        payment = Payment.objects.create(
            transaction_id=transaction_id,
            payer=request.user,
            amount=amount,
            purpose=purpose,
            payment_method=payment_method,
            invoice_number=_generate_invoice_number(),
            utr_number=utr_number,
            status=PaymentStatus.INITIATED if not utr_number else PaymentStatus.PENDING,
            gateway_order_id=order_id,
        )
        AuditService.log(
            action='PAYMENT_ORDER_INITIATED',
            target_type='Payment',
            target_id=payment.id,
            actor=request.user,
            request=request,
            metadata={
                'amount': str(amount),
                'purpose': purpose,
                'invoice_number': payment.invoice_number,
                'gateway_order_id': order_id,
            },
        )
        return success_response(
            data=PaymentSerializer(payment).data,
            message="Payment order initiated.",
            status_code=status.HTTP_201_CREATED,
        )


class PaymentVerifySignatureView(APIView):
    """
    Verifies a Razorpay checkout / webhook HMAC-SHA256 signature and marks the
    matching payment order as SUCCESS.
    """
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request: Request) -> Response:
        order_id = request.data.get('razorpay_order_id', '')
        payment_id = request.data.get('razorpay_payment_id', '')
        signature = request.data.get('razorpay_signature', '')

        if not (order_id and payment_id and signature):
            return error_response("razorpay_order_id, razorpay_payment_id, and razorpay_signature are required.")

        secret = getattr(settings, 'RAZORPAY_KEY_SECRET', '') or settings.SECRET_KEY
        expected = hmac.new(
            secret.encode('utf-8'),
            f"{order_id}|{payment_id}".encode('utf-8'),
            hashlib.sha256,
        ).hexdigest()

        if not hmac.compare_digest(expected, signature):
            return error_response("Payment signature verification failed.", status_code=status.HTTP_400_BAD_REQUEST)

        now = timezone.now()
        Payment.objects.filter(gateway_order_id=order_id).update(
            gateway_payment_id=payment_id,
            status=PaymentStatus.SUCCESS,
            verified_by=request.user,
            verified_at=now,
        )
        AuditService.log(
            action='PAYMENT_SIGNATURE_VERIFIED',
            target_type='PaymentOrder',
            target_id=order_id,
            actor=request.user,
            request=request,
            metadata={'razorpay_payment_id': payment_id},
        )
        return success_response(message="Payment signature verified.")


class PaymentReconcileView(APIView):
    """
    Reconciles a bank escrow NEFT/RTGS UTR or payment order (`PENDING`/`INITIATED` -> `SUCCESS`).
    """
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request: Request, id: str) -> Response:
        payment = Payment.objects.select_related('transaction').filter(id=id).first()
        if not payment:
            return error_response("Payment record not found.", status_code=status.HTTP_404_NOT_FOUND)

        user = request.user
        can_reconcile = (
            user.is_staff
            or user.has_role(Role.ADMIN)
            or (payment.transaction and payment.transaction.seller_id == user.id)
        )
        if not can_reconcile:
            return error_response("Only the seller or escrow administrator can reconcile this payment.", status_code=status.HTTP_403_FORBIDDEN)

        utr = (request.data.get('utr_number') or payment.utr_number or f"UTR-{uuid.uuid4().hex[:10].upper()}").strip()
        payment.utr_number = utr
        payment.gateway_payment_id = payment.gateway_payment_id or f"PAY_{uuid.uuid4().hex[:10].upper()}"
        payment.status = PaymentStatus.SUCCESS
        payment.verified_by = user
        payment.verified_at = timezone.now()
        payment.save()

        AuditService.log(
            action='PAYMENT_RECONCILED',
            target_type='Payment',
            target_id=payment.id,
            actor=user,
            request=request,
            metadata={'utr_number': utr, 'amount': str(payment.amount)},
        )
        return success_response(data=PaymentSerializer(payment).data, message="Escrow payment reconciled.")
