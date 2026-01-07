from django.shortcuts import render


from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from django.shortcuts import get_object_or_404


from projects.models import Project
from .models import ProjectFile
from .serializers import ProjectFileSerializer

class ProjectFileListCreateView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)

    def get(self, request, project_id):
        
        project = get_object_or_404(Project, project_id=project_id)
        
        
        files = ProjectFile.objects.filter(project=project).order_by('-uploaded_at')
        serializer = ProjectFileSerializer(files, many=True)
        return Response(serializer.data)

    def post(self, request, project_id):
        project = get_object_or_404(Project, project_id=project_id)

        serializer = ProjectFileSerializer(data=request.data)
        if serializer.is_valid():
            file_obj = request.data.get('file')
            name = request.data.get('name')
            if not name and file_obj:
                name = file_obj.name
            
            serializer.save(
                project=project,
                uploader=request.user,
                name=name
            )
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ProjectFileDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, project_id, file_id):
        
        file_obj = get_object_or_404(ProjectFile, project_id=project_id, file_id=file_id)
        file_obj.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)