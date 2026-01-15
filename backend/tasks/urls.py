from django.urls import path
from .views import (
    TaskListCreateView,
    TaskDetailView,
    TaskCommentCreateView,
    TaskCommentListView,
)

urlpatterns = [
    path(
        "projects/<uuid:project_id>/tasks/",
        TaskListCreateView.as_view(),
        name="task-list-create",
    ),
    path(
        "projects/<uuid:project_id>/tasks/<uuid:task_id>/",
        TaskDetailView.as_view(),
        name="task-detail",
    ),
    path(
        "projects/<uuid:project_id>/tasks/<uuid:task_id>/comments/",
        TaskCommentCreateView.as_view(),
        name="task-comment-create",
    ),
    path(
        "tasks/<uuid:task_id>/comments/",
        TaskCommentListView.as_view(),
        name="task-comment-list",
    ),
]
