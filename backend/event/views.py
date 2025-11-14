from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Event
from .serializers import EventSerializer
from tasks.models import Project
from django.shortcuts import get_object_or_404


class EventCreateView(generics.CreateAPIView):
    """
    POST /api/projects/{project_id}/events
    新しいeventを作成する
    """
    serializer_class = EventSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        project_id = self.kwargs.get('project_id')
        project = get_object_or_404(Project, project_id=project_id)
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # projectを関連付けて保存
        event = serializer.save(project=project)
        
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class EventDeleteView(generics.DestroyAPIView):
    """
    DELETE /api/projects/{project_id}/events/{event_id}
    指定されたeventを削除する
    """
    permission_classes = [IsAuthenticated]
    lookup_field = 'event_id'

    def get_queryset(self):
        project_id = self.kwargs.get('project_id')
        return Event.objects.filter(project__project_id=project_id)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)

