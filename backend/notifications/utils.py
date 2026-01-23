from .models import Notification
from .serializers import NotificationSerializer
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync


def create_notification(
    recipient, title, message, notification_type, related_object_id=None
):
    """
    Helper function to create notifications

    Args:
        recipient: User object who will receive the notification
        title: Notification title
        message: Notification message
        notification_type: Type of notification ('task', 'project', 'chat', 'event', 'system')
        related_object_id: Optional ID of related object

    Returns:
        Notification object
    """
    notification = Notification.objects.create(
        recipient=recipient,
        title=title,
        message=message,
        notification_type=notification_type,
        related_object_id=related_object_id,
    )

    channel_layer = get_channel_layer()
    user_id = str(recipient.id)
    serializer = NotificationSerializer(notification)

    unread_count = Notification.objects.filter(
        recipient=recipient, is_read=False
    ).count()

    async_to_sync(channel_layer.group_send)(
        f"notifications_{user_id}",
        {
            "type": "notification_created",
            "notification": serializer.data,
            "unread_count": unread_count,
        },
    )

    return notification


def create_task_notification(recipient, task, action="created"):
    """
    Create task-related notifications

    Args:
        recipient: User to notify
        task: Task object
        action: Action performed ('created', 'updated', 'completed')
    """
    action_messages = {
        "created": f"新しいタスク『{task.name}』が追加されました",
        "updated": f"タスク『{task.name}』が更新されました",
        "completed": f"タスク『{task.name}』が完了しました",
    }

    return create_notification(
        recipient=recipient,
        title="タスク通知",
        message=action_messages.get(action, f"タスク『{task.name}』が変更されました"),
        notification_type="task",
        related_object_id=str(task.task_id),
    )


def create_project_notification(recipient, project, action="updated"):
    """
    Create project-related notifications

    Args:
        recipient: User to notify
        project: Project object
        action: Action performed
    """
    action_messages = {
        "created": f"新しいプロジェクト『{project.title}』が作成されました",
        "updated": f"プロジェクト『{project.title}』が更新されました",
        "member_added": f"プロジェクト『{project.title}』に新しいメンバーが追加されました",
    }

    return create_notification(
        recipient=recipient,
        title="プロジェクト通知",
        message=action_messages.get(
            action, f"プロジェクト『{project.title}』が変更されました"
        ),
        notification_type="project",
        related_object_id=str(project.project_id),
    )


def create_chat_notification(recipient, message, sender):
    """
    Create chat-related notifications

    Args:
        recipient: User to notify
        message: Message object or content
        sender: User who sent the message
    """
    message_content = message.content if hasattr(message, "content") else str(message)

    return create_notification(
        recipient=recipient,
        title="新しいメッセージ",
        message=f"{sender.username}さんから新しいメッセージが届いています",
        notification_type="chat",
        related_object_id=str(message.message_id)
        if hasattr(message, "message_id")
        else None,
    )


def create_event_notification(recipient, event, action="created"):
    """
    Create event-related notifications

    Args:
        recipient: User to notify
        event: Event object
        action: Action performed ('created', 'updated')
    """
    action_messages = {
        "created": f"新しいイベント『{event.title}』が作成されました",
        "updated": f"イベント『{event.title}』が更新されました",
    }

    return create_notification(
        recipient=recipient,
        title="イベント通知",
        message=action_messages.get(
            action, f"イベント『{event.title}』が変更されました"
        ),
        notification_type="event",
        related_object_id=str(event.event_id),
    )


def create_chatroom_notification(recipient, chatroom, action="created"):
    """
    Create chatroom-related notifications

    Args:
        recipient: User to notify
        chatroom: ChatRoom object
        action: Action performed ('created')
    """
    action_messages = {
        "created": f"新しいチャットルームが作成されました",
    }

    return create_notification(
        recipient=recipient,
        title="チャットルーム通知",
        message=action_messages.get(action, "チャットルームが変更されました"),
        notification_type="chat",
        related_object_id=str(chatroom.chatroom_id),
    )
