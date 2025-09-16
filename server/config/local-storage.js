const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// 创建上传目录
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 生成唯一的文件名
const generateFileName = (originalName) => {
  const ext = path.extname(originalName);
  const timestamp = Date.now();
  const random = uuidv4().substring(0, 8);
  return `f1-history/${timestamp}-${random}${ext}`;
};

// 保存文件到本地
const saveToLocal = async (file) => {
  try {
    const fileName = generateFileName(file.originalname);
    const filePath = path.join(uploadDir, fileName);
    
    // 确保目录存在
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // 写入文件
    fs.writeFileSync(filePath, file.buffer);
    
    // 返回本地URL
    const localUrl = `http://localhost:3001/uploads/${fileName}`;
    
    return {
      success: true,
      url: localUrl,
      fileName: fileName,
      localPath: filePath
    };
  } catch (error) {
    console.error('本地文件保存失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// 删除本地文件
const deleteFromLocal = async (fileName) => {
  try {
    const filePath = path.join(uploadDir, fileName);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return { success: true };
    }
    return { success: true }; // 文件不存在也算成功
  } catch (error) {
    console.error('本地文件删除失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  saveToLocal,
  deleteFromLocal,
  generateFileName,
  uploadDir
}; 