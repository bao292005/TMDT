import crypto from 'crypto';

export const authService = {
  /**
   * Mã hóa mật khẩu an toàn
   */
  hashPassword(password: string): string {
    // Trong thực tế nên dùng bcrypt.hash()
    // Code demo dùng crypto native của Node.js
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return `${salt}:${hash}`;
  },

  /**
   * So sánh mật khẩu nhập vào và mật khẩu trong DB
   */
  verifyPassword(password: string, storedHash: string): boolean {
    const [salt, key] = storedHash.split(':');
    const hashedBuffer = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512');
    const keyBuffer = Buffer.from(key, 'hex');
    return crypto.timingSafeEqual(hashedBuffer, keyBuffer);
  },

  /**
   * Sinh Token phiên làm việc (Mock)
   */
  generateSessionToken(userId: string): string {
    // Thực tế sẽ dùng JWT (jsonwebtoken)
    const payload = Buffer.from(JSON.stringify({ userId, exp: Date.now() + 86400000 })).toString('base64');
    const signature = crypto.createHmac('sha256', process.env.AUTH_SECRET || 'secret').update(payload).digest('hex');
    return `${payload}.${signature}`;
  }
};