from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APITestCase
from rest_framework import status
from datetime import timedelta
from .models import Notification
from .serializers import NotificationSerializer
from projects.models import Project
from tasks.models import Task, TaskComment
from chat.models import ChatRoom, Message
from event.models import Event

User = get_user_model()


class NotificationModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser", email="test@example.com", password="testpass123"
        )

    def test_notification_creation(self):
        notification = Notification.objects.create(
            recipient=self.user,
            title="Test Notification",
            message="This is a test notification",
            notification_type="task",
            related_object_id=1,
        )

        self.assertEqual(notification.recipient, self.user)
        self.assertEqual(notification.title, "Test Notification")
        self.assertEqual(notification.message, "This is a test notification")
        self.assertEqual(notification.notification_type, "task")
        self.assertEqual(notification.related_object_id, 1)
        self.assertIsNotNone(notification.created_at)

    def test_notification_str_representation(self):
        notification = Notification.objects.create(
            recipient=self.user,
            title="Test Title",
            message="Test message",
            notification_type="system",
        )

        expected_str = f"{notification.title} - {self.user.email}"
        self.assertEqual(str(notification), expected_str)

    def test_notification_ordering(self):
        older_time = timezone.now() - timezone.timedelta(hours=2)
        newer_time = timezone.now() - timezone.timedelta(hours=1)

        # Create notifications with different creation times
        notification1 = Notification.objects.create(
            recipient=self.user,
            title="Older Notification",
            message="Older message",
            notification_type="task",
        )
        notification1.created_at = older_time
        notification1.save()

        notification2 = Notification.objects.create(
            recipient=self.user,
            title="Newer Notification",
            message="Newer message",
            notification_type="project",
        )
        notification2.created_at = newer_time
        notification2.save()

        # Test default ordering (newest first)
        notifications = Notification.objects.all()
        self.assertEqual(notifications.first().title, "Newer Notification")
        self.assertEqual(notifications.last().title, "Older Notification")

    def test_notification_type_choices(self):
        valid_types = ["task", "project", "chat", "event", "system"]

        for notification_type in valid_types:
            notification = Notification.objects.create(
                recipient=self.user,
                title=f"{notification_type.title()} Notification",
                message=f"Test {notification_type} message",
                notification_type=notification_type,
            )
            self.assertEqual(notification.notification_type, notification_type)


class NotificationSerializerTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser", email="test@example.com", password="testpass123"
        )
        self.notification_data = {
            "title": "Test Notification",
            "message": "This is a test notification",
            "notification_type": "task",
            "related_object_id": 1,
        }

    def test_serializer_with_valid_data(self):
        notification = Notification.objects.create(
            recipient=self.user, **self.notification_data
        )

        serializer = NotificationSerializer(notification)
        data = serializer.data

        self.assertEqual(data["id"], notification.id)
        self.assertEqual(data["title"], notification.title)
        self.assertEqual(data["message"], notification.message)
        self.assertEqual(data["notification_type"], notification.notification_type)
        self.assertEqual(
            data["created_at"], notification.created_at.isoformat()[:-6] + "Z"
        )

    def test_serializer_read_only_fields(self):
        notification = Notification.objects.create(
            recipient=self.user, **self.notification_data
        )

        # Test that id and created_at are read-only
        serializer = NotificationSerializer(
            notification,
            data={"id": 999, "created_at": "2023-01-01T00:00:00Z"},
            partial=True,
        )

        # Should validate without errors but not change read-only fields
        self.assertTrue(serializer.is_valid())

    def test_serializer_fields(self):
        notification = Notification.objects.create(
            recipient=self.user, **self.notification_data
        )

        serializer = NotificationSerializer(notification)
        expected_fields = {"id", "title", "message", "notification_type", "created_at"}

        self.assertEqual(set(serializer.data.keys()), expected_fields)


