const OSS = require('ali-oss');
require('dotenv').config();

// 阿里云OSS配置
const ossConfig = {
  region: process.env.OSS_REGION || 'oss-cn-shenzhen',
  accessKeyId: process.env.OSS_ACCESS_KEY_ID || 'LTAI5t6SLsZpVUJ87LwuFmsyk',
  accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET || 'fG3uPybtED35Kp7UKBntiODmjCiaAX',
  bucket: process.env.OSS_BUCKET || 'anna1994',
  endpoint: process.env.OSS_ENDPOINT || 'https://oss-cn-shenzhen.aliyuncs.com'
};

console.log('=== OSS配置测试 ===');
console.log('Region:', ossConfig.region);
console.log('AccessKeyId:', ossConfig.accessKeyId);
console.log('AccessKeySecret:', ossConfig.accessKeySecret ? '已设置' : '未设置');
console.log('Bucket:', ossConfig.bucket);
console.log('Endpoint:', ossConfig.endpoint);
console.log('');

// 创建OSS客户端
const ossClient = new OSS(ossConfig);

async function testOSSConnection() {
  try {
    console.log('正在测试OSS连接...');
    
    // 测试列出Bucket中的文件
    const result = await ossClient.list();
    console.log('✅ OSS连接成功！');
    console.log('Bucket中的文件数量:', result.objects ? result.objects.length : 0);
    
    // 测试上传一个小文件
    console.log('正在测试文件上传...');
    const testContent = 'Hello OSS!';
    const testFileName = `test-${Date.now()}.txt`;
    
    const uploadResult = await ossClient.put(testFileName, Buffer.from(testContent));
    console.log('✅ 文件上传成功！');
    console.log('上传的文件URL:', uploadResult.url);
    
    // 测试删除文件
    console.log('正在测试文件删除...');
    await ossClient.delete(testFileName);
    console.log('✅ 文件删除成功！');
    
    console.log('\n🎉 所有OSS测试通过！配置正确。');
    
  } catch (error) {
    console.error('❌ OSS测试失败:', error.message);
    console.error('错误详情:', error);
    
    if (error.code === 'InvalidAccessKeyId') {
      console.log('\n💡 解决方案:');
      console.log('1. 检查AccessKeyId是否正确');
      console.log('2. 确认AccessKey是否已启用');
      console.log('3. 检查AccessKey权限是否包含OSS操作权限');
    } else if (error.code === 'NoSuchBucket') {
      console.log('\n💡 解决方案:');
      console.log('1. 检查Bucket名称是否正确');
      console.log('2. 确认Bucket是否存在');
      console.log('3. 检查Bucket所在区域是否正确');
    } else if (error.code === 'AccessDenied') {
      console.log('\n💡 解决方案:');
      console.log('1. 检查AccessKey权限');
      console.log('2. 确认Bucket权限设置');
      console.log('3. 检查RAM用户权限');
    }
  }
}

// 运行测试
testOSSConnection(); 