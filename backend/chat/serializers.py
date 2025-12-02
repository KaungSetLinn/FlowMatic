from django.contrib.auth import get_user_model
from rest_framework import serializers

from projects.models import Project
from .models import ChatRoom, ChatRoomUser, Message


User = get_user_model()


class ChatRoomResponseSerializer(serializers.ModelSerializer):
    project_id = serializers.UUIDField(source='project.project_id', read_only=True)
    members = serializers.SerializerMethodField()

    class Meta:
        model = ChatRoom
        fields = ('chatroom_id', 'project_id', 'members')

    def get_members(self, obj: ChatRoom) -> list[str]:
        return [str(member.pk) for member in obj.members.all()]


class ChatRoomCreateSerializer(serializers.Serializer):
    members = serializers.ListField(
        child=serializers.UUIDField(),
        allow_empty=False,
        help_text='List of user UUIDs to include in the chat room.',
    )

    default_error_messages = {
        'duplicate_members': 'Duplicate user IDs are not allowed.',
        'invalid_members': 'Some users do not exist.',
        'not_in_project': 'All members must be assigned to the project.',
    }

    def validate(self, attrs: dict) -> dict:
        project: Project = self.context['project']
        member_ids = attrs['members']
        seen = set()
        unique_member_ids = []
        for member_id in member_ids:
            if member_id in seen:
                self.fail('duplicate_members')
            seen.add(member_id)
            unique_member_ids.append(member_id)

        members = list(User.objects.filter(pk__in=unique_member_ids))
        if len(members) != len(unique_member_ids):
            self.fail('invalid_members')

        assigned_user_ids = set(
            project.members.filter(pk__in=unique_member_ids).values_list('pk', flat=True)
        )
        if assigned_user_ids != set(unique_member_ids):
            self.fail('not_in_project')

        attrs['member_objects'] = members
        return attrs

    def create(self, validated_data: dict) -> ChatRoom:
        project: Project = self.context['project']
        members = validated_data.pop('member_objects')

        chatroom = ChatRoom.objects.create(project=project)
        ChatRoomUser.objects.bulk_create(
            [ChatRoomUser(chatroom=chatroom, user=member) for member in members]
        )
        chatroom.refresh_from_db()
        return chatroom


class MessageSerializer(serializers.ModelSerializer):
    chatroom_id = serializers.UUIDField(source='chatroom.chatroom_id', read_only=True)
    user_id = serializers.UUIDField(source='user.pk', read_only=True)

    class Meta:
        model = Message
        fields = ('message_id', 'chatroom_id', 'user_id', 'content', 'timestamp')


class MessageCreateSerializer(serializers.Serializer):
    user_id = serializers.UUIDField()
    content = serializers.CharField()

    default_error_messages = {
        'user_mismatch': 'user_id must match the authenticated user.',
        'not_in_chatroom': 'The user is not a member of this chat room.',
        'blank_content': 'Message content cannot be blank.',
    }

    def validate(self, attrs: dict) -> dict:
        request = self.context['request']
        chatroom: ChatRoom = self.context['chatroom']

        content = attrs['content'].strip()
        if not content:
            self.fail('blank_content')
        attrs['content'] = content

        if str(request.user.pk) != str(attrs['user_id']):
            self.fail('user_mismatch')

        is_member = chatroom.members.filter(pk=request.user.pk).exists()
        if not is_member:
            self.fail('not_in_chatroom')

        attrs['user'] = request.user
        return attrs

    def create(self, validated_data: dict) -> Message:
        chatroom: ChatRoom = self.context['chatroom']
        user = validated_data['user']
        content = validated_data['content']
        message = Message.objects.create(chatroom=chatroom, user=user, content=content)
        return message
