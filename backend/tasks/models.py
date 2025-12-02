import uuid
from django.db import models
from django.conf import settings
from django.db.models import Q, CheckConstraint

class TaskStatus(models.TextChoices):
    TO_DO = "to_do", "To Do"
    PENDING = "pending", "Pending"
    READY = "ready", "Ready"
    IN_PROGRESS = "in_progress", "In Progress"
    IN_REVIEW = "in_review", "In Review"
    TESTING = "testing", "Testing"


class TaskPriority(models.TextChoices):
    LOW = "low", "Low"
    MEDIUM = "medium", "Medium"
    HIGH = "high", "High"


class Task(models.Model):
    task_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey('projects.Project', on_delete=models.CASCADE, related_name='tasks')

    name = models.TextField()
    description = models.TextField(blank=True)
    deadline = models.DateTimeField()

    status = models.CharField(
        max_length=20,
        choices=TaskStatus.choices,
        default=TaskStatus.TO_DO
    )
    priority = models.CharField(
        max_length=10,
        choices=TaskPriority.choices,
        default=TaskPriority.MEDIUM
    )

    assigned_users = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        through='TaskAssignedUser',
        related_name='tasks'
    )

    def __str__(self):
        return self.name

    class Meta:
        constraints = [
            CheckConstraint(
                check=Q(status__in=[choice.value for choice in TaskStatus]),
                name='valid_task_status'
            ),
            CheckConstraint(
                check=Q(priority__in=[choice.value for choice in TaskPriority]),
                name='valid_task_priority'
            ),
        ]


class TaskRelationType(models.TextChoices):
    START_TO_START = "start_to_start", "Start to Start"
    START_TO_FINISH = "start_to_finish", "Start to Finish"
    FINISH_TO_START = "finish_to_start", "Finish to Start"
    FINISH_TO_FINISH = "finish_to_finish", "Finish to Finish"


class TaskRelation(models.Model):
    parent_task = models.ForeignKey(
        Task,
        on_delete=models.CASCADE,
        related_name='children',
        null=True,
        blank=True
    )
    child_task = models.ForeignKey(
        Task,
        on_delete=models.CASCADE,
        related_name='parents',
        null=True,
        blank=True
    )
    relation_type = models.CharField(
        max_length=20,
        choices=TaskRelationType.choices
    )

    class Meta:
        unique_together = ('parent_task', 'child_task')
        constraints = [
            CheckConstraint(
                check=Q(relation_type__in=[choice.value for choice in TaskRelationType]),
                name='valid_relation_type'
            ),
        ]

class TaskAssignedUser(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    task = models.ForeignKey(Task, on_delete=models.CASCADE)

    class Meta:
        unique_together = ('user', 'task')
