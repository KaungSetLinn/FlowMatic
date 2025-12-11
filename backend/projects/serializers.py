# projects/serializers.py
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Project

User = get_user_model()


class MemberSerializer(serializers.ModelSerializer):
    user_id = serializers.UUIDField(source='id')
    name = serializers.CharField(source='username')

    class Meta:
        model = User
        fields = ['user_id', 'name']


class ProjectListSerializer(serializers.ModelSerializer):
    members = MemberSerializer(many=True, read_only=True)

    class Meta:
        model = Project
        fields = [
            'project_id',
            'title',
            'description',
            'start_date',
            'deadline',
            'progress',
            'status',
            'members',
        ]


class ProjectResponseSerializer(serializers.ModelSerializer):
    members = serializers.PrimaryKeyRelatedField(many=True, queryset=User.objects.all())

    class Meta:
        model = Project
        fields = [
            'project_id',
            'title',
            'description',
            'start_date',
            'deadline',
            'progress',
            'status',
            'members',
        ]
        read_only_fields = ['project_id']


class ProjectCreateSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=255)
    description = serializers.CharField(allow_blank=True, required=False)
    start_date = serializers.DateTimeField()
    deadline = serializers.DateTimeField()
    progress = serializers.IntegerField(required=False, default=0)
    status = serializers.ChoiceField(
        choices=[(c[0], c[1]) for c in Project.status_choices], default='planning'
    )
    members = serializers.PrimaryKeyRelatedField(
        many=True, queryset=User.objects.all(), required=False, default=[]
    )

    default_error_messages = {
        'invalid_date_range': 'deadline must be greater than or equal to start_date.',
        'blank_title': 'title may not be blank.',
        'invalid_progress': 'progress must be between 0 and 100.',
        'invalid_status': 'invalid status value.',
    }

    def validate(self, attrs):
        title = attrs.get('title', '').strip()
        if not title:
            self.fail('blank_title')
        attrs['title'] = title

        start_date = attrs.get('start_date')
        deadline = attrs.get('deadline')
        if start_date and deadline and deadline < start_date:
            self.fail('invalid_date_range')

        progress = attrs.get('progress', 0)
        if progress < 0 or progress > 100:
            self.fail('invalid_progress')

        status = attrs.get('status')
        valid_statuses = [c[0] for c in Project.status_choices]
        if status not in valid_statuses:
            self.fail('invalid_status')

        return attrs

    def create(self, validated_data):
        members = validated_data.pop('members', [])
        project = Project.objects.create(**validated_data)
        if members:
            project.members.set(members)
        return project
