# POST projects/{project_id}/tasks

新しいtaskを作成する

## Request

### Path Parameters

| Name | Type | Description |
| - | - | - |
| project_id | uuid | 作成するtaskの所属するprojectのID |

### Request Body

```json
{
    "name": "string",
    "description": "string",
    "deadline": "2024-01-01T00:00:00Z",
    "priority": "low | medium | high",
    "status": "todo | pending | in_progress | in_review | testing | done",
    "assigned_user_ids": ["uuid1"],
    "parent_tasks": [
        {
            "task_id": "existing_task_id_1",
            "relation_type": "FtS | FtF | StS | StF"
        }
    ]
}
```

| Name | Type | Description |
| - | - | - |
| name | string | taskの名前 |
| description | string | taskの説明 |
| priority | string | taskの優先度（low, medium, high） |
| status | string | taskのステータス（todo, in_progress, done） |
| deadline | string | taskの期限 |
| assigned_user_ids | uuid array | taskに割り当てられたユーザーのID |
| parent_tasks | array of objects | 親タスクのリスト |
| parent_tasks.task_id | uuid | 親タスクのID |
| parent_tasks.relation_type | string | 依存関係のタイプ（FtS, FtF, StS, StF） |

## Response

### 201 Created

```json
{
    "task_id": "newly_created_task_id",
    // 以下、Request bodyと同じ
}
```

| Name | Type | Description |
| - | - | - |
| task_id | uuid | 作成されたtaskのID |
| | | 以下、Request bodyと同じ |

# POST projects/{project_id}/tasks/{task_id}/comments

新しいコメントをtaskに追加する

## Request

### Path Parameters

| Name | Type | Description |
| - | - | - |
| project_id | uuid | コメントを追加するtaskの所属するprojectのID |
| task_id | uuid | コメントを追加するtaskのID |

### Request Body

```json
{
    "user_id": "uuid",
    "content": "string"
}
```

| Name | Type | Description |
| - | - | - |
| user_id | uuid | コメントを追加するユーザーのID |
| content | string | コメントの内容 |

## Response

### 201 Created

```json
{
    "task_id": "uuid",
    "comment_id": "newly_created_comment_id",
    // 以下、Request bodyと同じ
}
```

| Name | Type | Description |
| - | - | - |
| task_id | uuid | コメントが追加されたtaskのID |
| comment_id | uuid | 作成されたコメントのID |
| | | 以下、Request bodyと同じ |

## GET /projects/{project_id}/tasks

指定したprojectのtask一覧を取得する

## Request

### Path Parameters

| Name | Type | Description |
| - | - | - |
| project_id | uuid | 取得するtaskの所属するprojectのID |

## Response

### 200 OK

```json
{
    "tasks": [
        {
            // 以下、POST /projects/{project_id}/tasks の201レスポンスと同じ
        }
    ]
}
```

| Name | Type | Description |
| - | - | - |
| tasks | array of objects | taskのリスト |
| tasks.comments | array of objects | taskに関連するコメントのリスト |
| tasks.comments.* | object | 以下、POST /projects/{project_id}/tasks/{task_id}/comments の201レスポンスと同じ |
| tasks.* | object | 以下、POST /projects/{project_id}/tasks の201レスポンスと同じ |

## GET /tasks/{task_id}/comments

指定したtaskのコメント一覧を取得する

## Request

### Path Parameters

| Name | Type | Description |
| - | - | - |
| task_id | uuid | 取得するコメントの所属するtaskのID |

## Response

### 200 OK

```json
{
    "comments": [
        {
            // 以下、POST /projects/{project_id}/tasks/{task_id}/comments の201レスポンスと同じ
        }
    ]
}
```

| Name | Type | Description |
| - | - | - |
| comments | array of objects | コメントのリスト |
| comments.* | object | 以下、POST /projects/{project_id}/tasks/{task_id}/comments の201レスポンスと同じ |
