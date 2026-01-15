from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import ProjectMemo

User = get_user_model()

class MemoUserSerializer(serializers.ModelSerializer):

    name = serializers.CharField(source='username', read_only=True)
    user_id = serializers.PrimaryKeyRelatedField(source='pk', read_only=True)
    
    class Meta:
        model = User
        
        fields = ['user_id', 'name', 'email', 'profile_picture']


class ProjectMemoSerializer(serializers.ModelSerializer):

    user = MemoUserSerializer(read_only=True)
    
    
    user_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), 
        write_only=True, 
        required=False,
        source='user'
    )

    class Meta:
        model = ProjectMemo
        fields = [
            'memo_id', 'project_id', 'content', 'color', 
            'is_pinned', 'user', 'user_id', 
            'created_at', 'updated_at'
        ]
        read_only_fields = ['memo_id', 'project_id', 'created_at', 'updated_at']