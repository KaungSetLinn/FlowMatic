from rest_framework import generics, permissions
from rest_framework.exceptions import PermissionDenied
from django.shortcuts import get_object_or_404
from projects.models import Project
from .models import ProjectMemo
from .serializers import ProjectMemoSerializer

class ProjectMemoListCreateView(generics.ListCreateAPIView):
    serializer_class = ProjectMemoSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):

        project_id = self.kwargs.get('project_id')
        
        project = get_object_or_404(Project, project_id=project_id)
        if not project.members.filter(pk=self.request.user.pk).exists():
            raise PermissionDenied("You are not a member of this project.")
        
        return ProjectMemo.objects.filter(project_id=project_id)

    def perform_create(self, serializer):
        project_id = self.kwargs.get('project_id')
        project = get_object_or_404(Project, project_id=project_id)
        

        if not project.members.filter(pk=self.request.user.pk).exists():
            raise PermissionDenied("You are not a member of this project.")
            
        
        serializer.save(user=self.request.user, project=project)



class ProjectMemoDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ProjectMemoSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'memo_id'

    def get_queryset(self):
        project_id = self.kwargs.get('project_id')
        return ProjectMemo.objects.filter(project_id=project_id)

    def get_object(self):
        obj = super().get_object()
        

        if not obj.project.members.filter(pk=self.request.user.pk).exists():
            raise PermissionDenied("You are not a member of this project.")
        

        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            if obj.user != self.request.user:
                raise PermissionDenied("You can only edit or delete your own memos.")
        
        return obj