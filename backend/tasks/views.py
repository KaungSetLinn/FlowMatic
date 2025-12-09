from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied

from projects.models import Project
from .serializers import (
    TaskCreateSerializer,
    TaskResponseSerializer,
    TaskCommentCreateSerializer,
    TaskCommentResponseSerializer,
)
from .models import Task, TaskComment


class TaskListCreateView(APIView):
    """GET/POST /api/projects/{project_id}/tasks - List and create tasks for the project.

    Permissions: authenticated user assigned to the project.
    """

    permission_classes = [IsAuthenticated]

    def _get_project(self, project_id):
        project = get_object_or_404(
            Project.objects.prefetch_related("members"), project_id=project_id
        )
        if not project.members.filter(pk=self.request.user.pk).exists():
            raise PermissionDenied("You are not assigned to this project.")
        return project

    def get(self, request, project_id):
        project = self._get_project(project_id)
        tasks = (
            Task.objects.filter(project=project)
            .select_related("project")
            .prefetch_related(
                "assigned_users", "parents__parent_task", "comments__user"
            )
        )
        serializer = TaskResponseSerializer(tasks, many=True)
        return Response({"tasks": serializer.data}, status=status.HTTP_200_OK)

    def post(self, request, project_id):
        project = self._get_project(project_id)
        serializer = TaskCreateSerializer(
            data=request.data, context={"project": project, "request": request}
        )
        serializer.is_valid(raise_exception=True)
        task = serializer.save()
        response_serializer = TaskResponseSerializer(task)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)


class TaskCommentCreateView(APIView):
    """POST /api/projects/{project_id}/tasks/{task_id}/comments - Create a comment for a task.

    Permissions: authenticated user assigned to the project.
    """

    permission_classes = [IsAuthenticated]

    def _get_project(self, project_id):
        project = get_object_or_404(
            Project.objects.prefetch_related("members"), project_id=project_id
        )
        if not project.members.filter(pk=self.request.user.pk).exists():
            raise PermissionDenied("You are not assigned to this project.")
        return project

    def _get_task(self, project, task_id):
        task = get_object_or_404(Task, task_id=task_id, project=project)
        return task

    def post(self, request, project_id, task_id):
        project = self._get_project(project_id)
        task = self._get_task(project, task_id)
        serializer = TaskCommentCreateSerializer(
            data=request.data, context={"task": task}
        )
        serializer.is_valid(raise_exception=True)
        comment = serializer.save()
        response_serializer = TaskCommentResponseSerializer(comment)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)


class TaskCommentListView(APIView):
    """GET /api/tasks/{task_id}/comments - List comments for a task.

    Permissions: authenticated user assigned to the task's project.
    """

    permission_classes = [IsAuthenticated]

    def _get_task(self, task_id):
        task = get_object_or_404(
            Task.objects.select_related("project").prefetch_related("project__members"),
            task_id=task_id,
        )
        if not task.project.members.filter(pk=self.request.user.pk).exists():
            raise PermissionDenied("You are not assigned to this project.")
        return task

    def get(self, request, task_id):
        task = self._get_task(task_id)
        comments = task.comments.select_related("user").all()
        serializer = TaskCommentResponseSerializer(comments, many=True)
        return Response({"comments": serializer.data}, status=status.HTTP_200_OK)
