require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const multer = require('multer');
const axios = require('axios');
const { uploadToOSS, deleteFromOSS, ossClient, generateFileName, uploadBufferWithKey } = require('./config/oss');
const { encrypt, decrypt } = require('./config/cryptoExt');
const fs = require('fs');

// 获取中国时区的当前时间
const getChinaTime = () => {
  const now = new Date();
  const chinaTime = new Date(now.getTime() + (8 * 60 * 60 * 1000)); // UTC+8
  return chinaTime.toISOString().replace('T', ' ').substring(0, 19);
};
const os = require('os');
const crypto = require('crypto');
const mime = require('mime-types');

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

  // 新闻状态管理表
  db.run(`CREATE TABLE IF NOT EXISTS news_status (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    news_id TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    published_at TEXT NOT NULL,
    cover_url TEXT,
    news_source_name TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('adopted', 'rejected')) DEFAULT 'rejected',
    created_at DATETIME,
    updated_at DATETIME
  )`);

  // 新闻发布表
  db.run(`CREATE TABLE IF NOT EXISTS published_news (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT NOT NULL UNIQUE,
    cover_url TEXT,
    published_at TEXT NOT NULL,
    news_source TEXT NOT NULL,
    news_source_link TEXT,
    title TEXT NOT NULL,
    summary TEXT NOT NULL,
    content TEXT NOT NULL,
    tags TEXT,
    syncSta INTEGER DEFAULT 0,
    created_at DATETIME,
    updated_at DATETIME
  )`);

  // 迁移：为已存在的 published_news 表添加 syncSta 列（默认为 0/false）
  db.get("PRAGMA table_info(published_news)", (e, row) => {});
  db.all("PRAGMA table_info(published_news)", (err, columns) => {
    if (err) {
      console.error('检查 published_news 表结构失败:', err.message);
      return;
    }
    const hasSyncSta = Array.isArray(columns) && columns.some(col => col.name === 'syncSta');
    if (!hasSyncSta) {
      db.run('ALTER TABLE published_news ADD COLUMN syncSta INTEGER DEFAULT 0', (alterErr) => {
        if (alterErr) {
          console.error('添加 syncSta 字段失败:', alterErr.message);
        } else {
          console.log('已为 published_news 表添加 syncSta 字段');
        }
      });
    }
  });
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

