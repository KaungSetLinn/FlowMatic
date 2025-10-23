from django.db import models
from django.conf import settings
import uuid

class Project(models.Model):
    project_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)

class Task(models.Model):
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
    ]
    STATUS_CHOICES = [
        ('todo', 'To Do'),
        ('in_progress', 'In Progress'),
        ('done', 'Done'),
    ]

    task_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='tasks')
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    deadline = models.DateTimeField()
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES)
    status = models.CharField(max_length=15, choices=STATUS_CHOICES)
    assigned_users = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='assigned_tasks')

class TaskRelation(models.Model):
    RELATION_CHOICES = [
        ('FtS', 'Finish to Start'),
        ('FtF', 'Finish to Finish'),
        ('StS', 'Start to Start'),
        ('StF', 'Start to Finish'),
    ]
    parent = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='child_relations')
    child = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='parent_relations')
    relation_type = models.CharField(max_length=3, choices=RELATION_CHOICES)