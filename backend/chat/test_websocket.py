from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from channels.testing import WebsocketCommunicator
from rest_framework_simplejwt.tokens import AccessToken

from projects.models import Project
from .models import ChatRoom, ChatRoomUser, Message, MessageReaction
from backend.asgi import application

User = get_user_model()


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

        self.message = Message.objects.create(
            chatroom=self.chatroom, user=self.user, content="Test message"
        )

    async def test_connect_to_chatroom(self):
        """チャットルームへの正常接続テスト"""
        token = AccessToken.for_user(self.user)
        communicator = WebsocketCommunicator(
            application,
            f"/ws/chat/{self.project.project_id}/{self.chatroom.chatroom_id}/?token={str(token)}",
        )
        connected, subprotocol = await communicator.connect()
        self.assertTrue(connected)

        await communicator.send_json_to({"type": "join_room"})
        while True:
            response = await communicator.receive_json_from(timeout=1)
            if response.get("type") == "history_complete":
                break

        await communicator.disconnect()

    async def test_send_and_receive_message(self):
        """メッセージ送信とブロードキャストのテスト"""
        token = AccessToken.for_user(self.user)
        communicator = WebsocketCommunicator(
            application,
            f"/ws/chat/{self.project.project_id}/{self.chatroom.chatroom_id}/?token={str(token)}",
        )
        connected, subprotocol = await communicator.connect()
        self.assertTrue(connected)

        await communicator.send_json_to({"type": "join_room"})
        while True:
            response = await communicator.receive_json_from(timeout=1)
            if response.get("type") == "history_complete":
                break

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
        token1 = AccessToken.for_user(self.user)
        token2 = AccessToken.for_user(self.user2)
        communicator1 = WebsocketCommunicator(
            application,
            f"/ws/chat/{self.project.project_id}/{self.chatroom.chatroom_id}/?token={str(token1)}",
        )
        communicator2 = WebsocketCommunicator(
            application,
            f"/ws/chat/{self.project.project_id}/{self.chatroom.chatroom_id}/?token={str(token2)}",
        )

        connected1, _ = await communicator1.connect()
        connected2, _ = await communicator2.connect()
        self.assertTrue(connected1)
        self.assertTrue(connected2)

        await communicator1.send_json_to({"type": "join_room"})
        while True:
            response = await communicator1.receive_json_from(timeout=1)
            if response.get("type") == "history_complete":
                break

        await communicator2.send_json_to({"type": "join_room"})
        while True:
            response = await communicator2.receive_json_from(timeout=1)
            if response.get("type") == "history_complete":
                break

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
        while True:
            response = await communicator.receive_json_from(timeout=1)
            if response.get("type") == "history_complete":
                break

        await communicator.send_json_to(
            {"type": "message", "content": "   ", "user_id": self.user.id}
        )

        await communicator.disconnect()

    async def test_non_member_can_connect_but_message_fails(self):
        """メンバー以外のユーザーは接続できるが、メッセージ送信が失敗するテスト"""
        token = AccessToken.for_user(self.user3)
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

        await communicator.disconnect()

    async def test_typing_notification(self):
        """タイピング通知の送受信テスト"""
        token1 = AccessToken.for_user(self.user)
        token2 = AccessToken.for_user(self.user2)
        communicator1 = WebsocketCommunicator(
            application,
            f"/ws/chat/{self.project.project_id}/{self.chatroom.chatroom_id}/?token={str(token1)}",
        )
        communicator2 = WebsocketCommunicator(
            application,
            f"/ws/chat/{self.project.project_id}/{self.chatroom.chatroom_id}/?token={str(token2)}",
        )

        connected1, _ = await communicator1.connect()
        connected2, _ = await communicator2.connect()
        self.assertTrue(connected1)
        self.assertTrue(connected2)

        await communicator1.send_json_to({"type": "join_room"})
        while True:
            response = await communicator1.receive_json_from(timeout=1)
            if response.get("type") == "history_complete":
                break

        await communicator2.send_json_to({"type": "join_room"})
        while True:
            response = await communicator2.receive_json_from(timeout=1)
            if response.get("type") == "history_complete":
                break

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
        token = AccessToken.for_user(self.user)
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
        token = AccessToken.for_user(self.user)
        communicator1 = WebsocketCommunicator(
            application,
            f"/ws/chat/{self.project.project_id}/{self.chatroom.chatroom_id}/?token={str(token)}",
        )
        communicator2 = WebsocketCommunicator(
            application,
            f"/ws/chat/{self.project.project_id}/{self.chatroom.chatroom_id}/?token={str(token)}",
        )

        await communicator1.connect()
        await communicator2.connect()

        await communicator1.send_json_to({"type": "join_room"})
        while True:
            response = await communicator1.receive_json_from(timeout=1)
            if response.get("type") == "history_complete":
                break

        await communicator2.send_json_to({"type": "join_room"})
        while True:
            response = await communicator2.receive_json_from(timeout=1)
            if response.get("type") == "history_complete":
                break

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
        token = AccessToken.for_user(self.user)
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
            {"type": "message", "content": "User data test", "user_id": self.user.id}
        )

        response = await communicator.receive_json_from()
        self.assertEqual(response["type"], "message")
        self.assertEqual(response["message"]["user_id"], self.user.id)
        self.assertEqual(response["message"]["name"], self.user.username)
        self.assertEqual(response["message"]["email"], self.user.email)

        await communicator.send_json_to({"type": "join_room"})
        await communicator.disconnect()

    async def test_send_reply_via_websocket(self):
        """WebSocketでリプライメッセージを送信できるテスト"""
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

        original_message = self.message

        await communicator.send_json_to(
            {
                "type": "message",
                "content": "Reply via WebSocket",
                "reply_to": str(original_message.message_id),
            }
        )

        response = await communicator.receive_json_from()
        self.assertEqual(response["type"], "message")
        self.assertEqual(response["message"]["content"], "Reply via WebSocket")
        self.assertIsNotNone(response["message"]["reply_to_message"])
        self.assertEqual(
            response["message"]["reply_to_message"]["message_id"],
            str(original_message.message_id),
        )

        await communicator.send_json_to({"type": "join_room"})
        await communicator.disconnect()

    async def test_add_reaction_via_websocket(self):
        """WebSocketでリアクションを追加できるテスト"""
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

        message = self.message

        await communicator.send_json_to(
            {
                "type": "add_reaction",
                "message_id": str(message.message_id),
                "emoji": "👍",
            }
        )

        response = await communicator.receive_json_from()
        self.assertEqual(response["type"], "reaction_added")
        self.assertEqual(response["reaction"]["emoji"], "👍")
        self.assertEqual(response["reaction"]["user_id"], self.user2.id)

        reaction_exists = await MessageReaction.objects.filter(
            message=message, user=self.user2, emoji="👍"
        ).aexists()
        self.assertTrue(reaction_exists)

        await communicator.send_json_to({"type": "join_room"})
        await communicator.disconnect()

    async def test_remove_reaction_via_websocket(self):
        """WebSocketでリアクションを削除できるテスト"""
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

        message = self.message

        reaction = await MessageReaction.objects.acreate(
            message=message, user=self.user2, emoji="👍"
        )

        await communicator.send_json_to(
            {
                "type": "remove_reaction",
                "message_id": str(message.message_id),
                "emoji": "👍",
            }
        )

        response = await communicator.receive_json_from()
        self.assertEqual(response["type"], "reaction_removed")
        self.assertEqual(response["emoji"], "👍")
        self.assertEqual(response["user_id"], self.user2.id)

        reaction_exists = await MessageReaction.objects.filter(
            message=message, user=self.user2, emoji="👍"
        ).aexists()
        self.assertFalse(reaction_exists)

        await communicator.send_json_to({"type": "join_room"})
        await communicator.disconnect()

    async def test_reaction_broadcast_to_all_clients(self):
        """リアクションが全クライアントにブロードキャストされるテスト"""
        token1 = AccessToken.for_user(self.user)
        token2 = AccessToken.for_user(self.user2)

        communicator1 = WebsocketCommunicator(
            application,
            f"/ws/chat/{self.project.project_id}/{self.chatroom.chatroom_id}/?token={str(token1)}",
        )
        communicator2 = WebsocketCommunicator(
            application,
            f"/ws/chat/{self.project.project_id}/{self.chatroom.chatroom_id}/?token={str(token2)}",
        )

        connected1, _ = await communicator1.connect()
        connected2, _ = await communicator2.connect()
        self.assertTrue(connected1)
        self.assertTrue(connected2)

        await communicator1.send_json_to({"type": "join_room"})
        while True:
            response = await communicator1.receive_json_from(timeout=1)
            if response.get("type") == "history_complete":
                break

        await communicator2.send_json_to({"type": "join_room"})
        while True:
            response = await communicator2.receive_json_from(timeout=1)
            if response.get("type") == "history_complete":
                break

        message = self.message

        await communicator1.send_json_to(
            {
                "type": "add_reaction",
                "message_id": str(message.message_id),
                "emoji": "❤️",
            }
        )

        response1 = await communicator1.receive_json_from()
        response2 = await communicator2.receive_json_from()

        self.assertEqual(response1["type"], "reaction_added")
        self.assertEqual(response2["type"], "reaction_added")
        self.assertEqual(response1["reaction"]["emoji"], "❤️")
        self.assertEqual(response2["reaction"]["emoji"], "❤️")

        await communicator1.send_json_to({"type": "join_room"})
        await communicator2.send_json_to({"type": "join_room"})
        await communicator1.disconnect()
        await communicator2.disconnect()
