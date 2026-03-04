const CryptoJS = require('crypto-js');

const AES_KEY = process.env.AES_SECRET_KEY || 'loom_look_aes_256_bit_secret_key!';

/**
 * Encrypt plain text using AES
 */
const encrypt = (plainText) => {
    if (!plainText) return '';
    return CryptoJS.AES.encrypt(String(plainText), AES_KEY).toString();
};

/**
 * Decrypt AES cipher text
 */
const decrypt = (cipherText) => {
    if (!cipherText) return '';
    try {
        const bytes = CryptoJS.AES.decrypt(cipherText, AES_KEY);
        return bytes.toString(CryptoJS.enc.Utf8);
    } catch {
        return '';
    }
};

/**
 * Encrypt an object's fields
 */
const encryptObject = (obj, fields) => {
    const encrypted = { ...obj };
    fields.forEach((field) => {
        if (obj[field] !== undefined) {
            encrypted[field] = encrypt(obj[field]);
        }
    });
    return encrypted;
};

/**
 * Decrypt an object's fields
 */
const decryptObject = (obj, fieldMap) => {
    // fieldMap: { encryptedField: 'plainField' }
    const decrypted = { ...obj };
    Object.entries(fieldMap).forEach(([encField, plainField]) => {
        if (obj[encField] !== undefined) {
            decrypted[plainField] = decrypt(obj[encField]);
            delete decrypted[encField];
        }
    });
    return decrypted;
};

module.exports = { encrypt, decrypt, encryptObject, decryptObject };
