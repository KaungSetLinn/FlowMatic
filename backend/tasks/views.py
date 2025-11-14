
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Project
from .serializers import TaskCreateSerializer

class TaskCreateView(APIView):
    def post(self, request, project_id):
        try:
            project = Project.objects.get(id=project_id)
        except Project.DoesNotExist:
            return Response({'error': 'Project not found'}, status=status.HTTP_404_NOT_FOUND)

        serializer = TaskCreateSerializer(data=request.data, context={'project': project})
        if serializer.is_valid():
            task = serializer.save()
            return Response({
                'task_id': str(task.id),
                'name': task.name,
                'description': task.description,
                'deadline': task.deadline,
                'priority': task.priority,
                'status': task.status,
                'assigned_user_ids': [str(user.id) for user in task.assigned_users.all()],
                'parent_tasks': [
                    {
                        'task_id': str(rel.parent.id),
                        'relation_type': rel.relation_type
                    } for rel in task.parent_relations.all()
                ]
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)