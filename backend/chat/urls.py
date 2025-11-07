from django.urls import path

from .views import (
    ChatRoomDeleteView,
    ChatRoomMessageListCreateView,
    ProjectChatRoomListCreateView,
)


urlpatterns = [
    path('projects/<uuid:project_id>/chatrooms/', ProjectChatRoomListCreateView.as_view(), name='chatroom-list-create'),
    path('chatrooms/<uuid:chatroom_id>/messages/', ChatRoomMessageListCreateView.as_view(), name='chatroom-messages'),
    path('chatrooms/<uuid:chatroom_id>/', ChatRoomDeleteView.as_view(), name='chatroom-delete'),
]
