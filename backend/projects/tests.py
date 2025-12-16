# tests.py
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from .models import Project

User = get_user_model()


class ProjectAPITest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser", email="testuser@example.com", password="password"
        )
        self.client.force_authenticate(user=self.user)

        # 他のメンバー作成
        self.member1 = User.objects.create_user(
            username="member1", email="member1@example.com", password="password"
        )
        self.member2 = User.objects.create_user(
            username="member2", email="member2@example.com", password="password"
        )
        self.stranger = User.objects.create_user(
            username="stranger", email="stranger@example.com", password="password"
        )

        self.url_list = reverse("project-list")

    def create_project_helper(self, title="Test Project"):
        project = Project.objects.create(
            title=title,
            description="Description",
            start_date="2024-01-01T00:00:00Z",
            progress=0,
            status="planning",
            deadline="2024-01-02T00:00:00Z",
        )
        project.members.set([self.user, self.member1])
        return project

    def test_create_project(self):
        data = {
            "title": "New Project",
            "description": "Test project",
            "start_date": "2024-01-01T00:00:00Z",
            "progress": 0,
            "status": "planning",
            "members": [self.user.id, self.member1.id, self.member2.id],
            "deadline": "2024-01-01T23:59:59Z",
        }
        response = self.client.post(self.url_list, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        # membersフィールドは別途検証（user_idとnameの形式で返る）
        expected_members = [
            {"user_id": str(self.user.id), "name": self.user.username},
            {"user_id": str(self.member1.id), "name": self.member1.username},
            {"user_id": str(self.member2.id), "name": self.member2.username},
        ]
        self.assertEqual(response.data["members"], expected_members)
        # 他のフィールドを検証
        for key in [
            "title",
            "description",
            "start_date",
            "deadline",
            "progress",
            "status",
        ]:
            self.assertEqual(response.data[key], data[key])
        self.assertIn("project_id", response.data)

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

    def test_update_project(self):
        project = self.create_project_helper()
        url_detail = reverse("project-detail", args=[project.project_id])
        data = {"title": "Updated Project", "progress": 50}
        response = self.client.patch(url_detail, data, format="json")  # PATCHで部分更新
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["title"], "Updated Project")
        self.assertEqual(response.data["progress"], 50)

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
        self.assertIn(
            response.status_code,
            [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN],
        )

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

        response = self.client.patch(url_detail, {"title": "Hacked"}, format="json")
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

        response = self.client.patch(
            url_detail, {"title": "Member Edited"}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        response = self.client.delete(url_detail)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_project_update_integration(self):
        """プロジェクト更新の統合テスト"""
        project = self.create_project_helper(title="Original Project")
        
        # GETで現在の状態を確認
        url_detail = reverse("project-detail", args=[project.project_id])
        response = self.client.get(url_detail)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["title"], "Original Project")
        
        # PUTで全フィールド更新
        update_data = {
            "title": "Fully Updated Project",
            "description": "Updated description",
            "start_date": "2024-02-01T00:00:00Z",
            "progress": 75,
            "status": "in_progress",
            "members": [self.user.id, self.member2.id],
            "deadline": "2024-02-15T00:00:00Z"
        }
        response = self.client.put(url_detail, update_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # データベースで更新を確認
        project.refresh_from_db()
        self.assertEqual(project.title, "Fully Updated Project")
        self.assertEqual(project.progress, 75)
        self.assertEqual(project.status, "in_progress")
        
        # メンバーが更新されたことを確認
        updated_members = set(project.members.values_list('id', flat=True))
        expected_members = {self.user.id, self.member2.id}
        self.assertEqual(updated_members, expected_members)
        
        # レスポンスデータも確認（membersはuser_idとnameの形式）
        for key in ["title", "description", "progress", "status"]:
            self.assertEqual(response.data[key], update_data[key])

    def test_project_patch_members_only(self):
        """プロジェクトメンバーのみを部分更新するテスト"""
        project = self.create_project_helper()
        original_member_count = project.members.count()
        
        # PATCHでメンバーのみ更新
        update_data = {
            "members": [self.user.id, self.member1.id, self.member2.id]
        }
        url_detail = reverse("project-detail", args=[project.project_id])
        response = self.client.patch(url_detail, update_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # メンバーが追加されたことを確認
        project.refresh_from_db()
        new_member_count = project.members.count()
        self.assertEqual(new_member_count, original_member_count + 1)
        
        # member2が追加されたことを確認
        self.assertTrue(project.members.filter(id=self.member2.id).exists())

    def test_project_validation_on_update(self):
        """プロジェクト更新時のバリデーションテスト"""
        project = self.create_project_helper()
        url_detail = reverse("project-detail", args=[project.project_id])
        
        # 無効な進捗率での更新
        invalid_data = {
            "title": "Invalid Progress Project",
            "progress": 150
        }
        response = self.client.patch(url_detail, invalid_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        # 無効なステータスでの更新
        invalid_status_data = {
            "status": "invalid_status"
        }
        response = self.client.patch(url_detail, invalid_status_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        # 空タイトルでの更新
        empty_title_data = {
            "title": ""
        }
        response = self.client.patch(url_detail, empty_title_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        # 無効な日付範囲での更新
        invalid_date_data = {
            "start_date": "2024-02-01T00:00:00Z",
            "deadline": "2024-01-01T00:00:00Z"
        }
        response = self.client.patch(url_detail, invalid_date_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
