from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from projects.models import Project
from .models import Event
from .serializers import EventSerializer


class ProjectEventListCreateView(APIView):
	"""
	GET /api/projects/{project_id}/events - プロジェクトのイベント一覧を取得
	POST /api/projects/{project_id}/events - 新しいeventを作成する
	"""
	permission_classes = [IsAuthenticated]

	def _get_project(self, project_id: str) -> Project:
		project = get_object_or_404(Project.objects.prefetch_related('assigned_users'), project_id=project_id)
		if not project.assigned_users.filter(pk=self.request.user.pk).exists():
			raise PermissionDenied('You are not assigned to this project.')
		return project

	def get(self, request, project_id: str) -> Response:
		project = self._get_project(project_id)
		events = project.events.all().order_by('start_date')
		serializer = EventSerializer(events, many=True)
		return Response({'events': serializer.data})

	def post(self, request, project_id: str) -> Response:
		project = self._get_project(project_id)
		serializer = EventSerializer(data=request.data)
		serializer.is_valid(raise_exception=True)
		event = serializer.save(project=project)
		return Response(serializer.data, status=status.HTTP_201_CREATED)


class EventDeleteView(APIView):
	"""
	DELETE /api/projects/{project_id}/events/{event_id}
	指定されたeventを削除する
	"""
	permission_classes = [IsAuthenticated]

	def delete(self, request, project_id: str, event_id: str) -> Response:
		event = get_object_or_404(
			Event.objects.select_related('project').prefetch_related('project__assigned_users'),
			event_id=event_id,
			project__project_id=project_id,
		)
		if not event.project.assigned_users.filter(pk=request.user.pk).exists():
			raise PermissionDenied('You are not assigned to this project.')
		event.delete()
		return Response(status=status.HTTP_204_NO_CONTENT)

