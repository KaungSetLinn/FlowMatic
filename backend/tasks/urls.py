from django.urls import path
from .views import TaskCreateAPIView

urlpatterns = [
    path('projects/<uuid:project_id>/tasks', TaskCreateAPIView.as_view(), name='task-create'),
]
