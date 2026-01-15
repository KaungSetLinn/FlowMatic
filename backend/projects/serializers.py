# projects/serializers.py
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Project

TASK_STATUS_DONE = "done"
User = get_user_model()


class MemberSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(source="pk")
    name = serializers.CharField(source="username")
    email = serializers.EmailField()
    profile_picture = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["user_id", "name", "email", "profile_picture"]

    def get_profile_picture(self, obj):
        return obj.profile_picture.url if obj.profile_picture else None


class ProjectListSerializer(serializers.ModelSerializer):
    members = MemberSerializer(many=True, read_only=True)

    progress = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = [
            "project_id",
            "title",
            "description",
            "start_date",
            "deadline",
            "progress",
            "status",
            "members",
        ]

    def get_progress(self, obj):
        tasks = obj.tasks.all()
        total_tasks = tasks.count()

        if total_tasks == 0:
            return 0

        completed_tasks = tasks.filter(status=TASK_STATUS_DONE).count()

        return int((completed_tasks / total_tasks) * 100)


class ProjectResponseSerializer(serializers.ModelSerializer):
    members = MemberSerializer(many=True, read_only=True)
    progress = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = [
            "project_id",
            "title",
            "description",
            "start_date",
            "deadline",
            "progress",
            "status",
            "members",
        ]
        read_only_fields = ["project_id"]

    def get_progress(self, obj):
        tasks = obj.tasks.all()
        total_tasks = tasks.count()

        if total_tasks == 0:
            return 0

        completed_tasks = tasks.filter(status=TASK_STATUS_DONE).count()
        return int((completed_tasks / total_tasks) * 100)


class ProjectCreateSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=255)
    description = serializers.CharField(allow_blank=True, required=False)
    start_date = serializers.DateTimeField()
    deadline = serializers.DateTimeField()
    progress = serializers.IntegerField(required=False, default=0)
    status = serializers.ChoiceField(
        choices=[(c[0], c[1]) for c in Project.status_choices], default="planning"
    )
    members = serializers.PrimaryKeyRelatedField(
        many=True, queryset=User.objects.all(), required=False, default=[]
    )

    default_error_messages = {
        "invalid_date_range": "deadline must be greater than or equal to start_date.",
        "blank_title": "title may not be blank.",
        "invalid_progress": "progress must be between 0 and 100.",
        "invalid_status": "invalid status value.",
    }

    def validate(self, attrs):
        title = attrs.get("title", "").strip()
        if "title" in attrs and not title:
            self.fail("blank_title")
        if title:
            attrs["title"] = title

        start_date = attrs.get("start_date")
        deadline = attrs.get("deadline")
        if start_date and deadline and deadline < start_date:
            self.fail("invalid_date_range")

        # progress is calculated from tasks, not manually set
        attrs.pop("progress", None)

        status = attrs.get("status")
        if status:
            valid_statuses = [c[0] for c in Project.status_choices]
            if status not in valid_statuses:
                self.fail("invalid_status")

        return attrs

    def create(self, validated_data):
        members = validated_data.pop("members", [])
        project = Project.objects.create(**validated_data)
        if members:
            project.members.set(members)
        return project

    def update(self, instance, validated_data):
        members = validated_data.pop("members", None)
        validated_data.pop(
            "progress", None
        )  # progress is calculated from tasks, not manually set

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        instance.save()

        if members is not None:
            instance.members.set(members)

        return instance

    def validate_members(self, value):
        # Validate members are unique
        if value:
            user_ids = [user.pk for user in value]
            if len(user_ids) != len(set(user_ids)):
                raise serializers.ValidationError(
                    "Duplicate member IDs are not allowed."
                )
        return value
