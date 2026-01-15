from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APITestCase
from rest_framework import status
from uuid import uuid4

from projects.models import Project
from .models import (
    Task,
    TaskRelation,
    TaskAssignedUser,
    TaskStatus,
    TaskPriority,
    TaskRelationType,
)

User = get_user_model()


class TaskModelTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser", email="test@example.com", password="testpass123"
        )
        self.project = Project.objects.create(
            title="Test Project",
            description="Test Description",
            start_date=timezone.now(),
            deadline=timezone.now() + timezone.timedelta(days=30),
        )
        self.project.members.add(self.user)

    def test_task_creation(self):
        task = Task.objects.create(
            project=self.project,
            name="Test Task",
            description="Test Description",
            deadline=timezone.now() + timezone.timedelta(days=7),
            status=TaskStatus.TODO,
            priority=TaskPriority.HIGH,
        )
        self.assertEqual(str(task), "Test Task")
        self.assertEqual(task.project, self.project)
        self.assertEqual(task.status, TaskStatus.TODO)
        self.assertEqual(task.priority, TaskPriority.HIGH)

    def test_task_default_values(self):
        task = Task.objects.create(
            project=self.project,
            name="Default Task",
            deadline=timezone.now() + timezone.timedelta(days=7),
        )
        self.assertEqual(task.status, TaskStatus.TODO)
        self.assertEqual(task.priority, TaskPriority.MEDIUM)

    def test_task_assigned_users(self):
        user2 = User.objects.create_user(
            username="user2", email="user2@example.com", password="testpass123"
        )
        self.project.members.add(user2)

        task = Task.objects.create(
            project=self.project,
            name="Task with Users",
            deadline=timezone.now() + timezone.timedelta(days=7),
            status=TaskStatus.TODO,
        )
        task.assigned_users.add(self.user, user2)

        self.assertEqual(task.assigned_users.count(), 2)
        self.assertIn(self.user, task.assigned_users.all())
        self.assertIn(user2, task.assigned_users.all())

    def test_task_relation_creation(self):
        parent_task = Task.objects.create(
            project=self.project,
            name="Parent Task",
            deadline=timezone.now() + timezone.timedelta(days=7),
        )
        child_task = Task.objects.create(
            project=self.project,
            name="Child Task",
            deadline=timezone.now() + timezone.timedelta(days=14),
        )

        relation = TaskRelation.objects.create(
            parent_task=parent_task,
            child_task=child_task,
            relation_type=TaskRelationType.FINISH_TO_START,
        )

        self.assertEqual(relation.parent_task, parent_task)
        self.assertEqual(relation.child_task, child_task)
        self.assertEqual(relation.relation_type, TaskRelationType.FINISH_TO_START)

    def test_task_assigned_user_model(self):
        task = Task.objects.create(
            project=self.project,
            name="Test Task",
            deadline=timezone.now() + timezone.timedelta(days=7),
            status=TaskStatus.TODO,
        )
        TaskAssignedUser.objects.create(user=self.user, task=task)

        self.assertEqual(TaskAssignedUser.objects.count(), 1)
        assigned_user = TaskAssignedUser.objects.first()
        self.assertEqual(assigned_user.user, self.user)
        self.assertEqual(assigned_user.task, task)


class TaskAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser", email="test@example.com", password="testpass123"
        )
        self.user2 = User.objects.create_user(
            username="user2", email="user2@example.com", password="testpass123"
        )
        self.project = Project.objects.create(
            title="Test Project",
            description="Test Description",
            start_date=timezone.now(),
            deadline=timezone.now() + timezone.timedelta(days=30),
        )
        self.project.members.add(self.user, self.user2)
        self.client.force_authenticate(user=self.user)

    def test_create_task_success(self):
        url = f"/api/projects/{self.project.project_id}/tasks/"
        data = {
            "name": "New Task",
            "description": "Task Description",
            "deadline": (timezone.now() + timezone.timedelta(days=7)).isoformat(),
            "priority": "high",
            "status": "todo",
            "assigned_user_ids": [self.user2.pk],
            "parent_tasks": [],
        }
        response = self.client.post(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Task.objects.count(), 1)
        task = Task.objects.first()
        self.assertEqual(task.name, "New Task")
        self.assertEqual(task.assigned_users.count(), 1)
        self.assertEqual(task.assigned_users.first(), self.user2)

    def test_create_task_with_parent(self):
        parent_task = Task.objects.create(
            project=self.project,
            name="Parent Task",
            deadline=timezone.now() + timezone.timedelta(days=7),
            status=TaskStatus.TODO,
        )

        url = f"/api/projects/{self.project.project_id}/tasks/"
        data = {
            "name": "Child Task",
            "deadline": (timezone.now() + timezone.timedelta(days=14)).isoformat(),
            "parent_tasks": [
                {"task_id": str(parent_task.task_id), "relation_type": "FtS"}
            ],
        }
        response = self.client.post(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        child_task = Task.objects.get(name="Child Task")
        self.assertEqual(TaskRelation.objects.count(), 1)
        relation = TaskRelation.objects.first()
        self.assertEqual(relation.parent_task, parent_task)
        self.assertEqual(relation.child_task, child_task)
        self.assertEqual(relation.relation_type, TaskRelationType.FINISH_TO_START)

    def test_create_task_unauthorized_user(self):
        self.client.force_authenticate(user=None)
        url = f"/api/projects/{self.project.project_id}/tasks/"
        data = {
            "name": "Unauthorized Task",
            "deadline": (timezone.now() + timezone.timedelta(days=7)).isoformat(),
        }
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_task_non_member(self):
        non_member = User.objects.create_user(
            username="nonmember", email="nonmember@example.com", password="testpass123"
        )
        self.client.force_authenticate(user=non_member)

        url = f"/api/projects/{self.project.project_id}/tasks/"
        data = {
            "name": "Non-member Task",
            "deadline": (timezone.now() + timezone.timedelta(days=7)).isoformat(),
        }
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_create_task_invalid_assigned_user(self):
        url = f"/api/projects/{self.project.project_id}/tasks/"
        data = {
            "name": "Task with Invalid User",
            "deadline": (timezone.now() + timezone.timedelta(days=7)).isoformat(),
            "assigned_user_ids": ["999999"],  # Non-existent user ID
        }
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_task_user_not_in_project(self):
        non_member_user = User.objects.create_user(
            username="nonmember2",
            email="nonmember2@example.com",
            password="testpass123",
        )

        url = f"/api/projects/{self.project.project_id}/tasks/"
        data = {
            "name": "Task with Non-member User",
            "deadline": (timezone.now() + timezone.timedelta(days=7)).isoformat(),
            "assigned_user_ids": [non_member_user.pk],
        }
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_task_duplicate_assigned_users(self):
        url = f"/api/projects/{self.project.project_id}/tasks/"
        data = {
            "name": "Task with Duplicate Users",
            "deadline": (timezone.now() + timezone.timedelta(days=7)).isoformat(),
            "assigned_user_ids": [self.user2.pk, self.user2.pk],
        }
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_task_invalid_parent_task(self):
        url = f"/api/projects/{self.project.project_id}/tasks/"
        data = {
            "name": "Task with Invalid Parent",
            "deadline": (timezone.now() + timezone.timedelta(days=7)).isoformat(),
            "parent_tasks": [
                {
                    "task_id": str(uuid4()),  # Non-existent task ID
                    "relation_type": "FtS",
                }
            ],
        }
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_list_tasks_success(self):
        # Create multiple tasks
        Task.objects.create(
            project=self.project,
            name="Task 1",
            deadline=timezone.now() + timezone.timedelta(days=7),
            status=TaskStatus.TODO,
        )
        Task.objects.create(
            project=self.project,
            name="Task 2",
            deadline=timezone.now() + timezone.timedelta(days=14),
            status=TaskStatus.TODO,
        )

        url = f"/api/projects/{self.project.project_id}/tasks/"
        response = self.client.get(url, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["tasks"]), 2)
        task_names = [task["name"] for task in response.data["tasks"]]
        self.assertIn("Task 1", task_names)
        self.assertIn("Task 2", task_names)

    def test_list_tasks_unauthorized_user(self):
        self.client.force_authenticate(user=None)
        url = f"/api/projects/{self.project.project_id}/tasks/"
        response = self.client.get(url, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_list_tasks_non_member(self):
        non_member = User.objects.create_user(
            username="nonmember3",
            email="nonmember3@example.com",
            password="testpass123",
        )
        self.client.force_authenticate(user=non_member)

        url = f"/api/projects/{self.project.project_id}/tasks/"
        response = self.client.get(url, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_task_response_serializer_structure(self):
        user2 = User.objects.create_user(
            username="user3", email="user3@example.com", password="testpass123"
        )
        self.project.members.add(user2)

        parent_task = Task.objects.create(
            project=self.project,
            name="Parent Task",
            deadline=timezone.now() + timezone.timedelta(days=7),
            status=TaskStatus.TODO,
        )

        task = Task.objects.create(
            project=self.project,
            name="Test Task",
            description="Test Description",
            deadline=timezone.now() + timezone.timedelta(days=14),
            status=TaskStatus.IN_PROGRESS,
            priority=TaskPriority.HIGH,
        )
        task.assigned_users.add(self.user, user2)

        TaskRelation.objects.create(
            parent_task=parent_task,
            child_task=task,
            relation_type=TaskRelationType.START_TO_FINISH,
        )

        url = f"/api/projects/{self.project.project_id}/tasks/"
        response = self.client.get(url, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Find the 'Test Task' instead of assuming it's first
        task_data = next(
            task for task in response.data["tasks"] if task["name"] == "Test Task"
        )

        self.assertEqual(task_data["name"], "Test Task")
        self.assertEqual(task_data["description"], "Test Description")
        self.assertEqual(task_data["status"], "in_progress")
        self.assertEqual(task_data["priority"], "high")
        self.assertEqual(task_data["project_id"], str(self.project.project_id))
        self.assertEqual(len(task_data["users"]), 2)
        user_ids = [user["user_id"] for user in task_data["users"]]
        self.assertIn(self.user.pk, user_ids)
        self.assertIn(user2.pk, user_ids)
        self.assertEqual(len(task_data["parent_tasks"]), 1)
        self.assertEqual(
            task_data["parent_tasks"][0]["task_id"], str(parent_task.task_id)
        )
        self.assertEqual(task_data["parent_tasks"][0]["relation_type"], "StF")

        # Check that email and profile_picture are included in users
        user_data = next(
            user for user in task_data["users"] if user["user_id"] == self.user.pk
        )
        self.assertIn("email", user_data)
        self.assertIn("profile_picture", user_data)
        self.assertEqual(user_data["email"], self.user.email)

    def test_task_comment_includes_email_and_profile_picture(self):
        """タスクコメントでユーザーのemailとprofile_pictureが含まれるテスト"""
        task = Task.objects.create(
            project=self.project,
            name="Test Task",
            deadline=timezone.now() + timezone.timedelta(days=7),
            status=TaskStatus.TODO,
        )
        task.assigned_users.add(self.user)

        from .models import TaskComment

        TaskComment.objects.create(task=task, user=self.user, content="Test comment")

        url = f"/api/projects/{self.project.project_id}/tasks/"
        response = self.client.get(url, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        task_data = next(
            task for task in response.data["tasks"] if task["name"] == "Test Task"
        )
        self.assertGreater(len(task_data["comments"]), 0)
        comment = task_data["comments"][0]
        self.assertIn("email", comment)
        self.assertIn("profile_picture", comment)
        self.assertEqual(comment["email"], self.user.email)
