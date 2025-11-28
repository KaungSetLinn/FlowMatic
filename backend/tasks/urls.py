from django.urls import path
from .views import TaskCreateView

urlpatterns = [
    path('projects/<uuid:project_id>/tasks/', TaskCreateView.as_view(), name='task-create'),
]