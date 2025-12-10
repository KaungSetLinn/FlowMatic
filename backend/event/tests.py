from django.test import TestCase

from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from .models import Project, Event 
from datetime import datetime, timedelta
from django.utils import timezone

User = get_user_model()

class EventAPITest(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser",
            email="testuser@example.com",
            password="password"
        )
        self.client.force_authenticate(user=self.user)


        self.member1 = User.objects.create_user(username="member1", email="member1@example.com", password="password")
        self.member2 = User.objects.create_user(username="member2", email="member2@example.com", password="password")
        self.stranger = User.objects.create_user(username="stranger", email="stranger@example.com", password="password")

    def create_project_helper(self, title="Test Project"):
        project = Project.objects.create(
            title=title,
            description="Description",
            start_date="2024-01-01T00:00:00Z",
            progress=0,
            status="planning",
            deadline="2024-01-02T00:00:00Z"
        )
        project.members.set([self.user, self.member1])
        return project

    def create_event_helper(self, project, title="Test Event", start="2024-01-01T09:00:00Z", end="2024-01-01T10:00:00Z", color="red"):
        event = Event.objects.create(
            project=project,
            title=title,
            is_all_day=False,
            start_date=start,
            end_date=end,
            color=color
        )
        return event


    def test_create_event(self):
        project = self.create_project_helper()
        url = reverse("event-list", args=[project.project_id])
        data = {
            "title": "New Event",
            "is_all_day": False,
            "start_date": "2024-01-01T09:00:00Z",
            "end_date": "2024-01-01T10:00:00Z",
            "color": "blue"
        }
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("event_id", response.data)
        for key in data:
            self.assertEqual(response.data[key], data[key])


    def test_non_member_cannot_create_event(self):
        project = self.create_project_helper()
        self.client.force_authenticate(user=self.stranger)
        url = reverse("event-list", args=[project.project_id])
        data = {
            "title": "Hacked Event",
            "is_all_day": False,
            "start_date": "2024-01-01T09:00:00Z",
            "end_date": "2024-01-01T10:00:00Z",
            "color": "blue"
        }
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_unauthenticated_user_cannot_create_event(self):
        project = self.create_project_helper()
        self.client.force_authenticate(user=None)
        url = reverse("event-list", args=[project.project_id])
        data = {
            "title": "NoAuth Event",
            "is_all_day": False,
            "start_date": "2024-01-01T09:00:00Z",
            "end_date": "2024-01-01T10:00:00Z",
            "color": "blue"
        }
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


    def test_list_events(self):
        project = self.create_project_helper()
        self.create_event_helper(project)
        url = reverse("event-list", args=[project.project_id])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("events", response.data)
        self.assertGreaterEqual(len(response.data["events"]), 1)


    def test_list_events_with_date_range(self):
        project = self.create_project_helper()
        
        event1 = self.create_event_helper(project, start="2024-01-01T09:00:00Z", end="2024-01-01T10:00:00Z")
        
        event2 = self.create_event_helper(project, start="2024-02-01T09:00:00Z", end="2024-02-01T10:00:00Z")
        url = reverse("event-list", args=[project.project_id]) + "?start_date=2024-01-01T00:00:00Z&end_date=2024-01-31T23:59:59Z"
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("events", response.data)
        
        self.assertEqual(len(response.data["events"]), 1)
        self.assertEqual(response.data["events"][0]["event_id"], event1.event_id)


    def test_get_event_detail(self):
        project = self.create_project_helper()
        event = self.create_event_helper(project)
        url = reverse("event-detail", args=[project.project_id, event.event_id])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["title"], event.title)

    def test_update_event_full_fields(self):
        """PUTで全フィールド更新"""
        project = self.create_project_helper()
        event = self.create_event_helper(project)
        url = reverse("event-detail", args=[project.project_id, event.event_id])
        data = {
            "title": "Fully Updated",
            "is_all_day": True,
            "start_date": "2024-01-01T12:00:00Z",
            "end_date": "2024-01-01T13:00:00Z",
            "color": "green"
        }
        response = self.client.put(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for key in data:
            self.assertEqual(response.data[key], data[key])

    def test_delete_event(self):
        project = self.create_project_helper()
        event = self.create_event_helper(project)
        url = reverse("event-detail", args=[project.project_id, event.event_id])
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Event.objects.filter(event_id=event.event_id).exists())


    def test_get_event_after_delete_returns_404(self):
        project = self.create_project_helper()
        event = self.create_event_helper(project)
        url = reverse("event-detail", args=[project.project_id, event.event_id])
        self.client.delete(url)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


    def test_invalid_color_returns_400(self):
        project = self.create_project_helper()
        url = reverse("event-list", args=[project.project_id])
        data = {
            "title": "Invalid Color",
            "is_all_day": False,
            "start_date": "2024-01-01T09:00:00Z",
            "end_date": "2024-01-01T10:00:00Z",
            "color": "purple"
        }
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_start_date_after_end_date_returns_400(self):
        project = self.create_project_helper()
        url = reverse("event-list", args=[project.project_id])
        data = {
            "title": "Bad Dates",
            "is_all_day": False,
            "start_date": "2024-01-01T11:00:00Z",
            "end_date": "2024-01-01T10:00:00Z",
            "color": "red"
        }
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_empty_title_returns_400(self):
        project = self.create_project_helper()
        url = reverse("event-list", args=[project.project_id])
        data = {
            "title": "",
            "is_all_day": False,
            "start_date": "2024-01-01T09:00:00Z",
            "end_date": "2024-01-01T10:00:00Z",
            "color": "red"
        }
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_unauthenticated_user_cannot_access_event(self):
        project = self.create_project_helper()
        event = self.create_event_helper(project)
        self.client.force_authenticate(user=None)
        url = reverse("event-detail", args=[project.project_id, event.event_id])
        response = self.client.get(url)
        self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])

    def test_non_member_cannot_modify_event(self):
        project = self.create_project_helper()
        event = self.create_event_helper(project)
        self.client.force_authenticate(self.stranger)
        url = reverse("event-detail", args=[project.project_id, event.event_id])

        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        response = self.client.put(url, {"title": "Hacked"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_member_can_view_edit_and_delete_event(self):
        project = self.create_project_helper()
        event = self.create_event_helper(project)
        self.client.force_authenticate(self.member1)
        url = reverse("event-detail", args=[project.project_id, event.event_id])

        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        response = self.client.put(url, {"title": "Member Edited", "color": "orange"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

