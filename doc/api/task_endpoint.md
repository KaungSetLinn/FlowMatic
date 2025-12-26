# POST /api/projects/{project_id}/tasks/

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
    "start_date": "2024-01-01T00:00:00Z",
    "deadline": "2024-01-15T00:00:00Z",
    "priority": "low | medium | high",
    "status": "todo | pending | in_progress | in_review | testing | done",
    "assigned_user_ids": [1],
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
| start_date | string | taskの開始日 |
| priority | string | taskの優先度(low, medium, high) |
| status | string | taskのステータス(todo, in_progress, done) |
| deadline | string | taskの期限 |
| assigned_user_ids | int array | taskに割り当てられたユーザーのID |
| parent_tasks | array of objects | 親タスクのリスト |
| parent_tasks.task_id | uuid | 親タスクのID |
| parent_tasks.relation_type | string | 依存関係のタイプ(FtS, FtF, StS, StF) |

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

# POST /api/projects/{project_id}/tasks/{task_id}/comments/

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
    "user_id": 1,
    "content": "string"
}
```

| Name | Type | Description |
| - | - | - |
| user_id | int | コメントを追加するユーザーのID |
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

# GET /api/projects/{project_id}/tasks/

指定したprojectのtask一覧を取得する

## Request

### Path Parameters

| Name | Type | Description |
| - | - | - |
| project_id | uuid | 取得するtaskの所属するprojectのID |

### Query Parameters

| Name | Type | Description |
| - | - | - |
| p | int | 取得するページ番号（1始まり、デフォルト: 1） |
| per_page | int | 1ページあたりのタスク数（デフォルト: 20） |

## Response

### 200 OK

```json
{
    "tasks": [
        {
            "task_id": "550e8400-e29b-41d4-a716-446655440000",
            "project_id": "550e8400-e29b-41d4-a716-446655440001",
            "name": "Sample Task",
            "description": "This is a sample task",
            "start_date": "2024-01-01T00:00:00Z",
            "deadline": "2024-01-15T00:00:00Z",
            "priority": "medium",
            "status": "in_progress",
            "users": [
                {
                    "user_id": 1,
                    "name": "John Doe"
                }
            ],
            "parent_tasks": [
                {
                    "task_id": "550e8400-e29b-41d4-a716-446655440002",
                    "relation_type": "FtS"
                }
            ],
            "comments": [
                {
                    "comment_id": "550e8400-e29b-41d4-a716-446655440003",
                    "task_id": "550e8400-e29b-41d4-a716-446655440000",
                    "user_id": 1,
                    "name": "John Doe",
                    "content": "This is a comment",
                    "created_at": "2024-01-01T12:00:00Z"
                }
            ]
        }
    ],
    "page": 1,
    "per_page": 20
}
```

| Name | Type | Description |
| - | - | - |
| tasks | array of objects | taskのリスト |
| tasks.comments | array of objects | taskに関連するコメントのリスト |
| tasks.comments.* | object | 以下、POST /api/projects/{project_id}/tasks/{task_id}/comments/ の201レスポンスと同じ |
| tasks.* | object | 以下、POST /api/projects/{project_id}/tasks/ の201レスポンスと同じ |

# GET /api/projects/{project_id}/tasks/{task_id}/

指定したtaskを取得する

## Request

### Path Parameters

| Name | Type | Description |
| - | - | - |
| project_id | uuid | 取得するtaskの所属するprojectのID |
| task_id | uuid | 取得するtaskのID |

## Response

### 200 OK

```json
{
    // 以下、users 以外 POST /api/projects/{project_id}/tasks/ の201レスポンスと同じ
    "users": {
        "user_id": "int",
        "name": "string",
    }
}
```

# PUT /api/projects/{project_id}/tasks/{task_id}/

指定したtaskを更新する

## Request

### Path Parameters

| Name | Type | Description |
| - | - | - |
| project_id | uuid | 更新するtaskの所属するprojectのID |
| task_id | uuid | 更新するtaskのID |

### Request Body

```json
{
    "name": "string",
    "description": "string",
    "start_date": "2024-01-01T00:00:00Z",
    "deadline": "2024-01-15T00:00:00Z",
    "priority": "low | medium | high",
    "status": "todo | pending | in_progress | in_review | testing | done",
    "assigned_user_ids": [1]
}
```

## Response

### 200 OK

```json
{
    // 以下、users 以外 POST /api/projects/{project_id}/tasks/ の201レスポンスと同じ
    "users": {
        "user_id": "int",
        "name": "string",
    }
}
```

# DELETE /api/projects/{project_id}/tasks/{task_id}/

指定したtaskを削除する

## Request

### Path Parameters

| Name | Type | Description |
| - | - | - |
| project_id | uuid | 削除するtaskの所属するprojectのID |
| task_id | uuid | 削除するtaskのID |

## Response

### 204 No Content

# GET /api/tasks/{task_id}/comments/

指定したtaskのコメント一覧を取得する

## Request

### Path Parameters

| Name | Type | Description |
| - | - | - |
| task_id | uuid | 取得するコメントの所属するtaskのID |

### Query Parameters

| Name | Type | Description |
| - | - | - |
| p | int | 取得するページ番号（1始まり、デフォルト: 1） |
| per_page | int | 1ページあたりのコメント数（デフォルト: 20） |

## Response

### 200 OK

```json
{
    "comments": [
        {
            "comment_id": "550e8400-e29b-41d4-a716-446655440000",
            "user_id": 1,
            "content": "This is a comment",
            "created_at": "2024-01-01T12:00:00Z",
            "user": {
                "user_id": 1,
                "name": "John Doe",
            }
        }
    ],
    "page": 1,
    "per_page": 20
}
```

| Name | Type | Description |
| - | - | - |
| comments | array of objects | コメントのリスト |
| comments.* | object | 以下、POST /projects/{project_id}/tasks/{task_id}/comments の201レスポンスと同じ |

# GET /tasks/{task_id}

指定したtaskを取得する

## Request

### Path Parameters

| Name | Type | Description |
| - | - | - |
| task_id | uuid | 取得するtaskのID |

## Response

### 200 OK

```json
{
    "task_id": "550e8400-e29b-41d4-a716-446655440000",
    "project_id": "550e8400-e29b-41d4-a716-446655440001",
    "name": "Sample Task",
    "description": "This is a sample task",
    "start_date": "2024-01-01T00:00:00Z",
    "deadline": "2024-01-15T00:00:00Z",
    "priority": "medium",
    "status": "in_progress",
    "users": [
        {
            "user_id": 1,
            "name": "John Doe"
        }
    ],
    "parent_tasks": [
        {
            "task_id": "550e8400-e29b-41d4-a716-446655440002",
            "relation_type": "FtS"
        }
    ],
    "comments": [
        {
            "comment_id": "550e8400-e29b-41d4-a716-446655440003",
            "task_id": "550e8400-e29b-41d4-a716-446655440000",
            "user_id": 1,
            "name": "John Doe",
            "content": "This is a comment",
            "created_at": "2024-01-01T12:00:00Z"
        }
    ]
}
```

# PUT /tasks/{task_id}

指定したtaskを更新する（全体更新）

## Request

### Path Parameters

| Name | Type | Description |
| - | - | - |
| task_id | uuid | 更新するtaskのID |

### Request Body

```json
{
    "name": "string",
    "description": "string",
    "start_date": "2024-01-01T00:00:00Z",
    "deadline": "2024-01-15T00:00:00Z",
    "priority": "low | medium | high",
    "status": "todo | pending | in_progress | in_review | testing | done",
    "assigned_user_ids": [1]
}
```

## Response

### 200 OK

```json
{
    "task_id": "550e8400-e29b-41d4-a716-446655440000",
    "project_id": "550e8400-e29b-41d4-a716-446655440001",
    "name": "Updated Task",
    "description": "This is an updated task",
    "start_date": "2024-01-01T00:00:00Z",
    "deadline": "2024-01-15T00:00:00Z",
    "priority": "high",
    "status": "done",
    "users": [
        {
            "user_id": 1,
            "name": "John Doe"
        }
    ],
    "parent_tasks": [],
    "comments": []
}
```

# PATCH /tasks/{task_id}

指定したtaskを部分更新する

## Request

### Path Parameters

| Name | Type | Description |
| - | - | - |
| task_id | uuid | 更新するtaskのID |

### Request Body

（更新可能なフィールドのみを送る）

```json
{
    "status": "done",
    "priority": "high"
}
```

## Response

### 200 OK

```json
{
    "task_id": "550e8400-e29b-41d4-a716-446655440000",
    "project_id": "550e8400-e29b-41d4-a716-446655440001",
    "name": "Sample Task",
    "description": "This is a sample task",
    "start_date": "2024-01-01T00:00:00Z",
    "deadline": "2024-01-15T00:00:00Z",
    "priority": "high",
    "status": "done",
    "users": [
        {
            "user_id": 1,
            "name": "John Doe"
        }
    ],
    "parent_tasks": [],
    "comments": []
}
```

# DELETE /tasks/{task_id}

指定したtaskを削除する

## Request

### Path Parameters

| Name | Type | Description |
| - | - | - |
| task_id | uuid | 削除するtaskのID |

## Response

### 204 No Content