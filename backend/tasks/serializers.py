from rest_framework import serializers
from .models import Task, TaskRelation, Project
from django.contrib.auth.models import User

class TaskRelationInputSerializer(serializers.Serializer):
    task_id = serializers.UUIDField()
    relation_type = serializers.ChoiceField(choices=[('FtS', 'FtS'), ('FtF', 'FtF'), ('StS', 'StS'), ('StF', 'StF')])

class TaskCreateSerializer(serializers.ModelSerializer):
    assigned_user_ids = serializers.ListField(
        child=serializers.UUIDField(), write_only=True
    )
    parent_tasks = TaskRelationInputSerializer(many=True, write_only=True)

    class Meta:
        model = Task
        fields = ['id', 'name', 'description', 'deadline', 'priority', 'status',
                'assigned_user_ids', 'parent_tasks']

    def create(self, validated_data):
        assigned_user_ids = validated_data.pop('assigned_user_ids', [])
        parent_tasks = validated_data.pop('parent_tasks', [])
        project = self.context['project']

        task = Task.objects.create(project=project, **validated_data)

    
        users = User.objects.filter(id__in=assigned_user_ids)
        task.assigned_users.set(users)

        for relation in parent_tasks:
            try:
                parent_task = Task.objects.get(task_id=relation['task_id'])
            except Task.DoesNotExist:
                raise serializers.ValidationError(f"Parent task {relation['task_id']} does not exist.")
            TaskRelation.objects.create(
                parent=parent_task,
                child=task,
                relation_type=relation['relation_type']
        )
        

        return task