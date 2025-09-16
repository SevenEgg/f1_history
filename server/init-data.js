const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, 'f1_history.db'));

// 插入示例数据
const sampleData = [
  {
    summary: '汉密尔顿在摩纳哥大奖赛中获胜',
    date: '2024-05-26',
    records_en: [
      { year: 2024, content: 'Lewis Hamilton won the Monaco Grand Prix' },
      { year: 2020, content: 'Hamilton secured another victory in Monaco' }
    ],
    records_cn: [
      { year: 2024, content: '汉密尔顿在摩纳哥大奖赛中获胜' },
      { year: 2020, content: '汉密尔顿在摩纳哥再次获胜' }
    ]
  },
  {
    summary: '维斯塔潘在西班牙大奖赛中夺冠',
    date: '2024-06-02',
    records_en: [
      { year: 2024, content: 'Max Verstappen won the Spanish Grand Prix' },
      { year: 2023, content: 'Verstappen dominated the Spanish GP' }
    ],
    records_cn: [
      { year: 2024, content: '维斯塔潘在西班牙大奖赛中夺冠' },
      { year: 2023, content: '维斯塔潘在西班牙大奖赛中统治性获胜' }
    ]
  }
];

db.serialize(() => {
  // 清空现有数据
  db.run('DELETE FROM records');
  db.run('DELETE FROM posts');
  
  // 插入示例数据
  sampleData.forEach((data, index) => {
    db.run(
      'INSERT INTO posts (summary, date) VALUES (?, ?)',
      [data.summary, data.date],
      function(err) {
        if (err) {
          console.error('Error inserting post:', err);
          return;
        }
        
        const postId = this.lastID;
        console.log(`Inserted post ${postId}: ${data.summary}`);
        
        // 插入英文记录
        data.records_en.forEach(record => {
          db.run(
            'INSERT INTO records (post_id, year, content, language) VALUES (?, ?, ?, ?)',
            [postId, record.year, record.content, 'en']
          );
        });
        
        // 插入中文记录
        data.records_cn.forEach(record => {
          db.run(
            'INSERT INTO records (post_id, year, content, language) VALUES (?, ?, ?, ?)',
            [postId, record.year, record.content, 'cn']
          );
        });
      }
    );
  });
});

console.log('Sample data initialization completed!');
db.close(); 