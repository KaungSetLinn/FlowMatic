import uuid
from django.db import models
from django.conf import settings
from django.db.models import Q, CheckConstraint
from django.utils import timezone


class TaskStatus(models.TextChoices):
    TODO = "todo", "Todo"
    PENDING = "pending", "Pending"
    IN_PROGRESS = "in_progress", "In Progress"
    IN_REVIEW = "in_review", "In Review"
    TESTING = "testing", "Testing"
    DONE = "done", "Done"


class TaskPriority(models.TextChoices):
    LOW = "low", "Low"
    MEDIUM = "medium", "Medium"
    HIGH = "high", "High"


class Task(models.Model):
    task_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(
        "projects.Project", on_delete=models.CASCADE, related_name="tasks"
    )

    name = models.TextField()
    description = models.TextField(blank=True)
    start_date = models.DateTimeField(default=timezone.now)
    deadline = models.DateTimeField()

    status = models.CharField(
        max_length=20, choices=TaskStatus.choices, default=TaskStatus.TODO
    )
    priority = models.CharField(
        max_length=10, choices=TaskPriority.choices, default=TaskPriority.MEDIUM
    )

    assigned_users = models.ManyToManyField(
        settings.AUTH_USER_MODEL, through="TaskAssignedUser", related_name="tasks"
    )

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._old_status = self.status

    def __str__(self):
        return self.name

    class Meta:
        constraints = [
            CheckConstraint(
                condition=Q(
                    status__in=[
                        TaskStatus.TODO,
                        TaskStatus.PENDING,
                        TaskStatus.IN_PROGRESS,
                        TaskStatus.IN_REVIEW,
                        TaskStatus.TESTING,
                        TaskStatus.DONE,
                    ]
                ),
                name="valid_task_status",
            ),
            CheckConstraint(
                condition=Q(
                    priority__in=[
                        TaskPriority.LOW,
                        TaskPriority.MEDIUM,
                        TaskPriority.HIGH,
                    ]
                ),
                name="valid_task_priority",
            ),
        ]


class TaskRelationType(models.TextChoices):
    FINISH_TO_START = "FtS", "Finish to Start"
    FINISH_TO_FINISH = "FtF", "Finish to Finish"
    START_TO_START = "StS", "Start to Start"
    START_TO_FINISH = "StF", "Start to Finish"


class TaskRelation(models.Model):
    parent_task = models.ForeignKey(
        Task, on_delete=models.CASCADE, related_name="children", null=True, blank=True
    )
    child_task = models.ForeignKey(
        Task, on_delete=models.CASCADE, related_name="parents", null=True, blank=True
    )
    relation_type = models.CharField(max_length=20, choices=TaskRelationType.choices)

    class Meta:
        unique_together = ("parent_task", "child_task")
        constraints = [
            CheckConstraint(
                check=Q(
                    relation_type__in=[
                        TaskRelationType.FINISH_TO_START,
                        TaskRelationType.FINISH_TO_FINISH,
                        TaskRelationType.START_TO_START,
                        TaskRelationType.START_TO_FINISH,
                    ]
                ),
                name="valid_relation_type",
            ),
        ]


class TaskAssignedUser(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    task = models.ForeignKey(Task, on_delete=models.CASCADE)

    class Meta:
        unique_together = ("user", "task")


class TaskComment(models.Model):
    comment_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name="comments")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Comment by {self.user.username} on {self.task.name}"
