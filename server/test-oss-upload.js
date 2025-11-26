require('dotenv').config();
const { uploadBufferWithKey, USE_LOCAL_STORAGE, ossClient } = require('./config/oss');
const fs = require('fs');
const path = require('path');

async function testOSSUpload() {
  console.log('='.repeat(60));
  console.log('OSS 上传测试');
  console.log('='.repeat(60));
  
  // 检查配置
  console.log('\n📋 配置检查:');
  console.log(`USE_LOCAL_STORAGE: ${USE_LOCAL_STORAGE}`);
  console.log(`OSS_ACCESS_KEY_ID: ${process.env.OSS_ACCESS_KEY_ID ? process.env.OSS_ACCESS_KEY_ID.substring(0, 8) + '...' : '未设置'}`);
  console.log(`OSS_BUCKET: ${process.env.OSS_BUCKET || '未设置'}`);
  console.log(`OSS_REGION: ${process.env.OSS_REGION || '未设置'}`);
  console.log(`OSS客户端状态: ${ossClient ? '✅ 已创建' : '❌ 未创建'}`);
  
  if (USE_LOCAL_STORAGE) {
    console.log('\n⚠️  当前使用本地存储模式，不会上传到 OSS');
    console.log('如需使用 OSS，请设置 USE_LOCAL_STORAGE=false 并配置正确的 OSS 凭证');
    return;
  }
  
  if (!ossClient) {
    console.log('\n❌ OSS 客户端未创建，无法进行上传测试');
    console.log('请检查 OSS 配置是否正确');
    return;
  }
  
  // 测试上传 newsList.json
  const newsListPath = path.join(__dirname, 'data', 'newsList.json');
  if (!fs.existsSync(newsListPath)) {
    console.log(`\n❌ 文件不存在: ${newsListPath}`);
    console.log('请先运行 /api/newList 接口生成 newsList.json 文件');
    return;
  }
  
  console.log(`\n📁 找到文件: ${newsListPath}`);
  const fileStats = fs.statSync(newsListPath);
  console.log(`文件大小: ${(fileStats.size / 1024).toFixed(2)} KB`);
  
  // 读取文件
  console.log('\n📖 读取文件...');
  const fileBuffer = fs.readFileSync(newsListPath);
  console.log(`读取成功，缓冲区大小: ${(fileBuffer.length / 1024).toFixed(2)} KB`);
  
  // 测试上传
  const ossKey = 'ChinaF1/newsList.json';
  console.log(`\n🚀 开始上传到 OSS...`);
  console.log(`OSS Key: ${ossKey}`);
  
  try {
    const startTime = Date.now();
    const result = await uploadBufferWithKey(ossKey, fileBuffer, 'application/json');
    const uploadTime = Date.now() - startTime;
    
    if (result.success) {
      console.log(`\n✅ 上传成功！`);
      console.log(`耗时: ${uploadTime}ms`);
      console.log(`URL: ${result.url}`);
      console.log(`Key: ${result.fileName}`);
    } else {
      console.log(`\n❌ 上传失败！`);
      console.log(`错误: ${result.error}`);
      if (result.details) {
        console.log('错误详情:', JSON.stringify(result.details, null, 2));
      }
    }
  } catch (error) {
    console.log(`\n❌ 上传异常！`);
    console.error('错误:', error);
    console.error('堆栈:', error.stack);
  }
  
  console.log('\n' + '='.repeat(60));
}

// 运行测试
testOSSUpload().catch(console.error);

