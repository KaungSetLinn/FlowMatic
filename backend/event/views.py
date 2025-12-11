from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from projects.models import Project
from .models import Event
from .serializers import EventCreateSerializer, EventResponseSerializer


class ProjectEventListCreateView(APIView):
	"""
	GET /api/projects/{project_id}/events - プロジェクトのイベント一覧を取得
	POST /api/projects/{project_id}/events - 新しいeventを作成する
	"""
	permission_classes = [IsAuthenticated]

	def _get_project(self, project_id: str) -> Project:
		project = get_object_or_404(Project.objects.prefetch_related('members'), project_id=project_id)
		if not project.members.filter(pk=self.request.user.pk).exists():
			raise PermissionDenied('You are not assigned to this project.')
		return project

	def get(self, request, project_id: str) -> Response:
		project = self._get_project(project_id)
		try:
			page = int(request.query_params.get('p', '1'))
			per_page = int(request.query_params.get('per_page', '20'))
		except ValueError:
			return Response({'detail': 'p and per_page must be integers.'}, status=status.HTTP_400_BAD_REQUEST)

		if page < 1 or per_page < 1:
			return Response({'detail': 'p and per_page must be greater than zero.'}, status=status.HTTP_400_BAD_REQUEST)

		events_qs = project.events.all().order_by('start_date')
		start = (page - 1) * per_page
		end = start + per_page
		events = list(events_qs[start:end])

		serializer = EventResponseSerializer(events, many=True)
		return Response({'events': serializer.data, 'page': page, 'per_page': per_page})

	def post(self, request, project_id: str) -> Response:
		project = self._get_project(project_id)
		serializer = EventCreateSerializer(data=request.data, context={'project': project, 'request': request})
		serializer.is_valid(raise_exception=True)
		event = serializer.save()
		response_serializer = EventResponseSerializer(event)
		return Response(response_serializer.data, status=status.HTTP_201_CREATED)


class EventDeleteView(APIView):
	"""
	DELETE /api/projects/{project_id}/events/{event_id}
	指定されたeventを削除する
	"""
	permission_classes = [IsAuthenticated]

	def delete(self, request, project_id: str, event_id: str) -> Response:
		event = get_object_or_404(
			Event.objects.select_related('project').prefetch_related('project__members'),
			event_id=event_id,
			project__project_id=project_id,
		)
		if not event.project.members.filter(pk=request.user.pk).exists():
			raise PermissionDenied('You are not assigned to this project.')
		event.delete()
		return Response(status=status.HTTP_204_NO_CONTENT)

