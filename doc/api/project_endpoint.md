# POST /projects

新しいprojectを作成する

## Request

### Request Body

```json
{
    "title": "string",
    "description": "string",
    "start_date": "2024-01-01T00:00:00Z",
    "end_date": "2024-01-01T23:59:59Z",
    "progress": 0,
    "status": "planning | in_progress | completed",
    "members": ["uuid"]
}
```

| Name | Type | Description |
| - | - | - |
| title | string | projectのタイトル |
| description | string | projectの説明 |
| start_date | string | 開始日時（ISO 8601） |
| end_date | string | 終了日時（ISO 8601） |
| progress | integer | 進捗（0〜100） |
| status | string | ステータス（計画中, 進行中, 完了） |
| members | array[uuid] | プロジェクトに紐づくメンバーのID一覧 |

## Response

### 201 Created

```json
{
    "project_id": "newly_created_project_id",
    // 以下、Request bodyと同じ
}
```

| Name | Type | Description |
| - | - | - |
| project_id | uuid | 作成されたprojectのID |
| | | 以下、Request bodyと同じ |

# GET /projects

プロジェクト一覧を取得する

## Response

### 200 OK
```json
{
    "projects": [
        {
            // 以下、POST /projects の201レスポンスと同じ
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
    // 以下、POST /projects の201レスポンスと同じ
}
```

# PUT /projects/{project_id}

指定したprojectを更新する（全体更新または部分更新を許可する場合はPATCHも検討）

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
    // 以下、POST /projects の201レスポンスと同じ
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
