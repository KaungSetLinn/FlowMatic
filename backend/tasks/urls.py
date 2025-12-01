from django.urls import path
from .views import TaskCreateView, TaskListView

urlpatterns = [
    path('projects/<uuid:project_id>/tasks/', TaskCreateView.as_view(), name='task-create'),
    path('projects/<uuid:project_id>/tasks/', TaskListView.as_view(), name='task-list'),
]