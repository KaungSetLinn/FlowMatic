import uuid
from django.db import models
from django.db.models import Q, CheckConstraint
from projects.models import Project


class EventColor(models.TextChoices):
    RED = "red", "Red"
    BLUE = "blue", "Blue"
    GREEN = "green", "Green"
    ORANGE = "orange", "Orange"


class Event(models.Model):
    event_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='events')
    
    title = models.CharField(max_length=255)
    is_all_day = models.BooleanField(default=False)
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    color = models.CharField(
        max_length=10,
        choices=EventColor.choices,
        default=EventColor.BLUE
    )

    def __str__(self):
        return self.title

    class Meta:
        constraints = [
            CheckConstraint(
                condition=Q(color__in=[choice.value for choice in EventColor]),
                name='valid_event_color'
            ),
            CheckConstraint(
                condition=Q(end_date__gte=models.F('start_date')),
                name='valid_event_date_range'
            ),
        ]
