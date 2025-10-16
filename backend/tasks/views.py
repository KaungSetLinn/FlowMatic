from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404 
from ..api.models import Project, Task, User, TaskAssignedUser, TaskRelation, TaskRelationType
from .serializers import TaskCreateSerializer
from django.db import transaction


RELATION_TYPE_MAP = {
    "FtS": TaskRelationType.FINISH_TO_START,
    "FtF": TaskRelationType.FINISH_TO_FINISH,
    "StS": TaskRelationType.START_TO_START,
    "StF": TaskRelationType.START_TO_FINISH,
}

class TaskCreateAPIView(APIView):
    def post(self, request, project_id):
        project = get_object_or_404(Project, pk=project_id)

        serializer = TaskCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        with transaction.atomic():
            
            task = Task.objects.create(
                project=project,
                name=data['name'],
                description=data.get('description', ''),
                deadline=data['deadline'],
                priority=data['priority'],
                status=data['status'],
            )

            
            assigned_user_ids = data.get('assigned_user_ids', [])
            if assigned_user_ids:
                users = User.objects.filter(pk__in=assigned_user_ids)
                for user in users:
                    TaskAssignedUser.objects.create(user=user, task=task)

            
            parent_tasks = data.get('parent_tasks', [])
            for parent in parent_tasks:
                parent_task = get_object_or_404(Task, pk=parent['task_id'])
                relation_type = RELATION_TYPE_MAP[parent['relation_type']]
                TaskRelation.objects.create(
                    parent_task=parent_task,
                    child_task=task,
                    relation_type=relation_type,
                )

        
        response_data = {
            "task_id": str(task.task_id),
            "name": task.name,
            "description": task.description,
            "deadline": task.deadline.isoformat(),
            "priority": task.priority,
            "status": task.status,
            "assigned_user_ids": assigned_user_ids,
            "parent_tasks": parent_tasks,
        }
        return Response(response_data, status=status.HTTP_201_CREATED)
