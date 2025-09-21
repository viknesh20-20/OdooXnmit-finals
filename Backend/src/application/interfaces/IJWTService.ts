import { UUID } from '@/types/common';
import { RefreshToken } from '@domain/entities/RefreshToken';

export interface TokenPayload {
  readonly userId: UUID;
  readonly username: string;
  readonly email: string;
  readonly roleId?: UUID;
}

export interface TokenPair {
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly expiresIn: string;
}

export interface IJWTService {
  /**
   * Generate an access token for the given user
   */
  generateAccessToken(payload: TokenPayload): string;

  /**
   * Generate a refresh token for the given user
   */
  generateRefreshToken(userId: UUID): Promise<{
    token: string;
    refreshToken: RefreshToken;
  }>;

  /**
   * Generate both access and refresh tokens
   */
  generateTokenPair(payload: TokenPayload): Promise<TokenPair>;

  /**
   * Verify and decode an access token
   */
  verifyAccessToken(token: string): TokenPayload | null;

  /**
   * Verify a refresh token
   */
  verifyRefreshToken(token: string): Promise<{
    isValid: boolean;
    userId?: UUID;
    tokenId?: UUID;
  }>;

  /**
   * Refresh an access token using a refresh token
   */
  refreshAccessToken(refreshToken: string): Promise<{
    accessToken: string;
    expiresIn: string;
  } | null>;

  /**
   * Revoke a refresh token
   */
  revokeRefreshToken(tokenId: UUID): Promise<void>;

  /**
   * Get token expiration time in seconds
   */
  getTokenExpirationTime(token: string): number | null;

  /**
   * Get access token expiration time in seconds
   */
  getAccessTokenExpirationTime(): number;
}
