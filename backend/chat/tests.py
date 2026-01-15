from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APITestCase
from rest_framework import status

from projects.models import Project
from .models import ChatRoom, ChatRoomUser, Message

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