class NotificationListViewTest(APITestCase):
    def setUp(self):
        self.user1 = User.objects.create_user(
            username="user1", email="user1@example.com", password="pass123"
        )
        self.user2 = User.objects.create_user(
            username="user2", email="user2@example.com", password="pass123"
        )

        # Create notifications for user1
        self.notification1 = Notification.objects.create(
            recipient=self.user1,
            title="User1 Notification 1",
            message="First notification for user1",
            notification_type="task",
        )
        self.notification2 = Notification.objects.create(
            recipient=self.user1,
            title="User1 Notification 2",
            message="Second notification for user1",
            notification_type="project",
        )

        # Create notification for user2
        self.notification3 = Notification.objects.create(
            recipient=self.user2,
            title="User2 Notification",
            message="Notification for user2",
            notification_type="chat",
        )

    def test_list_notifications_unauthenticated(self):
        url = "/api/notifications/"
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_list_notifications_authenticated_user1(self):
        self.client.force_authenticate(user=self.user1)
        url = "/api/notifications/"
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

        # Check that only user1's notifications are returned
        titles = [notification["title"] for notification in response.data]
        self.assertIn("User1 Notification 1", titles)
        self.assertIn("User1 Notification 2", titles)
        self.assertNotIn("User2 Notification", titles)

    def test_list_notifications_authenticated_user2(self):
        self.client.force_authenticate(user=self.user2)
        url = "/api/notifications/"
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

        # Check that only user2's notification is returned
        titles = [notification["title"] for notification in response.data]
        self.assertIn("User2 Notification", titles)
        self.assertNotIn("User1 Notification 1", titles)
        self.assertNotIn("User1 Notification 2", titles)

    def test_list_notifications_response_format(self):
        self.client.force_authenticate(user=self.user1)
        url = "/api/notifications/"
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Check response structure
        notification = response.data[0]
        expected_fields = {"id", "title", "message", "notification_type", "created_at"}
        self.assertEqual(set(notification.keys()), expected_fields)

        # Check data types
        self.assertIsInstance(notification["id"], int)
        self.assertIsInstance(notification["title"], str)
        self.assertIsInstance(notification["message"], str)
        self.assertIsInstance(notification["notification_type"], str)
        self.assertIsInstance(notification["created_at"], str)

    def test_list_notifications_empty_for_user_with_no_notifications(self):
        # Create a user with no notifications
        user3 = User.objects.create_user(
            username="user3", email="user3@example.com", password="pass123"
        )

        self.client.force_authenticate(user=user3)
        url = "/api/notifications/"
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)

    def test_list_notifications_ordering(self):
        self.client.force_authenticate(user=self.user1)
        url = "/api/notifications/"
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Notifications should be ordered by created_at descending (newest first)
        notifications = response.data
        self.assertEqual(len(notifications), 2)

        # Check that newer notification comes first
        first_notification = notifications[0]
        second_notification = notifications[1]

        # notification2 was created after notification1 in setUp
        self.assertEqual(first_notification["title"], "User1 Notification 2")
        self.assertEqual(second_notification["title"], "User1 Notification 1")


class NotificationIntegrationTest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser", email="test@example.com", password="testpass123"
        )

    def test_create_and_retrieve_notifications_through_api(self):
        # Create multiple notifications
        notifications_data = [
            {
                "recipient": self.user,
                "title": "Task Notification",
                "message": "New task assigned",
                "notification_type": "task",
            },
            {
                "recipient": self.user,
                "title": "Project Notification",
                "message": "Project updated",
                "notification_type": "project",
            },
            {
                "recipient": self.user,
                "title": "Chat Notification",
                "message": "New message received",
                "notification_type": "chat",
            },
        ]

        for data in notifications_data:
            Notification.objects.create(**data)

        # Retrieve through API
        self.client.force_authenticate(user=self.user)
        url = "/api/notifications/"
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 3)

        # Verify all notification types are present
        notification_types = [n["notification_type"] for n in response.data]
        self.assertIn("task", notification_types)
        self.assertIn("project", notification_types)
        self.assertIn("chat", notification_types)

    def test_notification_isolation_between_users(self):
        # Create notifications for two different users
        user2 = User.objects.create_user(
            username="user2", email="user2@example.com", password="pass123"
        )

        # Create notifications for both users
        Notification.objects.create(
            recipient=self.user,
            title="User1 Notification",
            message="Message for user1",
            notification_type="system",
        )

        Notification.objects.create(
            recipient=user2,
            title="User2 Notification",
            message="Message for user2",
            notification_type="system",
        )

        # Test user1 can only see their notifications
        self.client.force_authenticate(user=self.user)
        url = "/api/notifications/"
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["title"], "User1 Notification")

        # Test user2 can only see their notifications
        self.client.force_authenticate(user=user2)
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["title"], "User2 Notification")


