# 阿里云OSS配置指南

## 🚨 当前问题

您遇到的错误是：**"The request signature we calculated does not match the signature you provided"**

这表明：
- ✅ AccessKey ID 是正确的
- ❌ AccessKey Secret 可能不正确或已过期

## 🔧 解决步骤

### 1. 获取正确的AccessKey

#### 方法一：使用主账号AccessKey
1. 登录阿里云控制台
2. 点击右上角头像 → "AccessKey管理"
3. 创建AccessKey（如果还没有）
4. 复制AccessKey ID和AccessKey Secret

#### 方法二：使用RAM用户AccessKey（推荐）
1. 登录阿里云控制台
2. 进入"RAM访问控制"
3. 创建RAM用户
4. 为RAM用户创建AccessKey
5. 给RAM用户分配OSS权限

### 2. 创建RAM用户和权限（推荐方法）

#### 步骤1：创建RAM用户
1. 登录阿里云控制台
2. 进入"RAM访问控制" → "用户"
3. 点击"创建用户"
4. 填写用户信息：
   - 登录名称：`f1-history-oss`
   - 显示名称：`F1历史OSS用户`
   - 选择"编程访问"
5. 点击"确定"

#### 步骤2：创建AccessKey
1. 在用户列表中找到刚创建的用户
2. 点击"创建AccessKey"
3. 选择"继续使用AccessKey"
4. 复制AccessKey ID和AccessKey Secret

#### 步骤3：分配权限
1. 在用户详情页面，点击"添加权限"
2. 选择"系统策略"
3. 搜索并选择以下权限：
   - `AliyunOSSFullAccess`（OSS完全访问权限）
   - 或者 `AliyunOSSReadWriteAccess`（OSS读写权限）
4. 点击"确定"

### 3. 创建OSS Bucket

#### 步骤1：创建Bucket
1. 进入"对象存储OSS"
2. 点击"创建Bucket"
3. 填写Bucket信息：
   - Bucket名称：`your-bucket-name`（或您喜欢的名称）
   - 区域：`华南1（深圳）`
   - 读写权限：`公共读`
4. 点击"确定"

#### 步骤2：配置Bucket权限
1. 在Bucket列表中找到刚创建的Bucket
2. 点击"管理"
3. 进入"权限管理"
4. 确保"读写权限"设置为"公共读"

### 4. 更新配置文件

#### 更新 `.env` 文件
```bash
# 阿里云OSS配置
OSS_REGION=oss-cn-shenzhen
OSS_ACCESS_KEY_ID=您的AccessKeyID
OSS_ACCESS_KEY_SECRET=您的AccessKeySecret
OSS_BUCKET=your-bucket-name
OSS_ENDPOINT=https://oss-cn-shenzhen.aliyuncs.com

# 服务器配置
PORT=3001
```

### 5. 测试配置

运行测试脚本验证配置：
```bash
cd server
node test-oss.js
```

如果看到以下输出，说明配置正确：
```
🎉 所有OSS测试通过！配置正确。
```

## 🔍 常见问题排查

### 1. AccessKey Secret错误
**症状**：SignatureDoesNotMatch错误
**解决**：
- 检查AccessKey Secret是否正确复制
- 确认没有多余的空格或换行符
- 重新生成AccessKey Secret

### 2. Bucket不存在
**症状**：NoSuchBucket错误
**解决**：
- 确认Bucket名称正确
- 检查Bucket所在区域
- 确认Bucket已创建

### 3. 权限不足
**症状**：AccessDenied错误
**解决**：
- 检查RAM用户权限
- 确认已分配OSS权限
- 检查Bucket权限设置

### 4. 区域不匹配
**症状**：各种连接错误
**解决**：
- 确认OSS Region与Bucket区域一致
- 检查Endpoint是否正确

## 📋 配置检查清单

- [ ] 创建了RAM用户
- [ ] 生成了AccessKey ID和Secret
- [ ] 分配了OSS权限
- [ ] 创建了OSS Bucket
- [ ] 设置了Bucket权限为"公共读"
- [ ] 更新了.env文件
- [ ] 运行了测试脚本
- [ ] 测试通过

## 🛡️ 安全建议

### 1. 使用RAM用户
- 不要使用主账号AccessKey
- 创建专门的RAM用户
- 只分配必要的权限

### 2. 定期轮换AccessKey
- 定期更新AccessKey
- 删除不再使用的AccessKey
- 监控AccessKey使用情况

### 3. 限制权限
- 只分配必要的OSS权限
- 使用最小权限原则
- 定期审查权限

## 📞 获取帮助

如果仍然遇到问题：

1. **查看阿里云文档**：
   - [OSS快速开始](https://help.aliyun.com/document_detail/31817.html)
   - [RAM用户管理](https://help.aliyun.com/document_detail/28637.html)

2. **联系阿里云支持**：
   - 提交工单获取技术支持

3. **检查网络连接**：
   - 确认服务器能访问阿里云OSS
   - 检查防火墙设置 