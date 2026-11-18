"""
Serializers for user profiles, KYC records, professional profiles, and audit logs.
"""
from rest_framework import serializers
from apps.accounts.models import User, UserProfile
from apps.users.models import KYCRecord, ProfessionalProfile
from apps.accounts.serializers import UserProfileSerializer
from common.models import AuditLog
from common.constants.choices import KYCDocumentType, KYCStatus, Role, ProfessionType


class UserProfileUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating personal profile information."""
    name = serializers.CharField(source='user.name', required=False)

    class Meta:
        model = UserProfile
        fields = ['name', 'avatar', 'bio', 'city', 'state', 'address']

    def update(self, instance: UserProfile, validated_data: dict) -> UserProfile:
        user_data = validated_data.pop('user', {})
        if 'name' in user_data:
            instance.user.name = user_data['name']
            instance.user.save(update_fields=['name'])

        return super().update(instance, validated_data)


class KYCRecordSerializer(serializers.ModelSerializer):
    """Serializer for viewing KYC record status."""
    user_name = serializers.CharField(source='user.name', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    document_type_display = serializers.CharField(source='get_document_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    reviewed_by_name = serializers.CharField(source='reviewed_by.name', read_only=True, default='')

    class Meta:
        model = KYCRecord
        fields = [
            'id',
            'user',
            'user_name',
            'user_email',
            'document_type',
            'document_type_display',
            'status',
            'status_display',
            'reviewed_by',
            'reviewed_by_name',
            'rejection_reason',
            'created_at',
            'updated_at',
        ]
        read_only_fields = fields


class KYCSubmitSerializer(serializers.Serializer):
    """Serializer for submitting KYC documents."""
    document_type = serializers.ChoiceField(choices=KYCDocumentType.choices)
    document_number = serializers.CharField(max_length=50)
    front_image = serializers.ImageField()
    back_image = serializers.ImageField(required=False, allow_null=True)
    selfie_image = serializers.ImageField()


class KYCAdminReviewSerializer(serializers.Serializer):
    """Serializer for admin approval/rejection of a KYC record."""
    decision = serializers.ChoiceField(choices=['approve', 'reject'])
    rejection_reason = serializers.CharField(required=False, allow_blank=True, default='')


class ProfessionalProfileSerializer(serializers.ModelSerializer):
    """Serializer for professional credentials."""
    user_name = serializers.CharField(source='user.name', read_only=True)
    profession_display = serializers.CharField(source='get_profession_display', read_only=True)

    class Meta:
        model = ProfessionalProfile
        fields = [
            'id',
            'user',
            'user_name',
            'profession',
            'profession_display',
            'license_number',
            'license_document',
            'agency_name',
            'years_experience',
            'is_verified',
            'created_at',
        ]
        read_only_fields = ['id', 'user', 'is_verified', 'created_at']


class AssignRoleSerializer(serializers.Serializer):
    """Serializer for assigning a role to a user."""
    user_id = serializers.UUIDField()
    role = serializers.ChoiceField(choices=Role.choices)


class UserDetailSerializer(serializers.ModelSerializer):
    """Detailed user profile serializer including KYC & Professional data."""
    profile = UserProfileSerializer(read_only=True)
    professional_profile = ProfessionalProfileSerializer(read_only=True)
    roles = serializers.SerializerMethodField()
    kyc_status = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id',
            'email',
            'phone',
            'name',
            'is_active',
            'is_staff',
            'is_verified',
            'roles',
            'kyc_status',
            'profile',
            'professional_profile',
            'created_at',
        ]
        read_only_fields = fields

    def get_roles(self, obj: User) -> list[str]:
        return obj.roles_list

    def get_kyc_status(self, obj: User) -> str:
        latest = obj.kyc_records.first()
        return latest.status if latest else KYCStatus.PENDING


class AuditLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuditLog
        fields = [
            'id',
            'actor',
            'actor_email',
            'action',
            'target_type',
            'target_id',
            'ip_address',
            'user_agent',
            'metadata_json',
            'created_at',
        ]
        read_only_fields = fields
