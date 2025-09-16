const superagent = require('superagent');

const BASE_URL = 'http://localhost:3001';

// 测试搜索功能
async function testSearch() {
  console.log('🔍 开始测试搜索功能...\n');

  try {
    // 测试1: 按年份搜索
    console.log('📅 测试1: 按年份搜索 (2024)');
    const yearResult = await superagent.get(`${BASE_URL}/api/posts?year=2024`);
    console.log(`找到 ${yearResult.body.length} 条记录`);
    yearResult.body.forEach(post => {
      console.log(`  - ${post.date}: ${post.summary}`);
    });
    console.log('');

    // 测试2: 按月份搜索
    console.log('📅 测试2: 按月份搜索 (05)');
    const monthResult = await superagent.get(`${BASE_URL}/api/posts?month=05`);
    console.log(`找到 ${monthResult.body.length} 条记录`);
    monthResult.body.forEach(post => {
      console.log(`  - ${post.date}: ${post.summary}`);
    });
    console.log('');

    // 测试3: 按日期搜索
    console.log('📅 测试3: 按日期搜索 (26)');
    const dateResult = await superagent.get(`${BASE_URL}/api/posts?date=26`);
    console.log(`找到 ${dateResult.body.length} 条记录`);
    dateResult.body.forEach(post => {
      console.log(`  - ${post.date}: ${post.summary}`);
    });
    console.log('');

    // 测试4: MM-DD 格式搜索
    console.log('📅 测试4: MM-DD 格式搜索 (05-26)');
    const mmddResult = await superagent.get(`${BASE_URL}/api/posts?month=05&date=26`);
    console.log(`找到 ${mmddResult.body.length} 条记录`);
    mmddResult.body.forEach(post => {
      console.log(`  - ${post.date}: ${post.summary}`);
    });
    console.log('');

    // 测试5: 组合搜索
    console.log('📅 测试5: 组合搜索 (年份2024 + 月份05)');
    const combinedResult = await superagent.get(`${BASE_URL}/api/posts?year=2024&month=05`);
    console.log(`找到 ${combinedResult.body.length} 条记录`);
    combinedResult.body.forEach(post => {
      console.log(`  - ${post.date}: ${post.summary}`);
    });
    console.log('');

    // 测试6: 获取所有记录
    console.log('📅 测试6: 获取所有记录');
    const allResult = await superagent.get(`${BASE_URL}/api/posts`);
    console.log(`总共 ${allResult.body.length} 条记录`);
    allResult.body.forEach(post => {
      console.log(`  - ${post.date}: ${post.summary}`);
    });

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应内容:', error.response.text);
    }
  }
}

// 运行测试
testSearch(); 