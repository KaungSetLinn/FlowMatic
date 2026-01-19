from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APITestCase
from rest_framework import status
from rest_framework_simplejwt.tokens import AccessToken

from projects.models import Project
from .models import ChatRoom, ChatRoomUser, Message, MessageReaction

User = get_user_model()


def get_auth_headers(user):
    """ユーザーのJWTトークンを使用して認証ヘッダーを生成"""
    token = AccessToken.for_user(user)
    return {"HTTP_AUTHORIZATION": f"Bearer {token}"}


class ChatRoomAPITests(APITestCase):
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


class MessageAPITests(APITestCase):
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

    def test_message_with_reply_to(self):
        """リプライ付きメッセージの作成と取得テスト"""
        chatroom = ChatRoom.objects.create(project=self.project, name="Test Room")
        ChatRoomUser.objects.create(chatroom=chatroom, user=self.user)

        original_message = Message.objects.create(
            chatroom=chatroom, user=self.user, content="Original message"
        )

        url = f"/api/projects/{self.project.project_id}/chatrooms/{chatroom.chatroom_id}/messages/"
        response = self.client.post(
            url,
            {
                "content": "Reply message",
                "reply_to_id": str(original_message.message_id),
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["content"], "Reply message")
        self.assertIsNotNone(response.data["reply_to_message"])
        self.assertEqual(
            response.data["reply_to_message"]["message_id"],
            str(original_message.message_id),
        )

        reply_message = Message.objects.get(message_id=response.data["message_id"])
        self.assertEqual(reply_message.reply_to, original_message)

    def test_message_list_includes_reactions(self):
        """メッセージ一覧でリアクションが含まれるテスト"""
        chatroom = ChatRoom.objects.create(project=self.project, name="Test Room")
        ChatRoomUser.objects.create(chatroom=chatroom, user=self.user)
        ChatRoomUser.objects.create(chatroom=chatroom, user=self.user2)

        message = Message.objects.create(
            chatroom=chatroom, user=self.user, content="Test message"
        )

        reaction = MessageReaction.objects.create(
            message=message, user=self.user2, emoji="👍"
        )

        url = f"/api/projects/{self.project.project_id}/chatrooms/{chatroom.chatroom_id}/messages/"
        response = self.client.get(url, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(len(response.data["messages"]), 0)
        message_data = response.data["messages"][0]
        self.assertIn("reactions", message_data)
        self.assertIn("👍", message_data["reactions"])
        self.assertIn(self.user2.id, message_data["reactions"]["👍"])

    def test_reply_to_nonexistent_message_fails(self):
        """存在しないメッセージへのリプライは失敗するテスト"""
        chatroom = ChatRoom.objects.create(project=self.project, name="Test Room")
        ChatRoomUser.objects.create(chatroom=chatroom, user=self.user)

        import uuid

        fake_message_id = uuid.uuid4()

        url = f"/api/projects/{self.project.project_id}/chatrooms/{chatroom.chatroom_id}/messages/"
        response = self.client.post(
            url,
            {"content": "Reply message", "reply_to_id": str(fake_message_id)},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class ReactionAPITests(APITestCase):
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

    def test_add_reaction_to_message(self):
        """メッセージへのリアクション追加テスト"""
        chatroom = ChatRoom.objects.create(project=self.project, name="Test Room")
        ChatRoomUser.objects.create(chatroom=chatroom, user=self.user)

        message = Message.objects.create(
            chatroom=chatroom, user=self.user2, content="Test message"
        )

        url = f"/api/projects/{self.project.project_id}/chatrooms/{chatroom.chatroom_id}/messages/{message.message_id}/reactions/"
        response = self.client.post(url, {"emoji": "👍"}, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["emoji"], "👍")
        self.assertEqual(response.data["user_id"], self.user.id)

        reaction = MessageReaction.objects.filter(
            message=message, user=self.user, emoji="👍"
        ).first()
        self.assertIsNotNone(reaction)

    def test_add_reaction_to_own_message(self):
        """自分のメッセージへのリアクション追加テスト"""
        chatroom = ChatRoom.objects.create(project=self.project, name="Test Room")
        ChatRoomUser.objects.create(chatroom=chatroom, user=self.user)

        message = Message.objects.create(
            chatroom=chatroom, user=self.user, content="My message"
        )

        url = f"/api/projects/{self.project.project_id}/chatrooms/{chatroom.chatroom_id}/messages/{message.message_id}/reactions/"
        response = self.client.post(url, {"emoji": "❤️"}, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["emoji"], "❤️")

        reaction = MessageReaction.objects.filter(
            message=message, user=self.user, emoji="❤️"
        ).first()
        self.assertIsNotNone(reaction)

    def test_toggle_reaction_removes_existing(self):
        """同じリアクションを再追加すると削除されるテスト"""
        chatroom = ChatRoom.objects.create(project=self.project, name="Test Room")
        ChatRoomUser.objects.create(chatroom=chatroom, user=self.user)

        message = Message.objects.create(
            chatroom=chatroom, user=self.user, content="Test message"
        )

        url = f"/api/projects/{self.project.project_id}/chatrooms/{chatroom.chatroom_id}/messages/{message.message_id}/reactions/"

        response1 = self.client.post(url, {"emoji": "👍"}, format="json")
        self.assertEqual(response1.status_code, status.HTTP_201_CREATED)

        reaction_exists = MessageReaction.objects.filter(
            message=message, user=self.user, emoji="👍"
        ).exists()
        self.assertTrue(reaction_exists)

        response2 = self.client.post(url, {"emoji": "👍"}, format="json")
        self.assertEqual(response2.status_code, status.HTTP_200_OK)
        self.assertEqual(response2.data["detail"], "Reaction removed.")

        reaction_exists = MessageReaction.objects.filter(
            message=message, user=self.user, emoji="👍"
        ).exists()
        self.assertFalse(reaction_exists)

    def test_remove_reaction_from_message(self):
        """メッセージからのリアクション削除テスト"""
        chatroom = ChatRoom.objects.create(project=self.project, name="Test Room")
        ChatRoomUser.objects.create(chatroom=chatroom, user=self.user)

        message = Message.objects.create(
            chatroom=chatroom, user=self.user2, content="Test message"
        )

        reaction = MessageReaction.objects.create(
            message=message, user=self.user, emoji="👍"
        )

        url = f"/api/projects/{self.project.project_id}/chatrooms/{chatroom.chatroom_id}/messages/{message.message_id}/reactions/%F0%9F%91%8D/"
        response = self.client.delete(url)

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(
            MessageReaction.objects.filter(
                message=message, user=self.user, emoji="👍"
            ).exists()
        )

    def test_add_reaction_without_membership_fails(self):
        """チャットルームメンバー以外はリアクションを追加できないテスト"""
        non_member = User.objects.create_user(
            username="nonmember", email="nonmember@example.com", password="testpass123"
        )
        self.project.members.add(non_member)

        chatroom = ChatRoom.objects.create(project=self.project, name="Test Room")
        ChatRoomUser.objects.create(chatroom=chatroom, user=self.user)

        message = Message.objects.create(
            chatroom=chatroom, user=self.user, content="Test message"
        )

        self.client.force_authenticate(user=non_member)
        url = f"/api/projects/{self.project.project_id}/chatrooms/{chatroom.chatroom_id}/messages/{message.message_id}/reactions/"
        response = self.client.post(url, {"emoji": "👍"}, format="json")

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
