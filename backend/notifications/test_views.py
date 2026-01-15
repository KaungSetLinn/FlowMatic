from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status

from notifications.models import Notification

User = get_user_model()


class NotificationMarkReadViewTest(APITestCase):
    def setUp(self):
        self.user1 = User.objects.create_user(
            username="user1", email="user1@example.com", password="testpass123"
        )
        self.user2 = User.objects.create_user(
            username="user2", email="user2@example.com", password="testpass123"
        )

        self.notification = Notification.objects.create(
            recipient=self.user1,
            title="テスト通知",
            message="テストメッセージ",
            notification_type="test",
            related_object_id="123",
            is_read=False,
        )

        self.mark_read_url = f"/api/notifications/{self.notification.id}/mark_read/"

    def test_mark_notification_as_read(self):
        """通知を既読にできること"""
        self.client.force_authenticate(user=self.user1)
        response = self.client.patch(self.mark_read_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.notification.refresh_from_db()
        self.assertTrue(self.notification.is_read)

    def test_mark_read_nonexistent_notification(self):
        """存在しない通知IDで404が返されること"""
        self.client.force_authenticate(user=self.user1)
        response = self.client.patch("/api/notifications/999999/mark_read/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_cannot_mark_other_users_notification_as_read(self):
        """他のユーザーの通知を既読にできないこと"""
        self.client.force_authenticate(user=self.user2)
        response = self.client.patch(self.mark_read_url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

        self.notification.refresh_from_db()
        self.assertFalse(self.notification.is_read)

    def test_mark_already_read_notification(self):
        """既読の通知を再度既読にしても成功すること"""
        self.notification.is_read = True
        self.notification.save()

        self.client.force_authenticate(user=self.user1)
        response = self.client.patch(self.mark_read_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.notification.refresh_from_db()
        self.assertTrue(self.notification.is_read)

    def test_unauthenticated_user_cannot_mark_read(self):
        """認証されていないユーザーは通知を既読にできないこと"""
        response = self.client.patch(self.mark_read_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class NotificationMarkAllReadViewTest(APITestCase):
    def setUp(self):
        self.user1 = User.objects.create_user(
            username="user1", email="user1@example.com", password="testpass123"
        )
        self.user2 = User.objects.create_user(
            username="user2", email="user2@example.com", password="testpass123"
        )

        for i in range(5):
            Notification.objects.create(
                recipient=self.user1,
                title=f"通知{i}",
                message=f"メッセージ{i}",
                notification_type="test",
                related_object_id=str(i),
                is_read=False,
            )

        self.mark_all_read_url = "/api/notifications/mark_all_read/"

    def test_mark_all_notifications_as_read(self):
        """全通知を既読にできること"""
        self.client.force_authenticate(user=self.user1)
        response = self.client.post(self.mark_all_read_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["updated_count"], 5)

        all_read = all(
            n.is_read for n in Notification.objects.filter(recipient=self.user1)
        )
        self.assertTrue(all_read)

    def test_mark_all_read_when_no_unread(self):
        """未読通知がない場合でも成功すること"""
        Notification.objects.filter(recipient=self.user1).update(is_read=True)

        self.client.force_authenticate(user=self.user1)
        response = self.client.post(self.mark_all_read_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["updated_count"], 0)

    def test_mark_all_read_only_for_current_user(self):
        """自分の通知のみが既読になること"""
        Notification.objects.create(
            recipient=self.user2,
            title="他ユーザー通知",
            message="他ユーザーメッセージ",
            notification_type="test",
            related_object_id="999",
            is_read=False,
        )

        self.client.force_authenticate(user=self.user1)
        response = self.client.post(self.mark_all_read_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        user2_notification = Notification.objects.get(recipient=self.user2)
        self.assertFalse(user2_notification.is_read)

    def test_unauthenticated_user_cannot_mark_all_read(self):
        """認証されていないユーザーは全通知既読にできないこと"""
        response = self.client.post(self.mark_all_read_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_updated_count_in_response(self):
        """レスポンスに更新件数が含まれること"""
        self.client.force_authenticate(user=self.user1)
        response = self.client.post(self.mark_all_read_url)

        self.assertIn("updated_count", response.data)
        self.assertEqual(response.data["updated_count"], 5)
