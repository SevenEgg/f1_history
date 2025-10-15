import crypto from 'crypto';

const key = 'yali1990yali1990';
const algorithm = 'aes-128-ecb';
const keyBuffer = Buffer.from(key, 'utf8');

function encrypt(text) {
    const cipher = crypto.createCipheriv(algorithm, keyBuffer, null);
    let encrypted = cipher.update(text, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    return encrypted;
}

function decrypt(encryptedText) {
    const decipher = crypto.createDecipheriv(algorithm, keyBuffer, null);
    let decrypted = decipher.update(encryptedText, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

export {
    encrypt,
    decrypt
}