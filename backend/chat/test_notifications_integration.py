from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APITestCase
from rest_framework import status
from rest_framework_simplejwt.tokens import AccessToken

from projects.models import Project
from .models import ChatRoom, ChatRoomUser, Message, MessageReaction
from notifications.models import Notification

User = get_user_model()


def get_auth_headers(user):
    """ユーザーのJWTトークンを使用して認証ヘッダーを生成"""
    token = AccessToken.for_user(user)
    return {"HTTP_AUTHORIZATION": f"Bearer {token}"}


class ReplyNotificationTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser", email="test@example.com", password="testpass123"
        )
        self.user2 = User.objects.create_user(
            username="user2", email="user2@example.com", password="testpass123"
        )
        self.project = Project.objects.create(
            title="Test Project",
            description="Test Description",
            start_date=timezone.now(),
            deadline=timezone.now() + timezone.timedelta(days=30),
        )
        self.project.members.add(self.user, self.user2)

        self.chatroom = ChatRoom.objects.create(project=self.project, name="Test Room")
        ChatRoomUser.objects.create(chatroom=self.chatroom, user=self.user)
        ChatRoomUser.objects.create(chatroom=self.chatroom, user=self.user2)

        self.original_message = Message.objects.create(
            chatroom=self.chatroom, user=self.user, content="Original message"
        )

    def test_reply_to_message_creates_notification(self):
        """リプライ時に通知が作成されるテスト"""
        headers = get_auth_headers(self.user2)

        url = f"/api/projects/{self.project.project_id}/chatrooms/{self.chatroom.chatroom_id}/messages/"
        response = self.client.post(
            url,
            {
                "content": "Reply message",
                "reply_to_id": str(self.original_message.message_id),
            },
            format="json",
            **headers,
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        reply_message_id = response.data["message_id"]

        notification = Notification.objects.filter(
            recipient=self.user,
            notification_type="chat",
            related_object_id=reply_message_id,
        ).first()

        self.assertIsNotNone(notification)
        self.assertIn("返信", notification.title)

    def test_reply_to_own_message_does_not_create_notification(self):
        """自分のメッセージへのリプライで通知が作成されないテスト"""
        headers = get_auth_headers(self.user)

        initial_notification_count = Notification.objects.filter(
            recipient=self.user, notification_type="chat"
        ).count()

        url = f"/api/projects/{self.project.project_id}/chatrooms/{self.chatroom.chatroom_id}/messages/"
        response = self.client.post(
            url,
            {
                "content": "Reply to own message",
                "reply_to_id": str(self.original_message.message_id),
            },
            format="json",
            **headers,
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        final_notification_count = Notification.objects.filter(
            recipient=self.user, notification_type="chat"
        ).count()

        self.assertEqual(initial_notification_count, final_notification_count)

    def test_reply_notification_includes_sender_info(self):
        """リプライ通知に送信者情報が含まれるテスト"""
        headers = get_auth_headers(self.user2)

        url = f"/api/projects/{self.project.project_id}/chatrooms/{self.chatroom.chatroom_id}/messages/"
        response = self.client.post(
            url,
            {
                "content": "Test reply",
                "reply_to_id": str(self.original_message.message_id),
            },
            format="json",
            **headers,
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        reply_message_id = response.data["message_id"]

        notification = Notification.objects.filter(
            recipient=self.user,
            notification_type="chat",
            related_object_id=reply_message_id,
        ).first()

        self.assertIsNotNone(notification)
        self.assertIn(self.user2.username, notification.message)


class ReactionNotificationTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser", email="test@example.com", password="testpass123"
        )
        self.user2 = User.objects.create_user(
            username="user2", email="user2@example.com", password="testpass123"
        )
        self.project = Project.objects.create(
            title="Test Project",
            description="Test Description",
            start_date=timezone.now(),
            deadline=timezone.now() + timezone.timedelta(days=30),
        )
        self.project.members.add(self.user, self.user2)

        self.chatroom = ChatRoom.objects.create(project=self.project, name="Test Room")
        ChatRoomUser.objects.create(chatroom=self.chatroom, user=self.user)
        ChatRoomUser.objects.create(chatroom=self.chatroom, user=self.user2)

        self.message = Message.objects.create(
            chatroom=self.chatroom, user=self.user, content="Test message"
        )

    def test_reaction_to_message_creates_notification(self):
        """リアクション時に通知が作成されるテスト"""
        headers = get_auth_headers(self.user2)

        url = f"/api/projects/{self.project.project_id}/chatrooms/{self.chatroom.chatroom_id}/messages/{self.message.message_id}/reactions/"
        response = self.client.post(url, {"emoji": "👍"}, format="json", **headers)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        notification = Notification.objects.filter(
            recipient=self.user,
            notification_type="chat",
            related_object_id=str(self.message.message_id),
        ).first()

        self.assertIsNotNone(notification)
        self.assertIn("リアクション", notification.title)

    def test_reaction_to_own_message_does_not_create_notification(self):
        """自分のメッセージへのリアクションで通知が作成されないテスト"""
        headers = get_auth_headers(self.user)

        initial_notification_count = Notification.objects.filter(
            recipient=self.user, notification_type="chat"
        ).count()

        url = f"/api/projects/{self.project.project_id}/chatrooms/{self.chatroom.chatroom_id}/messages/{self.message.message_id}/reactions/"
        response = self.client.post(url, {"emoji": "👍"}, format="json", **headers)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        final_notification_count = Notification.objects.filter(
            recipient=self.user, notification_type="chat"
        ).count()

        self.assertEqual(initial_notification_count, final_notification_count)

    def test_multiple_reactions_create_multiple_notifications(self):
        """複数の異なるユーザーからリアクションされると複数の通知が作られるテスト"""
        user3 = User.objects.create_user(
            username="user3", email="user3@example.com", password="testpass123"
        )
        self.project.members.add(user3)
        ChatRoomUser.objects.create(chatroom=self.chatroom, user=user3)

        headers2 = get_auth_headers(self.user2)
        headers3 = get_auth_headers(user3)

        url = f"/api/projects/{self.project.project_id}/chatrooms/{self.chatroom.chatroom_id}/messages/{self.message.message_id}/reactions/"

        response1 = self.client.post(url, {"emoji": "👍"}, format="json", **headers2)
        self.assertEqual(response1.status_code, status.HTTP_201_CREATED)

        response2 = self.client.post(url, {"emoji": "❤️"}, format="json", **headers3)
        self.assertEqual(response2.status_code, status.HTTP_201_CREATED)

        notification_count = Notification.objects.filter(
            recipient=self.user,
            notification_type="chat",
            related_object_id=str(self.message.message_id),
        ).count()

        self.assertEqual(notification_count, 2)

    def test_reaction_notification_includes_emoji(self):
        """リアクション通知に絵文字情報が含まれるテスト"""
        headers = get_auth_headers(self.user2)

        url = f"/api/projects/{self.project.project_id}/chatrooms/{self.chatroom.chatroom_id}/messages/{self.message.message_id}/reactions/"
        response = self.client.post(url, {"emoji": "🎉"}, format="json", **headers)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        notification = Notification.objects.filter(
            recipient=self.user,
            notification_type="chat",
            related_object_id=str(self.message.message_id),
        ).first()

        self.assertIsNotNone(notification)
        self.assertIn("🎉", notification.message)

    def test_same_emoji_from_same_user_does_not_duplicate_notification(self):
        """同じユーザーが同じ絵文字で再度リアクションしても通知が重複しないテスト（トグル機能）"""
        headers = get_auth_headers(self.user2)

        url = f"/api/projects/{self.project.project_id}/chatrooms/{self.chatroom.chatroom_id}/messages/{self.message.message_id}/reactions/"

        response1 = self.client.post(url, {"emoji": "👍"}, format="json", **headers)
        self.assertEqual(response1.status_code, status.HTTP_201_CREATED)

        notification_count_after_first = Notification.objects.filter(
            recipient=self.user,
            notification_type="chat",
            related_object_id=str(self.message.message_id),
        ).count()
        self.assertEqual(notification_count_after_first, 1)

        response2 = self.client.post(url, {"emoji": "👍"}, format="json", **headers)
        self.assertEqual(response2.status_code, status.HTTP_200_OK)

        notification_count_after_toggle = Notification.objects.filter(
            recipient=self.user,
            notification_type="chat",
            related_object_id=str(self.message.message_id),
        ).count()
        self.assertEqual(notification_count_after_toggle, 1)


class WebSocketNotificationTests(TestCase):
    """WebSocket経由のリプライ・リアクションで通知が作られるかのテスト"""

    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser", email="test@example.com", password="testpass123"
        )
        self.user2 = User.objects.create_user(
            username="user2", email="user2@example.com", password="testpass123"
        )
        self.project = Project.objects.create(
            title="Test Project",
            description="Test Description",
            start_date=timezone.now(),
            deadline=timezone.now() + timezone.timedelta(days=30),
        )
        self.project.members.add(self.user, self.user2)

        self.chatroom = ChatRoom.objects.create(project=self.project, name="Test Room")
        ChatRoomUser.objects.create(chatroom=self.chatroom, user=self.user)
        ChatRoomUser.objects.create(chatroom=self.chatroom, user=self.user2)

        self.message = Message.objects.create(
            chatroom=self.chatroom, user=self.user, content="Test message"
        )

    async def test_websocket_reply_creates_notification(self):
        """WebSocket経由でリプライを送信した時に通知が作られるテスト"""
        from channels.testing import WebsocketCommunicator
        from backend.asgi import application

        token = AccessToken.for_user(self.user2)
        communicator = WebsocketCommunicator(
            application,
            f"/ws/chat/{self.project.project_id}/{self.chatroom.chatroom_id}/?token={str(token)}",
        )
        connected, _ = await communicator.connect()
        self.assertTrue(connected)

        await communicator.send_json_to({"type": "join_room"})
        while True:
            response = await communicator.receive_json_from(timeout=1)
            if response.get("type") == "history_complete":
                break

        await communicator.send_json_to(
            {
                "type": "message",
                "content": "Reply via WebSocket",
                "reply_to": str(self.message.message_id),
            }
        )

        response = await communicator.receive_json_from()
        reply_message_id = response["message"]["message_id"]
        await communicator.disconnect()

        notification_exists = await Notification.objects.filter(
            recipient=self.user,
            notification_type="chat",
            related_object_id=reply_message_id,
        ).aexists()
        self.assertTrue(notification_exists)

    async def test_websocket_reaction_creates_notification(self):
        """WebSocket経由でリアクションを追加した時に通知が作られるテスト"""
        from channels.testing import WebsocketCommunicator
        from backend.asgi import application

        token = AccessToken.for_user(self.user2)
        communicator = WebsocketCommunicator(
            application,
            f"/ws/chat/{self.project.project_id}/{self.chatroom.chatroom_id}/?token={str(token)}",
        )
        connected, _ = await communicator.connect()
        self.assertTrue(connected)

        await communicator.send_json_to({"type": "join_room"})
        while True:
            response = await communicator.receive_json_from(timeout=1)
            if response.get("type") == "history_complete":
                break

        await communicator.send_json_to(
            {
                "type": "add_reaction",
                "message_id": str(self.message.message_id),
                "emoji": "👍",
            }
        )

        await communicator.receive_json_from()
        await communicator.disconnect()

        notification_exists = await Notification.objects.filter(
            recipient=self.user,
            notification_type="chat",
            related_object_id=str(self.message.message_id),
        ).aexists()
        self.assertTrue(notification_exists)
