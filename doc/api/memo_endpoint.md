# POST /projects/{project_id}/memos

新しいプロジェクトメモ（付箋）を作成する

## Request

### Path Parameters

| Name | Type | Description |
| - | - | - |
| project_id | uuid | メモを作成するprojectのID |

### Request Body

```json
{
    "user_id": 9,
    "content": "string",
    "color": "yellow | blue | green",
    "is_pinned": false
}
```

| Name | Type | Description |
| - | - | - |
| user_id | int | メモを作成するユーザーのID |
| content | string | メモの内容 |
| color | string | メモの色（yellow, blue, green） |
| is_pinned | boolean | ピン留めするかどうか |

## Response

### 201 Created

```json
{
    "memo_id": "newly_created_memo_id",
    "project_id": "uuid",
    "content": "string",
    "color": "yellow",
    "is_pinned": false,
    "user": {
        "user_id": 9,
        "name": "電子太郎",
        "email": "denshi_taro@gmail.com",
        "profile_picture": "/media/profile_pics/anime_boy_profile.jpg"
    },
    "created_at": "2024-01-01T00:00:00Z"
}
```

| Name | Type | Description |
| - | - | - |
| memo_id | uuid | 作成されたメモのID |
| project_id | uuid | メモが属するprojectのID |
| content | string | メモの内容 |
| color | string | メモの色 |
| is_pinned | boolean | ピン留め状態 |
| user | object | 作成者情報 |
| user.user_id | int | ユーザーID |
| user.name | string | ユーザー名 |
| user.email | string | メールアドレス |
| user.profile_picture | string | プロフィール画像のパス |
| created_at | string | 作成日時（ISO8601） |

# GET /projects/{project_id}/memos

指定したprojectのメモ一覧を取得する

## Request

### Path Parameters

| Name | Type | Description |
| - | - | - |
| project_id | uuid | 取得するメモの所属するprojectのID |

## Response

### 200 OK

```json
{
    "memos": [
        {
            "memo_id": "uuid",
            "project_id": "uuid",
            "content": "string",
            "color": "yellow",
            "is_pinned": true,
            "user": {
                "user_id": 9,
                "name": "電子太郎",
                "email": "denshi_taro@gmail.com",
                "profile_picture": "/media/profile_pics/anime_boy_profile.jpg"
            },
            "created_at": "2024-01-01T00:00:00Z"
        }
    ]
}
```

| Name | Type | Description |
| - | - | - |
| memos | array of objects | メモのリスト |
| memos.* | object | POST /projects/{project_id}/memos の201レスポンスと同じ |

# PATCH /projects/{project_id}/memos/{memo_id}

指定したメモを更新する（内容・色・ピン留め）

## Request

### Path Parameters

| Name | Type | Description |
| - | - | - |
| project_id | uuid | メモが所属するprojectのID |
| memo_id | uuid | 更新するメモのID |

### Request Body

```json
{
    "user_id": 9,
    "content": "string",
    "color": "yellow | blue | green",
    "is_pinned": true
}
```

| Name | Type | Description |
| - | - | - |
| user_id | int | 更新を実行するユーザーのID |
| content | string | メモの内容 |
| color | string | メモの色 |
| is_pinned | boolean | ピン留め状態 |

## Response

### 200 OK

```json
{
    "memo_id": "uuid",
    "project_id": "uuid",
    "content": "string",
    "color": "blue",
    "is_pinned": true,
    "user": {
        "user_id": 9,
        "name": "電子太郎",
        "email": "denshi_taro@gmail.com",
        "profile_picture": "/media/profile_pics/anime_boy_profile.jpg"
    },
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-02T10:30:00Z"
}
```

| Name | Type | Description |
| - | - | - |
| memo_id | uuid | メモのID |
| project_id | uuid | メモが属するprojectのID |
| content | string | メモの内容 |
| color | string | メモの色 |
| is_pinned | boolean | ピン留め状態 |
| user | object | 作成者情報 |
| user.user_id | int | ユーザーID |
| user.name | string | ユーザー名 |
| user.email | string | メールアドレス |
| user.profile_picture | string | プロフィール画像のパス |
| created_at | string | 作成日時（ISO8601） |
| updated_at | string | 更新日時（ISO8601） |

# DELETE /projects/{project_id}/memos/{memo_id}

指定したメモを削除する

## Request

### Path Parameters

| Name | Type | Description |
| - | - | - |
| project_id | uuid | メモが所属するprojectのID |
| memo_id | uuid | 削除するメモのID |

## Response

### 204 No Content

レスポンスボディなし