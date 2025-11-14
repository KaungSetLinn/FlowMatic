from django.urls import path
from .views import ProjectEventListCreateView, EventDeleteView

urlpatterns = [
    path('projects/<uuid:project_id>/events/', ProjectEventListCreateView.as_view(), name='project-event-list-create'),
    path('projects/<uuid:project_id>/events/<uuid:event_id>/', EventDeleteView.as_view(), name='event-delete'),
]
