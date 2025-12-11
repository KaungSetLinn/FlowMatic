# POST /projects

新しいprojectを作成する

## Request

### Request Body

```json
{
    "title": "string",
    "description": "string",
    "start_date": "2024-01-01T00:00:00Z",
    "progress": 0,
    "status": "planning | in_progress | completed",
    "members": ["uuid"],
    "deadline": "2024-01-01T23:59:59Z"
}
```

| Name | Type | Description |
| - | - | - |
| title | string | projectのタイトル |
| description | string | projectの説明 |
| start_date | string | 開始日時（ISO 8601） |
| progress | integer | 進捗（0〜100） |
| status | string | ステータス（計画中, 進行中, 完了） |
| members | array[int] | プロジェクトに紐づくメンバーのID一覧 |
| deadline | string | 締切日時（ISO 8601） |

## Response

### 201 Created

```json
{
    "project_id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Sample Project",
    "description": "This is a sample project",
    "start_date": "2024-01-01T00:00:00Z",
    "deadline": "2024-12-31T23:59:59Z",
    "progress": 25,
    "status": "in_progress",
    "members": [1, 2]
}
```

| Name | Type | Description |
| - | - | - |
| project_id | uuid | 作成されたprojectのID |
| | | 以下、Request bodyと同じ |

# GET /projects

プロジェクト一覧を取得する

## Request

### Query Parameters

| Name | Type | Description |
| - | - | - |
| p | int | 取得するページ番号（1始まり、デフォルト: 1） |
| per_page | int | 1ページあたりのプロジェクト数（デフォルト: 20） |

## Response

### 200 OK
```json
{
    "projects": [
        {
            "project_id": "550e8400-e29b-41d4-a716-446655440000",
            "title": "Sample Project",
            "description": "This is a sample project",
            "start_date": "2024-01-01T00:00:00Z",
            "deadline": "2024-12-31T23:59:59Z",
            "progress": 25,
            "status": "in_progress",
            "members": [
                {
                    "user_id": "550e8400-e29b-41d4-a716-446655440001",
                    "name": "John Doe",
                },
                {
                    "user_id": "550e8400-e29b-41d4-a716-446655440002",
                    "name": "Jane Smith",
                }
            ]
        }
    ],
    "page": 1,
    "per_page": 20,
}
```

| Name      | Type    | Description                       |
|-----------|---------|-----------------------------------|
| projects  | array   | プロジェクトの一覧                |
| page      | integer | 現在のページ番号                  |
| per_page  | integer | 1ページあたりの件数                |

# GET /projects/{project_id}

指定したprojectを取得する

## Request

### Path Parameters

| Name | Type | Description |
| - | - | - |
| project_id | uuid | 取得するprojectのID |

## Response

### 200 OK

```json
{
    "project_id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Sample Project",
    "description": "This is a sample project",
    "start_date": "2024-01-01T00:00:00Z",
    "deadline": "2024-12-31T23:59:59Z",
    "progress": 25,
    "status": "in_progress",
    "members": [
        {
            "user_id": "550e8400-e29b-41d4-a716-446655440001",
            "name": "John Doe",
        },
        {
            "user_id": "550e8400-e29b-41d4-a716-446655440002",
            "name": "Jane Smith",
        }
    ]
}
```

# PUT /projects/{project_id}

指定したprojectを更新する（全体更新）

## Request

### Path Parameters

| Name | Type | Description |
| - | - | - |
| project_id | uuid | 更新するprojectのID |

### Request Body

（更新可能なフィールドのみを送る）

```json
{
    // 以下、POST /projects の201レスポンスと同じ
}
```

## Response

### 200 OK

```json
{
    "project_id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Updated Project",
    "description": "This is an updated project",
    "start_date": "2024-01-01T00:00:00Z",
    "deadline": "2024-12-31T23:59:59Z",
    "progress": 50,
    "status": "completed",
    "members": [1, 2, 3]
}
```

# DELETE /projects/{project_id}

指定したprojectを削除する

## Request

### Path Parameters

| Name | Type | Description |
| - | - | - |
| project_id | uuid | 削除するprojectのID |

## Response

### 204 No Content

# PATCH /projects/{project_id}

指定したprojectを部分更新する

## Request

### Path Parameters

| Name | Type | Description |
| - | - | - |
| project_id | uuid | 更新するprojectのID |

### Request Body

（更新可能なフィールドのみを送る）

```json
{
    "title": "Updated Title",
    "progress": 75,
    "status": "in_progress"
}
```

## Response

### 200 OK

```json
{
    "project_id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Updated Title",
    "description": "This is a sample project",
    "start_date": "2024-01-01T00:00:00Z",
    "deadline": "2024-12-31T23:59:59Z",
    "progress": 75,
    "status": "in_progress",
    "members": [
        {
            "user_id": "550e8400-e29b-41d4-a716-446655440001",
            "name": "John Doe",
        },
        {
            "user_id": "550e8400-e29b-41d4-a716-446655440002",
            "name": "Jane Smith",
        }
    ]
}
```
