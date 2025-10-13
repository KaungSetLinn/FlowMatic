from rest_framework import serializers
from ..api.models import Task, User, TaskRelation, TaskRelationType

class ParentTaskRelationSerializer(serializers.Serializer): #おそらく親タスクのデータを定義（あとで調べる）
    task_id = serializers.UUIDField()
    relation_type = serializers.ChoiceField(choices=['FtS', 'FtF', 'StS', 'StF'])

class TaskCreateSerializer(serializers.Serializer):#おそらく新しいタスクのデータの定義(あとで調べる)
    name = serializers.CharField()
    description = serializers.CharField(allow_blank=True, required=False)
    deadline = serializers.DateTimeField()
    priority = serializers.ChoiceField(choices=['low', 'medium', 'high'])
    status = serializers.ChoiceField(choices=['todo', 'in_progress', 'done'])
    assigned_user_ids = serializers.ListField(
        child=serializers.UUIDField(),
        allow_empty=True,
        required=False
    )
    parent_tasks = ParentTaskRelationSerializer(many=True, required=False)

    def validate_assigned_user_ids(self, value):
        # ユーザーIDの検証（おそらくリストにユーザーが存在するか調べている）
        users = User.objects.filter(pk__in=value)
        if len(users) != len(value):
            raise serializers.ValidationError("Some assigned_user_ids do not exist.")
        return value

    def validate_parent_tasks(self, value):
        # relation_typeをモデルの値に変換(おそらくDRFのSerializerを使ってparent_tasks の中にある relation_typeの値を検証している)
        valid_relation_types = ['FtS', 'FtF', 'StS', 'StF']
        for rel in value:
            if rel['relation_type'] not in valid_relation_types:
                raise serializers.ValidationError(f"Invalid relation_type: {rel['relation_type']}")
        return value
