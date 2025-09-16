# F1历史上的今天管理系统

这是一个完整的F1历史上的今天管理系统，包含后端服务和前端管理页面。

## 功能特性

### 管理后台
- **帖子管理**：完整的CRUD操作
- **搜索功能**：支持按年份、月份、日期、车手、车队进行模糊查询
- **新增帖子**：包含简介（100字内）、日期、英文记录、中文记录
- **编辑功能**：复用新增组件，支持编辑和添加记录
- **详情查看**：点击简介可查看详细的记录信息

### 后端服务
- 基于Node.js + Express框架
- 使用SQLite数据库
- 完整的RESTful API接口
- 支持CORS跨域请求

## 技术栈

### 前端
- React 18
- Ant Design 5
- Styled Components
- Superagent (HTTP客户端)
- React Router 6
- Day.js (日期处理)

### 后端
- Node.js
- Express.js
- SQLite3
- CORS
- Body Parser

## 项目结构

```
F1History/
├── server/                 # 后端服务
│   ├── index.js           # 服务器主文件
│   ├── package.json       # 后端依赖
│   └── f1_history.db      # SQLite数据库文件（自动生成）
├── client/                # 前端应用
│   ├── public/
│   │   └── index.html     # HTML模板
│   ├── src/
│   │   ├── components/    # React组件
│   │   │   ├── Header.js      # 页面头部
│   │   │   ├── PostList.js    # 帖子列表
│   │   │   └── PostForm.js    # 帖子表单
│   │   ├── App.js         # 主应用组件
│   │   ├── index.js       # 应用入口
│   │   └── index.css      # 全局样式
│   └── package.json       # 前端依赖
├── package.json           # 根项目配置
└── README.md             # 项目说明
```

## 安装和运行

### 1. 安装依赖

```bash
# 安装根项目依赖
npm install

# 安装所有依赖（包括后端和前端）
npm run install-all
```

### 2. 启动开发服务器

```bash
# 同时启动后端和前端服务
npm run dev
```

或者分别启动：

```bash
# 启动后端服务（端口3001）
npm run server

# 启动前端服务（端口3000）
npm run client
```

### 3. 访问应用

- 前端管理页面：http://localhost:3000
- 后端API服务：http://localhost:3001

## API接口

### 帖子管理

#### 获取帖子列表
```
GET /api/posts
查询参数：
- year: 年份（模糊查询）
- month: 月份（模糊查询）
- date: 日期（模糊查询）
- driver: 车手（模糊查询）
- team: 车队（模糊查询）
```

#### 获取单个帖子
```
GET /api/posts/:id
```

#### 添加帖子
```
POST /api/posts
请求体：
{
  "summary": "简介（100字内）",
  "date": "YYYY-MM-DD",
  "records_en": [
    {"year": 2020, "content": "英文内容"}
  ],
  "records_cn": [
    {"year": 2020, "content": "中文内容"}
  ]
}
```

#### 更新帖子
```
PUT /api/posts/:id
请求体：同添加帖子
```

#### 删除帖子
```
DELETE /api/posts/:id
```

## 数据库结构

### posts表
- id: 主键
- summary: 简介
- date: 日期
- created_at: 创建时间

### records表
- id: 主键
- post_id: 帖子ID（外键）
- year: 年份
- content: 内容
- language: 语言（en/cn）

## 使用说明

1. **查看帖子列表**：首页显示所有帖子，支持搜索和分页
2. **添加新帖子**：点击右上角"新增帖子"按钮
3. **编辑帖子**：在列表中点击"编辑"按钮
4. **查看详情**：点击帖子简介或"详情"按钮
5. **删除帖子**：在列表中点击"删除"按钮

## 开发说明

- 前端使用React Hooks和函数式组件
- 使用Ant Design组件库提供UI组件
- 使用Styled Components进行样式管理
- 后端使用Express.js提供RESTful API
- 数据库使用SQLite，文件存储在server目录下

## 注意事项

- 简介字段限制100字以内
- 日期格式为YYYY-MM-DD
- 记录支持中英文双语
- 搜索功能支持模糊查询
- 所有操作都有相应的成功/失败提示 