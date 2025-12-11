# POST /projects/{project_id}/chatrooms

新しいチャットルームを作成する

## Request

### Path Parameters

| Name | Type | Description |
| - | - | - |
| project_id | uuid | チャットルームを作成するプロジェクトのID |

### Request Body

```json
{
    "members": [1, 2]
}
```

| Name | Type | Description |
| - | - | - |
| members | uuid array | チャットルーム参加ユーザーID |

## Response

### 201 Created

```json
{
    "chatroom_id": "550e8400-e29b-41d4-a716-446655440000",
    "project_id": "550e8400-e29b-41d4-a716-446655440001",
    "members": [1, 2]
}
```

| Name | Type | Description |
| - | - | - |
| chatroom_id | uuid | 作成されたチャットルームID |
| project_id | uuid | プロジェクトID |
| members | uuid array | チャットルーム参加ユーザーID |

# GET /projects/{project_id}/chatrooms

指定したプロジェクトのチャットルーム一覧を取得する

## Request

### Path Parameters

| Name | Type | Description |
| - | - | - |
| project_id | uuid | プロジェクトID |

### Query Parameters

| Name | Type | Description |
| - | - | - |
| p | int | 取得するページ番号（1始まり、デフォルト: 1） |
| per_page | int | 1ページあたりのチャットルーム数（デフォルト: 20） |

## Response

### 200 OK

```json
{
    "chatrooms": [
        {
            "chatroom_id": "550e8400-e29b-41d4-a716-446655440000",
            "project_id": "550e8400-e29b-41d4-a716-446655440001",
            "members": [1, 2]
        }
    ],
    "page": 1,
    "per_page": 20
}
```

| Name | Type | Description |
| - | - | - |
| chatrooms | array of objects | チャットルームの一覧 |
| chatrooms.* | object | 以下、POST /projects/{project_id}/chatrooms の201レスポンスと同じ |

# POST /projects/{project_id}/chatrooms/{chatroom_id}/messages

チャットルームにメッセージを投稿する

## Request

### Path Parameters

| Name | Type | Description |
| - | - | - |
| chatroom_id | uuid | メッセージを投稿するチャットルームID |

### Request Body

```json
{
    "user_id": "uuid",
    "content": "string"
}
```

| Name | Type | Description |
| - | - | - |
| user_id | uuid | 投稿ユーザーID |
| content | string | メッセージ内容 |

## Response

### 201 Created

```json
{
    "message_id": "550e8400-e29b-41d4-a716-446655440000",
    "chatroom_id": "550e8400-e29b-41d4-a716-446655440001",
    "user_id": "550e8400-e29b-41d4-a716-446655440002",
    "content": "Hello, this is a message!",
    "timestamp": "2024-01-01T12:00:00Z"
}
```

| Name | Type | Description |
| - | - | - |
| message_id | uuid | 作成されたメッセージID |
| chatroom_id | uuid | チャットルームID |
| user_id | uuid | 投稿ユーザーID |
| content | string | メッセージ内容 |
| timestamp | string | 投稿日時（ISO 8601） |

# GET /projects/{project_id}/chatrooms/{chatroom_id}/messages/?page={page}&per_page={per_page}

チャットルームのメッセージ一覧を取得する

## Request

### Query Parameters

| Name       | Type | Description               |
|------------|------|---------------------------|
| page       | int  | 取得するページ番号（1始まり） |
| per_page   | int  | 1ページあたりのメッセージ数   |

### Path Parameters

| Name | Type | Description |
| - | - | - |
| chatroom_id | uuid | メッセージを取得するチャットルームID |

## Response

### 200 OK

```json
{
    "messages": [
        {
            "message_id": "550e8400-e29b-41d4-a716-446655440000",
            "chatroom_id": "550e8400-e29b-41d4-a716-446655440001",
            "user_id": "550e8400-e29b-41d4-a716-446655440002",
            "content": "Hello, this is a message!",
            "timestamp": "2024-01-01T12:00:00Z"
        }
    ],
    "page": 1,
    "per_page": 20
}
```

| Name | Type | Description |
| - | - | - |
| messages | array of objects | メッセージの一覧 |
| messages.* | object | 以下、POST /projects/{project_id}/chatrooms/{chatroom_id}/messages の201レスポンスと同じ |

# DELETE /projects/{project_id}/chatrooms/{chatroom_id}

指定したチャットルームを削除する

## Request

### Path Parameters

| Name | Type | Description |
| - | - | - |
| chatroom_id | uuid | 削除するチャットルームID |

## Response

### 204 No Content

<!-- TODO: 画像取り扱い/メンション -->� -->