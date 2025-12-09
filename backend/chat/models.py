import uuid

from django.conf import settings
from django.db import models
from django.db.models import CheckConstraint, Q


class ChatRoom(models.Model):
	chatroom_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
	project = models.ForeignKey(
		'projects.Project',
		on_delete=models.CASCADE,
		related_name='chatrooms',
	)
	members = models.ManyToManyField(
		settings.AUTH_USER_MODEL,
		through='ChatRoomUser',
		related_name='chatrooms',
	)
	created_at = models.DateTimeField(auto_now_add=True)

	def __str__(self) -> str:
		return f"ChatRoom({self.chatroom_id})"


class ChatRoomUser(models.Model):
	chatroom = models.ForeignKey(ChatRoom, on_delete=models.CASCADE, related_name='chatroom_users')
	user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='chatroom_users')
	joined_at = models.DateTimeField(auto_now_add=True)

	class Meta:
		unique_together = ('chatroom', 'user')


class Message(models.Model):
	message_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
	chatroom = models.ForeignKey(ChatRoom, on_delete=models.CASCADE, related_name='messages')
	user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='messages')
	content = models.TextField()
	timestamp = models.DateTimeField(auto_now_add=True)

	class Meta:
		ordering = ['timestamp']
		constraints = [
			CheckConstraint(
				condition=Q(content__gt=''),
				name='message_content_not_empty',
			)
		]

	def __str__(self) -> str:
		return f"Message({self.message_id})"
