# projects/serializers.py
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Project

User = get_user_model()

class ProjectSerializer(serializers.ModelSerializer):
    members = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=User.objects.all()
    )

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
            'members'
        ]
