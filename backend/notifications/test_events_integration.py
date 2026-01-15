from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APITestCase
from rest_framework import status
from datetime import timedelta

from projects.models import Project
from event.models import Event
from notifications.models import Notification

User = get_user_model()


class EventNotificationIntegrationTest(APITestCase):
    """
    Event Appの通知機能統合テスト
    イベント作成・更新時の通知をテスト
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

        # テストプロジェクト作成
        self.project = Project.objects.create(
            title="テストプロジェクト",
            start_date=timezone.now(),
            deadline=timezone.now() + timedelta(days=30),
        )
        self.project.members.add(self.user1, self.user2, self.user3)

        # API URL
        self.events_url = f"/api/projects/{self.project.project_id}/events/"

    def test_event_creation_sends_notifications_to_all_members_except_creator(self):
        """イベント作成時、作成者以外の全プロジェクトメンバーに通知が送られること"""
        self.client.force_authenticate(user=self.user1)

        # 開始時刻を現在から1時間後、終了時刻を2時間後に設定
        start_time = timezone.now() + timedelta(hours=1)
        end_time = timezone.now() + timedelta(hours=2)

        event_data = {
            "title": "テストイベント",
            "is_all_day": False,
            "start_date": start_time.isoformat(),
            "end_date": end_time.isoformat(),
            "color": "blue",
        }

        response = self.client.post(self.events_url, event_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # 通知が作成されたことを確認
        notifications = Notification.objects.filter(
            notification_type="event", title="イベント通知"
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
                "新しいイベント『テストイベント』が作成されました",
                notification.message,
            )
            self.assertEqual(
                notification.related_object_id, str(response.data["event_id"])
            )

    def test_event_creation_notification_uses_japanese_language(self):
        """イベント作成通知が日本語で表示されること"""
        self.client.force_authenticate(user=self.user1)

        start_time = timezone.now() + timedelta(hours=1)
        end_time = timezone.now() + timedelta(hours=2)

        event_data = {
            "title": "日本語イベント名",
            "is_all_day": False,
            "start_date": start_time.isoformat(),
            "end_date": end_time.isoformat(),
            "color": "green",
        }

        response = self.client.post(self.events_url, event_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # 日本語の通知メッセージを確認
        notification = Notification.objects.filter(
            recipient=self.user2, notification_type="event"
        ).first()

        self.assertIsNotNone(notification)
        self.assertEqual(notification.title, "イベント通知")
        self.assertIn(
            "新しいイベント『日本語イベント名』が作成されました",
            notification.message,
        )

    def test_event_creation_with_single_member(self):
        """単一メンバーのプロジェクトでイベントを作成するテスト"""
        # 単一メンバーのプロジェクトを作成
        single_project = Project.objects.create(
            title="単一メンバープロジェクト",
            start_date=timezone.now(),
            deadline=timezone.now() + timedelta(days=30),
        )
        single_project.members.add(self.user1, self.user2)

        # API URL
        single_events_url = f"/api/projects/{single_project.project_id}/events/"

        self.client.force_authenticate(user=self.user1)

        start_time = timezone.now() + timedelta(hours=1)
        end_time = timezone.now() + timedelta(hours=2)

        event_data = {
            "title": "単一メンバーイベント",
            "is_all_day": False,
            "start_date": start_time.isoformat(),
            "end_date": end_time.isoformat(),
            "color": "blue",
        }

        response = self.client.post(single_events_url, event_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # 通知を確認
        notifications = Notification.objects.filter(
            notification_type="event", title="イベント通知"
        )
        self.assertEqual(notifications.count(), 1)  # user2にのみ通知

        notification = notifications.first()
        self.assertEqual(notification.recipient, self.user2)

    def test_all_day_event_notification(self):
        """終日イベントでも通知が正しく機能すること"""
        self.client.force_authenticate(user=self.user1)

        # 終日イベントを作成
        start_time = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)
        end_time = start_time + timedelta(days=1)

        event_data = {
            "title": "終日イベント",
            "is_all_day": True,
            "start_date": start_time.isoformat(),
            "end_date": end_time.isoformat(),
            "color": "red",
        }

        response = self.client.post(self.events_url, event_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # 通知を確認
        notifications = Notification.objects.filter(
            notification_type="event", title="イベント通知"
        )
        self.assertEqual(notifications.count(), 2)  # user2とuser3に通知

        # 通知メッセージの確認
        notification = notifications.first()
        self.assertIn(
            "新しいイベント『終日イベント』が作成されました",
            notification.message,
        )
