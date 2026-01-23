import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model

from .models import Notification
from .serializers import NotificationSerializer

User = get_user_model()


class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        if self.scope["user"].is_anonymous:
            await self.close()
            return

        self.user = self.scope["user"]
        self.user_id = str(self.user.id)
        self.notification_group_name = f"notifications_{self.user_id}"

        await self.channel_layer.group_add(
            self.notification_group_name, self.channel_name
        )

        await self.accept()

        await self.send_recent_notifications()

    async def disconnect(self, close_code):
        if hasattr(self, "notification_group_name"):
            await self.channel_layer.group_discard(
                self.notification_group_name, self.channel_name
            )

    async def receive(self, text_data):
        if self.scope["user"].is_anonymous:
            return

        text_data_json = json.loads(text_data)
        message_type = text_data_json.get("type", "")

        if message_type == "mark_read":
            await self.handle_mark_read(text_data_json)
        elif message_type == "mark_all_read":
            await self.handle_mark_all_read()

    async def handle_mark_read(self, text_data_json):
        notification_id = text_data_json.get("notification_id")
        if notification_id:
            await self.mark_notification_read(notification_id)
            unread_count = await self.get_unread_count()
            await self.send_unread_count(unread_count)

    async def handle_mark_all_read(self):
        await self.mark_all_read()
        unread_count = await self.get_unread_count()
        await self.send_unread_count(unread_count)

    async def send_recent_notifications(self):
        notifications = await self.get_recent_notifications()
        unread_count = await self.get_unread_count()

        serializer = NotificationSerializer(notifications, many=True)

        await self.send(
            text_data=json.dumps(
                {
                    "type": "recent_notifications",
                    "notifications": serializer.data,
                    "unread_count": unread_count,
                }
            )
        )

    async def notification_created(self, event):
        notification_data = event["notification"]
        unread_count = event["unread_count"]

        await self.send(
            text_data=json.dumps(
                {
                    "type": "notification",
                    "notification": notification_data,
                    "unread_count": unread_count,
                }
            )
        )

    async def send_unread_count(self, unread_count):
        await self.send(
            text_data=json.dumps(
                {
                    "type": "unread_count",
                    "unread_count": unread_count,
                }
            )
        )

    @database_sync_to_async
    def get_recent_notifications(self):
        return list(
            Notification.objects.filter(recipient=self.user).order_by("-created_at")[
                :10
            ]
        )

    @database_sync_to_async
    def get_unread_count(self):
        return Notification.objects.filter(recipient=self.user, is_read=False).count()

    @database_sync_to_async
    def mark_notification_read(self, notification_id):
        try:
            notification = Notification.objects.get(
                id=notification_id, recipient=self.user
            )
            notification.is_read = True
            notification.save()
        except Notification.DoesNotExist:
            pass

    @database_sync_to_async
    def mark_all_read(self):
        Notification.objects.filter(recipient=self.user, is_read=False).update(
            is_read=True
        )
