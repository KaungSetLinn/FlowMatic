from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from .models import Project

User = get_user_model()

class ProjectAPITest(APITestCase):
    def setUp(self):
        # 認証用ユーザー作成
        self.user = User.objects.create_user(
            username="testuser",
            email="testuser@example.com",
            password="password"
        )
        self.client.force_authenticate(user=self.user)

        # 他のメンバーも作成（ManyToManyField用）
        self.member1 = User.objects.create_user(
            username="member1",
            email="member1@example.com",
            password="password"
        )
        self.member2 = User.objects.create_user(
            username="member2",
            email="member2@example.com",
            password="password"
        )

        # URL
        self.url_list = reverse("project-list")  # router basename='project'に対応

    def test_create_project(self):
        data = {
            "title": "New Project",
            "description": "Test project",
            "start_date": "2024-01-01T00:00:00Z",
            "progress": 0,
            "status": "planning",
            "members": [self.member1.id, self.member2.id],
            "deadline": "2024-01-02T00:00:00Z"
        }
        response = self.client.post(self.url_list, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["title"], "New Project")
        self.project_id = response.data["project_id"]  # 他のテストで使う場合

    def test_list_projects(self):
        project = Project.objects.create(
            title="A",
            description="Project A",
            start_date="2024-01-01T00:00:00Z",
            progress=0,
            status="planning",
            deadline="2024-01-02T00:00:00Z"
        )
        project.members.set([self.member1, self.member2])
        response = self.client.get(self.url_list)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 1)

    def test_get_project_detail(self):
        project = Project.objects.create(
            title="Detail",
            description="Detail project",
            start_date="2024-01-01T00:00:00Z",
            progress=0,
            status="planning",
            deadline="2024-01-02T00:00:00Z"
        )
        project.members.set([self.member1])
        url_detail = reverse("project-detail", args=[project.project_id])
        response = self.client.get(url_detail)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["title"], "Detail")

    def test_update_project(self):
        project = Project.objects.create(
            title="Old Title",
            description="Old description",
            start_date="2024-01-01T00:00:00Z",
            progress=0,
            status="planning",
            deadline="2024-01-02T00:00:00Z"
        )
        project.members.set([self.member1])
        url_detail = reverse("project-detail", args=[project.project_id])

        data = {
            "title": "Updated Title",
            "progress": 50
        }
        # 部分更新はPATCHを使う
        response = self.client.patch(url_detail, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["title"], "Updated Title")
        self.assertEqual(response.data["progress"], 50)

    def test_delete_project(self):
        project = Project.objects.create(
            title="Delete Me",
            description="To be deleted",
            start_date="2024-01-01T00:00:00Z",
            progress=0,
            status="planning",
            deadline="2024-01-02T00:00:00Z"
        )
        project.members.set([self.member1])
        url_detail = reverse("project-detail", args=[project.project_id])
        response = self.client.delete(url_detail)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Project.objects.filter(project_id=project.project_id).exists())
