from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied

from projects.models import Project
from .serializers import (
    TaskCreateSerializer,
    TaskUpdateSerializer,
    TaskResponseSerializer,
    TaskCommentCreateSerializer,
    TaskCommentResponseSerializer,
    TaskCommentListSerializer,
)
from .models import Task, TaskComment
from notifications.utils import create_task_notification, create_notification


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
            .order_by("deadline")
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

        # Create notifications for project members (except creator)
        for member in project.members.all():
            if member != request.user:
                create_task_notification(member, task, "created")

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
            data=request.data, context={"task": task, "request": request}
        )
        serializer.is_valid(raise_exception=True)
        comment = serializer.save()

        # Create notifications for task assigned users (except commenter)
        for assigned_user in task.assigned_users.all():
            if assigned_user != request.user:
                create_notification(
                    recipient=assigned_user,
                    title="新しいコメント",
                    message=f"タスク『{task.name}』に新しいコメントが追加されました",
                    notification_type="task",
                    related_object_id=task.task_id,
                )

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
    serializer = TaskCommentListSerializer(comments, many=True)
    return Response({"comments": serializer.data}, status=status.HTTP_200_OK)


class TaskDetailView(APIView):
    """GET/PUT/PATCH /api/projects/{project_id}/tasks/{task_id} - Get, update, and delete a task.

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

    def get(self, request, project_id, task_id):
        project = self._get_project(project_id)
        task = self._get_task(project, task_id)
        serializer = TaskResponseSerializer(task)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request, project_id, task_id):
        project = self._get_project(project_id)
        task = self._get_task(project, task_id)
        old_status = task.status

        serializer = TaskUpdateSerializer(
            data=request.data, context={"project": project, "request": request}
        )
        serializer.is_valid(raise_exception=True)

        # Get old assigned users before update
        old_assigned_users = set(task.assigned_users.all())

        # Get assigned users before update
        assigned_user_ids = serializer.validated_data.get("assigned_user_ids")
        users = serializer.validated_data.get("member_objects")

        # Update task fields
        if serializer.validated_data:
            for field, value in serializer.validated_data.items():
                if field not in ["assigned_user_ids", "member_objects"]:
                    setattr(task, field, value)
        task.save()

        # Update assigned users if provided
        if assigned_user_ids is not None and users is not None:
            task.assigned_users.set(users)

        # Get new assigned users
        new_assigned_users = set(task.assigned_users.all())
        newly_assigned_users = new_assigned_users - old_assigned_users

        # Create status change notification
        if old_status != task.status:
            for member in project.members.all():
                if member != request.user:
                    if task.status == "done":
                        create_task_notification(member, task, "completed")
                    else:
                        create_notification(
                            recipient=member,
                            title="タスク状態変更",
                            message=f"タスク『{task.name}』の状態が変更されました",
                            notification_type="task",
                            related_object_id=task.task_id,
                        )

        # Create assignment notification for newly assigned users
        for user in newly_assigned_users:
            if user != request.user:
                create_notification(
                    recipient=user,
                    title="タスク割り当て",
                    message=f"タスク『{task.name}』があなたに割り当てられました",
                    notification_type="task",
                    related_object_id=task.task_id,
                )

        task.refresh_from_db()
        response_serializer = TaskResponseSerializer(task)
        return Response(response_serializer.data, status=status.HTTP_200_OK)

    def patch(self, request, project_id, task_id):
        project = self._get_project(project_id)
        task = self._get_task(project, task_id)
        old_status = task.status

        serializer = TaskUpdateSerializer(
            data=request.data, context={"project": project, "request": request}
        )
        serializer.is_valid(raise_exception=True)

        # Get old assigned users before update
        old_assigned_users = set(task.assigned_users.all())

        # Get assigned users before update
        assigned_user_ids = serializer.validated_data.get("assigned_user_ids")
        users = serializer.validated_data.get("member_objects")

        # Update task fields (only provided fields)
        if serializer.validated_data:
            for field, value in serializer.validated_data.items():
                if field not in ["assigned_user_ids", "member_objects"]:
                    setattr(task, field, value)
        task.save()

        # Update assigned users if provided
        if assigned_user_ids is not None and users is not None:
            task.assigned_users.set(users)

        # Get new assigned users
        new_assigned_users = set(task.assigned_users.all())
        newly_assigned_users = new_assigned_users - old_assigned_users

        # Create status change notification
        if old_status != task.status:
            for member in project.members.all():
                if member != request.user:
                    if task.status == "done":
                        create_task_notification(member, task, "completed")
                    else:
                        create_notification(
                            recipient=member,
                            title="タスク状態変更",
                            message=f"タスク『{task.name}』の状態が変更されました",
                            notification_type="task",
                            related_object_id=task.task_id,
                        )

        # Create assignment notification for newly assigned users
        for user in newly_assigned_users:
            if user != request.user:
                create_notification(
                    recipient=user,
                    title="タスク割り当て",
                    message=f"タスク『{task.name}』があなたに割り当てられました",
                    notification_type="task",
                    related_object_id=task.task_id,
                )

        task.refresh_from_db()
        response_serializer = TaskResponseSerializer(task)
        return Response(response_serializer.data, status=status.HTTP_200_OK)
