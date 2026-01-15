# projects/models.py
import uuid
from django.db import models
from django.conf import settings
from django.db.models import Q, CheckConstraint, F


class Project(models.Model):
    project_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    start_date = models.DateTimeField()
    deadline = models.DateTimeField()
    progress = models.PositiveIntegerField(default=0)

    status_choices = [
        ("planning", "Planning"),
        ("in_progress", "In Progress"),
        ("completed", "Completed"),
    ]
    status = models.CharField(max_length=20, choices=status_choices, default="planning")

    members = models.ManyToManyField(settings.AUTH_USER_MODEL, blank=True)

    def __str__(self):
        return self.title

    class Meta:
        constraints = [
            CheckConstraint(
                condition=Q(deadline__gte=F("start_date")), name="valid_project_dates"
            ),
            CheckConstraint(
                condition=Q(progress__gte=0) & Q(progress__lte=100),
                name="valid_project_progress",
            ),
        ]
