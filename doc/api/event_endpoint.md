# POST projects/{project_id}/events

新しいeventを作成する

## Request

### Path Parameters

| Name | Type | Description |
| - | - | - |
| project_id | uuid | eventを作成するprojectのID |

### Request Body

```json
{
    "title": "string",
    "is_all_day": false,
    "start_date": "2024-01-01T09:00:00Z",
    "end_date": "2024-01-01T10:00:00Z",
    "color": "red | blue | green | orange"
}
```

| Name | Type | Description |
| - | - | - |
| title | string | eventのタイトル |
| is_all_day | boolean | 終日イベントかどうか |
| start_date | string | eventの開始日時 |
| end_date | string | eventの終了日時 |
| color | string | eventの色（red, blue, green, orange） |

## Response

### 201 Created

```json
{
    "event_id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Sample Event",
    "is_all_day": false,
    "start_date": "2024-01-01T09:00:00Z",
    "end_date": "2024-01-01T10:00:00Z",
    "color": "blue"
}
```

| Name | Type | Description |
| - | - | - |
| event_id | uuid | 作成されたeventのID |
| | | 以下、Request bodyと同じ |

# GET /projects/{project_id}/events

指定したプロジェクトのevent一覧を取得する

## Request

### Path Parameters

| Name | Type | Description |
| - | - | - |
| project_id | uuid | プロジェクトID |

### Query Parameters

| Name | Type | Description |
| - | - | - |
| p | int | 取得するページ番号（1始まり、デフォルト: 1） |
| per_page | int | 1ページあたりのイベント数（デフォルト: 20） |

## Response

### 200 OK

```json
{
    "events": [
        {
            "event_id": "550e8400-e29b-41d4-a716-446655440000",
            "title": "Sample Event",
            "is_all_day": false,
            "start_date": "2024-01-01T09:00:00Z",
            "end_date": "2024-01-01T10:00:00Z",
            "color": "blue"
        }
    ],
    "page": 1,
    "per_page": 20
}
```

| Name | Type | Description |
| - | - | - |
| events | array of objects | eventの一覧 |
| events.* | object | 以下、POST /projects/{project_id}/events の201レスポンスと同じ |



# DELETE /projects/{project_id}/events/{event_id}

指定されたeventを削除する

## Request

### Path Parameters

| Name | Type | Description |
| - | - | - |
| project_id | uuid | eventの所属するprojectのID |
| event_id | uuid | 削除するeventのID |

## Response

### 204 No Content