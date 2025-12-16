from django.contrib.auth import get_user_model
from rest_framework import serializers

from projects.models import Project
from .models import ChatRoom, ChatRoomUser, Message


User = get_user_model()


class ChatRoomResponseSerializer(serializers.ModelSerializer):
    project_id = serializers.UUIDField(source="project.project_id", read_only=True)
    members = serializers.SerializerMethodField()

    class Meta:
        model = ChatRoom
        fields = ("chatroom_id", "project_id", "name", "members")

    def get_members(self, obj: ChatRoom) -> list[str]:
        return [str(member.pk) for member in obj.members.all()]


class ChatRoomCreateSerializer(serializers.Serializer):
    name = serializers.CharField(
        max_length=255,
        allow_blank=True,
        required=False,
        default="",
        help_text="Name of the chat room.",
    )
    members = serializers.ListField(
        child=serializers.IntegerField(),
        allow_empty=False,
        help_text="List of user IDs to include in chat room.",
    )

    default_error_messages = {
        "duplicate_members": "Duplicate user IDs are not allowed.",
        "invalid_members": "Some users do not exist.",
        "not_in_project": "All members must be assigned to the project.",
    }

    def validate(self, attrs: dict) -> dict:
        project: Project = self.context["project"]
        member_ids = attrs["members"]
        seen = set()
        unique_member_ids = []
        for member_id in member_ids:
            if member_id in seen:
                self.fail("duplicate_members")
            seen.add(member_id)
            unique_member_ids.append(member_id)

        members = list(User.objects.filter(pk__in=unique_member_ids))
        if len(members) != len(unique_member_ids):
            self.fail("invalid_members")

        assigned_user_ids = set(
            project.members.filter(pk__in=unique_member_ids).values_list(
                "pk", flat=True
            )
        )
        if assigned_user_ids != set(unique_member_ids):
            self.fail("not_in_project")

        attrs["member_objects"] = members
        return attrs

    def create(self, validated_data: dict) -> ChatRoom:
        project: Project = self.context["project"]
        members = validated_data.pop("member_objects")
        name = validated_data.pop("name", "")

        chatroom = ChatRoom.objects.create(project=project, name=name)
        ChatRoomUser.objects.bulk_create(
            [ChatRoomUser(chatroom=chatroom, user=member) for member in members]
        )
        chatroom.refresh_from_db()
        return chatroom


class MessageSerializer(serializers.ModelSerializer):
    chatroom_id = serializers.UUIDField(source="chatroom.chatroom_id", read_only=True)
    user_id = serializers.IntegerField(source="user.pk", read_only=True)

    class Meta:
        model = Message
        fields = ("message_id", "chatroom_id", "user_id", "content", "timestamp")


class MessageCreateSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(write_only=True, required=False)

    class Meta:
        model = Message
        fields = ["content", "user_id"]

    default_error_messages = {
        "not_in_chatroom": "The user is not a member of this chat room.",
        "blank_content": "Message content cannot be blank.",
    }

    def validate(self, attrs: dict) -> dict:
        request = self.context["request"]
        chatroom: ChatRoom = self.context["chatroom"]

        content = attrs["content"].strip()
        if not content:
            self.fail("blank_content")
        attrs["content"] = content

        # Determine which user ID to use
        user_id = attrs.pop("user_id", None)
        if user_id:
            # Use provided user_id (for compatibility)
            try:
                from django.contrib.auth import get_user_model

                User = get_user_model()
                user = User.objects.get(pk=user_id)
            except User.DoesNotExist:
                raise serializers.ValidationError({"user_id": "Invalid user ID."})
        else:
            # Use authenticated user
            user = request.user

        is_member = chatroom.members.filter(pk=user.pk).exists()
        if not is_member:
            self.fail("not_in_chatroom")

        attrs["user"] = user
        attrs["chatroom"] = chatroom
        return attrs

    def create(self, validated_data: dict) -> Message:
        message = Message.objects.create(**validated_data)
        return message
