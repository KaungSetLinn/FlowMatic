from django.urls import path
from .views import ProjectEventListCreateView, EventDetailView

urlpatterns = [
    path("projects/<uuid:project_id>/events/", ProjectEventListCreateView.as_view(),name="event-list"),
    path("projects/<uuid:project_id>/events/<uuid:event_id>/", EventDetailView.as_view(), name="event-detail"),
]
