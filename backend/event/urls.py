from django.urls import path
from .views import *

urlpatterns = [
    path('projects/<uuid:project_id>/events/', EventCreateView.as_view(), name='event-create'),
    path('projects/<uuid:project_id>/events/<uuid:event_id>/', EventDeleteView.as_view(), name='event-delete'),
]
