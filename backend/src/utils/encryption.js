const crypto = require('crypto');
const util = require('util');

const randomBytesAsync = util.promisify(crypto.randomBytes);

// The 256-bit (32 byte) encryption key is required
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'super-secret-default-key-that-is-exactly-32-b'; // For tests fallback
const ALGORITHM = 'aes-256-gcm';

/**
 * Encrypts plaintext into a securely authenticated ciphertext format
 * Format: "iv:authTag:ciphertext"
 */
async function encrypt(text) {
  if (!text) return text;
  
  // Create a 96-bit (12 byte) Initialization Vector asynchronously to avoid blocking the event loop
  const iv = await randomBytesAsync(12);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY.substring(0, 32)), iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypts a previously encrypted string.
 * Format: "iv:authTag:ciphertext"
 * Note: Made async for API consistency with encrypt()
 */
async function decrypt(hash) {
  if (!hash || !hash.includes(':')) return hash; // If not encrypted format, return as is

  try {
    const parts = hash.split(':');
    if (parts.length !== 3) return hash;

    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encryptedText = Buffer.from(parts[2], 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY.substring(0, 32)), iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (err) {
    console.error('[Encryption] Failed to decrypt message:', err);
    return '*** [Encrypted Message] ***'; // Failsafe
  }
}

module.exports = { encrypt, decrypt };
