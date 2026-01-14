from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APITestCase
from rest_framework import status
from rest_framework_simplejwt.tokens import AccessToken
from datetime import timedelta

from projects.models import Project
from event.models import Event
from notifications.models import Notification

User = get_user_model()


def get_auth_headers(user):
    """ユーザーのJWTトークンを使用して認証ヘッダーを生成"""
    token = AccessToken.for_user(user)
    return {"HTTP_AUTHORIZATION": f"Bearer {token}"}


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
        headers = get_auth_headers(self.user1)

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

        response = self.client.post(
            self.events_url, event_data, format="json", **headers
        )
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
        headers = get_auth_headers(self.user1)

        start_time = timezone.now() + timedelta(hours=1)
        end_time = timezone.now() + timedelta(hours=2)

        event_data = {
            "title": "日本語イベント名",
            "is_all_day": False,
            "start_date": start_time.isoformat(),
            "end_date": end_time.isoformat(),
            "color": "green",
        }

        response = self.client.post(
            self.events_url, event_data, format="json", **headers
        )
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

        headers = get_auth_headers(self.user1)

        start_time = timezone.now() + timedelta(hours=1)
        end_time = timezone.now() + timedelta(hours=2)

        event_data = {
            "title": "単一メンバーイベント",
            "is_all_day": False,
            "start_date": start_time.isoformat(),
            "end_date": end_time.isoformat(),
            "color": "blue",
        }

        response = self.client.post(
            single_events_url, event_data, format="json", **headers
        )
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
        headers = get_auth_headers(self.user1)

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

        response = self.client.post(
            self.events_url, event_data, format="json", **headers
        )
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

    def test_event_update_sends_notifications_to_all_members_except_updater(self):
        """イベント更新時、更新者以外の全プロジェクトメンバーに通知が送られること"""
        # イベントを作成
        event = Event.objects.create(
            project=self.project,
            title="更新対象イベント",
            is_all_day=False,
            start_date=timezone.now() + timedelta(hours=1),
            end_date=timezone.now() + timedelta(hours=2),
            color="blue",
        )

        # API URL
        event_url = f"/api/projects/{self.project.project_id}/events/{event.event_id}/"

        # user1がイベントを更新
        headers = get_auth_headers(self.user1)
        update_data = {"title": "更新後イベント名"}
        response = self.client.patch(event_url, update_data, format="json", **headers)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # 通知を確認
        notifications = Notification.objects.filter(
            notification_type="event", title="イベント通知"
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
                "イベント『更新後イベント名』が更新されました",
                notification.message,
            )

    def test_event_update_notification_uses_japanese_language(self):
        """イベント更新通知が日本語で表示されること"""
        # イベントを作成
        event = Event.objects.create(
            project=self.project,
            title="更新前日本語名",
            is_all_day=False,
            start_date=timezone.now() + timedelta(hours=1),
            end_date=timezone.now() + timedelta(hours=2),
            color="green",
        )

        # API URL
        event_url = f"/api/projects/{self.project.project_id}/events/{event.event_id}/"

        # user1がイベントを更新
        headers = get_auth_headers(self.user1)
        update_data = {"title": "更新後日本語名"}
        response = self.client.patch(event_url, update_data, format="json", **headers)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # 日本語の通知メッセージを確認
        notification = Notification.objects.filter(
            recipient=self.user2, notification_type="event"
        ).first()

        self.assertIsNotNone(notification)
        self.assertEqual(notification.title, "イベント通知")
        self.assertIn(
            "イベント『更新後日本語名』が更新されました", notification.message
        )

    def test_multiple_event_updates_create_multiple_notifications(self):
        """複数回のイベント更新で複数の通知が作成されること"""
        # イベントを作成
        event = Event.objects.create(
            project=self.project,
            title="多重更新イベント",
            is_all_day=False,
            start_date=timezone.now() + timedelta(hours=1),
            end_date=timezone.now() + timedelta(hours=2),
            color="blue",
        )

        # API URL
        event_url = f"/api/projects/{self.project.project_id}/events/{event.event_id}/"

        # user1が複数回イベントを更新
        headers = get_auth_headers(self.user1)

        # 1回目の更新
        self.client.patch(event_url, {"title": "1回目更新"}, format="json", **headers)

        # 2回目の更新
        self.client.patch(event_url, {"title": "2回目更新"}, format="json", **headers)

        # 3回目の更新
        self.client.patch(event_url, {"title": "3回目更新"}, format="json", **headers)

        # 通知を確認
        notifications = Notification.objects.filter(
            recipient=self.user2, notification_type="event"
        )
        self.assertEqual(notifications.count(), 3)  # 3回の更新で3通知

        # 各通知のメッセージを確認
        messages = [n.message for n in notifications]
        self.assertIn("イベント『1回目更新』が更新されました", messages)
        self.assertIn("イベント『2回目更新』が更新されました", messages)
        self.assertIn("イベント『3回目更新』が更新されました", messages)

    def test_event_creator_notified_when_other_updates(self):
        """他のユーザーがイベントを更新した場合、作成者に通知が送られること"""
        # user1がイベントを作成
        event = Event.objects.create(
            project=self.project,
            title="作成者通知イベント",
            is_all_day=False,
            start_date=timezone.now() + timedelta(hours=1),
            end_date=timezone.now() + timedelta(hours=2),
            color="blue",
        )

        # user2がイベントを更新
        event_url = f"/api/projects/{self.project.project_id}/events/{event.event_id}/"
        headers = get_auth_headers(self.user2)
        update_data = {"title": "user2による更新"}
        response = self.client.patch(event_url, update_data, format="json", **headers)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # user1に通知が送られたことを確認
        notifications = Notification.objects.filter(
            recipient=self.user1, notification_type="event"
        )
        self.assertEqual(notifications.count(), 1)

        notification = notifications.first()
        self.assertEqual(notification.title, "イベント通知")
        self.assertIn("user2による更新", notification.message)
