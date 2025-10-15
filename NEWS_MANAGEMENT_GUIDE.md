# F1新闻管理系统使用指南

## 功能概述

本系统实现了从F1 Cosmos API获取新闻数据，并在前端以表格形式展示，支持新闻状态管理（采用/未采用）和图片预览功能。

## 服务器端API接口

### 1. 获取新闻列表
- **接口**: `GET /api/news`
- **参数**: 
  - `page`: 页码（默认1）
  - `limit`: 每页数量（默认35）
- **返回**: 包含新闻数据和分页信息的JSON
  - `total`: 总记录数（totalPage × limit）
  - `currentPage`: 当前页码
  - `totalPage`: 总页数
  - `hasNextPage`: 是否有下一页
  - `data`: 新闻数据数组

### 2. 更新新闻状态
- **接口**: `PUT /api/news/:id/status`
- **参数**: 
  - `status`: 状态（adopted/rejected）
  - `title`: 新闻标题
  - `published_at`: 发布时间
  - `cover_url`: 封面图片URL
  - `news_source_name`: 新闻来源名称
- **返回**: 更新成功消息

### 3. 获取新闻详情
- **接口**: `GET /api/news/:slug`
- **参数**: 
  - `slug`: 新闻的唯一标识符
- **返回**: 新闻的详细内容，包括markdown格式的content字段

### 4. 发布新闻
- **接口**: `POST /api/news/publish`
- **参数**: 
  - `slug`: 新闻唯一标识符
  - `title`: 新闻标题
  - `summary`: 新闻摘要
  - `content`: 新闻内容（markdown格式）
  - `cover_url`: 封面图片URL
  - `published_at`: 发布时间
  - `news_source`: 新闻来源
  - `news_source_link`: 新闻链接
  - `tags`: 标签数组
- **返回**: 发布成功消息
- **功能**: 发布成功后自动将新闻标记为已采用状态

### 6. 获取已发布新闻列表
- **接口**: `GET /api/published-news`
- **参数**: 
  - `page`: 页码（默认1）
  - `limit`: 每页数量（默认10）
  - `search`: 搜索关键词（可选，搜索标题和摘要）
- **返回**: 已发布新闻列表，包含分页信息和搜索结果
  - `data`: 新闻数据数组
  - `pagination`: 分页信息（current, pageSize, total, totalPages, hasNextPage, hasPrevPage）
  - `search`: 搜索关键词

### 7. 获取新闻状态统计
- **接口**: `GET /api/news/stats`
- **返回**: 采用和未采用新闻的数量统计

## 前端功能

### 表格展示
- **标题**: 显示新闻标题，支持省略号显示
- **发布时间**: 格式化为中文本地时间
- **封面图片**: 80x60像素缩略图，点击可全屏预览
- **新闻来源**: 以蓝色标签显示
- **状态**: 绿色标签（已采用）/红色标签（未采用）
- **操作**: 查看按钮（点击打开新闻详情抽屉）

### 新闻详情抽屉
- **查看模式**: 显示新闻的完整内容，包括标题、摘要、封面图片、markdown内容、状态信息
- **编辑模式**: 可编辑所有字段，支持markdown编辑器
- **发布功能**: 编辑完成后可发布到数据库，发布成功后自动标记为已采用
- **状态控制**: 已采用的新闻编辑按钮被禁用，防止重复编辑
- **自动状态更新**: 发布成功后界面自动更新状态，编辑按钮变为禁用状态
- **markdown支持**: 使用react-markdown和@uiw/react-md-editor处理markdown格式

### 分页功能
- 支持每页10/20/35/50/100条记录
- 快速跳转页码
- 显示总记录数、当前范围和页码信息
- 正确处理F1 Cosmos API的分页结构（totalPage字段）
- 自动计算总记录数（totalPage × pageSize）

### 图片预览
- 点击封面图片可全屏预览
- 支持缩放和拖拽
- 无图片时显示占位符

## 数据库表结构

### news_status表
```sql
CREATE TABLE news_status (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    news_id TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    published_at TEXT NOT NULL,
    cover_url TEXT,
    news_source_name TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('adopted', 'rejected')) DEFAULT 'rejected',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### published_news表
```sql
CREATE TABLE published_news (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT NOT NULL UNIQUE,
    cover_url TEXT,
    published_at TEXT NOT NULL,
    news_source TEXT NOT NULL,
    news_source_link TEXT,
    title TEXT NOT NULL,
    summary TEXT NOT NULL,
    content TEXT NOT NULL,
    tags TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## 使用步骤

1. 启动服务器：`cd server && npm start`
2. 启动前端：`cd client && npm start`
3. 访问ContentFarm页面
4. 点击"刷新数据"获取最新新闻
5. 浏览新闻列表，点击图片预览
6. 点击"查看"按钮打开新闻详情抽屉
7. 在抽屉中查看完整内容，已采用新闻不可编辑
8. 未采用新闻可点击"编辑"按钮进行编辑和发布

## 技术栈

- **后端**: Node.js + Express + SQLite3 + Axios
- **前端**: React + Ant Design + Styled Components
- **外部API**: F1 Cosmos News API

## 注意事项

- 新闻数据来源于F1 Cosmos API，需要网络连接
- 状态管理数据存储在本地SQLite数据库中
- 图片预览功能依赖Ant Design的Image组件
- 支持中文文件名和内容的正确处理
