require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const multer = require('multer');
const { uploadToOSS, deleteFromOSS } = require('./config/oss');

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 静态文件服务（用于本地存储的图片）
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 文件上传中间件
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB限制
  },
  fileFilter: (req, file, cb) => {
    // 只允许图片文件
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('只允许上传图片文件'), false);
    }
  }
});

// 数据库初始化
const db = new sqlite3.Database(path.join(__dirname, 'f1_history.db'));

// 创建表
db.serialize(() => {
  // 帖子表
  db.run(`CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    summary TEXT NOT NULL,
    date TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // 记录表
  db.run(`CREATE TABLE IF NOT EXISTS records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER,
    year INTEGER NOT NULL,
    content TEXT NOT NULL,
    language TEXT NOT NULL,
    images TEXT,
    FOREIGN KEY (post_id) REFERENCES posts (id) ON DELETE CASCADE
  )`);

  // Deaths 表
  db.run(`CREATE TABLE IF NOT EXISTS deaths (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('driver', 'team')),
    name_en TEXT NOT NULL,
    name_cn TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Champion 表
  db.run(`CREATE TABLE IF NOT EXISTS champions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('driver', 'team')),
    name_en TEXT NOT NULL,
    name_cn TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
});

// 添加帖子接口
app.post('/api/posts', (req, res) => {
  const { summary, date, records_en, records_cn } = req.body;

  if (!summary || !date) {
    return res.status(400).json({ error: '简介和日期不能为空' });
  }

  if (summary.length > 100) {
    return res.status(400).json({ error: '简介不能超过100字' });
  }

  db.run(
    'INSERT INTO posts (summary, date) VALUES (?, ?)',
    [summary, date],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      const postId = this.lastID;

      // 插入英文记录
      if (records_en && Array.isArray(records_en)) {
        records_en.forEach(record => {
          const images = record.images ? JSON.stringify(record.images) : null;
          db.run(
            'INSERT INTO records (post_id, year, content, language, images) VALUES (?, ?, ?, ?, ?)',
            [postId, record.year, record.content, 'en', images]
          );
        });
      }

      // 插入中文记录
      if (records_cn && Array.isArray(records_cn)) {
        records_cn.forEach(record => {
          const images = record.images ? JSON.stringify(record.images) : null;
          db.run(
            'INSERT INTO records (post_id, year, content, language, images) VALUES (?, ?, ?, ?, ?)',
            [postId, record.year, record.content, 'cn', images]
          );
        });
      }

      res.json({ id: postId, message: '帖子添加成功' });
    }
  );
});

// 编辑帖子接口
app.put('/api/posts/:id', (req, res) => {
  const { id } = req.params;
  const { summary, date, records_en, records_cn } = req.body;

  if (!summary || !date) {
    return res.status(400).json({ error: '简介和日期不能为空' });
  }

  if (summary.length > 100) {
    return res.status(400).json({ error: '简介不能超过100字' });
  }

  db.run(
    'UPDATE posts SET summary = ?, date = ? WHERE id = ?',
    [summary, date, id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: '帖子不存在' });
      }

      // 删除原有记录
      db.run('DELETE FROM records WHERE post_id = ?', [id]);

      // 插入新的英文记录
      if (records_en && Array.isArray(records_en)) {
        records_en.forEach(record => {
          const images = record.images ? JSON.stringify(record.images) : null;
          db.run(
            'INSERT INTO records (post_id, year, content, language, images) VALUES (?, ?, ?, ?, ?)',
            [id, record.year, record.content, 'en', images]
          );
        });
      }

      // 插入新的中文记录
      if (records_cn && Array.isArray(records_cn)) {
        records_cn.forEach(record => {
          const images = record.images ? JSON.stringify(record.images) : null;
          db.run(
            'INSERT INTO records (post_id, year, content, language, images) VALUES (?, ?, ?, ?, ?)',
            [id, record.year, record.content, 'cn', images]
          );
        });
      }

      res.json({ message: '帖子更新成功' });
    }
  );
});

// 帖子列表接口
app.get('/api/posts', (req, res) => {
  const { year, month, date, driver, team } = req.query;
  
  let query = `
    SELECT p.id, p.summary, p.date, p.created_at
    FROM posts p
  `;

  const conditions = [];
  const params = [];

  if (year) {
    conditions.push('p.date LIKE ?');
    params.push(`${year}%`);
  }

  // 支持 MM-DD 格式查询
  if (month && date) {
    // 确保月份和日期都是两位数格式
    const monthStr = month.padStart(2, '0');
    const dateStr = date.padStart(2, '0');
    conditions.push('p.date LIKE ?');
    params.push(`%-${monthStr}-${dateStr}`);
  } else if (month) {
    // 只查询月份
    const monthStr = month.padStart(2, '0');
    conditions.push('p.date LIKE ?');
    params.push(`%-${monthStr}-%`);
  } else if (date) {
    // 只查询日期
    const dateStr = date.padStart(2, '0');
    conditions.push('p.date LIKE ?');
    params.push(`%-${dateStr}`);
  }

  if (driver) {
    conditions.push('(p.summary LIKE ? OR EXISTS (SELECT 1 FROM records WHERE post_id = p.id AND content LIKE ?))');
    params.push(`%${driver}%`, `%${driver}%`);
  }

  if (team) {
    conditions.push('(p.summary LIKE ? OR EXISTS (SELECT 1 FROM records WHERE post_id = p.id AND content LIKE ?))');
    params.push(`%${team}%`, `%${team}%`);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' ORDER BY p.date DESC';

  db.all(query, params, async (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    // 为每个帖子获取记录
    const posts = await Promise.all(rows.map(async (row) => {
      return new Promise((resolve, reject) => {
        db.all(
          'SELECT year, content, images FROM records WHERE post_id = ? AND language = ? ORDER BY year',
          [row.id, 'en'],
          (err, recordsEn) => {
            if (err) {
              reject(err);
              return;
            }

            db.all(
              'SELECT year, content, images FROM records WHERE post_id = ? AND language = ? ORDER BY year',
              [row.id, 'cn'],
              (err, recordsCn) => {
                if (err) {
                  reject(err);
                  return;
                }

                // 获取 deaths 记录
                db.all(
                  'SELECT * FROM deaths WHERE date = ? ORDER BY created_at',
                  [row.date],
                  (err, deaths) => {
                    if (err) {
                      reject(err);
                      return;
                    }

                    // 获取 champions 记录
                    db.all(
                      'SELECT * FROM champions WHERE date = ? ORDER BY created_at',
                      [row.date],
                      (err, champions) => {
                        if (err) {
                          reject(err);
                          return;
                        }

                        resolve({
                          id: row.id,
                          summary: row.summary,
                          date: row.date,
                          created_at: row.created_at,
                          records_en: recordsEn.map(record => ({
                            year: record.year,
                            content: record.content,
                            images: record.images ? JSON.parse(record.images) : []
                          })),
                          records_cn: recordsCn.map(record => ({
                            year: record.year,
                            content: record.content,
                            images: record.images ? JSON.parse(record.images) : []
                          })),
                          deaths: deaths,
                          champions: champions
                        });
                      }
                    );
                  }
                );
              }
            );
          }
        );
      });
    }));

    res.json(posts);
  });
});

// 获取单个帖子详情
app.get('/api/posts/:id', (req, res) => {
  const { id } = req.params;

  db.get(
    'SELECT * FROM posts WHERE id = ?',
    [id],
    (err, post) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (!post) {
        return res.status(404).json({ error: '帖子不存在' });
      }

      db.all(
        'SELECT * FROM records WHERE post_id = ? ORDER BY year',
        [id],
        (err, records) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }

          const records_en = records.filter(r => r.language === 'en').map(r => ({
            year: r.year,
            content: r.content,
            images: r.images ? JSON.parse(r.images) : []
          }));

          const records_cn = records.filter(r => r.language === 'cn').map(r => ({
            year: r.year,
            content: r.content,
            images: r.images ? JSON.parse(r.images) : []
          }));

          // 获取 deaths 记录
          db.all(
            'SELECT * FROM deaths WHERE date = ? ORDER BY created_at',
            [post.date],
            (err, deaths) => {
              if (err) {
                return res.status(500).json({ error: err.message });
              }

              // 获取 champions 记录
              db.all(
                'SELECT * FROM champions WHERE date = ? ORDER BY created_at',
                [post.date],
                (err, champions) => {
                  if (err) {
                    return res.status(500).json({ error: err.message });
                  }

                  res.json({
                    ...post,
                    records_en,
                    records_cn,
                    deaths,
                    champions
                  });
                }
              );
            }
          );
        }
      );
    }
  );
});

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

// 图片上传接口
app.post('/api/upload', upload.array('images', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: '没有上传文件' });
    }

    const uploadResults = [];
    
    for (const file of req.files) {
      // 修复中文文件名乱码
      const fixedOriginalName = fixChineseFileName(file.originalname);
      
      // 更新文件的originalname
      file.originalname = fixedOriginalName;
      
      const result = await uploadToOSS(file);
      if (result.success) {
        uploadResults.push({
          originalName: fixedOriginalName,
          url: result.url,
          fileName: result.fileName
        });
      } else {
        uploadResults.push({
          originalName: fixedOriginalName,
          error: result.error
        });
      }
    }

    res.json({
      success: true,
      files: uploadResults
    });
  } catch (error) {
    console.error('文件上传失败:', error);
    res.status(500).json({ error: '文件上传失败' });
  }
});

// 删除帖子接口
app.delete('/api/posts/:id', (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM posts WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: '帖子不存在' });
    }

    res.json({ message: '帖子删除成功' });
  });
});

// ==================== Deaths API ====================

// 添加 Deaths 记录接口
app.post('/api/deaths', (req, res) => {
  const { date, type, name_en, name_cn, entity_id } = req.body;

  if (!date || !type || !name_en || !name_cn || !entity_id) {
    return res.status(400).json({ error: '所有字段都不能为空' });
  }

  if (!['driver', 'team'].includes(type)) {
    return res.status(400).json({ error: '类型必须是 driver 或 team' });
  }

  db.run(
    'INSERT INTO deaths (date, type, name_en, name_cn, entity_id) VALUES (?, ?, ?, ?, ?)',
    [date, type, name_en, name_cn, entity_id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      res.json({ id: this.lastID, message: 'Deaths 记录添加成功' });
    }
  );
});

// 获取 Deaths 记录列表接口
app.get('/api/deaths', (req, res) => {
  const { year, month, date, type, name } = req.query;
  
  let query = 'SELECT * FROM deaths WHERE 1=1';
  const conditions = [];
  const params = [];

  if (year) {
    conditions.push('date LIKE ?');
    params.push(`${year}%`);
  }

  if (month && date) {
    const monthStr = month.padStart(2, '0');
    const dateStr = date.padStart(2, '0');
    conditions.push('date LIKE ?');
    params.push(`%-${monthStr}-${dateStr}`);
  } else if (month) {
    const monthStr = month.padStart(2, '0');
    conditions.push('date LIKE ?');
    params.push(`%-${monthStr}-%`);
  } else if (date) {
    const dateStr = date.padStart(2, '0');
    conditions.push('date LIKE ?');
    params.push(`%-${dateStr}`);
  }

  if (type) {
    conditions.push('type = ?');
    params.push(type);
  }

  if (name) {
    conditions.push('(name_en LIKE ? OR name_cn LIKE ?)');
    params.push(`%${name}%`, `%${name}%`);
  }

  if (conditions.length > 0) {
    query += ' AND ' + conditions.join(' AND ');
  }

  query += ' ORDER BY date DESC';

  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res.json(rows);
  });
});

// 获取单个 Deaths 记录详情
app.get('/api/deaths/:id', (req, res) => {
  const { id } = req.params;

  db.get('SELECT * FROM deaths WHERE id = ?', [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (!row) {
      return res.status(404).json({ error: '记录不存在' });
    }

    res.json(row);
  });
});

// 更新 Deaths 记录接口
app.put('/api/deaths/:id', (req, res) => {
  const { id } = req.params;
  const { date, type, name_en, name_cn, entity_id } = req.body;

  if (!date || !type || !name_en || !name_cn || !entity_id) {
    return res.status(400).json({ error: '所有字段都不能为空' });
  }

  if (!['driver', 'team'].includes(type)) {
    return res.status(400).json({ error: '类型必须是 driver 或 team' });
  }

  db.run(
    'UPDATE deaths SET date = ?, type = ?, name_en = ?, name_cn = ?, entity_id = ? WHERE id = ?',
    [date, type, name_en, name_cn, entity_id, id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: '记录不存在' });
      }

      res.json({ message: 'Deaths 记录更新成功' });
    }
  );
});

// 删除 Deaths 记录接口
app.delete('/api/deaths/:id', (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM deaths WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: '记录不存在' });
    }

    res.json({ message: 'Deaths 记录删除成功' });
  });
});

// ==================== Champion API ====================

// 添加 Champion 记录接口
app.post('/api/champions', (req, res) => {
  const { date, type, name_en, name_cn, entity_id } = req.body;

  if (!date || !type || !name_en || !name_cn || !entity_id) {
    return res.status(400).json({ error: '所有字段都不能为空' });
  }

  if (!['driver', 'team'].includes(type)) {
    return res.status(400).json({ error: '类型必须是 driver 或 team' });
  }

  db.run(
    'INSERT INTO champions (date, type, name_en, name_cn, entity_id) VALUES (?, ?, ?, ?, ?)',
    [date, type, name_en, name_cn, entity_id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      res.json({ id: this.lastID, message: 'Champion 记录添加成功' });
    }
  );
});

// 获取 Champion 记录列表接口
app.get('/api/champions', (req, res) => {
  const { year, month, date, type, name } = req.query;
  
  let query = 'SELECT * FROM champions WHERE 1=1';
  const conditions = [];
  const params = [];

  if (year) {
    conditions.push('date LIKE ?');
    params.push(`${year}%`);
  }

  if (month && date) {
    const monthStr = month.padStart(2, '0');
    const dateStr = date.padStart(2, '0');
    conditions.push('date LIKE ?');
    params.push(`%-${monthStr}-${dateStr}`);
  } else if (month) {
    const monthStr = month.padStart(2, '0');
    conditions.push('date LIKE ?');
    params.push(`%-${monthStr}-%`);
  } else if (date) {
    const dateStr = date.padStart(2, '0');
    conditions.push('date LIKE ?');
    params.push(`%-${dateStr}`);
  }

  if (type) {
    conditions.push('type = ?');
    params.push(type);
  }

  if (name) {
    conditions.push('(name_en LIKE ? OR name_cn LIKE ?)');
    params.push(`%${name}%`, `%${name}%`);
  }

  if (conditions.length > 0) {
    query += ' AND ' + conditions.join(' AND ');
  }

  query += ' ORDER BY date DESC';

  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res.json(rows);
  });
});

// 获取单个 Champion 记录详情
app.get('/api/champions/:id', (req, res) => {
  const { id } = req.params;

  db.get('SELECT * FROM champions WHERE id = ?', [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (!row) {
      return res.status(404).json({ error: '记录不存在' });
    }

    res.json(row);
  });
});

// 更新 Champion 记录接口
app.put('/api/champions/:id', (req, res) => {
  const { id } = req.params;
  const { date, type, name_en, name_cn, entity_id } = req.body;

  if (!date || !type || !name_en || !name_cn || !entity_id) {
    return res.status(400).json({ error: '所有字段都不能为空' });
  }

  if (!['driver', 'team'].includes(type)) {
    return res.status(400).json({ error: '类型必须是 driver 或 team' });
  }

  db.run(
    'UPDATE champions SET date = ?, type = ?, name_en = ?, name_cn = ?, entity_id = ? WHERE id = ?',
    [date, type, name_en, name_cn, entity_id, id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: '记录不存在' });
      }

      res.json({ message: 'Champion 记录更新成功' });
    }
  );
});

// 删除 Champion 记录接口
app.delete('/api/champions/:id', (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM champions WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: '记录不存在' });
    }

    res.json({ message: 'Champion 记录删除成功' });
  });
});

app.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
}); 