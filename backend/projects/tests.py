from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from tasks.models import Task, TaskStatus 
from .models import Project

User = get_user_model()

class ProjectAPITest(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser",
            email="testuser@example.com",
            password="password"
        )
        self.client.force_authenticate(user=self.user)

        # 他のメンバー作成
        self.member1 = User.objects.create_user(username="member1", email="member1@example.com", password="password")
        self.member2 = User.objects.create_user(username="member2", email="member2@example.com", password="password")
        self.stranger = User.objects.create_user(username="stranger", email="stranger@example.com", password="password")

        self.url_list = reverse("project-list")

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

    def test_create_project(self):
        """プロジェクト作成テスト：入力したprogressが無視され0になることを確認"""
        data = {
            "title": "New Project",
            "description": "Test project",
            "start_date": "2024-01-01T00:00:00Z",
            "progress": 100,
            "status": "planning",
            "members": [self.user.id, self.member1.id, self.member2.id],
            "deadline": "2024-01-01T23:59:59Z"
        }
        response = self.client.post(self.url_list, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        
        self.assertEqual(response.data["title"], data["title"])
        
        self.assertEqual(response.data["progress"], 0)
        self.assertIn("project_id", response.data)

    def test_update_project(self):
        """プロジェクト更新テスト：PATCHでprogressを送っても無視されることを確認"""
        project = self.create_project_helper()
        url_detail = reverse("project-detail", args=[project.project_id])
        
        data = {
            "title": "Updated Project",
            "progress": 50
        }
        response = self.client.patch(url_detail, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.assertEqual(response.data["title"], "Updated Project")
        
        self.assertEqual(response.data["progress"], 0)

    
    def test_progress_calculation_with_tasks(self):
        """タスクの完了状況に応じてプロジェクトの進捗率が変化するかテスト"""
        project = self.create_project_helper()
        url_detail = reverse("project-detail", args=[project.project_id])

        
        task1 = Task.objects.create(
            project=project,
            name="Task 1",
            deadline="2024-01-02T00:00:00Z",
            status=TaskStatus.TODO
        )
        task2 = Task.objects.create(
            project=project,
            name="Task 2",
            deadline="2024-01-02T00:00:00Z",
            status=TaskStatus.TODO
        )

        
        response = self.client.get(url_detail)
        self.assertEqual(response.data["progress"], 0)

        
        task1.status = "done" 
        task1.save()

        response = self.client.get(url_detail)
        self.assertEqual(response.data["progress"], 50)

        task2.status = "done"
        task2.save()

        response = self.client.get(url_detail)
        self.assertEqual(response.data["progress"], 100)

    def test_list_projects(self):
        self.create_project_helper()
        response = self.client.get(self.url_list + "?page=1&per_page=20")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("projects", response.data)
        self.assertIn("page", response.data)
        self.assertIn("per_page", response.data)
        self.assertGreaterEqual(len(response.data["projects"]), 1)

    def test_get_project_detail(self):
        project = self.create_project_helper()
        url_detail = reverse("project-detail", args=[project.project_id])
        response = self.client.get(url_detail)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["title"], project.title)
        self.assertEqual(response.data["description"], project.description)

    def test_delete_project(self):
        project = self.create_project_helper()
        url_detail = reverse("project-detail", args=[project.project_id])
        response = self.client.delete(url_detail)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Project.objects.filter(project_id=project.project_id).exists())

    def test_unauthenticated_user_cannot_access(self):
        self.client.force_authenticate(user=None)
        project = self.create_project_helper()
        url_detail = reverse("project-detail", args=[project.project_id])
        response = self.client.get(url_detail)
        self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])

    def test_non_member_cannot_view_project(self):
        project = self.create_project_helper()
        self.client.force_authenticate(self.stranger)
        url_detail = reverse("project-detail", args=[project.project_id])
        response = self.client.get(url_detail)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_non_member_cannot_update_project(self):
        project = self.create_project_helper()
        self.client.force_authenticate(self.stranger)
        url_detail = reverse("project-detail", args=[project.project_id])
        response = self.client.patch(url_detail, {"title": "Hacked"}, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_non_member_cannot_delete_project(self):
        project = self.create_project_helper()
        self.client.force_authenticate(self.stranger)
        url_detail = reverse("project-detail", args=[project.project_id])
        response = self.client.delete(url_detail)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_member_can_view_edit_and_delete(self):
        project = self.create_project_helper()
        self.client.force_authenticate(self.member1)
        url_detail = reverse("project-detail", args=[project.project_id])
        response = self.client.get(url_detail)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        response = self.client.patch(url_detail, {"title": "Member Edited"}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        response = self.client.delete(url_detail)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)