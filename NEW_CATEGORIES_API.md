# 新增分类 API 文档

本文档描述了新增的 Deaths 和 Champion 分类的 API 接口。

## 数据库结构

### Deaths 表
```sql
CREATE TABLE deaths (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('driver', 'team')),
  name_en TEXT NOT NULL,
  name_cn TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Champion 表
```sql
CREATE TABLE champions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('driver', 'team')),
  name_en TEXT NOT NULL,
  name_cn TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## Deaths API

### 1. 添加 Deaths 记录
**POST** `/api/deaths`

**请求体：**
```json
{
  "date": "2024-01-15",
  "type": "driver",
  "name_en": "Ayrton Senna",
  "name_cn": "埃尔顿·塞纳",
  "entity_id": "senna_001"
}
```

**响应：**
```json
{
  "id": 1,
  "message": "Deaths 记录添加成功"
}
```

### 2. 获取 Deaths 记录列表
**GET** `/api/deaths`

**查询参数：**
- `year`: 年份过滤
- `month`: 月份过滤
- `date`: 日期过滤
- `type`: 类型过滤 (driver/team)
- `name`: 名称搜索（支持英文和中文）

**示例：**
```
GET /api/deaths?year=2024&type=driver
GET /api/deaths?month=01&date=15
GET /api/deaths?name=Senna
```

**响应：**
```json
[
  {
    "id": 1,
    "date": "2024-01-15",
    "type": "driver",
    "name_en": "Ayrton Senna",
    "name_cn": "埃尔顿·塞纳",
    "entity_id": "senna_001",
    "created_at": "2024-01-15T10:00:00.000Z"
  }
]
```

### 3. 获取单个 Deaths 记录
**GET** `/api/deaths/:id`

**响应：**
```json
{
  "id": 1,
  "date": "2024-01-15",
  "type": "driver",
  "name_en": "Ayrton Senna",
  "name_cn": "埃尔顿·塞纳",
  "entity_id": "senna_001",
  "created_at": "2024-01-15T10:00:00.000Z"
}
```

### 4. 更新 Deaths 记录
**PUT** `/api/deaths/:id`

**请求体：** 同添加接口

**响应：**
```json
{
  "message": "Deaths 记录更新成功"
}
```

### 5. 删除 Deaths 记录
**DELETE** `/api/deaths/:id`

**响应：**
```json
{
  "message": "Deaths 记录删除成功"
}
```

## Champion API

Champion API 的接口结构与 Deaths API 完全相同，只是路径前缀为 `/api/champions`。

### 1. 添加 Champion 记录
**POST** `/api/champions`

### 2. 获取 Champion 记录列表
**GET** `/api/champions`

### 3. 获取单个 Champion 记录
**GET** `/api/champions/:id`

### 4. 更新 Champion 记录
**PUT** `/api/champions/:id`

### 5. 删除 Champion 记录
**DELETE** `/api/champions/:id`

## 更新的 Posts API

现有的 Posts API 已经更新，现在返回的数据中包含 `deaths` 和 `champions` 字段：

### 获取帖子列表
**GET** `/api/posts`

**响应示例：**
```json
[
  {
    "id": 1,
    "summary": "示例帖子",
    "date": "2024-01-15",
    "created_at": "2024-01-15T10:00:00.000Z",
    "records_en": [...],
    "records_cn": [...],
    "deaths": [
      {
        "id": 1,
        "date": "2024-01-15",
        "type": "driver",
        "name_en": "Ayrton Senna",
        "name_cn": "埃尔顿·塞纳",
        "entity_id": "senna_001",
        "created_at": "2024-01-15T10:00:00.000Z"
      }
    ],
    "champions": [
      {
        "id": 1,
        "date": "2024-01-15",
        "type": "team",
        "name_en": "Mercedes",
        "name_cn": "梅赛德斯",
        "entity_id": "mercedes_001",
        "created_at": "2024-01-15T10:00:00.000Z"
      }
    ]
  }
]
```

### 获取单个帖子详情
**GET** `/api/posts/:id`

响应格式与帖子列表相同，包含完整的 deaths 和 champions 数据。

## 字段说明

- `date`: 日期，格式为 YYYY-MM-DD
- `type`: 类型，只能是 "driver"（车手）或 "team"（车队）
- `name_en`: 英文名称
- `name_cn`: 中文名称
- `entity_id`: 实体ID，用于唯一标识车手或车队

## 测试

运行测试脚本：
```bash
node test-new-categories.js
```

确保服务器正在运行：
```bash
cd server
npm start
```
