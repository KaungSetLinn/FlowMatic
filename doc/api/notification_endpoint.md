# GET /notifications/

認証済みユーザーの通知一覧を取得する

## Response

### 200 OK

```json
[
    {
        "id": "uuid",
        "title": "string",
        "message": "string",
        "notification_type": "task | project | chat | event | system",
        "created_at": "2024-01-01T00:00:00Z"
    }
]
```

| Name | Type | Description |
| - | - | - |
| id | uuid | 通知ID |
| title | string | 通知のタイトル |
| message | string | 通知のメッセージ内容 |
| notification_type | string | 通知タイプ（task, project, chat, event, system） |
| created_at | string | 作成日時（ISO 8601） |