// 通过远程URL抓取图片并上传到OSS
app.post('/api/upload-by-url', async (req, res) => {
  try {
    const { url } = req.body || {};
    if (!url) {
      return res.status(400).json({ error: '缺少图片URL' });
    }

    // 拉取远程图片为buffer
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    const contentType = response.headers['content-type'] || 'application/octet-stream';
    const ext = mime.extension(contentType) ? `.${mime.extension(contentType)}` : '';

    // 构造上传所需file对象（与现有uploadToOSS兼容）
    const originalBase = crypto.createHash('md5').update(url).digest('hex');
    const originalname = `${originalBase}${ext || '.img'}`;
    const fileBuffer = Buffer.from(response.data);

    // 若OSS客户端可用，则直接走OSS，确保返回线上URL
    if (ossClient) {
      const fileName = generateFileName(originalname);
      const putResult = await ossClient.put(fileName, fileBuffer);
      return res.json({ success: true, url: putResult.url, fileName });
    }

    // 否则走现有上传逻辑（可能为本地存储）
    const result = await uploadToOSS({ originalname, buffer: fileBuffer, mimetype: contentType });
    if (!result || !result.success) {
      return res.status(500).json({ error: result && result.error ? result.error : '上传失败' });
    }

    return res.json({ success: true, url: result.url, fileName: result.fileName });
  } catch (error) {
    console.error('通过URL上传失败:', error.message);
    return res.status(500).json({ error: '通过URL上传失败' });
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

// ==================== News API ====================

// 获取新闻列表接口（带分页）
app.get('/api/news', async (req, res) => {
  try {
    const { page = 1, limit = 35 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    
    // 请求外部API
    const response = await axios.get('https://api.f1cosmos.com/news', {
      params: {
        page: pageNum,
        limit: limitNum,
        lang: 'zh',
        source: 'latest'
      }
    });

    const newsData = response.data;
    
    // 处理新闻数据，添加状态信息
    const processedNews = await Promise.all(newsData.data.map(async (news) => {
      // 查询数据库中该新闻的状态
      return new Promise((resolve, reject) => {
        db.get(
          'SELECT status FROM news_status WHERE news_id = ?',
          [news.slug],
          (err, row) => {
            if (err) {
              reject(err);
              return;
            }
            
            resolve({
              ...news,
              status: row ? row.status : 'rejected' // 默认为未采用
            });
          }
        );
      });
    }));

    res.json({
      ...newsData,
      data: processedNews,
      total: newsData.totalPage * limitNum, // 计算总记录数
      currentPage: newsData.currentPage,
      totalPage: newsData.totalPage,
      hasNextPage: newsData.hasNextPage
    });
  } catch (error) {
    console.error('获取新闻失败:', error);
    res.status(500).json({ error: '获取新闻失败' });
  }
});

// 更新新闻状态接口
app.put('/api/news/:id/status', (req, res) => {
  const { id } = req.params;
  const { status, title, published_at, cover_url, news_source_name } = req.body;

  if (!status || !['adopted', 'rejected'].includes(status)) {
    return res.status(400).json({ error: '状态必须是 adopted 或 rejected' });
  }

  // 先尝试更新，如果不存在则插入
  const chinaTime = getChinaTime();
  db.run(
    `INSERT OR REPLACE INTO news_status 
     (news_id, title, published_at, cover_url, news_source_name, status, created_at, updated_at) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, title, published_at, cover_url, news_source_name, status, chinaTime, chinaTime],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      res.json({ message: '新闻状态更新成功' });
    }
  );
});

// 获取新闻详情接口
app.get('/api/news/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    
    // 请求外部API获取新闻详情
    const response = await axios.get(`https://api.f1cosmos.com/news/${slug}?lang=zh`);
    
    res.json(response.data);
  } catch (error) {
    console.error('获取新闻详情失败:', error);
    res.status(500).json({ error: '获取新闻详情失败' });
  }
});

// 发布新闻接口
app.post('/api/news/publish', (req, res) => {
  const { slug, cover_url, published_at, news_source, news_source_link, title, summary, content, tags } = req.body;

  if (!slug || !title || !summary || !content || !published_at || !news_source) {
    return res.status(400).json({ error: '必填字段不能为空' });
  }

  const tagsJson = tags ? JSON.stringify(tags) : null;

  // 先发布新闻到published_news表
  const chinaTime = getChinaTime();
  db.run(
    `INSERT OR REPLACE INTO published_news 
     (slug, cover_url, published_at, news_source, news_source_link, title, summary, content, tags, created_at, updated_at) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [slug, cover_url, published_at, news_source, news_source_link, title, summary, content, tagsJson, chinaTime, chinaTime],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      // 发布成功后，将该新闻标记为已采用
      db.run(
        `INSERT OR REPLACE INTO news_status 
         (news_id, title, published_at, cover_url, news_source_name, status, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, 'adopted', ?, ?)`,
        [slug, title, published_at, cover_url, news_source, chinaTime, chinaTime],
        function(err2) {
          if (err2) {
            console.error('更新新闻状态失败:', err2);
            // 即使状态更新失败，也返回发布成功
          }
          
          res.json({ id: this.lastID, message: '新闻发布成功并已标记为采用' });
        }
      );
    }
  );
});

// 获取已发布新闻列表接口（带分页和搜索）
app.get('/api/published-news', (req, res) => {
  const { page = 1, limit = 10, search = '' } = req.query;
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const offset = (pageNum - 1) * limitNum;

  // 构建查询条件
  let whereClause = '';
  let params = [];
  
  if (search) {
    whereClause = 'WHERE title LIKE ? OR summary LIKE ?';
    params = [`%${search}%`, `%${search}%`];
  }

  // 获取总数
  const countQuery = `SELECT COUNT(*) as total FROM published_news ${whereClause}`;
  
  db.get(countQuery, params, (err, countResult) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    const total = countResult.total;
    const totalPages = Math.ceil(total / limitNum);

    // 获取分页数据
    const dataQuery = `
      SELECT 
        id, slug, cover_url, published_at, news_source, news_source_link,
        title, summary, content, tags, created_at, updated_at, syncSta
      FROM published_news 
      ${whereClause}
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `;

    db.all(dataQuery, [...params, limitNum, offset], (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      // 处理tags字段（JSON字符串转数组）
      const processedRows = rows.map(row => ({
        ...row,
        tags: row.tags ? JSON.parse(row.tags) : []
      }));

      res.json({
        data: processedRows,
        pagination: {
          current: pageNum,
          pageSize: limitNum,
          total: total,
          totalPages: totalPages,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1
        },
        search: search
      });
    });
  });
});

// 获取新闻状态统计接口
app.get('/api/news/stats', (req, res) => {
  db.all(
    `SELECT 
       status,
       COUNT(*) as count
     FROM news_status 
     GROUP BY status`,
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      const stats = {
        adopted: 0,
        rejected: 0
      };

      rows.forEach(row => {
        stats[row.status] = row.count;
      });

      res.json(stats);
    }
  );
});

// 发布新闻接口（从外部API获取并保存到published_news表）
app.post('/api/published-news/publish', async (req, res) => {
  const { slug } = req.body;

  if (!slug) {
    return res.status(400).json({ error: '新闻slug不能为空' });
  }

  try {
    // 从外部API获取新闻详情
    const response = await axios.get(`https://api.f1cosmos.com/news/${slug}?lang=zh`);
    const newsData = response.data.data;

    // 检查是否已存在
    db.get('SELECT id FROM published_news WHERE slug = ?', [slug], (err, existingNews) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (existingNews) {
        return res.status(400).json({ error: '该新闻已存在' });
      }

      // 插入到published_news表
      const chinaTime = getChinaTime();
      db.run(
        `INSERT INTO published_news 
         (slug, cover_url, published_at, news_source, news_source_link, title, summary, content, tags, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          slug,
          newsData.cover_url,
          newsData.published_at,
          newsData.news_source?.name || '',
          newsData.link_url || '',
          newsData.title,
          newsData.summary,
          newsData.content,
          JSON.stringify(newsData.news_types?.map(type => type.name) || []),
          chinaTime,
          chinaTime
        ],
        function(err) {
          if (err) {
            return res.status(500).json({ error: err.message });
          }

          res.json({ id: this.lastID, message: '新闻发布成功' });
        }
      );
    });
  } catch (error) {
    console.error('发布新闻失败:', error);
    res.status(500).json({ error: '获取新闻详情失败' });
  }
});

// 更新已发布新闻接口
app.put('/api/published-news/:id', (req, res) => {
  const { id } = req.params;
  const { cover_url, published_at, news_source, news_source_link, title, summary, content, tags } = req.body;

  if (!id) {
    return res.status(400).json({ error: '新闻ID不能为空' });
  }

  if (!title || !summary || !content) {
    return res.status(400).json({ error: '标题、摘要和内容不能为空' });
  }

  // 更新已发布新闻
  const chinaTime = getChinaTime();
  db.run(
    `UPDATE published_news 
     SET cover_url = ?, published_at = ?, news_source = ?, news_source_link = ?, 
         title = ?, summary = ?, content = ?, tags = ?, updated_at = ?
     WHERE id = ?`,
    [cover_url, published_at, news_source, news_source_link, title, summary, content, JSON.stringify(tags || []), chinaTime, id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: '新闻不存在' });
      }

      res.json({ message: '新闻更新成功' });
    }
  );
});

// 删除已发布新闻接口
app.delete('/api/published-news/:id', (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ error: '新闻ID不能为空' });
  }

  // 先获取新闻的slug，用于检查采纳库
  db.get('SELECT slug FROM published_news WHERE id = ?', [id], (err, news) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (!news) {
      return res.status(404).json({ error: '新闻不存在' });
    }

    const newsSlug = news.slug;

    // 删除已发布新闻
    db.run('DELETE FROM published_news WHERE id = ?', [id], function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: '新闻不存在' });
      }

      // 检查并删除采纳库中的对应记录
      db.run('DELETE FROM news_status WHERE news_id = ?', [newsSlug], function(err2) {
        if (err2) {
          console.error('删除采纳库记录失败:', err2);
          // 即使删除采纳库记录失败，也返回成功，因为主要删除操作已完成
        }

        const deletedAdoptedCount = this.changes || 0;
        let message = '新闻删除成功';
        
        if (deletedAdoptedCount > 0) {
          message += '，并已同步删除采纳库中的相关记录';
        }

        res.json({ 
          message: message,
          deletedAdoptedCount: deletedAdoptedCount
        });
      });
    });
  });
});

// 导出所有已发布新闻为JSON并上传到OSS
app.get('/api/newList', (req, res) => {
  // 设置请求超时（60秒，因为生成JSON和上传可能需要较长时间）
  let timeout = setTimeout(() => {
    if (!res.headersSent) {
      res.status(500).json({ error: '请求超时，请稍后重试' });
    }
  }, 60000);

  const query = `
    SELECT id, slug, cover_url, news_source, title, summary, created_at
    FROM published_news
    ORDER BY id DESC
  `;

  db.all(query, [], async (err, rows) => {
    // 清除初始超时
    clearTimeout(timeout);
    
    if (err) {
      console.error('数据库查询失败:', err);
      if (!res.headersSent) {
        return res.status(500).json({ error: `数据库查询失败: ${err.message}` });
      }
      return;
    }

    // 重新设置超时（从查询完成开始，给JSON生成和上传更多时间）
    timeout = setTimeout(() => {
      if (!res.headersSent) {
        res.status(500).json({ error: '处理超时，数据量可能过大，请稍后重试' });
      }
    }, 90000); // 90秒用于JSON生成和上传

    try {
      console.log(`开始同步，共 ${rows.length} 条新闻`);
      
      // 确保 data 目录存在并写入文件
      const dataDir = path.join(__dirname, 'data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      const filePath = path.join(dataDir, 'newsList.json');
      
      // 优化：使用流式JSON生成，避免大对象阻塞事件循环
      console.log('开始生成JSON...');
      const startTime = Date.now();
      
      // 对于大数据量，使用更高效的JSON序列化
      const jsonData = { data: rows };
      // 使用 process.nextTick 让出事件循环，避免阻塞
      await new Promise(resolve => process.nextTick(resolve));
      
      const jsonString = JSON.stringify(jsonData, null, 2);
      const jsonBuffer = Buffer.from(jsonString);
      
      const jsonGenTime = Date.now() - startTime;
      console.log(`JSON 生成完成，耗时: ${jsonGenTime}ms，文件大小: ${(jsonBuffer.length / 1024).toFixed(2)} KB`);
      
      // 写入文件
      await fs.promises.writeFile(filePath, jsonBuffer);
      console.log('本地文件写入完成，开始验证文件...');
      
      // 验证文件是否生成成功
      let fileStats;
      try {
        fileStats = await fs.promises.stat(filePath);
      } catch (statError) {
        clearTimeout(timeout);
        console.error('文件不存在或无法访问:', statError);
        if (!res.headersSent) {
          return res.status(500).json({ 
            error: `文件生成失败: 无法访问生成的文件`,
            count: rows.length
          });
        }
        return;
      }
      
      // 检查文件大小是否合理（应该大于0且与预期大小接近）
      if (fileStats.size === 0) {
        clearTimeout(timeout);
        console.error('文件大小为0，文件生成失败');
        if (!res.headersSent) {
          return res.status(500).json({ 
            error: `文件生成失败: 文件大小为0`,
            count: rows.length
          });
        }
        return;
      }
      
      // 检查文件大小是否与预期一致（允许1字节的误差，因为可能有换行符差异）
      const sizeDiff = Math.abs(fileStats.size - jsonBuffer.length);
      if (sizeDiff > 1) {
        console.warn(`文件大小异常: 预期 ${jsonBuffer.length} 字节，实际 ${fileStats.size} 字节，差异 ${sizeDiff} 字节`);
        // 如果差异较大，读取文件验证内容
        try {
          const fileContent = await fs.promises.readFile(filePath, 'utf8');
          JSON.parse(fileContent); // 验证JSON格式
          console.log('文件大小异常但JSON格式有效，继续上传');
        } catch (parseError) {
          clearTimeout(timeout);
          console.error('文件内容验证失败，JSON格式无效:', parseError);
          if (!res.headersSent) {
            return res.status(500).json({ 
              error: `文件生成失败: JSON格式验证失败 - ${parseError.message}`,
              count: rows.length
            });
          }
          return;
        }
      } else {
        // 文件大小正常，由于jsonBuffer已经验证过（来自JSON.stringify），无需再次验证
        console.log('文件验证成功: 文件存在、大小正常');
      }

      // 文件验证通过，开始上传到 OSS
      const ossKey = 'ChinaF1/newsList.json';
      
      console.log('开始上传到OSS...');
      console.log(`OSS Key: ${ossKey}`);
      console.log(`文件大小: ${(jsonBuffer.length / 1024).toFixed(2)} KB`);
      const uploadStartTime = Date.now();
      
      // 为 OSS 上传添加超时处理（增加到30秒，因为文件可能较大）
      const uploadPromise = uploadBufferWithKey(ossKey, jsonBuffer, 'application/json');
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('OSS上传超时（30秒）')), 30000);
      });
      
      let uploadResult;
      try {
        uploadResult = await Promise.race([uploadPromise, timeoutPromise]);
        const uploadTime = Date.now() - uploadStartTime;
        console.log(`OSS上传完成，耗时: ${uploadTime}ms`);
        if (uploadResult.success) {
          console.log(`OSS上传成功: ${uploadResult.url}`);
        } else {
          console.error(`OSS上传失败: ${uploadResult.error}`);
          if (uploadResult.details) {
            console.error('错误详情:', uploadResult.details);
          }
        }
      } catch (uploadError) {
        console.error('OSS上传异常:', uploadError);
        uploadResult = { 
          success: false, 
          error: uploadError.message || 'OSS上传失败',
          details: uploadError.stack
        };
      }
      
      // 清除超时定时器
      clearTimeout(timeout);
      
      if (!uploadResult || !uploadResult.success) {
        // OSS 上传失败，返回错误信息
        const errorMsg = uploadResult && uploadResult.error ? uploadResult.error : 'OSS上传失败，未知错误';
        const errorDetails = uploadResult && uploadResult.details ? uploadResult.details : undefined;
        console.error('OSS上传失败:', errorMsg);
        if (errorDetails) {
          console.error('详细错误信息:', errorDetails);
        }
        if (!res.headersSent) {
          return res.json({
            success: false,
            error: `OSS上传失败: ${errorMsg}`,
            localPath: filePath,
            oss: { 
              success: false, 
              error: errorMsg,
              details: errorDetails
            },
            count: rows.length
          });
        }
        return;
      }

      if (!res.headersSent) {
        res.json({
          success: true,
          localPath: filePath,
          oss: { success: true, url: uploadResult.url, key: uploadResult.fileName },
          count: rows.length
        });
      }
    } catch (e) {
      // 清除超时定时器
      clearTimeout(timeout);
      console.error('导出/上传 newsList 失败:', e);
      if (!res.headersSent) {
        return res.status(500).json({ 
          error: `导出或上传失败: ${e.message || '未知错误'}` 
        });
      }
    }
  });
});

// 导出单条已发布新闻为 JSON 并上传到 OSS（按 slug）
app.get('/api/newItem/:slug', (req, res) => {
  const { slug } = req.params;
  if (!slug) {
    return res.status(400).json({ error: '缺少 slug 参数' });
  }

  const query = `
    SELECT id, slug, cover_url, news_source, title, summary, content, tags, created_at, updated_at, syncSta
    FROM published_news
    WHERE slug = ?
    LIMIT 1
  `;

  db.get(query, [slug], async (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: '未找到对应的新闻' });
    }

    try {
      const dataDir = path.join(__dirname, 'data', 'news');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      row["content"] = encrypt(row["content"]);
      row["summary"] = encrypt(row["summary"]);
      row["title"] = encrypt(row["title"]);
      row["cover_url"] = encrypt(row["cover_url"]);
     
      const fileName = `${slug}.json`;
      const filePath = path.join(dataDir, fileName);
      const jsonBuffer = Buffer.from(JSON.stringify(row, null, 2));
      await fs.promises.writeFile(filePath, jsonBuffer);

      // 上传到 OSS ChinaF1/news/${slug}.json
      const ossKey = `ChinaF1/news/${fileName}`;
      const uploadResult = await uploadBufferWithKey(ossKey, jsonBuffer, 'application/json');
      if (!uploadResult || !uploadResult.success) {
        return res.json({
          success: true,
          localPath: filePath,
          oss: { success: false, error: uploadResult && uploadResult.error },
        });
      }

      // 可选：标记该条已同步
      db.run('UPDATE published_news SET syncSta = 1 WHERE slug = ?', [slug], (uErr) => {
        if (uErr) {
          console.error('更新 syncSta 失败:', uErr.message);
        }
      });

      return res.json({ success: true, localPath: filePath, oss: { success: true, url: uploadResult.url, key: uploadResult.fileName } });
    } catch (e) {
      console.error('导出/上传单条 news 失败:', e);
      return res.status(500).json({ error: '导出或上传失败' });
    }
  });
});

// 调试接口：重置 published_news 的 syncSta 为 0（需提供正确pwd）
app.get('/api/debug/reset-sync', (req, res) => {
  try {
    const { pwd } = req.query;
    if (pwd !== 'yali1990') {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    db.run('UPDATE published_news SET syncSta = 0', function(err) {
      if (err) {
        return res.status(500).json({ success: false, error: err.message });
      }
      // this.changes 在 SQLite 的 UPDATE 中表示受影响的行数
      return res.json({ success: true, updated: this.changes || 0 });
    });
  } catch (e) {
    return res.status(500).json({ success: false, error: '重置失败' });
  }
});

// 调试接口：重置指定 slug 的 published_news 的 syncSta 为 0（需提供正确pwd）
app.post('/api/debug/reset-sync', (req, res) => {
  try {
    const { slug, pwd } = req.body;
    
    if (pwd !== 'yali1990') {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    if (!slug) {
      return res.status(400).json({ success: false, error: '缺少 slug 参数' });
    }

    db.run('UPDATE published_news SET syncSta = 0 WHERE slug = ?', [slug], function(err) {
      if (err) {
        return res.status(500).json({ success: false, error: err.message });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ success: false, error: '未找到指定 slug 的新闻' });
      }
      
      return res.json({ 
        success: true, 
        updated: this.changes || 0,
        slug: slug,
        message: `成功重置 slug "${slug}" 的同步状态`
      });
    });
  } catch (e) {
    return res.status(500).json({ success: false, error: '重置失败' });
  }
});

app.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
}); 