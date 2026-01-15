from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status
from rest_framework_simplejwt.tokens import AccessToken

from projects.models import Project
from notifications.models import Notification

User = get_user_model()


def get_auth_headers(user):
    """ユーザーのJWTトークンを使用して認証ヘッダーを生成"""
    token = AccessToken.for_user(user)
    return {"HTTP_AUTHORIZATION": f"Bearer {token}"}


class ProjectsNotificationIntegrationTest(APITestCase):
    """
    Projects Appの通知機能統合テスト
    プロジェクト作成・更新時の通知をテスト
    """

    def setUp(self):
        # テストユーザー作成
        self.user1 = User.objects.create_user(
            username="user1", email="user1@example.com", password="testpass123"
        )
        self.user2 = User.objects.create_user(
            username="user2", email="user2@example.com", password="testpass123"
        )
        self.user3 = User.objects.create_user(
            username="user3", email="user3@example.com", password="testpass123"
        )

        # API URL
        self.projects_url = "/api/projects/"

    def test_project_creation_sends_notifications_to_all_members_except_creator(self):
        """プロジェクト作成時、作成者以外の全メンバーに通知が送られること"""
        headers = get_auth_headers(self.user1)

        project_data = {
            "title": "テストプロジェクト",
            "description": "プロジェクト説明",
            "start_date": "2024-01-01T00:00:00Z",
            "deadline": "2024-12-31T23:59:59Z",
            "members": [self.user2.id, self.user3.id],
        }

        response = self.client.post(
            self.projects_url, project_data, format="json", **headers
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # 通知が作成されたことを確認
        notifications = Notification.objects.filter(
            notification_type="project", title="プロジェクト通知"
        )
        self.assertEqual(notifications.count(), 2)  # user2とuser3に通知

        # user2とuser3に通知が送られたことを確認
        notified_users = [n.recipient for n in notifications]
        self.assertIn(self.user2, notified_users)
        self.assertIn(self.user3, notified_users)
        self.assertNotIn(self.user1, notified_users)  # 作成者には通知なし

        # 通知メッセージの確認
        for notification in notifications:
            self.assertIn(
                "プロジェクト『テストプロジェクト』に新しいメンバーが追加されました",
                notification.message,
            )
            self.assertEqual(
                notification.related_object_id, str(response.data["project_id"])
            )

    def test_project_update_sends_notifications_to_all_members_except_updater(self):
        """プロジェクト更新時、更新者以外の全メンバーに通知が送られること"""
        # プロジェクトを作成
        from django.utils import timezone
        from datetime import timedelta

        project = Project.objects.create(
            title="更新対象プロジェクト",
            start_date=timezone.now(),
            deadline=timezone.now() + timedelta(days=30),
        )
        project.members.add(self.user1, self.user2, self.user3)

        # API URL
        project_url = f"/api/projects/{project.project_id}/"

        # user1がプロジェクトを更新
        headers = get_auth_headers(self.user1)
        update_data = {"title": "更新後プロジェクト名", "description": "更新後説明"}
        response = self.client.patch(project_url, update_data, format="json", **headers)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # 通知を確認
        notifications = Notification.objects.filter(
            notification_type="project", title="プロジェクト通知"
        )
        self.assertEqual(notifications.count(), 2)  # user2とuser3に通知

        # 通知受信者の確認
        notified_users = [n.recipient for n in notifications]
        self.assertIn(self.user2, notified_users)
        self.assertIn(self.user3, notified_users)
        self.assertNotIn(self.user1, notified_users)  # 更新者には通知なし

        # 通知メッセージの確認
        for notification in notifications:
            self.assertIn(
                "プロジェクト『更新後プロジェクト名』が更新されました",
                notification.message,
            )

    def test_project_put_update_sends_notifications(self):
        """PUTリクエストによるプロジェクト更新でも通知が送られること"""
        # プロジェクトを作成
        from django.utils import timezone
        from datetime import timedelta

        project = Project.objects.create(
            title="PUT更新プロジェクト",
            start_date=timezone.now(),
            deadline=timezone.now() + timedelta(days=30),
        )
        project.members.add(self.user1, self.user2)

        # API URL
        project_url = f"/api/projects/{project.project_id}/"

        # user1がプロジェクトを更新
        headers = get_auth_headers(self.user1)
        update_data = {
            "title": "PUT更新後プロジェクト",
            "description": "PUTによる更新",
            "start_date": "2024-01-01T00:00:00Z",
            "deadline": "2024-12-31T23:59:59Z",
            "members": [self.user1.id, self.user2.id],
        }
        response = self.client.put(project_url, update_data, format="json", **headers)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # 通知を確認
        notifications = Notification.objects.filter(
            notification_type="project", title="プロジェクト通知"
        )
        self.assertEqual(notifications.count(), 1)  # user2にのみ通知

        # 通知メッセージの確認
        notification = notifications.first()
        self.assertEqual(notification.recipient, self.user2)
        self.assertIn(
            "プロジェクト『PUT更新後プロジェクト』が更新されました",
            notification.message,
        )

    def test_project_creation_notification_uses_japanese_language(self):
        """プロジェクト作成通知が日本語で表示されること"""
        headers = get_auth_headers(self.user1)

        project_data = {
            "title": "日本語プロジェクト名",
            "start_date": "2024-01-01T00:00:00Z",
            "deadline": "2024-12-31T23:59:59Z",
            "members": [self.user2.id],
        }

        response = self.client.post(
            self.projects_url, project_data, format="json", **headers
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # 日本語の通知メッセージを確認
        notification = Notification.objects.filter(
            recipient=self.user2, notification_type="project"
        ).first()

        self.assertIsNotNone(notification)
        self.assertEqual(notification.title, "プロジェクト通知")
        self.assertIn(
            "プロジェクト『日本語プロジェクト名』に新しいメンバーが追加されました",
            notification.message,
        )

    def test_project_update_notification_uses_japanese_language(self):
        """プロジェクト更新通知が日本語で表示されること"""
        # プロジェクトを作成
        from django.utils import timezone
        from datetime import timedelta

        project = Project.objects.create(
            title="更新前日本語名",
            start_date=timezone.now(),
            deadline=timezone.now() + timedelta(days=30),
        )
        project.members.add(self.user1, self.user2)

        # API URL
        project_url = f"/api/projects/{project.project_id}/"

        # user1がプロジェクトを更新
        headers = get_auth_headers(self.user1)
        update_data = {"title": "更新後日本語名"}
        response = self.client.patch(project_url, update_data, format="json", **headers)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # 日本語の通知メッセージを確認
        notification = Notification.objects.filter(
            recipient=self.user2, notification_type="project"
        ).first()

        self.assertIsNotNone(notification)
        self.assertEqual(notification.title, "プロジェクト通知")
        self.assertIn(
            "プロジェクト『更新後日本語名』が更新されました", notification.message
        )

    def test_multiple_project_updates_create_multiple_notifications(self):
        """複数回のプロジェクト更新で複数の通知が作成されること"""
        # プロジェクトを作成
        from django.utils import timezone
        from datetime import timedelta

        project = Project.objects.create(
            title="多重更新プロジェクト",
            start_date=timezone.now(),
            deadline=timezone.now() + timedelta(days=30),
        )
        project.members.add(self.user1, self.user2)

        # API URL
        project_url = f"/api/projects/{project.project_id}/"

        # user1が複数回プロジェクトを更新
        headers = get_auth_headers(self.user1)

        # 1回目の更新
        self.client.patch(project_url, {"title": "1回目更新"}, format="json", **headers)

        # 2回目の更新
        self.client.patch(project_url, {"title": "2回目更新"}, format="json", **headers)

        # 3回目の更新
        self.client.patch(project_url, {"title": "3回目更新"}, format="json", **headers)

        # 通知を確認
        notifications = Notification.objects.filter(
            recipient=self.user2, notification_type="project"
        )
        self.assertEqual(notifications.count(), 3)  # 3回の更新で3通知

        # 各通知のメッセージを確認
        messages = [n.message for n in notifications]
        self.assertIn("プロジェクト『1回目更新』が更新されました", messages)
        self.assertIn("プロジェクト『2回目更新』が更新されました", messages)
        self.assertIn("プロジェクト『3回目更新』が更新されました", messages)

    def test_project_creation_with_single_member_still_sends_notification(self):
        """単一メンバーのプロジェクト作成でも通知が適切に処理されること"""
        headers = get_auth_headers(self.user1)

        project_data = {
            "title": "単一メンバープロジェクト",
            "start_date": "2024-01-01T00:00:00Z",
            "deadline": "2024-12-31T23:59:59Z",
            "members": [self.user2.id],
        }

        response = self.client.post(
            self.projects_url, project_data, format="json", **headers
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # 通知を確認
        notifications = Notification.objects.filter(
            notification_type="project", title="プロジェクト通知"
        )
        self.assertEqual(notifications.count(), 1)  # user2にのみ通知

        notification = notifications.first()
        self.assertEqual(notification.recipient, self.user2)

    def test_project_update_related_object_id(self):
        """プロジェクト更新時のrelated_object_idが正しく設定されること"""
        # プロジェクトを作成
        from django.utils import timezone
        from datetime import timedelta

        project = Project.objects.create(
            title="ID確認プロジェクト",
            start_date=timezone.now(),
            deadline=timezone.now() + timedelta(days=30),
        )
        project.members.add(self.user1, self.user2)

        # API URL
        project_url = f"/api/projects/{project.project_id}/"

        # プロジェクトを更新
        headers = get_auth_headers(self.user1)
        self.client.patch(project_url, {"title": "更新後"}, format="json", **headers)

        # 通知のrelated_object_idを確認
        notification = Notification.objects.filter(
            recipient=self.user2, notification_type="project"
        ).first()

        self.assertIsNotNone(notification)
        self.assertEqual(notification.related_object_id, str(project.project_id))

    def test_project_creator_notified_when_other_updates(self):
        """他のユーザーがプロジェクトを更新した場合、作成者に通知が送られること"""
        # user1がプロジェクトを作成
        from django.utils import timezone
        from datetime import timedelta

        project = Project.objects.create(
            title="作成者通知プロジェクト",
            start_date=timezone.now(),
            deadline=timezone.now() + timedelta(days=30),
        )
        project.members.add(self.user1, self.user2)

        # user2がプロジェクトを更新
        project_url = f"/api/projects/{project.project_id}/"
        headers = get_auth_headers(self.user2)
        update_data = {"title": "user2による更新"}
        response = self.client.patch(project_url, update_data, format="json", **headers)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # user1に通知が送られたことを確認
        notifications = Notification.objects.filter(
            recipient=self.user1, notification_type="project"
        )
        self.assertEqual(notifications.count(), 1)

        notification = notifications.first()
        self.assertEqual(notification.title, "プロジェクト通知")
        self.assertIn("user2による更新", notification.message)
