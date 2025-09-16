const OSS = require('ali-oss');
const path = require('path');
const { saveToLocal, deleteFromLocal } = require('./local-storage');

// 检查是否使用本地存储
const USE_LOCAL_STORAGE = process.env.USE_LOCAL_STORAGE === 'true' || !process.env.OSS_ACCESS_KEY_ID || process.env.OSS_ACCESS_KEY_ID === 'your-access-key-id';

// 阿里云OSS配置
const ossConfig = {
  region: process.env.OSS_REGION || 'oss-cn-hangzhou',
  accessKeyId: process.env.OSS_ACCESS_KEY_ID || 'your-access-key-id',
  accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET || 'your-access-key-secret',
  bucket: process.env.OSS_BUCKET || 'your-bucket-name',
  endpoint: process.env.OSS_ENDPOINT || 'https://oss-cn-hangzhou.aliyuncs.com'
};

// 打印配置信息（调试用）
console.log('存储配置信息:');
if (USE_LOCAL_STORAGE) {
  console.log('✅ 使用本地存储模式');
} else {
  console.log('🌐 使用阿里云OSS模式');
  console.log('Region:', ossConfig.region);
  console.log('AccessKeyId:', ossConfig.accessKeyId ? `${ossConfig.accessKeyId.substring(0, 8)}...` : '未设置');
  console.log('Bucket:', ossConfig.bucket);
  console.log('Endpoint:', ossConfig.endpoint);
}

// 创建OSS客户端（仅在非本地存储模式下）
let ossClient = null;
if (!USE_LOCAL_STORAGE) {
  try {
    ossClient = new OSS(ossConfig);
  } catch (error) {
    console.error('OSS客户端创建失败，切换到本地存储模式:', error.message);
  }
}

// 生成唯一的文件名
const generateFileName = (originalName) => {
  const ext = path.extname(originalName);
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `f1-history/${timestamp}-${random}${ext}`;
};

// 上传文件（智能选择存储方式）
const uploadToOSS = async (file) => {
  if (USE_LOCAL_STORAGE || !ossClient) {
    console.log('使用本地存储上传文件');
    return await saveToLocal(file);
  }

  try {
    console.log('使用OSS上传文件');
    const fileName = generateFileName(file.originalname);
    const result = await ossClient.put(fileName, file.buffer);
    return {
      success: true,
      url: result.url,
      fileName: fileName
    };
  } catch (error) {
    console.error('OSS上传失败，切换到本地存储:', error.message);
    return await saveToLocal(file);
  }
};

// 删除文件（智能选择存储方式）
const deleteFromOSS = async (fileName) => {
  if (USE_LOCAL_STORAGE || !ossClient) {
    console.log('使用本地存储删除文件');
    return await deleteFromLocal(fileName);
  }

  try {
    console.log('使用OSS删除文件');
    await ossClient.delete(fileName);
    return { success: true };
  } catch (error) {
    console.error('OSS删除失败，切换到本地存储:', error.message);
    return await deleteFromLocal(fileName);
  }
};

module.exports = {
  ossClient,
  uploadToOSS,
  deleteFromOSS,
  generateFileName,
  USE_LOCAL_STORAGE
}; 