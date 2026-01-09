from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from projects.models import Project
from .models import ChatRoom, Message
from .serializers import (
    ChatRoomCreateSerializer,
    ChatRoomResponseSerializer,
    MessageCreateSerializer,
    MessageSerializer,
    MessageUpdateSerializer,
)


class ProjectChatRoomListCreateView(APIView):
	permission_classes = [IsAuthenticated]

	def _get_project(self, project_id: str) -> Project:
		project = get_object_or_404(Project.objects.prefetch_related('members'), project_id=project_id)
		if not project.members.filter(pk=self.request.user.pk).exists():
			raise PermissionDenied('You are not assigned to this project.')
		return project

	def get(self, request, project_id: str) -> Response:
		project = self._get_project(project_id)
		chatrooms = project.chatrooms.prefetch_related('members')
		serializer = ChatRoomResponseSerializer(chatrooms, many=True)
		return Response({'chatrooms': serializer.data})

	def post(self, request, project_id: str) -> Response:
		project = self._get_project(project_id)
		serializer = ChatRoomCreateSerializer(data=request.data, context={'project': project, 'request': request})
		serializer.is_valid(raise_exception=True)
		chatroom = serializer.save()
		response_serializer = ChatRoomResponseSerializer(chatroom)
		return Response(response_serializer.data, status=status.HTTP_201_CREATED)


class ChatRoomMessageListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def _get_chatroom(self, project_id: str, chatroom_id: str) -> ChatRoom:
        chatroom = get_object_or_404(
            ChatRoom.objects
                .select_related('project')
                .prefetch_related('members'),
            chatroom_id=chatroom_id,
            project__project_id=project_id,   # 🔒 enforce project scope
        )

        if not chatroom.members.filter(pk=self.request.user.pk).exists():
            raise PermissionDenied('You are not a member of this chat room.')

        return chatroom

    def get(self, request, project_id: str, chatroom_id: str) -> Response:
        chatroom = self._get_chatroom(project_id, chatroom_id)

        try:
            page = int(request.query_params.get('page', '1'))
            per_page = int(request.query_params.get('per_page', '20'))
        except ValueError:
            return Response(
                {'detail': 'page and per_page must be integers.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if page < 1 or per_page < 1:
            return Response(
                {'detail': 'page and per_page must be greater than zero.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        queryset = chatroom.messages.select_related('user').order_by('timestamp')

        start = (page - 1) * per_page
        end = start + per_page
        messages = list(queryset[start:end])

        serializer = MessageSerializer(messages, many=True)

        return Response({
            'messages': serializer.data,
            'page': page,
            'per_page': per_page,
        })

    def post(self, request, project_id: str, chatroom_id: str) -> Response:
        chatroom = self._get_chatroom(project_id, chatroom_id)

        serializer = MessageCreateSerializer(
            data=request.data,
            context={'chatroom': chatroom, 'request': request},
        )
        serializer.is_valid(raise_exception=True)

        message = serializer.save()
        response_serializer = MessageSerializer(message)

        return Response(response_serializer.data, status=status.HTTP_201_CREATED)

class ChatRoomDeleteView(APIView):
	permission_classes = [IsAuthenticated]

	def delete(self, request, chatroom_id: str) -> Response:
		chatroom = get_object_or_404(ChatRoom.objects.select_related('project'), chatroom_id=chatroom_id)
		if not chatroom.project.members.filter(pk=request.user.pk).exists():
			raise PermissionDenied('You are not assigned to this project.')
		chatroom.delete()
		return Response(status=status.HTTP_204_NO_CONTENT)

class ChatRoomMessageDetailView(APIView):

    permission_classes = [IsAuthenticated]

    def _get_message(self, project_id: str, chatroom_id: str, message_id: str):

        message = get_object_or_404(
            Message,
            message_id=message_id,
            chatroom__chatroom_id=chatroom_id,
            chatroom__project__project_id=project_id,
        )

        if message.user != self.request.user:
            raise PermissionDenied("You can only edit or delete your own messages.")

        return message

    def put(self, request, project_id: str, chatroom_id: str, message_id: str) -> Response:
        message = self._get_message(project_id, chatroom_id, message_id)
        
        serializer = MessageUpdateSerializer(message, data=request.data)
        serializer.is_valid(raise_exception=True)
        updated_message = serializer.save()

        response_serializer = MessageSerializer(updated_message)
        return Response(response_serializer.data)

    def delete(self, request, project_id: str, chatroom_id: str, message_id: str) -> Response:
        message = self._get_message(project_id, chatroom_id, message_id)
        message.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

class ChatRoomMessageDetailView(APIView):

    permission_classes = [IsAuthenticated]

    def _get_message(self, project_id: str, chatroom_id: str, message_id: str):

        message = get_object_or_404(
            Message,
            message_id=message_id,
            chatroom__chatroom_id=chatroom_id,
            chatroom__project__project_id=project_id,
        )

        if message.user != self.request.user:
            raise PermissionDenied("You can only edit or delete your own messages.")

        return message

    def put(self, request, project_id: str, chatroom_id: str, message_id: str) -> Response:
        message = self._get_message(project_id, chatroom_id, message_id)
        
        serializer = MessageUpdateSerializer(message, data=request.data)
        serializer.is_valid(raise_exception=True)
        updated_message = serializer.save()

        response_serializer = MessageSerializer(updated_message)
        return Response(response_serializer.data)

    def delete(self, request, project_id: str, chatroom_id: str, message_id: str) -> Response:
        message = self._get_message(project_id, chatroom_id, message_id)
        message.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)