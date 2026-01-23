import uuid
from django.db import models
from django.conf import settings
from projects.models import Project

class ProjectMemo(models.Model):

    class Color(models.TextChoices):
        YELLOW = 'yellow', 'Yellow'
        BLUE = 'blue', 'Blue'
        GREEN = 'green', 'Green'

    memo_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='memos')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    
    content = models.TextField()
    color = models.CharField(max_length=10, choices=Color.choices, default=Color.YELLOW)
    is_pinned = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        
        ordering = ['-is_pinned', '-created_at']

    def __str__(self):
        return f"Memo({self.memo_id}) - {self.content[:20]}"