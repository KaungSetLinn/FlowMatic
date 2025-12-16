from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from rest_framework.views import APIView

from .models import Project
from .serializers import (
    ProjectResponseSerializer,
    ProjectListSerializer,
    ProjectCreateSerializer,
)
from notifications.utils import create_project_notification

User = get_user_model()


class ProjectListCreateView(APIView):
    """GET /api/projects/ - プロジェクト一覧を取得
    POST /api/projects/ - 新しいプロジェクトを作成する
    """


    permission_classes = [IsAuthenticated]

    def _get_queryset_for_user(self):
        user = self.request.user
        if user.is_staff:
            return Project.objects.all().order_by("-start_date")
        return Project.objects.filter(members=user).order_by("-start_date")
            return Project.objects.all().order_by("-start_date")
        return Project.objects.filter(members=user).order_by("-start_date")

    def get(self, request, *args, **kwargs):
        try:
            page = int(
                request.query_params.get("p", request.query_params.get("page", "1"))
                request.query_params.get("p", request.query_params.get("page", "1"))
            )
            per_page = int(request.query_params.get("per_page", "20"))
            per_page = int(request.query_params.get("per_page", "20"))
        except ValueError:
            return Response(
                {"detail": "p and per_page must be integers."},
                {"detail": "p and per_page must be integers."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if page < 1 or per_page < 1:
            return Response(
                {"detail": "p and per_page must be greater than zero."},
                {"detail": "p and per_page must be greater than zero."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        queryset = self._get_queryset_for_user().order_by("-start_date")
        queryset = self._get_queryset_for_user().order_by("-start_date")
        start = (page - 1) * per_page
        end = start + per_page
        projects = list(queryset[start:end])

        serializer = ProjectListSerializer(projects, many=True)
        return Response(
            {"projects": serializer.data, "page": page, "per_page": per_page}
            {"projects": serializer.data, "page": page, "per_page": per_page}
        )

    def post(self, request, *args, **kwargs):
        serializer = ProjectCreateSerializer(
            data=request.data, context={"request": request}
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        project = serializer.save()

        # Create notifications for project members (except creator)
        for member in project.members.all():
            if member != request.user:
                create_project_notification(member, project, "created")

        response_serializer = ProjectResponseSerializer(project)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)


class ProjectDetailView(APIView):
    """GET /api/projects/{project_id} - プロジェクト取得
    PUT/PATCH /api/projects/{project_id} - プロジェクト更新
    DELETE /api/projects/{project_id} - プロジェクト削除
    """


    permission_classes = [IsAuthenticated]

    def _get_project(self, project_id: str) -> Project:
        project = get_object_or_404(
            Project.objects.prefetch_related("members"), project_id=project_id
            Project.objects.prefetch_related("members"), project_id=project_id
        )
        return project

    def _assert_assigned_or_staff(self, project: Project):
        user = self.request.user
        if not (project.members.filter(pk=user.pk).exists() or user.is_staff):
            raise PermissionDenied("You are not assigned to this project.")
            raise PermissionDenied("You are not assigned to this project.")

    def get(self, request, project_id: str) -> Response:
        project = self._get_project(project_id)
        self._assert_assigned_or_staff(project)
        serializer = ProjectResponseSerializer(project)
        return Response(serializer.data)

    def put(self, request, project_id: str) -> Response:
        project = self._get_project(project_id)
        self._assert_assigned_or_staff(project)
        
        # Get current members before update
        old_member_ids = set(project.members.values_list('pk', flat=True))
        
        serializer = ProjectResponseSerializer(
            project, data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        # Get new members after update
        new_member_ids = set(project.members.values_list('pk', flat=True))
        new_members = new_member_ids - old_member_ids
        
        # Create notifications for new members
        for member_id in new_members:
            member = User.objects.get(pk=member_id)
            if member != request.user:
                create_project_notification(member, project, "member_added")
        
        # Create general update notifications for existing members (except updater)
        for member in project.members.all():
            if member != request.user and member.pk not in new_members:
                create_project_notification(member, project, "updated")

        return Response(serializer.data)

    def patch(self, request, project_id: str) -> Response:
        project = self._get_project(project_id)
        self._assert_assigned_or_staff(project)
        
        # Get current members before update
        old_member_ids = set(project.members.values_list('pk', flat=True))
        
        serializer = ProjectResponseSerializer(
            project, data=request.data, partial=True, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        # Get new members after update
        new_member_ids = set(project.members.values_list('pk', flat=True))
        new_members = new_member_ids - old_member_ids
        
        # Create notifications for new members
        for member_id in new_members:
            member = User.objects.get(pk=member_id)
            if member != request.user:
                create_project_notification(member, project, "member_added")
        
        # Create general update notifications for existing members (except updater)
        for member in project.members.all():
            if member != request.user and member.pk not in new_members:
                create_project_notification(member, project, "updated")

        return Response(serializer.data)

    def delete(self, request, project_id: str) -> Response:
        project = self._get_project(project_id)
        self._assert_assigned_or_staff(project)
        project.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
