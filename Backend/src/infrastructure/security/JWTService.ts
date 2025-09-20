import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { injectable, inject } from 'inversify';

import { IJWTService } from '@application/interfaces/IPasswordService';
import { IRefreshTokenRepository } from '@domain/repositories/IUserRepository';
import { ValidationError } from '@domain/exceptions/DomainException';
import { JWTConfig } from '@/types/common';
import { RefreshToken } from '@domain/entities/RefreshToken';

export interface JWTPayload {
  userId: string;
  username: string;
  email: string;
  roleId?: string;
  iat: number;
  exp: number;
}

@injectable()
export class JWTService implements IJWTService {
  constructor(
    @inject('JWTConfig') private readonly config: JWTConfig,
    @inject('IRefreshTokenRepository') private readonly refreshTokenRepository: IRefreshTokenRepository
  ) {
    this.validateConfig();
  }

  public async generateAccessToken(payload: {
    userId: string;
    username: string;
    email: string;
    roleId?: string;
  }): Promise<string> {
    try {
      const tokenPayload = {
        userId: payload.userId,
        username: payload.username,
        email: payload.email,
        roleId: payload.roleId,
      };

      return jwt.sign(
        tokenPayload,
        this.config.secret as string,
        {
          expiresIn: this.config.expiresIn as any,
          issuer: 'manufacturing-erp',
          audience: 'manufacturing-erp-users',
          subject: payload.userId,
        }
      );
    } catch (error) {
      throw new Error(`Failed to generate access token: ${(error as Error).message}`);
    }
  }

  public async generateRefreshToken(userId: string): Promise<{
    token: string;
    refreshToken: import('@domain/entities/RefreshToken').RefreshToken;
  }> {
    try {
      // Generate a secure random token
      const token = crypto.randomBytes(40).toString('hex');
      const tokenHash = this.hashToken(token);

      // Calculate expiration date
      const expirationMs = this.parseExpiresIn(this.config.refreshExpiresIn);
      const expiresAt = new Date(Date.now() + expirationMs);

      // Create refresh token entity
      const refreshTokenEntity = RefreshToken.create({
        userId,
        token: tokenHash,
        expiresAt,
      });

      // Save to repository
      const savedToken = await this.refreshTokenRepository.save(refreshTokenEntity);

      return {
        token,
        refreshToken: savedToken,
      };
    } catch (error) {
      throw new Error(`Failed to generate refresh token: ${(error as Error).message}`);
    }
  }

  public async verifyAccessToken(token: string): Promise<JWTPayload> {
    try {
      if (!token || typeof token !== 'string') {
        throw new ValidationError('Token is required and must be a string');
      }

      const decoded = jwt.verify(token, this.config.secret, {
        issuer: 'manufacturing-erp',
        audience: 'manufacturing-erp-users',
      }) as JWTPayload;

      return decoded;
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new ValidationError(`Invalid token: ${error.message}`);
      }
      if (error instanceof jwt.TokenExpiredError) {
        throw new ValidationError('Token has expired');
      }
      if (error instanceof jwt.NotBeforeError) {
        throw new ValidationError('Token is not active yet');
      }
      throw new Error(`Token verification failed: ${(error as Error).message}`);
    }
  }

  public hashToken(token: string): string {
    if (!token || typeof token !== 'string') {
      throw new ValidationError('Token is required and must be a string');
    }

    return crypto.createHash('sha256').update(token).digest('hex');
  }

  public getAccessTokenExpirationTime(): number {
    return this.parseExpiresIn(this.config.expiresIn) / 1000; // Return in seconds
  }

  public getRefreshTokenExpirationTime(): number {
    return this.parseExpiresIn(this.config.refreshExpiresIn) / 1000; // Return in seconds
  }

  private validateConfig(): void {
    if (!this.config.secret || this.config.secret.length < 32) {
      throw new Error('JWT secret must be at least 32 characters long');
    }

    if (!this.config.refreshSecret || this.config.refreshSecret.length < 32) {
      throw new Error('JWT refresh secret must be at least 32 characters long');
    }

    if (this.config.secret === this.config.refreshSecret) {
      throw new Error('JWT secret and refresh secret must be different');
    }

    // Validate expiration formats
    try {
      this.parseExpiresIn(this.config.expiresIn);
      this.parseExpiresIn(this.config.refreshExpiresIn);
    } catch (error) {
      throw new Error(`Invalid JWT expiration format: ${(error as Error).message}`);
    }
  }

  private parseExpiresIn(expiresIn: string): number {
    const units: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };

    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) {
      throw new Error('Invalid expiresIn format. Use format like "7d", "24h", "60m", "3600s"');
    }

    const [, value, unit] = match;
    const multiplier = units[unit!];

    if (!multiplier) {
      throw new Error(`Invalid time unit: ${unit}. Use s, m, h, or d`);
    }

    return parseInt(value!, 10) * multiplier;
  }
}

@injectable()
export class TokenBlacklistService {
  private readonly blacklistedTokens = new Set<string>();
  private readonly cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired tokens every hour
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredTokens();
    }, 60 * 60 * 1000);
  }

  public blacklistToken(token: string, expiresAt: Date): void {
    const tokenKey = `${token}:${expiresAt.getTime()}`;
    this.blacklistedTokens.add(tokenKey);
  }

  public isTokenBlacklisted(token: string): boolean {
    // Check if any entry starts with this token
    for (const blacklistedToken of this.blacklistedTokens) {
      if (blacklistedToken.startsWith(`${token}:`)) {
        return true;
      }
    }
    return false;
  }

  public clearBlacklist(): void {
    this.blacklistedTokens.clear();
  }

  public getBlacklistSize(): number {
    return this.blacklistedTokens.size;
  }

  public getTokenExpirationTime(token: string): number | null {
    try {
      const decoded = jwt.decode(token) as JWTPayload;
      if (!decoded || !decoded.exp) {
        return null;
      }
      // Return the time until expiration in seconds
      const currentTime = Math.floor(Date.now() / 1000);
      const expirationTime = decoded.exp;
      const timeUntilExpiration = expirationTime - currentTime;
      
      return timeUntilExpiration > 0 ? timeUntilExpiration : 0;
    } catch (error) {
      return null;
    }
  }

  private cleanupExpiredTokens(): void {
    const now = Date.now();
    const expiredTokens: string[] = [];

    for (const tokenKey of this.blacklistedTokens) {
      const [, expirationTime] = tokenKey.split(':');
      if (parseInt(expirationTime!, 10) < now) {
        expiredTokens.push(tokenKey);
      }
    }

    expiredTokens.forEach(token => {
      this.blacklistedTokens.delete(token);
    });

    if (expiredTokens.length > 0) {
      console.log(`Cleaned up ${expiredTokens.length} expired blacklisted tokens`);
    }
  }

  public destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.blacklistedTokens.clear();
  }
}
