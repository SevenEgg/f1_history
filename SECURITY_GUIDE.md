# 安全配置指南

## 重要安全提醒

⚠️ **请勿将敏感信息提交到Git仓库！**

本项目的敏感信息包括：
- 阿里云OSS AccessKey ID 和 Secret
- 数据库文件
- 上传的图片文件
- 环境变量文件

## 已配置的.gitignore规则

以下文件和目录已被添加到`.gitignore`中，不会被提交到Git仓库：

```
# 环境变量文件
.env
server/.env

# 数据库文件
*.db
*.sqlite
*.sqlite3

# 上传文件
server/uploads/

# 敏感信息
**/test-oss.js
```

## 环境变量配置

### 1. 创建环境变量文件

在`server`目录下创建`.env`文件：

```bash
# 阿里云OSS配置
OSS_REGION=oss-cn-hangzhou
OSS_ACCESS_KEY_ID=您的真实AccessKeyID
OSS_ACCESS_KEY_SECRET=您的真实AccessKeySecret
OSS_BUCKET=您的真实Bucket名称
OSS_ENDPOINT=https://oss-cn-hangzhou.aliyuncs.com

# 服务器配置
PORT=3001

# 存储模式（可选）
USE_LOCAL_STORAGE=false
```

### 2. 获取阿里云OSS凭证

1. 登录阿里云控制台
2. 进入"访问控制RAM"
3. 创建RAM用户
4. 为用户分配OSS权限
5. 创建AccessKey

详细步骤请参考：`OSS_SETUP_GUIDE.md`

## 安全最佳实践

### 1. 代码安全
- ✅ 所有敏感信息都通过环境变量配置
- ✅ 硬编码的敏感信息已移除
- ✅ 测试文件使用占位符而非真实凭证

### 2. 文件安全
- ✅ 数据库文件不提交到仓库
- ✅ 上传文件不提交到仓库
- ✅ 环境变量文件不提交到仓库

### 3. 部署安全
- 生产环境使用强密码
- 定期轮换AccessKey
- 限制AccessKey权限范围
- 使用HTTPS传输

## 如果意外提交了敏感信息

### 1. 立即处理
```bash
# 从Git历史中移除敏感文件
git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch server/.env' \
  --prune-empty --tag-name-filter cat -- --all

# 强制推送（谨慎使用）
git push origin --force --all
```

### 2. 更换凭证
- 在阿里云控制台禁用当前的AccessKey
- 创建新的AccessKey
- 更新环境变量文件

### 3. 检查泄露
- 检查GitHub仓库的提交历史
- 确认敏感信息已被完全移除

## 开发环境设置

### 1. 克隆项目后
```bash
# 复制环境变量模板
cp server/env.example server/.env

# 编辑环境变量文件
nano server/.env
```

### 2. 安装依赖
```bash
# 安装所有依赖
npm run install-all

# 或分别安装
cd server && npm install
cd ../client && npm install
```

### 3. 启动服务
```bash
# 开发模式
npm run dev

# 或分别启动
npm run server
npm run client
```

## 故障排除

### 1. 环境变量未加载
- 确认`.env`文件在`server`目录下
- 检查文件格式是否正确
- 重启服务器

### 2. OSS连接失败
- 检查AccessKey是否正确
- 确认Bucket名称和区域
- 检查网络连接

### 3. 文件上传失败
- 检查OSS权限设置
- 确认Bucket存在且可访问
- 查看服务器日志

## 联系支持

如果遇到安全问题，请：
1. 立即更换相关凭证
2. 检查系统日志
3. 联系技术支持

---

**记住：安全是每个人的责任！** 🔒



