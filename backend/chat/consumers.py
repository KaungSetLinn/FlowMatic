import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from asgiref.sync import async_to_sync
from notifications.utils import create_reply_notification, create_reaction_notification

from .models import ChatRoom, ChatRoomUser, Message, MessageReaction

User = get_user_model()


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.project_id = self.scope["url_route"]["kwargs"]["project_id"]
        self.chatroom_id = self.scope["url_route"]["kwargs"]["chatroom_id"]
        self.room_group_name = f"chat_{self.chatroom_id}"

        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message_type = text_data_json.get("type", "message")

        if message_type == "join_room":
            await self.handle_join_room()
        elif message_type == "message":
            await self.handle_message(text_data_json)
        elif message_type == "typing":
            await self.handle_typing(text_data_json)
        elif message_type == "add_reaction":
            await self.handle_add_reaction(text_data_json)
        elif message_type == "remove_reaction":
            await self.handle_remove_reaction(text_data_json)

    async def handle_join_room(self):
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)

        chatroom = await self.get_chatroom()
        if not chatroom:
            await self.send(
                text_data=json.dumps({"type": "error", "message": "Chatroom not found"})
            )
            return

        messages = await self.get_messages(chatroom)

        for message in messages:
            await self.send(
                text_data=json.dumps(
                    {
                        "type": "message",
                        "message": {
                            "message_id": str(message.message_id),
                            "chatroom_id": str(message.chatroom.chatroom_id),
                            "user_id": message.user.pk,
                            "name": message.user.username,
                            "email": message.user.email,
                            "profile_picture": message.user.profile_picture.url
                            if message.user.profile_picture
                            else None,
                            "content": message.content,
                            "timestamp": message.timestamp.isoformat(),
                        },
                    }
                )
            )

        await self.send(text_data=json.dumps({"type": "history_complete"}))

    async def handle_message(self, text_data_json):
        content = text_data_json.get("content")
        reply_to_id = text_data_json.get("reply_to")

        if not content or not content.strip():
            return

        message = await self.save_message(content, reply_to_id)

        reply_to_message = None
        if message.reply_to:
            reply_to_message = {
                "message_id": str(message.reply_to.message_id),
                "user_id": message.reply_to.user.pk,
                "name": message.reply_to.user.username,
                "content": message.reply_to.content,
            }

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "chat_message",
                "message": {
                    "message_id": str(message.message_id),
                    "chatroom_id": str(message.chatroom.chatroom_id),
                    "user_id": message.user.pk,
                    "name": message.user.username,
                    "email": message.user.email,
                    "profile_picture": message.user.profile_picture.url
                    if message.user.profile_picture
                    else None,
                    "content": message.content,
                    "timestamp": message.timestamp.isoformat(),
                    "reply_to_message": reply_to_message,
                    "reactions": {},
                },
            },
        )

    async def handle_typing(self, text_data_json):
        user_id = text_data_json.get("user_id")
        is_typing = text_data_json.get("is_typing", False)

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "user_typing",
                "user_id": user_id,
                "is_typing": is_typing,
            },
        )

    async def chat_message(self, event):
        message = event["message"]
        await self.send(text_data=json.dumps({"type": "message", "message": message}))

    async def user_typing(self, event):
        await self.send(
            text_data=json.dumps(
                {
                    "type": "typing",
                    "user_id": event["user_id"],
                    "is_typing": event["is_typing"],
                }
            )
        )

    async def handle_add_reaction(self, text_data_json):
        message_id = text_data_json.get("message_id")
        emoji = text_data_json.get("emoji")

        if not message_id or not emoji:
            return

        reaction = await self.save_reaction(message_id, emoji)

        if reaction:
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "reaction_added",
                    "message_id": message_id,
                    "reaction": {
                        "reaction_id": str(reaction.reaction_id),
                        "user_id": reaction.user.pk,
                        "username": reaction.user.username,
                        "emoji": reaction.emoji,
                    },
                },
            )
        else:
            # Reaction was removed (toggled)
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "reaction_removed",
                    "message_id": message_id,
                    "user_id": self.scope["user"].pk,
                    "emoji": emoji,
                },
            )

    async def handle_remove_reaction(self, text_data_json):
        message_id = text_data_json.get("message_id")
        emoji = text_data_json.get("emoji")

        if not message_id or not emoji:
            return

        await self.delete_reaction(message_id, emoji)

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "reaction_removed",
                "message_id": message_id,
                "user_id": self.scope["user"].pk,
                "emoji": emoji,
            },
        )

    async def reaction_added(self, event):
        await self.send(text_data=json.dumps({"type": "reaction_added", **event}))

    async def reaction_removed(self, event):
        await self.send(text_data=json.dumps({"type": "reaction_removed", **event}))

    @database_sync_to_async
    def get_chatroom(self):
        try:
            return ChatRoom.objects.get(
                chatroom_id=self.chatroom_id, project__project_id=self.project_id
            )
        except ChatRoom.DoesNotExist:
            return None

    @database_sync_to_async
    def get_messages(self, chatroom):
        return list(chatroom.messages.all().select_related("user", "chatroom"))

    @database_sync_to_async
    def save_message(self, content, reply_to_id=None):
        try:
            chatroom = ChatRoom.objects.get(
                chatroom_id=self.chatroom_id, project__project_id=self.project_id
            )

            reply_to = None
            if reply_to_id:
                reply_to = Message.objects.get(
                    message_id=reply_to_id, chatroom=chatroom
                )

            user = self.scope["user"]
            message = Message.objects.create(
                chatroom=chatroom, user=user, content=content, reply_to=reply_to
            )

            # Create notification for reply target (if any and not self)
            if reply_to and reply_to.user != user:
                create_reply_notification(
                    recipient=reply_to.user,
                    reply_message=message,
                    sender=user,
                )

            return message
        except ChatRoom.DoesNotExist:
            raise ValueError("Invalid chatroom")
        except Message.DoesNotExist:
            raise ValueError("Invalid reply_to message")

    @database_sync_to_async
    def save_reaction(self, message_id, emoji):
        try:
            chatroom = ChatRoom.objects.get(
                chatroom_id=self.chatroom_id, project__project_id=self.project_id
            )
            message = Message.objects.get(message_id=message_id, chatroom=chatroom)
            user = self.scope["user"]

            # Check if user is a member of chatroom
            is_member = chatroom.members.filter(pk=user.pk).exists()
            if not is_member:
                raise ValueError("User not in chatroom")

            # Check if reaction already exists
            existing = MessageReaction.objects.filter(
                message=message, user=user, emoji=emoji
            ).first()

            if existing:
                # Remove existing reaction
                existing.delete()
                return None
            else:
                # Create new reaction
                reaction = MessageReaction.objects.create(
                    message=message, user=user, emoji=emoji
                )

                # Create notification for message author (if not self)
                if message.user != user:
                    create_reaction_notification(
                        recipient=message.user,
                        message=message,
                        sender=user,
                        emoji=emoji,
                    )

                return reaction
        except ChatRoom.DoesNotExist:
            raise ValueError("Invalid chatroom")
        except Message.DoesNotExist:
            raise ValueError("Invalid message")

    @database_sync_to_async
    def delete_reaction(self, message_id, emoji):
        try:
            chatroom = ChatRoom.objects.get(
                chatroom_id=self.chatroom_id, project__project_id=self.project_id
            )
            message = Message.objects.get(message_id=message_id, chatroom=chatroom)
            user = self.scope["user"]

            MessageReaction.objects.filter(
                message=message, user=user, emoji=emoji
            ).delete()
        except ChatRoom.DoesNotExist:
            raise ValueError("Invalid chatroom")
        except Message.DoesNotExist:
            raise ValueError("Invalid message")
