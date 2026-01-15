from rest_framework import serializers
from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = [
            "id",
            "title",
            "message",
            "notification_type",
            "related_object_id",
            "created_at",
            "is_read",
        ]
        read_only_fields = ["id", "created_at"]
