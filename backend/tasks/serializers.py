from rest_framework import serializers
from .models import Task, TaskRelation, TaskRelationType, TaskComment
from django.contrib.auth import get_user_model

User = get_user_model()


class AssignedUserSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(source="pk")
    name = serializers.CharField(source="username")

    class Meta:
        model = User
        fields = ["user_id", "name"]


class TaskRelationInputSerializer(serializers.Serializer):
    task_id = serializers.UUIDField()
    # Use the TextChoices values as valid choices for API input
    relation_type = serializers.ChoiceField(
        choices=[(choice.value, choice.label) for choice in TaskRelationType]
    )


class TaskCreateSerializer(serializers.ModelSerializer):
    assigned_user_ids = serializers.ListField(
        child=serializers.IntegerField(), write_only=True, required=False, default=list
    )
    parent_tasks = TaskRelationInputSerializer(
        many=True, write_only=True, required=False, default=list
    )

    class Meta:
        model = Task
        fields = [
            "task_id",
            "name",
            "description",
            "deadline",
            "priority",
            "status",
            "assigned_user_ids",
            "parent_tasks",
        ]
        read_only_fields = ["task_id"]

    default_error_messages = {
        "invalid_assigned_user": "Some assigned_user_ids are invalid.",
        "not_in_project": "All assigned users must be assigned to the project.",
        "parent_task_not_found": "Parent task does not exist or is not in the same project.",
    }

    def validate(self, attrs):
        project = self.context["project"]
        assigned_user_ids = attrs.get("assigned_user_ids", [])
        parent_tasks = attrs.get("parent_tasks", [])

        # Ensure assigned_user_ids are unique
        seen = set()
        unique_user_ids = []
        for uid in assigned_user_ids:
            if uid in seen:
                raise serializers.ValidationError(
                    {"assigned_user_ids": "Duplicate IDs are not allowed."}
                )
            seen.add(uid)
            unique_user_ids.append(uid)

        users = (
            list(User.objects.filter(pk__in=unique_user_ids)) if unique_user_ids else []
        )
        if len(users) != len(unique_user_ids):
            self.fail("invalid_assigned_user")

        # Ensure assigned users are all in the project
        if users:
            assigned_user_pks = set(
                project.members.filter(pk__in=unique_user_ids).values_list(
                    "pk", flat=True
                )
            )
            if assigned_user_pks != set(unique_user_ids):
                self.fail("not_in_project")

        # Validate parent tasks: exist and belong to the same project
        for rel in parent_tasks:
            try:
                parent_task = Task.objects.get(task_id=rel["task_id"])
            except Task.DoesNotExist:
                self.fail("parent_task_not_found")
            if parent_task.project_id != project.project_id:
                self.fail("parent_task_not_found")

        # Attach resolved objects to attrs so create() can use them
        attrs["member_objects"] = users
        attrs["parent_relations"] = parent_tasks
        return attrs

    def create(self, validated_data):
        assigned_user_ids = validated_data.pop("assigned_user_ids", [])
        parent_tasks = validated_data.pop("parent_relations", [])
        users = validated_data.pop("member_objects", [])
        validated_data.pop("parent_tasks", None)
        project = self.context["project"]

        # Create the task
        task = Task.objects.create(project=project, **validated_data)

        # Attach assigned users
        if users:
            task.assigned_users.set(users)

        # Create TaskRelation entries
        for relation in parent_tasks:
            parent_task = Task.objects.get(task_id=relation["task_id"])
            TaskRelation.objects.create(
                parent_task=parent_task,
                child_task=task,
                relation_type=relation["relation_type"],
            )

        task.refresh_from_db()
        return task


class TaskCommentCreateSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = TaskComment
        fields = ["user_id", "content"]

    def validate_user_id(self, value):
        if not User.objects.filter(pk=value).exists():
            raise serializers.ValidationError("User with this ID does not exist.")
        return value

    def create(self, validated_data):
        task = self.context["task"]
        user_id = validated_data.pop("user_id")
        user = User.objects.get(pk=user_id)
        comment = TaskComment.objects.create(task=task, user=user, **validated_data)
        return comment


class TaskCommentResponseSerializer(serializers.ModelSerializer):
    task_id = serializers.UUIDField(source="task.task_id", read_only=True)
    user_id = serializers.IntegerField(source="user.pk", read_only=True)
    name = serializers.CharField(source="user.username", read_only=True)

    class Meta:
        model = TaskComment
        fields = ["comment_id", "task_id", "user_id", "name", "content", "created_at"]


class TaskResponseSerializer(serializers.ModelSerializer):
    project_id = serializers.UUIDField(source="project.project_id", read_only=True)
    assigned_users = AssignedUserSerializer(many=True, read_only=True)
    parent_tasks = serializers.SerializerMethodField()
    comments = serializers.SerializerMethodField()

    class Meta:
        model = Task
        fields = [
            "task_id",
            "project_id",
            "name",
            "description",
            "deadline",
            "priority",
            "status",
            "assigned_users",
            "parent_tasks",
            "comments",
        ]

    def get_parent_tasks(self, obj: Task) -> list[dict]:
        # related_name='parents' is on the child_task side, so we can iterate over obj.parents.all()
        relations = obj.parents.select_related("parent_task").all()
        return [
            {
                "task_id": str(rel.parent_task.task_id),
                "relation_type": rel.relation_type,
            }
            for rel in relations
        ]

    def get_comments(self, obj: Task) -> list[dict]:
        comments = obj.comments.select_related("user").all()
        return TaskCommentResponseSerializer(comments, many=True).data

    def get_parent_tasks(self, obj: Task) -> list[dict]:
        # related_name='parents' is on the child_task side, so we can iterate over obj.parents.all()
        relations = obj.parents.select_related("parent_task").all()
        return [
            {
                "task_id": str(rel.parent_task.task_id),
                "relation_type": rel.relation_type,
            }
            for rel in relations
        ]
