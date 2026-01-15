from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APITestCase
from rest_framework import status
from unittest.mock import patch
from django.urls import reverse
from datetime import timedelta

from projects.models import Project
from tasks.models import Task, TaskComment
from notifications.models import Notification

User = get_user_model()


class TasksNotificationIntegrationTest(APITestCase):
    """
    Tasks Appの通知機能統合テスト
    タスク作成・更新・コメント作成時の通知をテスト
    """

    def setUp(self):
        # テストユーザー作成
        self.user1 = User.objects.create_user(
            username="user1", email="user1@example.com", password="testpass123"
        )
        self.user2 = User.objects.create_user(
            username="user2", email="user2@example.com", password="testpass123"
        )
        self.user3 = User.objects.create_user(
            username="user3", email="user3@example.com", password="testpass123"
        )

        # テストプロジェクト作成
        self.project = Project.objects.create(
            title="テストプロジェクト",
            start_date=timezone.now(),
            deadline=timezone.now() + timedelta(days=30),
        )
        self.project.members.add(self.user1, self.user2, self.user3)

        # API URL
        self.tasks_url = f"/api/projects/{self.project.project_id}/tasks/"

    def test_task_creation_sends_notifications_to_all_members_except_creator(self):
        """タスク作成時、作成者以外の全プロジェクトメンバーに通知が送られること"""
        self.client.force_authenticate(user=self.user1)

        task_data = {
            "name": "テストタスク",
            "description": "タスク説明",
            "deadline": "2024-12-31T23:59:59Z",
            "status": "todo",
            "assigned_user_ids": [self.user2.id, self.user3.id],
        }

        response = self.client.post(self.tasks_url, task_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # 通知が作成されたことを確認
        notifications = Notification.objects.filter(
            notification_type="task", title="タスク通知"
        )
        self.assertEqual(notifications.count(), 2)  # user2とuser3に通知

        # user2とuser3に通知が送られたことを確認
        notified_users = [n.recipient for n in notifications]
        self.assertIn(self.user2, notified_users)
        self.assertIn(self.user3, notified_users)
        self.assertNotIn(self.user1, notified_users)  # 作成者には通知なし

        # 通知メッセージの確認
        for notification in notifications:
            self.assertIn(
                "新しいタスク『テストタスク』が追加されました", notification.message
            )
            self.assertEqual(
                notification.related_object_id, str(response.data["task_id"])
            )

    def test_task_comment_sends_notifications_to_assigned_users_except_commenter(self):
        """タスクコメント時、コメント者以外の担当者に通知が送られること"""
        # まずタスクを作成
        task = Task.objects.create(
            name="テストタスク",
            project=self.project,
            deadline=timezone.now() + timedelta(days=7),
        )
        task.assigned_users.add(self.user1, self.user2, self.user3)

        # API URL
        comments_url = (
            f"/api/projects/{self.project.project_id}/tasks/{task.task_id}/comments/"
        )

        # user2がコメント投稿
        self.client.force_authenticate(user=self.user2)
        comment_data = {"content": "テストコメントです"}
        response = self.client.post(comments_url, comment_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # 通知を確認
        notifications = Notification.objects.filter(
            notification_type="task", title="新しいコメント"
        )
        self.assertEqual(notifications.count(), 2)  # user1とuser3に通知

        # 通知受信者の確認
        notified_users = [n.recipient for n in notifications]
        self.assertIn(self.user1, notified_users)
        self.assertIn(self.user3, notified_users)
        self.assertNotIn(self.user2, notified_users)  # コメント者には通知なし

        # 通知メッセージの確認
        for notification in notifications:
            self.assertIn(
                "タスク『テストタスク』に新しいコメントが追加されました",
                notification.message,
            )

    def test_task_status_change_to_done_sends_completion_notifications(self):
        """タスクが完了状態に変更された場合、完了通知が送られること"""
        # タスクを作成
        task = Task.objects.create(
            name="未完了タスク",
            project=self.project,
            status="todo",
            deadline=timezone.now() + timedelta(days=7),
        )

        # API URL
        task_url = f"/api/projects/{self.project.project_id}/tasks/{task.task_id}/"

        # user1がタスクを完了に更新
        self.client.force_authenticate(user=self.user1)
        update_data = {"status": "done"}
        response = self.client.patch(task_url, update_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # 通知を確認
        notifications = Notification.objects.filter(
            notification_type="task", title="タスク通知"
        )
        self.assertEqual(notifications.count(), 2)  # user2とuser3に通知

        # 通知メッセージの確認
        for notification in notifications:
            self.assertIn("タスク『未完了タスク』が完了しました", notification.message)

    def test_task_status_change_to_other_status_sends_change_notifications(self):
        """タスクが完了以外の状態に変更された場合、変更通知が送られること"""
        # タスクを作成
        task = Task.objects.create(
            name="進行中タスク",
            project=self.project,
            status="todo",
            deadline=timezone.now() + timedelta(days=7),
        )

        # API URL
        task_url = f"/api/projects/{self.project.project_id}/tasks/{task.task_id}/"

        # user1がタスクを進行中に更新
        self.client.force_authenticate(user=self.user1)
        update_data = {"status": "in_progress"}
        response = self.client.patch(task_url, update_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # 通知を確認
        notifications = Notification.objects.filter(
            notification_type="task", title="タスク状態変更"
        )
        self.assertEqual(notifications.count(), 2)  # user2とuser3に通知

        # 通知メッセージの確認
        for notification in notifications:
            self.assertIn(
                "タスク『進行中タスク』の状態が変更されました", notification.message
            )

    def test_task_assignment_notification_for_newly_assigned_users(self):
        """タスク割り当て時、新しく割り当てられたユーザーに通知が送られること"""
        # タスクを作成（担当者なし）
        task = Task.objects.create(
            name="割り当てタスク",
            project=self.project,
            deadline=timezone.now() + timedelta(days=7),
        )

        # API URL
        task_url = f"/api/projects/{self.project.project_id}/tasks/{task.task_id}/"

        # user1がuser2とuser3を担当者として割り当て
        self.client.force_authenticate(user=self.user1)
        update_data = {"assigned_user_ids": [self.user2.id, self.user3.id]}
        response = self.client.patch(task_url, update_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # 通知を確認
        notifications = Notification.objects.filter(
            notification_type="task", title="タスク割り当て"
        )
        self.assertEqual(notifications.count(), 2)  # user2とuser3に通知

        # 通知受信者の確認
        notified_users = [n.recipient for n in notifications]
        self.assertIn(self.user2, notified_users)
        self.assertIn(self.user3, notified_users)
        self.assertNotIn(self.user1, notified_users)  # 割り当て者には通知なし

        # 通知メッセージの確認
        for notification in notifications:
            self.assertIn(
                "タスク『割り当てタスク』があなたに割り当てられました",
                notification.message,
            )

    def test_task_creation_notification_with_no_assigned_users(self):
        """担当者なしでタスクを作成した場合、プロジェクトメンバーに通知が送られること"""
        self.client.force_authenticate(user=self.user1)

        task_data = {
            "name": "担当者なしタスク",
            "description": "タスク説明",
            "deadline": "2024-12-31T23:59:59Z",
            "status": "todo",
        }

        response = self.client.post(self.tasks_url, task_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # 通知を確認
        notifications = Notification.objects.filter(
            notification_type="task", title="タスク通知"
        )
        self.assertEqual(notifications.count(), 2)  # user2とuser3に通知

        # user2とuser3に通知が送られたことを確認
        notified_users = [n.recipient for n in notifications]
        self.assertIn(self.user2, notified_users)
        self.assertIn(self.user3, notified_users)

    def test_task_comment_notification_only_to_assigned_users(self):
        """タスクコメントが担当者にのみ送られること"""
        # タスクを作成し、user2のみを担当者として割り当て
        task = Task.objects.create(
            name="担当者限定タスク",
            project=self.project,
            deadline=timezone.now() + timedelta(days=7),
        )
        task.assigned_users.add(self.user2)

        # API URL
        comments_url = (
            f"/api/projects/{self.project.project_id}/tasks/{task.task_id}/comments/"
        )

        # user1がコメント投稿
        self.client.force_authenticate(user=self.user1)
        comment_data = {"content": "担当者向けコメント"}
        response = self.client.post(comments_url, comment_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # 通知を確認 - user2にのみ通知が送られるはず
        notifications = Notification.objects.filter(
            notification_type="task", title="新しいコメント"
        )
        self.assertEqual(notifications.count(), 1)  # user2のみ

        # user2に通知が送られたことを確認
        self.assertEqual(notifications.first().recipient, self.user2)

    def test_notification_content_uses_japanese_language(self):
        """通知メッセージが日本語で表示されること"""
        self.client.force_authenticate(user=self.user1)

        task_data = {
            "name": "日本語タスク名",
            "description": "タスク説明",
            "deadline": "2024-12-31T23:59:59Z",
            "status": "todo",
        }

        response = self.client.post(self.tasks_url, task_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # 日本語の通知メッセージを確認
        notification = Notification.objects.filter(
            recipient=self.user2, notification_type="task"
        ).first()

        self.assertIsNotNone(notification)
        self.assertEqual(notification.title, "タスク通知")
        self.assertIn(
            "新しいタスク『日本語タスク名』が追加されました", notification.message
        )

    def test_multiple_actions_create_separate_notifications(self):
        """複数のアクションが別々の通知として作成されること"""
        # タスクを作成
        self.client.force_authenticate(user=self.user1)
        task_data = {
            "name": "複数アクションタスク",
            "status": "todo",
            "deadline": "2024-12-31T23:59:59Z",
            "assigned_user_ids": [self.user2.id, self.user3.id],
        }
        response = self.client.post(self.tasks_url, task_data, format="json")
        # APIがtask_idを返すか確認し、なければタスクを取得
        try:
            task_id = response.data["task_id"]
        except KeyError:
            # APIがtask_idを返さない場合、作成されたタスクを取得
            task = Task.objects.filter(
                name="複数アクションタスク", project=self.project
            ).first()
            task_id = str(task.task_id) if task else None

        # タスクを更新
        task_url = f"/api/projects/{self.project.project_id}/tasks/{task_id}/"
        self.client.patch(task_url, {"status": "done"}, format="json")

        # コメントを投稿
        comments_url = (
            f"/api/projects/{self.project.project_id}/tasks/{task_id}/comments/"
        )
        self.client.post(comments_url, {"content": "テストコメント"}, format="json")

        # user2の通知を確認
        user2_notifications = Notification.objects.filter(recipient=self.user2)
        self.assertEqual(user2_notifications.count(), 3)  # 作成・完了・コメントの3通知

        # 各通知のタイトルを確認
        titles = [n.title for n in user2_notifications]
        self.assertIn("タスク通知", titles)  # 作成と完了で2回
        self.assertIn("新しいコメント", titles)  # コメントで1回
