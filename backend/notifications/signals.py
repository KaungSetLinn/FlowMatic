from django.db.models.signals import post_save, m2m_changed
from django.dispatch import receiver

from .context import get_current_user
from .utils import (
    create_notification,
    create_task_notification,
    create_project_notification,
    create_chat_notification,
    create_event_notification,
)


@receiver(post_save, sender="tasks.Task")
def handle_task_save(sender, instance, created, **kwargs):
    from django.contrib.auth import get_user_model

    current_user = get_current_user()

    User = get_user_model()
    if current_user and current_user.is_anonymous:
        return

    project = instance.project

    if created:
        for member in project.members.all():
            if member != current_user:
                create_task_notification(member, instance, "created")
    else:
        old_status = getattr(instance, "_old_status", None)
        if old_status and old_status != instance.status:
            for member in project.members.all():
                if member != current_user:
                    if instance.status == "done":
                        create_task_notification(member, instance, "completed")
                    else:
                        create_notification(
                            recipient=member,
                            title="タスク状態変更",
                            message=f"タスク『{instance.name}』の状態が変更されました",
                            notification_type="task",
                            related_object_id=str(instance.task_id),
                        )


@receiver(post_save, sender="tasks.TaskComment")
def handle_task_comment_save(sender, instance, created, **kwargs):
    if not created:
        return

    current_user = get_current_user()
    if not current_user or current_user.is_anonymous:
        return

    task = instance.task

    for assigned_user in task.assigned_users.all():
        if assigned_user != current_user:
            create_notification(
                recipient=assigned_user,
                title="新しいコメント",
                message=f"タスク『{task.name}』に新しいコメントが追加されました",
                notification_type="task",
                related_object_id=str(task.task_id),
            )


@receiver(post_save, sender="projects.Project")
def handle_project_save(sender, instance, created, **kwargs):
    current_user = get_current_user()
    if not current_user or current_user.is_anonymous:
        return

    if created:
        for member in instance.members.all():
            if member != current_user:
                create_project_notification(member, instance, "created")
    else:
        for member in instance.members.all():
            if member != current_user:
                create_project_notification(member, instance, "updated")


@receiver(post_save, sender="chat.Message")
def handle_message_save(sender, instance, created, **kwargs):
    if not created:
        return

    current_user = get_current_user()
    if not current_user or current_user.is_anonymous:
        return

    chatroom = instance.chatroom

    for member in chatroom.members.all():
        if member != current_user:
            create_chat_notification(member, instance, current_user)


@receiver(post_save, sender="event.Event")
def handle_event_save(sender, instance, created, **kwargs):
    current_user = get_current_user()
    if not current_user or current_user.is_anonymous:
        return

    project = instance.project

    for member in project.members.all():
        if member != current_user:
            create_event_notification(
                member, instance, "created" if created else "updated"
            )


def handle_task_assigned_users_changed(
    instance, action, reverse, model, pk_set, **kwargs
):
    current_user = get_current_user()
    if not current_user or current_user.is_anonymous:
        return

    if action == "post_add" and not reverse:
        from django.contrib.auth import get_user_model

        task = instance
        User = get_user_model()
        newly_assigned_users = User.objects.filter(pk__in=pk_set)
        for user in newly_assigned_users:
            if user != current_user:
                create_notification(
                    recipient=user,
                    title="タスク割り当て",
                    message=f"タスク『{task.name}』があなたに割り当てられました",
                    notification_type="task",
                    related_object_id=str(task.task_id),
                )


def handle_project_members_changed(instance, action, reverse, model, pk_set, **kwargs):
    current_user = get_current_user()
    if not current_user or current_user.is_anonymous:
        return

    if action == "post_add" and not reverse:
        project = instance
        from django.contrib.auth import get_user_model

        User = get_user_model()
        new_members = User.objects.filter(pk__in=pk_set)
        for member in new_members:
            if member != current_user:
                create_project_notification(member, project, "member_added")
