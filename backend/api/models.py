
import uuid
from django.db import models
from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.db.models import Q, CheckConstraint

# Create your models here.
class User(AbstractUser):
    # make username not unique
    username = models.CharField(max_length=150, unique=False, blank=True, null=True)

    # enforce unique email instead
    email = models.EmailField(unique=True)
    

    # optional profile picture
    profile_picture = models.ImageField(
        upload_to="profile_pics/",  # saved under MEDIA_ROOT/profile_pics/
        blank=True,
        null=True,
    )

    USERNAME_FIELD = "email"   # login with email
    REQUIRED_FIELDS = ["username"]  # keep username for display, but not unique


class Project(models.Model):
    project_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)

    assigned_users = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        through='ProjectAssignedUser',
        related_name='projects'
    )

    def __str__(self):
        return self.name


class ProjectAssignedUser(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    project = models.ForeignKey(Project, on_delete=models.CASCADE)

    class Meta:
        unique_together = ('user', 'project')


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
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='tasks')

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


class TaskAssignedUser(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    task = models.ForeignKey(Task, on_delete=models.CASCADE)

    class Meta:
        unique_together = ('user', 'task')


class TaskRelationType(models.TextChoices):
    START_TO_START = "start_to_start", "Start to Start"
    START_TO_FINISH = "start_to_finish", "Start to Finish"
    FINISH_TO_START = "finish_to_start", "Finish to Start"
    FINISH_TO_FINISH = "finish_to_finish", "Finish to Finish"


class TaskRelation(models.Model):
    parent_task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='children')
    child_task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='parents')
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
