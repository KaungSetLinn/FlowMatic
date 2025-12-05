
from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied

from projects.models import Project
from .serializers import TaskCreateSerializer, TaskResponseSerializer
from .models import Task


class TaskCreateView(APIView):
    """POST /api/projects/{project_id}/tasks - Create a new task for the project.

    Permissions: authenticated user assigned to the project.
    """
    permission_classes = [IsAuthenticated]

    def _get_project(self, project_id):
        project = get_object_or_404(Project.objects.prefetch_related('members'), project_id=project_id)
        if not project.members.filter(pk=self.request.user.pk).exists():
            raise PermissionDenied('You are not assigned to this project.')
        return project

    def post(self, request, project_id):
        project = self._get_project(project_id)
        serializer = TaskCreateSerializer(data=request.data, context={'project': project, 'request': request})
        serializer.is_valid(raise_exception=True)
        task = serializer.save()
        response_serializer = TaskResponseSerializer(task)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)


class TaskListView(APIView):
    """GET /api/projects/{project_id}/tasks - List all tasks for the project.

    Permissions: authenticated user assigned to the project.
    """
    permission_classes = [IsAuthenticated]

    def _get_project(self, project_id):
        project = get_object_or_404(Project.objects.prefetch_related('assigned_users'), project_id=project_id)
        if not project.assigned_users.filter(pk=self.request.user.pk).exists():
            raise PermissionDenied('You are not assigned to this project.')
        return project

    def get(self, request, project_id):
        project = self._get_project(project_id)
        tasks = Task.objects.filter(project=project).select_related('project').prefetch_related('assigned_users', 'parents__parent_task')
        serializer = TaskResponseSerializer(tasks, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)