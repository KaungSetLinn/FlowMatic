from django.urls import path

from .views import (
    ChatRoomDeleteView,
    ChatRoomMessageListCreateView,
    ProjectChatRoomListCreateView,
    ChatRoomMessageDetailView,
    MessageReactionView,
)


urlpatterns = [
    path(
        "projects/<uuid:project_id>/chatrooms/",
        ProjectChatRoomListCreateView.as_view(),
        name="chatroom-list-create",
    ),
    path(
        "projects/<uuid:project_id>/chatrooms/<uuid:chatroom_id>/messages/",
        ChatRoomMessageListCreateView.as_view(),
        name="chatroom-messages",
    ),
    path(
        "projects/<uuid:project_id>/chatrooms/<uuid:chatroom_id>/messages/<uuid:message_id>/",
        ChatRoomMessageDetailView.as_view(),
        name="chatroom-message-detail",
    ),
    path(
        "projects/<uuid:project_id>/chatrooms/<uuid:chatroom_id>/messages/<uuid:message_id>/reactions/",
        MessageReactionView.as_view(),
        name="message-reactions",
    ),
    path(
        "projects/<uuid:project_id>/chatrooms/<uuid:chatroom_id>/messages/<uuid:message_id>/reactions/<str:emoji>/",
        MessageReactionView.as_view(),
        name="message-reaction-detail",
    ),
    path(
        "projects/<uuid:project_id>/chatrooms/<uuid:chatroom_id>/",
        ChatRoomDeleteView.as_view(),
        name="chatroom-delete",
    ),
]
