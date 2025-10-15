# 已发布新闻列表接口测试示例

## 接口地址
`GET /api/published-news`

## 测试用例

### 1. 获取所有已发布新闻（默认分页）
```bash
curl "http://localhost:3001/api/published-news"
```

### 2. 分页查询
```bash
# 第1页，每页5条
curl "http://localhost:3001/api/published-news?page=1&limit=5"

# 第2页，每页10条
curl "http://localhost:3001/api/published-news?page=2&limit=10"
```

### 3. 搜索功能
```bash
# 搜索标题包含"测试"的新闻
curl "http://localhost:3001/api/published-news?search=测试"

# 搜索摘要包含"F1"的新闻
curl "http://localhost:3001/api/published-news?search=F1"

# 组合查询：第1页，每页3条，搜索"新闻"
curl "http://localhost:3001/api/published-news?page=1&limit=3&search=新闻"
```

## 返回数据格式

```json
{
  "data": [
    {
      "id": 1,
      "slug": "test-news-slug",
      "cover_url": "https://example.com/image.jpg",
      "published_at": "2025-10-12T10:00:00.000Z",
      "news_source": "Test Source",
      "news_source_link": "https://example.com",
      "title": "测试新闻标题",
      "summary": "测试新闻摘要",
      "content": "## 测试内容\n这是测试新闻的内容。",
      "tags": ["Analysis", "Test"],
      "created_at": "2025-10-12 10:38:32",
      "updated_at": "2025-10-12 10:38:32"
    }
  ],
  "pagination": {
    "current": 1,
    "pageSize": 10,
    "total": 2,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPrevPage": false
  },
  "search": ""
}
```

## 功能特点

1. **分页支持**: 支持自定义页码和每页数量
2. **搜索功能**: 支持在标题和摘要中搜索关键词
3. **排序**: 按创建时间倒序排列（最新的在前）
4. **标签处理**: 自动将JSON字符串转换为数组
5. **完整信息**: 返回所有已发布新闻的详细信息

## 使用场景

- 新闻管理系统中的已发布新闻列表
- 前端分页展示
- 新闻搜索功能
- 已发布内容的统计和管理
