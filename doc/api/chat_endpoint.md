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
    "members": ["uuid1", "uuid2"]
}
```

| Name | Type | Description |
| - | - | - |
| members | uuid array | チャットルーム参加ユーザーID |

## Response

### 201 Created

```json
{
    "chatroom_id": "newly_created_chatroom_id",
    "project_id": "project_id",
    "members": ["uuid1", "uuid2"]
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

## Response

### 200 OK

```json
{
    "chatrooms": [
        {
            // 以下、POST /projects/{project_id}/chatrooms の201レスポンスと同じ
        }
    ]
}
```

| Name | Type | Description |
| - | - | - |
| chatrooms | array of objects | チャットルームの一覧 |
| chatrooms.* | object | 以下、POST /projects/{project_id}/chatrooms の201レスポンスと同じ |

# POST /chatrooms/{chatroom_id}/messages

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
    "message_id": "newly_created_message_id",
    "chatroom_id": "chatroom_id",
    "user_id": "uuid",
    "content": "string",
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

# GET /chatrooms/{chatroom_id}/messages?p={page}&per_page={per_page}

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
            // 以下、POST /chatrooms/{chatroom_id}/messages の201レスポンスと同じ
        }
    ],
    "page": 0,
    "per_page": 0
}
```

| Name | Type | Description |
| - | - | - |
| messages | array of objects | メッセージの一覧 |
| messages.* | object | 以下、POST /chatrooms/{chatroom_id}/messages の201レスポンスと同じ |

# DELETE /chatrooms/{chatroom_id}

指定したチャットルームを削除する

## Request

### Path Parameters

| Name | Type | Description |
| - | - | - |
| chatroom_id | uuid | 削除するチャットルームID |

## Response

### 204 No Content

<!-- TODO: 画像取り扱い/メンション -->