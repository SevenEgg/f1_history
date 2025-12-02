const crypto = require('crypto');

const key = 'yali1990yali1990';
const algorithm = 'aes-128-ecb';
const keyBuffer = Buffer.from(key, 'utf8');

function encrypt(text) {
  try {
    if (!text || text === null || text === undefined) {
      console.warn('[encrypt] 警告: 输入文本为空');
      return '';
    }
    const cipher = crypto.createCipheriv(algorithm, keyBuffer, null);
    let encrypted = cipher.update(text, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    return encrypted;
  } catch (error) {
    console.error('[encrypt] 加密失败:', error);
    throw error;
  }
}

function decrypt(encryptedText) {
  try {
    if (!encryptedText || encryptedText === null || encryptedText === undefined) {
      console.warn('[decrypt] 警告: 输入文本为空');
      return '';
    }
    const decipher = crypto.createDecipheriv(algorithm, keyBuffer, null);
    let decrypted = decipher.update(encryptedText, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('[decrypt] 解密失败:', error);
    throw error;
  }
}

module.exports = {
  encrypt,
  decrypt
};