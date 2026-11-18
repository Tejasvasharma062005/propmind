"""
Builders and real estate developer project & unit inventory models.
"""
from django.db import models
from django.conf import settings
from common.models import BaseModel
from common.constants.choices import AuthenticityLevel


class BuilderProfile(BaseModel):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='builder_profile'
    )
    company_name = models.CharField(max_length=200)
    rera_number = models.CharField(max_length=100, unique=True)
    established_year = models.PositiveIntegerField(null=True, blank=True)
    total_projects_delivered = models.PositiveIntegerField(default=0)
    website = models.URLField(blank=True, default='')
    authenticity_level = models.CharField(
        max_length=30,
        choices=AuthenticityLevel.choices,
        default=AuthenticityLevel.USER_SUBMITTED,
    )

    class Meta:
        verbose_name = 'Builder Profile'
        verbose_name_plural = 'Builder Profiles'

    def __str__(self) -> str:
        return f"{self.company_name} (RERA: {self.rera_number})"


class Project(BaseModel):
    builder = models.ForeignKey(
        BuilderProfile,
        on_delete=models.CASCADE,
        related_name='projects'
    )
    name = models.CharField(max_length=200)
    locality = models.CharField(max_length=150)
    city = models.CharField(max_length=100, default='Indore')
    rera_registration_number = models.CharField(max_length=100)
    total_units = models.PositiveIntegerField(default=0)
    available_units = models.PositiveIntegerField(default=0)
    launch_date = models.DateField(null=True, blank=True)
    possession_date = models.DateField(null=True, blank=True)
    status = models.CharField(
        max_length=50,
        default='UNDER_CONSTRUCTION'
    )
    authenticity_level = models.CharField(
        max_length=30,
        choices=AuthenticityLevel.choices,
        default=AuthenticityLevel.USER_SUBMITTED,
    )

    class Meta:
        verbose_name = 'Project'
        verbose_name_plural = 'Projects'

    def __str__(self) -> str:
        return f"{self.name} by {self.builder.company_name}"


class ProjectUnit(BaseModel):
    """
    Individual unit inventory inside a Builder Project.
    """
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name='units',
    )
    unit_number = models.CharField(max_length=50)
    tower_or_block = models.CharField(max_length=50, blank=True, default='Tower A')
    floor_number = models.IntegerField(default=1)
    configuration = models.CharField(max_length=50, default='3 BHK')
    carpet_area_sqft = models.DecimalField(max_digits=10, decimal_places=2)
    base_price = models.DecimalField(max_digits=14, decimal_places=2)
    status = models.CharField(
        max_length=30,
        choices=[
            ('AVAILABLE', 'Available'),
            ('BOOKED', 'Booked'),
            ('SOLD', 'Sold'),
        ],
        default='AVAILABLE',
        db_index=True,
    )

    class Meta:
        verbose_name = 'Project Unit'
        verbose_name_plural = 'Project Units'
        unique_together = ('project', 'tower_or_block', 'unit_number')

    def __str__(self) -> str:
        return f"{self.project.name} - {self.tower_or_block} {self.unit_number} ({self.status})"
