from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APITestCase
from rest_framework import status
from channels.testing import WebsocketCommunicator
from channels.layers import get_channel_layer
from django.contrib.sessions.backends.db import SessionStore

from projects.models import Project
from .models import ChatRoom, ChatRoomUser, Message
from backend.asgi import application

User = get_user_model()


class ChatAPITests(APITestCase):
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
        self.client.force_authenticate(user=self.user)

    def test_chatroom_list_includes_member_email_and_profile_picture(self):
        """チャットルーム一覧でメンバーのemailとprofile_pictureが含まれるテスト"""
        chatroom = ChatRoom.objects.create(project=self.project, name="Test Room")
        ChatRoomUser.objects.create(chatroom=chatroom, user=self.user)
        ChatRoomUser.objects.create(chatroom=chatroom, user=self.user2)

        url = f"/api/projects/{self.project.project_id}/chatrooms/"
        response = self.client.get(url, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(len(response.data["chatrooms"]), 0)
        chatroom_data = response.data["chatrooms"][0]
        self.assertIn("members", chatroom_data)
        self.assertGreater(len(chatroom_data["members"]), 0)
        member = chatroom_data["members"][0]
        self.assertIn("email", member)
        self.assertIn("profile_picture", member)
        self.assertEqual(member["email"], self.user.email)

    def test_message_includes_email_and_profile_picture(self):
        """メッセージでユーザーのemailとprofile_pictureが含まれるテスト"""
        chatroom = ChatRoom.objects.create(project=self.project, name="Test Room")
        ChatRoomUser.objects.create(chatroom=chatroom, user=self.user)

        Message.objects.create(
            chatroom=chatroom, user=self.user, content="Test message"
        )

        url = f"/api/projects/{self.project.project_id}/chatrooms/{chatroom.chatroom_id}/messages/"
        response = self.client.get(url, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(len(response.data["messages"]), 0)
        message_data = response.data["messages"][0]
        self.assertIn("email", message_data)
        self.assertIn("profile_picture", message_data)
        self.assertEqual(message_data["email"], self.user.email)


class ChatWebSocketTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser", email="test@example.com", password="testpass123"
        )
        self.user2 = User.objects.create_user(
            username="user2", email="user2@example.com", password="testpass123"
        )
        self.user3 = User.objects.create_user(
            username="user3", email="user3@example.com", password="testpass123"
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

    async def test_connect_to_chatroom(self):
        """チャットルームへの正常接続テスト"""
        communicator = WebsocketCommunicator(
            application,
            f"/ws/chat/{self.project.project_id}/{self.chatroom.chatroom_id}/",
        )
        connected, subprotocol = await communicator.connect()
        self.assertTrue(connected)

        await communicator.send_json_to({"type": "join_room"})
        response = await communicator.receive_json_from()
        self.assertEqual(response["type"], "connected")

        await communicator.disconnect()

    async def test_send_and_receive_message(self):
        """メッセージ送信とブロードキャストのテスト"""
        communicator = WebsocketCommunicator(
            application,
            f"/ws/chat/{self.project.project_id}/{self.chatroom.chatroom_id}/",
        )
        connected, subprotocol = await communicator.connect()
        self.assertTrue(connected)

        await communicator.send_json_to({"type": "join_room"})
        await communicator.receive_json_from()

        await communicator.send_json_to(
            {"type": "message", "content": "Hello, World!", "user_id": self.user.id}
        )

        response = await communicator.receive_json_from()
        self.assertEqual(response["type"], "message")
        self.assertEqual(response["message"]["content"], "Hello, World!")
        self.assertEqual(response["message"]["user_id"], self.user.id)

        await communicator.disconnect()

    async def test_multiple_clients_message_sync(self):
        """複数クライアント間でのメッセージ同期テスト"""
        communicator1 = WebsocketCommunicator(
            application,
            f"/ws/chat/{self.project.project_id}/{self.chatroom.chatroom_id}/",
        )
        communicator2 = WebsocketCommunicator(
            application,
            f"/ws/chat/{self.project.project_id}/{self.chatroom.chatroom_id}/",
        )

        connected1, _ = await communicator1.connect()
        connected2, _ = await communicator2.connect()
        self.assertTrue(connected1)
        self.assertTrue(connected2)

        await communicator1.send_json_to({"type": "join_room"})
        await communicator1.receive_json_from()
        await communicator2.send_json_to({"type": "join_room"})
        await communicator2.receive_json_from()

        await communicator1.send_json_to(
            {"type": "message", "content": "Test message", "user_id": self.user.id}
        )

        response1 = await communicator1.receive_json_from()
        response2 = await communicator2.receive_json_from()

        self.assertEqual(response1["type"], "message")
        self.assertEqual(response2["type"], "message")
        self.assertEqual(response1["message"]["content"], "Test message")
        self.assertEqual(response2["message"]["content"], "Test message")

        await communicator1.disconnect()
        await communicator2.disconnect()

    async def test_empty_message_rejected(self):
        """空メッセージの拒否テスト"""
        communicator = WebsocketCommunicator(
            application,
            f"/ws/chat/{self.project.project_id}/{self.chatroom.chatroom_id}/",
        )
        connected, _ = await communicator.connect()
        self.assertTrue(connected)

        await communicator.send_json_to({"type": "join_room"})
        await communicator.receive_json_from()

        await communicator.send_json_to(
            {"type": "message", "content": "", "user_id": self.user.id}
        )

        await communicator.disconnect()

    async def test_whitespace_only_message_rejected(self):
        """空白のみのメッセージ拒否テスト"""
        communicator = WebsocketCommunicator(
            application,
            f"/ws/chat/{self.project.project_id}/{self.chatroom.chatroom_id}/",
        )
        connected, _ = await communicator.connect()
        self.assertTrue(connected)

        await communicator.send_json_to({"type": "join_room"})
        await communicator.receive_json_from()

        await communicator.send_json_to(
            {"type": "message", "content": "   ", "user_id": self.user.id}
        )

        await communicator.disconnect()

    async def test_invalid_chatroom_id_message_fails(self):
        """無効なチャットルームIDでのメッセージ送信失敗テスト"""
        import uuid

        communicator = WebsocketCommunicator(
            application,
            f"/ws/chat/{self.project.project_id}/{self.chatroom.chatroom_id}/",
        )
        connected, _ = await communicator.connect()
        self.assertTrue(connected)

        await communicator.send_json_to({"type": "join_room"})
        await communicator.receive_json_from()

        await communicator.send_json_to(
            {"type": "message", "content": "Test", "user_id": self.user.id}
        )

        await communicator.receive_json_from()

        await communicator.disconnect()

    async def test_non_member_can_connect_but_message_fails(self):
        """メンバー以外のユーザーは接続できるが、メッセージ送信が失敗するテスト"""
        communicator = WebsocketCommunicator(
            application,
            f"/ws/chat/{self.project.project_id}/{self.chatroom.chatroom_id}/",
        )
        connected, _ = await communicator.connect()

        self.assertTrue(connected)

        await communicator.send_json_to({"type": "join_room"})
        await communicator.receive_json_from()

        await communicator.disconnect()

    async def test_typing_notification(self):
        """タイピング通知の送受信テスト"""
        communicator1 = WebsocketCommunicator(
            application,
            f"/ws/chat/{self.project.project_id}/{self.chatroom.chatroom_id}/",
        )
        communicator2 = WebsocketCommunicator(
            application,
            f"/ws/chat/{self.project.project_id}/{self.chatroom.chatroom_id}/",
        )

        connected1, _ = await communicator1.connect()
        connected2, _ = await communicator2.connect()
        self.assertTrue(connected1)
        self.assertTrue(connected2)

        await communicator1.send_json_to({"type": "join_room"})
        await communicator1.receive_json_from()
        await communicator2.send_json_to({"type": "join_room"})
        await communicator2.receive_json_from()

        await communicator1.send_json_to(
            {"type": "typing", "user_id": self.user.id, "is_typing": True}
        )

        response = await communicator2.receive_json_from()
        self.assertEqual(response["type"], "typing")
        self.assertTrue(response["is_typing"])

        await communicator1.send_json_to(
            {"type": "typing", "user_id": self.user.id, "is_typing": False}
        )

        response = await communicator2.receive_json_from()
        self.assertFalse(response["is_typing"])

        await communicator1.send_json_to({"type": "join_room"})
        await communicator2.send_json_to({"type": "join_room"})
        await communicator1.disconnect()
        await communicator2.disconnect()

    async def test_message_creation_in_database(self):
        """WebSocket経由で送信したメッセージがデータベースに保存されるテスト"""
        communicator = WebsocketCommunicator(
            application,
            f"/ws/chat/{self.project.project_id}/{self.chatroom.chatroom_id}/",
        )
        connected, _ = await communicator.connect()
        self.assertTrue(connected)

        await communicator.send_json_to({"type": "join_room"})
        await communicator.receive_json_from()

        message_content = "Database test message"
        await communicator.send_json_to(
            {"type": "message", "content": message_content, "user_id": self.user.id}
        )

        response = await communicator.receive_json_from()
        self.assertEqual(response["type"], "message")

        message_exists = await Message.objects.filter(
            chatroom=self.chatroom, user=self.user, content=message_content
        ).aexists()
        self.assertTrue(message_exists)

        await communicator.send_json_to({"type": "join_room"})
        await communicator.disconnect()

    async def test_disconnect_removes_from_group(self):
        """切断時にグループから削除されるテスト"""
        communicator1 = WebsocketCommunicator(
            application,
            f"/ws/chat/{self.project.project_id}/{self.chatroom.chatroom_id}/",
        )
        communicator2 = WebsocketCommunicator(
            application,
            f"/ws/chat/{self.project.project_id}/{self.chatroom.chatroom_id}/",
        )

        await communicator1.connect()
        await communicator2.connect()

        await communicator1.send_json_to({"type": "join_room"})
        await communicator1.receive_json_from()
        await communicator2.send_json_to({"type": "join_room"})
        await communicator2.receive_json_from()

        await communicator1.disconnect()

        await communicator2.send_json_to(
            {"type": "message", "content": "After disconnect", "user_id": self.user.id}
        )

        response = await communicator2.receive_json_from()
        self.assertEqual(response["type"], "message")

        await communicator2.send_json_to({"type": "join_room"})
        await communicator2.disconnect()

    async def test_message_persists_user_data(self):
        """メッセージにユーザーデータが正しく保存されるテスト"""
        communicator = WebsocketCommunicator(
            application,
            f"/ws/chat/{self.project.project_id}/{self.chatroom.chatroom_id}/",
        )
        connected, _ = await communicator.connect()
        self.assertTrue(connected)

        await communicator.send_json_to({"type": "join_room"})
        await communicator.receive_json_from()

        await communicator.send_json_to(
            {"type": "message", "content": "User data test", "user_id": self.user.id}
        )

        response = await communicator.receive_json_from()
        self.assertEqual(response["type"], "message")
        self.assertEqual(response["message"]["user_id"], self.user.id)
        self.assertEqual(response["message"]["name"], self.user.username)
        self.assertEqual(response["message"]["email"], self.user.email)

        await communicator.send_json_to({"type": "join_room"})
        await communicator.disconnect()
