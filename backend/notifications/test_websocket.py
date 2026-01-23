import json
from channels.testing import WebsocketCommunicator
from channels.db import database_sync_to_async
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import AccessToken

from notifications.models import Notification
from backend.asgi import application as ws_application

User = get_user_model()


@database_sync_to_async
def create_user(username, email, password):
    return User.objects.create_user(username=username, email=email, password=password)


@database_sync_to_async
def create_notification(
    recipient, title, message, notification_type, related_object_id
):
    return Notification.objects.create(
        recipient=recipient,
        title=title,
        message=message,
        notification_type=notification_type,
        related_object_id=related_object_id,
        is_read=False,
    )


@database_sync_to_async
def get_notification_count(user):
    return Notification.objects.filter(recipient=user).count()


@database_sync_to_async
def get_unread_count(user):
    return Notification.objects.filter(recipient=user, is_read=False).count()


@database_sync_to_async
def get_notification(notification_id):
    return Notification.objects.get(id=notification_id)


@database_sync_to_async
def mark_notification_read(notification_id):
    notification = Notification.objects.get(id=notification_id)
    notification.is_read = True
    notification.save()


class NotificationConsumerTest(TestCase):
    async def test_anonymous_user_connection_rejected(self):
        """匿名ユーザーは接続を拒否されること"""
        communicator = WebsocketCommunicator(ws_application, "/ws/notifications/")
        connected, _ = await communicator.connect()
        self.assertFalse(connected)

    async def test_authenticated_user_connection_accepted(self):
        """認証済みユーザーは接続が許可されること"""
        user = await create_user("testuser", "test@example.com", "testpass123")
        token = AccessToken.for_user(user)
        url = f"/ws/notifications/?token={str(token)}"
        communicator = WebsocketCommunicator(ws_application, url)
        connected, _ = await communicator.connect()
        self.assertTrue(connected)
        await communicator.disconnect()

    async def test_connection_sends_recent_notifications(self):
        """接続時に最近の通知が送信されること"""
        user = await create_user("testuser", "test@example.com", "testpass123")

        for i in range(10):
            await create_notification(
                user,
                f"通知{i}",
                f"メッセージ{i}",
                "test",
                str(i),
            )

        token = AccessToken.for_user(user)
        url = f"/ws/notifications/?token={str(token)}"
        communicator = WebsocketCommunicator(ws_application, url)
        connected, _ = await communicator.connect()
        self.assertTrue(connected)

        response = await communicator.receive_json_from()
        self.assertEqual(response["type"], "recent_notifications")
        self.assertEqual(len(response["notifications"]), 10)
        self.assertIn("unread_count", response)

        await communicator.disconnect()

    async def test_connection_sends_unread_count(self):
        """接続時に未読件数が送信されること"""
        user = await create_user("testuser", "test@example.com", "testpass123")

        await create_notification(user, "通知1", "メッセージ1", "test", "1")
        await create_notification(user, "通知2", "メッセージ2", "test", "2")

        notification = await create_notification(
            user, "通知3", "メッセージ3", "test", "3"
        )
        await mark_notification_read(notification.id)

        unread_count = await get_unread_count(user)
        self.assertEqual(unread_count, 2)

        token = AccessToken.for_user(user)
        url = f"/ws/notifications/?token={str(token)}"
        communicator = WebsocketCommunicator(ws_application, url)
        connected, _ = await communicator.connect()
        self.assertTrue(connected)

        response = await communicator.receive_json_from()
        self.assertEqual(response["type"], "recent_notifications")
        self.assertEqual(response["unread_count"], 2)

        await communicator.disconnect()

    async def test_mark_read_message(self):
        """mark_readメッセージで通知を既読にできること"""
        user = await create_user("testuser", "test@example.com", "testpass123")
        notification = await create_notification(
            user, "通知", "メッセージ", "test", "1"
        )

        token = AccessToken.for_user(user)
        url = f"/ws/notifications/?token={str(token)}"
        communicator = WebsocketCommunicator(ws_application, url)
        connected, _ = await communicator.connect()
        self.assertTrue(connected)

        await communicator.receive_json_from()

        await communicator.send_json_to(
            {
                "type": "mark_read",
                "notification_id": notification.id,
            }
        )

        response = await communicator.receive_json_from()
        self.assertEqual(response["type"], "unread_count")
        self.assertEqual(response["unread_count"], 0)

        notification = await get_notification(notification.id)
        self.assertTrue(notification.is_read)

        await communicator.disconnect()

    async def test_mark_all_read_message(self):
        """mark_all_readメッセージで全通知を既読にできること"""
        user = await create_user("testuser", "test@example.com", "testpass123")

        for i in range(3):
            await create_notification(
                user, f"通知{i}", f"メッセージ{i}", "test", str(i)
            )

        token = AccessToken.for_user(user)
        url = f"/ws/notifications/?token={str(token)}"
        communicator = WebsocketCommunicator(ws_application, url)
        connected, _ = await communicator.connect()
        self.assertTrue(connected)

        await communicator.receive_json_from()

        await communicator.send_json_to(
            {
                "type": "mark_all_read",
            }
        )

        response = await communicator.receive_json_from()
        self.assertEqual(response["type"], "unread_count")
        self.assertEqual(response["unread_count"], 0)

        unread_count = await get_unread_count(user)
        self.assertEqual(unread_count, 0)

        await communicator.disconnect()

    async def test_disconnect(self):
        """接続が正常に切断されること"""
        user = await create_user("testuser", "test@example.com", "testpass123")
        token = AccessToken.for_user(user)
        url = f"/ws/notifications/?token={str(token)}"
        communicator = WebsocketCommunicator(ws_application, url)
        connected, _ = await communicator.connect()
        self.assertTrue(connected)

        await communicator.disconnect()
