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
    "event_id": "newly_created_event_id",
    // 以下、Request bodyと同じ
}
```

| Name | Type | Description |
| - | - | - |
| event_id | uuid | 作成されたeventのID |
| | | 以下、Request bodyと同じ |

# DELETE projects/{project_id}/events/{event_id}

指定されたeventを削除する

## Request

### Path Parameters

| Name | Type | Description |
| - | - | - |
| project_id | uuid | eventの所属するprojectのID |
| event_id | uuid | 削除するeventのID |

## Response

### 204 No Content