class NotificationUtilsTest(TestCase):
    """notifications/utils.pyのヘルパー関数テスト"""

    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser", email="test@example.com", password="testpass123"
        )

        # プロジェクト、タスク、イベントを作成

        self.project = Project.objects.create(
            title="テストプロジェクト",
            start_date=timezone.now(),
            deadline=timezone.now() + timedelta(days=30),
        )
        self.project.members.add(self.user)

        # タスクとイベントは通常のmodels.pyからimportできないので、
        # 必要に応じて作成（APIテストとして実装）
        from tasks.models import Task

        self.task = Task.objects.create(
            name="テストタスク",
            project=self.project,
            deadline=timezone.now() + timedelta(days=7),
        )

        from event.models import Event
        import uuid

        self.event = Event.objects.create(
            event_id=uuid.uuid4(),
            project=self.project,
            title="テストイベント",
            is_all_day=False,
            start_date=timezone.now() + timedelta(hours=1),
            end_date=timezone.now() + timedelta(hours=2),
            color="blue",
        )

        # チャット関連オブジェクト
        from chat.models import ChatRoom, Message

        self.chatroom = ChatRoom.objects.create(project=self.project)
        self.chatroom.members.add(self.user)

        self.message = Message.objects.create(
            chatroom=self.chatroom,
            user=self.user,
            content="テストメッセージ",
        )

    def test_create_notification_basic(self):
        """create_notification基本機能テスト"""
        from .utils import create_notification

        notification = create_notification(
            recipient=self.user,
            title="基本通知",
            message="これは基本的な通知です",
            notification_type="system",
            related_object_id=123,
        )

        self.assertEqual(notification.recipient, self.user)
        self.assertEqual(notification.title, "基本通知")
        self.assertEqual(notification.message, "これは基本的な通知です")
        self.assertEqual(notification.notification_type, "system")
        self.assertEqual(notification.related_object_id, 123)
        self.assertIsNotNone(notification.created_at)

    def test_create_notification_without_optional_params(self):
        """create_notificationオプションパラメータなしテスト"""
        from .utils import create_notification

        notification = create_notification(
            recipient=self.user,
            title="最小通知",
            message="最小限の通知",
            notification_type="system",
        )

        self.assertEqual(notification.recipient, self.user)
        self.assertEqual(notification.title, "最小通知")
        self.assertEqual(notification.message, "最小限の通知")
        self.assertEqual(notification.notification_type, "system")
        self.assertIsNone(notification.related_object_id)

    def test_create_task_notification_created(self):
        """タスク作成通知テスト"""
        from .utils import create_task_notification

        notification = create_task_notification(
            recipient=self.user, task=self.task, action="created"
        )

        self.assertEqual(notification.recipient, self.user)
        self.assertEqual(notification.title, "タスク通知")
        self.assertEqual(
            notification.message, "新しいタスク『テストタスク』が追加されました"
        )
        self.assertEqual(notification.notification_type, "task")
        self.assertEqual(notification.related_object_id, str(self.task.task_id))

    def test_create_task_notification_updated(self):
        """タスク更新通知テスト"""
        from .utils import create_task_notification

        notification = create_task_notification(
            recipient=self.user, task=self.task, action="updated"
        )

        self.assertEqual(notification.title, "タスク通知")
        self.assertEqual(notification.message, "タスク『テストタスク』が更新されました")

    def test_create_task_notification_completed(self):
        """タスク完了通知テスト"""
        from .utils import create_task_notification

        notification = create_task_notification(
            recipient=self.user, task=self.task, action="completed"
        )

        self.assertEqual(notification.title, "タスク通知")
        self.assertEqual(notification.message, "タスク『テストタスク』が完了しました")

    def test_create_task_notification_default_action(self):
        """タスク通知デフォルトアクションテスト"""
        from .utils import create_task_notification

        notification = create_task_notification(
            recipient=self.user, task=self.task, action="unknown_action"
        )

        self.assertEqual(notification.message, "タスク『テストタスク』が変更されました")

    def test_create_project_notification_created(self):
        """プロジェクト作成通知テスト"""
        from .utils import create_project_notification

        notification = create_project_notification(
            recipient=self.user, project=self.project, action="created"
        )

        self.assertEqual(notification.recipient, self.user)
        self.assertEqual(notification.title, "プロジェクト通知")
        self.assertEqual(
            notification.message,
            "新しいプロジェクト『テストプロジェクト』が作成されました",
        )
        self.assertEqual(notification.notification_type, "project")
        self.assertEqual(notification.related_object_id, str(self.project.project_id))

    def test_create_project_notification_updated(self):
        """プロジェクト更新通知テスト"""
        from .utils import create_project_notification

        notification = create_project_notification(
            recipient=self.user, project=self.project, action="updated"
        )

        self.assertEqual(notification.title, "プロジェクト通知")
        self.assertEqual(
            notification.message, "プロジェクト『テストプロジェクト』が更新されました"
        )

    def test_create_project_notification_member_added(self):
        """プロジェクトメンバー追加通知テスト"""
        from .utils import create_project_notification

        notification = create_project_notification(
            recipient=self.user, project=self.project, action="member_added"
        )

        self.assertEqual(notification.title, "プロジェクト通知")
        self.assertEqual(
            notification.message,
            "プロジェクト『テストプロジェクト』に新しいメンバーが追加されました",
        )

    def test_create_project_notification_default_action(self):
        """プロジェクト通知デフォルトアクションテスト"""
        from .utils import create_project_notification

        notification = create_project_notification(
            recipient=self.user, project=self.project, action="unknown_action"
        )

        self.assertEqual(
            notification.message, "プロジェクト『テストプロジェクト』が変更されました"
        )

    def test_create_chat_notification_with_message_object(self):
        """チャット通知（メッセージオブジェクト）テスト"""
        from .utils import create_chat_notification

        notification = create_chat_notification(
            recipient=self.user, message=self.message, sender=self.user
        )

        self.assertEqual(notification.recipient, self.user)
        self.assertEqual(notification.title, "新しいメッセージ")
        self.assertEqual(
            notification.message, "testuserさんから新しいメッセージが届いています"
        )
        self.assertEqual(notification.notification_type, "chat")
        self.assertEqual(notification.related_object_id, str(self.message.message_id))

    def test_create_chat_notification_with_string(self):
        """チャット通知（文字列）テスト"""
        from .utils import create_chat_notification

        notification = create_chat_notification(
            recipient=self.user, message="単純なメッセージ文字列", sender=self.user
        )

        self.assertEqual(notification.title, "新しいメッセージ")
        self.assertEqual(
            notification.message, "testuserさんから新しいメッセージが届いています"
        )
        self.assertEqual(notification.notification_type, "chat")
        self.assertIsNone(notification.related_object_id)

    def test_create_event_notification_created(self):
        """イベント作成通知テスト"""
        from .utils import create_event_notification

        notification = create_event_notification(
            recipient=self.user, event=self.event, action="created"
        )

        self.assertEqual(notification.recipient, self.user)
        self.assertEqual(notification.title, "イベント通知")
        self.assertEqual(
            notification.message, "新しいイベント『テストイベント』が作成されました"
        )
        self.assertEqual(notification.notification_type, "event")
        self.assertEqual(notification.related_object_id, str(self.event.event_id))

    def test_create_event_notification_updated(self):
        """イベント更新通知テスト"""
        from .utils import create_event_notification

        notification = create_event_notification(
            recipient=self.user, event=self.event, action="updated"
        )

        self.assertEqual(notification.title, "イベント通知")
        self.assertEqual(
            notification.message, "イベント『テストイベント』が更新されました"
        )

    def test_create_event_notification_default_action(self):
        """イベント通知デフォルトアクションテスト"""
        from .utils import create_event_notification

        notification = create_event_notification(
            recipient=self.user, event=self.event, action="unknown_action"
        )

        self.assertEqual(
            notification.message, "イベント『テストイベント』が変更されました"
        )

    def test_create_chatroom_notification_created(self):
        """チャットルーム作成通知テスト"""
        from .utils import create_chatroom_notification

        notification = create_chatroom_notification(
            recipient=self.user, chatroom=self.chatroom, action="created"
        )

        self.assertEqual(notification.recipient, self.user)
        self.assertEqual(notification.title, "チャットルーム通知")
        self.assertEqual(notification.message, "新しいチャットルームが作成されました")
        self.assertEqual(notification.notification_type, "chat")
        self.assertEqual(notification.related_object_id, str(self.chatroom.chatroom_id))

    def test_create_chatroom_notification_default_action(self):
        """チャットルーム通知デフォルトアクションテスト"""
        from .utils import create_chatroom_notification

        notification = create_chatroom_notification(
            recipient=self.user, chatroom=self.chatroom, action="unknown_action"
        )

        self.assertEqual(notification.title, "チャットルーム通知")
        self.assertEqual(notification.message, "チャットルームが変更されました")

    def test_utility_functions_japanese_language_support(self):
        """ユーティリティ関数の日本語サポートテスト"""
        from .utils import (
            create_task_notification,
            create_project_notification,
            create_event_notification,
        )

        # タスク通知の日本語
        task_notification = create_task_notification(
            recipient=self.user, task=self.task, action="created"
        )
        self.assertIn("が追加されました", task_notification.message)

        # プロジェクト通知の日本語
        project_notification = create_project_notification(
            recipient=self.user, project=self.project, action="created"
        )
        self.assertIn("が作成されました", project_notification.message)

        # イベント通知の日本語
        event_notification = create_event_notification(
            recipient=self.user, event=self.event, action="created"
        )
        self.assertIn("が作成されました", event_notification.message)

    def test_utility_functions_notification_types(self):
        """ユーティリティ関数の通知タイプテスト"""
        from .utils import (
            create_notification,
            create_task_notification,
            create_project_notification,
            create_chat_notification,
            create_event_notification,
            create_chatroom_notification,
        )

        # 各関数の通知タイプ確認
        notifications = [
            create_notification(self.user, "タイトル", "メッセージ", "system"),
            create_task_notification(self.user, self.task),
            create_project_notification(self.user, self.project),
            create_chat_notification(self.user, self.message, self.user),
            create_event_notification(self.user, self.event),
            create_chatroom_notification(self.user, self.chatroom),
        ]

        expected_types = ["system", "task", "project", "chat", "event", "chat"]
        actual_types = [n.notification_type for n in notifications]

        self.assertEqual(expected_types, actual_types)

    def test_utility_functions_return_notification_objects(self):
        """ユーティリティ関数がNotificationオブジェクトを返すテスト"""
        from .utils import create_notification
        from .models import Notification

        notification = create_notification(
            recipient=self.user,
            title="テスト",
            message="メッセージ",
            notification_type="system",
        )

        self.assertIsInstance(notification, Notification)
        self.assertIsNotNone(notification.id)  # データベースに保存されていることを確認
