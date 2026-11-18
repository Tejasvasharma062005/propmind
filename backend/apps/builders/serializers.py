from rest_framework import serializers
from apps.builders.models import BuilderProfile, Project, ProjectUnit


class BuilderProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = BuilderProfile
        fields = [
            'id',
            'company_name',
            'rera_number',
            'established_year',
            'total_projects_delivered',
            'website',
            'authenticity_level',
            'created_at',
        ]
        read_only_fields = ['id', 'authenticity_level', 'created_at']


class ProjectUnitSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectUnit
        fields = [
            'id',
            'project',
            'unit_number',
            'tower_or_block',
            'floor_number',
            'configuration',
            'carpet_area_sqft',
            'base_price',
            'status',
            'created_at',
        ]
        read_only_fields = ['id', 'project', 'created_at']


class ProjectSerializer(serializers.ModelSerializer):
    builder_name = serializers.CharField(source='builder.company_name', read_only=True)
    builder_rera = serializers.CharField(source='builder.rera_number', read_only=True)
    units = ProjectUnitSerializer(many=True, read_only=True)

    class Meta:
        model = Project
        fields = [
            'id',
            'builder',
            'builder_name',
            'builder_rera',
            'name',
            'locality',
            'city',
            'rera_registration_number',
            'total_units',
            'available_units',
            'launch_date',
            'possession_date',
            'status',
            'authenticity_level',
            'units',
            'created_at',
        ]
        read_only_fields = ['id', 'builder', 'authenticity_level', 'created_at']
