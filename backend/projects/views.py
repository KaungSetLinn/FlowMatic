from django.shortcuts import render


from rest_framework import viewsets
from .models import Project
from .serializers import ProjectSerializer
from rest_framework.pagination import PageNumberPagination

class ProjectPagination(PageNumberPagination):
    page_size = 20

class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all().order_by('-start_date')
    serializer_class = ProjectSerializer
    pagination_class = ProjectPagination

