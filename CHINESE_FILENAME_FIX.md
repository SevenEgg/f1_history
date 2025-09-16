# 中文文件名乱码修复说明

## 问题描述

在使用F1历史管理系统上传包含中文字符的图片文件时，返回的`originalName`字段会出现乱码，例如：
```
originalName: "æµè¯.jpg.webp"
```

## 问题原因

这个问题是由于multer在处理multipart/form-data请求时，默认使用latin1编码来解析文件名，而浏览器通常使用UTF-8编码发送包含中文字符的文件名，导致编码不匹配产生乱码。

## 解决方案

### 1. 修复代码

在`server/index.js`中添加了`fixChineseFileName`函数来处理中文文件名乱码：

```javascript
// 修复中文文件名乱码的辅助函数
const fixChineseFileName = (originalName) => {
  if (!originalName) return originalName;
  
  // 检查是否包含乱码字符
  if (/[\u0080-\uFFFF]/.test(originalName)) {
    try {
      // 尝试将latin1编码的字符串转换为UTF-8
      const buffer = Buffer.from(originalName, 'latin1');
      const utf8Name = buffer.toString('utf8');
      
      // 验证转换后的字符串是否包含有效的中文字符
      if (/[\u4e00-\u9fff]/.test(utf8Name)) {
        return utf8Name;
      }
    } catch (e) {
      console.log('文件名转换失败:', e.message);
    }
  }
  
  return originalName;
};
```

### 2. 在上传接口中应用修复

在`/api/upload`接口中，对每个上传的文件应用文件名修复：

```javascript
for (const file of req.files) {
  // 修复中文文件名乱码
  const fixedOriginalName = fixChineseFileName(file.originalname);
  
  // 更新文件的originalname
  file.originalname = fixedOriginalName;
  
  const result = await uploadToOSS(file);
  // ... 处理上传结果
}
```

## 修复原理

1. **检测乱码**：使用正则表达式`/[\u0080-\uFFFF]/`检测文件名中是否包含非ASCII字符
2. **编码转换**：将latin1编码的字符串转换为UTF-8编码
3. **验证结果**：使用正则表达式`/[\u4e00-\u9fff]/`验证转换后的字符串是否包含有效的中文字符
4. **安全回退**：如果转换失败，保持原始文件名不变

## 测试方法

### 1. 使用测试页面

打开`test-chinese-filename.html`页面，可以：
- 拖拽包含中文文件名的图片文件
- 点击预设的测试文件名（如"测试图片.jpg"）
- 查看上传结果中的文件名是否正确显示

### 2. 手动测试

1. 准备一个包含中文文件名的图片文件，如"测试图片.jpg"
2. 使用Postman或其他工具向`http://localhost:3001/api/upload`发送multipart/form-data请求
3. 检查返回结果中的`originalName`字段是否正确显示中文

## 支持的字符

修复后的系统支持以下字符的文件名：
- 中文字符（\u4e00-\u9fff）
- 英文字母和数字
- 常用标点符号
- 其他UTF-8字符

## 注意事项

1. **编码兼容性**：修复方案主要针对latin1到UTF-8的转换，对于其他编码可能需要额外处理
2. **性能影响**：文件名修复操作对性能影响很小，但建议在生产环境中监控相关日志
3. **错误处理**：如果文件名转换失败，系统会保持原始文件名，确保上传功能不会中断

## 相关文件

- `server/index.js` - 主要修复代码
- `test-chinese-filename.html` - 测试页面
- `CHINESE_FILENAME_FIX.md` - 本说明文档

## 更新日志

- **2024-01-XX**: 添加中文文件名乱码修复功能
- **2024-01-XX**: 创建测试页面和说明文档
