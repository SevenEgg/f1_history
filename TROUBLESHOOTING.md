# 故障排除指南

## 🚨 常见错误及解决方案

### 1. "Cannot access 'fetchPost' before initialization" 错误

**错误原因**：在 `useEffect` 中使用了函数，但该函数在 `useEffect` 之后定义。

**解决方案**：
- 将函数定义移到 `useEffect` 之前
- 或者使用 `useCallback` 包装函数

**已修复**：✅ 此问题已在最新版本中修复

### 2. 图片上传失败

**可能原因**：
- OSS配置错误
- 网络连接问题
- 文件格式不支持
- 文件大小超限

**解决方案**：
1. 检查OSS配置是否正确
2. 确认网络连接正常
3. 验证文件格式（只支持图片）
4. 检查文件大小（最大5MB）

### 3. 图片不显示

**可能原因**：
- OSS文件不存在
- OSS访问权限问题
- 图片URL错误

**解决方案**：
1. 检查OSS控制台文件是否存在
2. 确认OSS Bucket权限设置
3. 验证图片URL是否正确

### 4. 后端服务启动失败

**可能原因**：
- 端口被占用
- 依赖包未安装
- 环境变量配置错误

**解决方案**：
```bash
# 检查端口占用
lsof -i :3001

# 安装依赖
cd server && npm install

# 检查环境变量
cat server/.env
```

### 5. 前端编译错误

**可能原因**：
- 依赖包未安装
- 代码语法错误
- 端口冲突

**解决方案**：
```bash
# 安装依赖
cd client && npm install

# 检查编译错误
npm start

# 检查端口占用
lsof -i :3000
```

## 🔧 调试方法

### 1. 浏览器调试

**打开开发者工具**：
- Chrome: F12 或 Ctrl+Shift+I
- Firefox: F12 或 Ctrl+Shift+I
- Safari: Cmd+Option+I

**检查网络请求**：
1. 切换到 Network 标签
2. 刷新页面或执行操作
3. 查看请求状态和响应

**查看控制台错误**：
1. 切换到 Console 标签
2. 查看红色错误信息
3. 根据错误信息定位问题

### 2. 服务器调试

**查看服务器日志**：
```bash
# 启动服务器并查看日志
cd server && npm start

# 或者使用 nodemon 自动重启
cd server && npm run dev
```

**测试API接口**：
```bash
# 测试帖子列表接口
curl http://localhost:3001/api/posts

# 测试图片上传接口
curl -X POST -F "images=@test.jpg" http://localhost:3001/api/upload
```

### 3. 数据库调试

**检查数据库文件**：
```bash
# 查看数据库文件是否存在
ls -la server/f1_history.db

# 使用 SQLite 命令行工具
sqlite3 server/f1_history.db
```

**查看表结构**：
```sql
-- 查看所有表
.tables

-- 查看表结构
.schema posts
.schema records

-- 查看数据
SELECT * FROM posts;
SELECT * FROM records;
```

## 🛠️ 配置检查清单

### 1. 环境变量配置

确保 `server/.env` 文件包含正确的配置：

```bash
# 阿里云OSS配置
OSS_REGION=oss-cn-shenzhen
OSS_ACCESS_KEY_ID=your-access-key-id
OSS_ACCESS_KEY_SECRET=your-access-key-secret
OSS_BUCKET=your-bucket-name
OSS_ENDPOINT=https://oss-cn-shenzhen.aliyuncs.com

# 服务器配置
PORT=3001
```

### 2. 依赖包检查

**后端依赖**：
```bash
cd server && npm list --depth=0
```

确保包含以下关键包：
- express
- sqlite3
- ali-oss
- multer
- cors

**前端依赖**：
```bash
cd client && npm list --depth=0
```

确保包含以下关键包：
- react
- antd
- superagent
- styled-components

### 3. 服务状态检查

**检查服务运行状态**：
```bash
# 检查后端服务
lsof -i :3001

# 检查前端服务
lsof -i :3000

# 检查数据库文件
ls -la server/f1_history.db
```

## 🧪 测试方法

### 1. 功能测试

**基础功能测试**：
1. 访问 http://localhost:3000
2. 测试新增帖子功能
3. 测试编辑帖子功能
4. 测试搜索功能
5. 测试导出功能

**图片上传测试**：
1. 使用提供的测试页面：`test-upload.html`
2. 测试拖拽上传
3. 测试点击上传
4. 验证图片预览
5. 检查OSS存储

### 2. API接口测试

**使用curl测试**：
```bash
# 获取帖子列表
curl http://localhost:3001/api/posts

# 获取单个帖子
curl http://localhost:3001/api/posts/1

# 上传图片
curl -X POST -F "images=@test.jpg" http://localhost:3001/api/upload
```

**使用Postman测试**：
1. 导入API接口
2. 设置请求参数
3. 发送请求并查看响应

### 3. 性能测试

**图片上传性能**：
- 测试不同大小的图片
- 测试并发上传
- 监控上传速度

**页面加载性能**：
- 使用浏览器开发者工具
- 查看加载时间
- 检查资源大小

## 📞 获取帮助

### 1. 查看日志

**前端日志**：
- 浏览器控制台
- 网络请求日志

**后端日志**：
- 服务器启动日志
- API请求日志
- 错误日志

### 2. 常见问题

**Q: 图片上传后不显示？**
A: 检查OSS配置和文件权限

**Q: 编辑帖子时数据不加载？**
A: 检查API接口和数据库连接

**Q: 搜索功能不工作？**
A: 检查搜索参数和数据库查询

**Q: 导出功能失败？**
A: 检查文件权限和浏览器设置

### 3. 联系支持

如果问题仍然存在，请提供以下信息：
1. 错误信息截图
2. 浏览器控制台日志
3. 服务器日志
4. 复现步骤
5. 环境信息（操作系统、浏览器版本等） 