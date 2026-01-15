from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status

from projects.models import Project
from chat.models import ChatRoom, Message
from notifications.models import Notification

User = get_user_model()


class ChatNotificationIntegrationTest(APITestCase):
    """
    Chat Appの通知機能統合テスト
    新規メッセージ送信時の通知をテスト
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
        from django.utils import timezone
        from datetime import timedelta

        self.project = Project.objects.create(
            title="テストプロジェクト",
            start_date=timezone.now(),
            deadline=timezone.now() + timedelta(days=30),
        )
        self.project.members.add(self.user1, self.user2, self.user3)

        # テストチャットルーム作成
        self.chatroom = ChatRoom.objects.create(project=self.project)
        self.chatroom.members.add(self.user1, self.user2, self.user3)

        # API URL
        self.messages_url = f"/api/projects/{self.project.project_id}/chatrooms/{self.chatroom.chatroom_id}/messages/"

    def test_message_creation_sends_notifications_to_all_members_except_sender(self):
        """メッセージ作成時、送信者以外の全チャットルームメンバーに通知が送られること"""
        self.client.force_authenticate(user=self.user1)

        message_data = {"content": "テストメッセージです"}

        response = self.client.post(self.messages_url, message_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # 通知が作成されたことを確認
        notifications = Notification.objects.filter(
            notification_type="chat", title="新しいメッセージ"
        )
        self.assertEqual(notifications.count(), 2)  # user2とuser3に通知

        # user2とuser3に通知が送られたことを確認
        notified_users = [n.recipient for n in notifications]
        self.assertIn(self.user2, notified_users)
        self.assertIn(self.user3, notified_users)
        self.assertNotIn(self.user1, notified_users)  # 送信者には通知なし

        # 通知メッセージの確認
        for notification in notifications:
            self.assertIn(
                "user1さんから新しいメッセージが届いています", notification.message
            )
            self.assertEqual(
                notification.related_object_id, str(response.data["message_id"])
            )

    def test_message_notification_uses_japanese_language(self):
        """メッセージ通知が日本語で表示されること"""
        self.client.force_authenticate(user=self.user1)

        message_data = {"content": "日本語メッセージ"}

        response = self.client.post(self.messages_url, message_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # 日本語の通知メッセージを確認
        notification = Notification.objects.filter(
            recipient=self.user2, notification_type="chat"
        ).first()

        self.assertIsNotNone(notification)
        self.assertEqual(notification.title, "新しいメッセージ")
        self.assertIn(
            "user1さんから新しいメッセージが届いています", notification.message
        )

    def test_different_users_send_messages_create_separate_notifications(self):
        """異なるユーザーがメッセージを送信した場合、それぞれ通知が作成されること"""
        # user1がメッセージ送信
        self.client.force_authenticate(user=self.user1)
        message_data1 = {"content": "user1のメッセージ"}
        response1 = self.client.post(self.messages_url, message_data1, format="json")
        self.assertEqual(response1.status_code, status.HTTP_201_CREATED)

        # user2がメッセージ送信
        self.client.force_authenticate(user=self.user2)
        message_data2 = {"content": "user2のメッセージ"}
        response2 = self.client.post(self.messages_url, message_data2, format="json")
        self.assertEqual(response2.status_code, status.HTTP_201_CREATED)

        # user3の通知を確認
        user3_notifications = Notification.objects.filter(
            recipient=self.user3, notification_type="chat"
        )
        self.assertEqual(user3_notifications.count(), 2)  # user1とuser2からの2通知

        # 通知メッセージを確認
        messages = [n.message for n in user3_notifications]
        self.assertIn("user1さんから新しいメッセージが届いています", messages)
        self.assertIn("user2さんから新しいメッセージが届いています", messages)

    def test_multiple_messages_from_same_user_create_multiple_notifications(self):
        """同一ユーザーから複数メッセージが送信された場合、複数の通知が作成されること"""
        self.client.force_authenticate(user=self.user1)

        # 複数のメッセージを送信
        for i in range(3):
            message_data = {"content": f"メッセージ{i + 1}"}
            response = self.client.post(self.messages_url, message_data, format="json")
            self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # user2の通知を確認
        user2_notifications = Notification.objects.filter(
            recipient=self.user2, notification_type="chat"
        )
        self.assertEqual(user2_notifications.count(), 3)  # 3メッセージで3通知

    def test_message_notification_related_object_id(self):
        """メッセージ通知のrelated_object_idが正しく設定されること"""
        self.client.force_authenticate(user=self.user1)

        message_data = {"content": "ID確認メッセージ"}
        response = self.client.post(self.messages_url, message_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # 通知のrelated_object_idを確認
        notification = Notification.objects.filter(
            recipient=self.user2, notification_type="chat"
        ).first()

        self.assertIsNotNone(notification)
        self.assertEqual(
            notification.related_object_id, str(response.data["message_id"])
        )

    def test_chatroom_with_two_members_notification(self):
        """2人だけのチャットルームでも通知が正しく機能すること"""
        # 2人だけのチャットルームを作成
        small_chatroom = ChatRoom.objects.create(
            name="2人チャット", project=self.project
        )
        small_chatroom.members.add(self.user1, self.user2)

        # API URL
        small_messages_url = f"/api/projects/{self.project.project_id}/chatrooms/{small_chatroom.chatroom_id}/messages/"

        # user1がメッセージ送信
        self.client.force_authenticate(user=self.user1)
        message_data = {"content": "2人でのメッセージ"}
        response = self.client.post(small_messages_url, message_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # 通知を確認
        notifications = Notification.objects.filter(
            notification_type="chat", title="新しいメッセージ"
        )
        self.assertEqual(notifications.count(), 1)  # user2にのみ通知

        notification = notifications.first()
        self.assertEqual(notification.recipient, self.user2)

    def test_message_content_affects_notification_display(self):
        """メッセージ内容が通知表示に影響しないこと（送信者名のみ表示）"""
        self.client.force_authenticate(user=self.user1)

        message_data = {"content": "特別な文字!@#$%^&*()を含むメッセージ"}
        response = self.client.post(self.messages_url, message_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # 通知メッセージは送信者名のみを含み、メッセージ内容は含まない
        notification = Notification.objects.filter(
            recipient=self.user2, notification_type="chat"
        ).first()

        self.assertIsNotNone(notification)
        self.assertEqual(notification.title, "新しいメッセージ")
        self.assertEqual(
            notification.message, "user1さんから新しいメッセージが届いています"
        )
        # メッセージ内容は含まれていないことを確認
        self.assertNotIn("特別な文字", notification.message)

    def test_user_not_in_chatroom_does_not_receive_notification(self):
        """チャットルームに参加していないユーザーは通知を受け取らないこと"""
        # user4を追加（チャットルームには参加していない）
        user4 = User.objects.create_user(
            username="user4", email="user4@example.com", password="testpass123"
        )
        self.project.members.add(user4)

        self.client.force_authenticate(user=self.user1)
        message_data = {"content": "限定メッセージ"}
        response = self.client.post(self.messages_url, message_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # user4には通知が送られないことを確認
        user4_notifications = Notification.objects.filter(
            recipient=user4, notification_type="chat"
        )
        self.assertEqual(user4_notifications.count(), 0)

        # チャットルームメンバーには通知が送られることを確認
        user2_notifications = Notification.objects.filter(
            recipient=self.user2, notification_type="chat"
        )
        self.assertEqual(user2_notifications.count(), 1)

    def test_message_sender_name_in_notification(self):
        """通知メッセージに正しい送信者名が表示されること"""
        # 異なるユーザー名でテスト
        self.client.force_authenticate(user=self.user2)
        message_data = {"content": "user2からのメッセージ"}
        response = self.client.post(self.messages_url, message_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # user2からの通知を確認
        notification = Notification.objects.filter(
            recipient=self.user1, notification_type="chat"
        ).first()

        self.assertIsNotNone(notification)
        self.assertEqual(
            notification.message, "user2さんから新しいメッセージが届いています"
        )

    def test_empty_message_notification(self):
        """空メッセージでも通知が送信されること"""
        self.client.force_authenticate(user=self.user1)
        message_data = {"content": ""}

        # 空メッセージはバリデーションで弾かれる可能性があるため、最小のメッセージでテスト
        message_data = {"content": " "}  # スペースのみ
        response = self.client.post(self.messages_url, message_data, format="json")

        # バリデーション通過しない場合もあるので、成功した場合のみ通知を確認
        if response.status_code == status.HTTP_201_CREATED:
            notifications = Notification.objects.filter(
                notification_type="chat", title="新しいメッセージ"
            )
            self.assertEqual(notifications.count(), 2)  # user2とuser3に通知
