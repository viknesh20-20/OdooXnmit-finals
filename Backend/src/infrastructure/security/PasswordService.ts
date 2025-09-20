import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { injectable } from 'inversify';

import { IPasswordService } from '@application/interfaces/IPasswordService';
import { ValidationError } from '@domain/exceptions/DomainException';

@injectable()
export class PasswordService implements IPasswordService {
  private readonly saltRounds: number;

  constructor() {
    this.saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS ?? '12', 10);
    if (this.saltRounds < 10) {
      throw new Error('BCRYPT_SALT_ROUNDS must be at least 10 for security');
    }
  }

  public async hash(password: string): Promise<string> {
    if (!password || typeof password !== 'string') {
      throw new ValidationError('Password is required and must be a string');
    }

    if (password.length < 8) {
      throw new ValidationError('Password must be at least 8 characters long');
    }

    if (password.length > 128) {
      throw new ValidationError('Password cannot exceed 128 characters');
    }

    try {
      return await bcrypt.hash(password, this.saltRounds);
    } catch (error) {
      throw new Error(`Failed to hash password: ${(error as Error).message}`);
    }
  }

  public async verify(password: string, hash: string): Promise<boolean> {
    if (!password || typeof password !== 'string') {
      return false;
    }

    if (!hash || typeof hash !== 'string') {
      return false;
    }

    try {
      return await bcrypt.compare(password, hash);
    } catch (error) {
      // Log error but don't throw to prevent timing attacks
      console.error('Password verification error:', error);
      return false;
    }
  }

  public generateSecurePassword(length: number = 16): string {
    if (length < 8) {
      throw new ValidationError('Password length must be at least 8 characters');
    }

    if (length > 128) {
      throw new ValidationError('Password length cannot exceed 128 characters');
    }

    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    const allChars = lowercase + uppercase + numbers + symbols;

    let password = '';

    // Ensure at least one character from each category
    password += this.getRandomChar(lowercase);
    password += this.getRandomChar(uppercase);
    password += this.getRandomChar(numbers);
    password += this.getRandomChar(symbols);

    // Fill the rest with random characters
    for (let i = 4; i < length; i++) {
      password += this.getRandomChar(allChars);
    }

    // Shuffle the password to avoid predictable patterns
    return this.shuffleString(password);
  }

  public validatePasswordStrength(password: string): {
    isValid: boolean;
    score: number;
    feedback: string[];
  } {
    const feedback: string[] = [];
    let score = 0;

    if (!password || typeof password !== 'string') {
      return {
        isValid: false,
        score: 0,
        feedback: ['Password is required'],
      };
    }

    // Length check
    if (password.length < 8) {
      feedback.push('Password must be at least 8 characters long');
    } else if (password.length >= 8) {
      score += 1;
    }

    if (password.length >= 12) {
      score += 1;
    }

    if (password.length >= 16) {
      score += 1;
    }

    // Character variety checks
    if (/[a-z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Password must contain at least one lowercase letter');
    }

    if (/[A-Z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Password must contain at least one uppercase letter');
    }

    if (/\d/.test(password)) {
      score += 1;
    } else {
      feedback.push('Password must contain at least one digit');
    }

    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Password must contain at least one special character');
    }

    // Common patterns check
    if (this.hasCommonPatterns(password)) {
      score -= 2;
      feedback.push('Password contains common patterns or sequences');
    }

    // Dictionary words check (simplified)
    if (this.containsCommonWords(password)) {
      score -= 1;
      feedback.push('Password contains common dictionary words');
    }

    // Repetitive characters check
    if (this.hasRepetitiveCharacters(password)) {
      score -= 1;
      feedback.push('Password contains too many repetitive characters');
    }

    const isValid = score >= 4 && feedback.length === 0;

    return {
      isValid,
      score: Math.max(0, Math.min(10, score)),
      feedback,
    };
  }

  private getRandomChar(chars: string): string {
    const randomIndex = crypto.randomInt(0, chars.length);
    return chars[randomIndex]!;
  }

  private shuffleString(str: string): string {
    const array = str.split('');
    for (let i = array.length - 1; i > 0; i--) {
      const j = crypto.randomInt(0, i + 1);
      [array[i], array[j]] = [array[j]!, array[i]!];
    }
    return array.join('');
  }

  private hasCommonPatterns(password: string): boolean {
    const commonPatterns = [
      /123456/,
      /abcdef/,
      /qwerty/,
      /password/i,
      /admin/i,
      /(.)\1{2,}/, // Three or more consecutive identical characters
      /(012|123|234|345|456|567|678|789|890)/, // Sequential numbers
      /(abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)/i, // Sequential letters
    ];

    return commonPatterns.some(pattern => pattern.test(password));
  }

  private containsCommonWords(password: string): boolean {
    const commonWords = [
      'password', 'admin', 'user', 'login', 'welcome', 'hello', 'world',
      'test', 'demo', 'sample', 'example', 'default', 'guest', 'public',
      'private', 'secret', 'key', 'access', 'system', 'database', 'server',
    ];

    const lowerPassword = password.toLowerCase();
    return commonWords.some(word => lowerPassword.includes(word));
  }

  private hasRepetitiveCharacters(password: string): boolean {
    let consecutiveCount = 1;
    let maxConsecutive = 1;

    for (let i = 1; i < password.length; i++) {
      if (password[i] === password[i - 1]) {
        consecutiveCount++;
        maxConsecutive = Math.max(maxConsecutive, consecutiveCount);
      } else {
        consecutiveCount = 1;
      }
    }

    // Check for too many repetitive characters
    if (maxConsecutive >= 3) {
      return true;
    }

    // Check for too many of the same character overall
    const charCounts = new Map<string, number>();
    for (const char of password) {
      charCounts.set(char, (charCounts.get(char) ?? 0) + 1);
    }

    const maxCharCount = Math.max(...charCounts.values());
    const threshold = Math.ceil(password.length * 0.4); // More than 40% of the same character

    return maxCharCount > threshold;
  }
}
