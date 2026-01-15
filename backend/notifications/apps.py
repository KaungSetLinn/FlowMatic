from django.apps import AppConfig


class NotificationsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "notifications"

    def ready(self):
        import notifications.signals

        from django.db.models.signals import m2m_changed
        from projects.models import Project

        m2m_changed.connect(
            notifications.signals.handle_task_assigned_users_changed,
            sender="tasks.TaskAssignedUser",
        )
        m2m_changed.connect(
            notifications.signals.handle_project_members_changed,
            sender=Project.members.through,
        )
