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
        # Debug logging
        print("Request FILES:", request.FILES)
        print("Request DATA:", request.data)
        
        project = get_object_or_404(Project, project_id=project_id)

        # Create a mutable copy of request.data
        data = request.data.copy()
        
        # If name is not provided, get it from the uploaded file
        if 'name' not in data and 'file' in request.FILES:
            data['name'] = request.FILES['file'].name

        serializer = ProjectFileSerializer(data=data)
        if serializer.is_valid():
            serializer.save(
                project=project,
                uploader=request.user
            )
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        # Better error logging
        print("Serializer errors:", serializer.errors)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ProjectFileDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, project_id, file_id):
        file_obj = get_object_or_404(ProjectFile, project_id=project_id, file_id=file_id)
        file_obj.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)