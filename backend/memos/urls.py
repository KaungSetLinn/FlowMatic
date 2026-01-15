from django.urls import path
from .views import ProjectMemoListCreateView, ProjectMemoDetailView

urlpatterns = [

    path('projects/<uuid:project_id>/memos/', ProjectMemoListCreateView.as_view(), name='project-memo-list'),
    
    
    path('projects/<uuid:project_id>/memos/<uuid:memo_id>/', ProjectMemoDetailView.as_view(), name='project-memo-detail'),
]