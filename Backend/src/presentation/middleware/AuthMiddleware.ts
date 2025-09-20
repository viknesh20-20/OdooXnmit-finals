import { Request, Response, NextFunction } from 'express';
import { inject, injectable } from 'inversify';
import jwt from 'jsonwebtoken';

import { IJWTService } from '@application/interfaces/IPasswordService';
import { ILogger } from '@application/interfaces/IPasswordService';
import { AuthenticatedRequest } from '@presentation/controllers/AuthController';

// Simple authentication middleware for testing
export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: {
        code: 'MISSING_TOKEN',
        message: 'Authorization token is required',
      },
    });
    return;
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix

  try {
    const secret = process.env.JWT_SECRET || 'your-secret-key';
    const payload = jwt.verify(token, secret) as any;

    (req as any).user = {
      userId: payload.userId,
      username: payload.username,
      email: payload.email,
      roleId: payload.roleId || undefined,
    };

    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid or expired token',
      },
    });
  }
};

@injectable()
export class AuthMiddleware {
  constructor(
    @inject('IJWTService') private readonly jwtService: IJWTService,
    @inject('ILogger') private readonly logger: ILogger
  ) {}

  public authenticate = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({
          success: false,
          error: {
            code: 'MISSING_TOKEN',
            message: 'Authorization token is required',
          },
        });
        return;
      }

      const token = authHeader.substring(7); // Remove 'Bearer ' prefix

      try {
        const payload = await this.jwtService.verifyAccessToken(token);
        
        req.user = {
          userId: payload.userId,
          username: payload.username,
          email: payload.email,
          roleId: payload.roleId || undefined,
        };

        next();
      } catch (error) {
        this.logger.warn('Token verification failed', {
          error: (error as Error).message,
          token: token.substring(0, 20) + '...', // Log partial token for debugging
        });

        res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_TOKEN',
            message: 'Invalid or expired token',
          },
        });
      }
    } catch (error) {
      this.logger.error('Authentication middleware error', error as Error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred',
        },
      });
    }
  };

  public optionalAuthenticate = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        // No token provided, continue without authentication
        next();
        return;
      }

      const token = authHeader.substring(7);

      try {
        const payload = await this.jwtService.verifyAccessToken(token);
        
        req.user = {
          userId: payload.userId,
          username: payload.username,
          email: payload.email,
          roleId: payload.roleId || undefined,
        };
      } catch (error) {
        // Invalid token, but continue without authentication
        this.logger.debug('Optional authentication failed', {
          error: (error as Error).message,
        });
      }

      next();
    } catch (error) {
      this.logger.error('Optional authentication middleware error', error as Error);
      next(); // Continue even on error
    }
  };
}

@injectable()
export class RoleAuthorizationMiddleware {
  constructor(
    @inject('ILogger') private readonly logger: ILogger
  ) {}

  public requireRole = (allowedRoles: string[]) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
      try {
        if (!req.user) {
          res.status(401).json({
            success: false,
            error: {
              code: 'UNAUTHORIZED',
              message: 'Authentication required',
            },
          });
          return;
        }

        if (!req.user.roleId) {
          res.status(403).json({
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'User has no assigned role',
            },
          });
          return;
        }

        if (!allowedRoles.includes(req.user.roleId)) {
          this.logger.warn('Access denied - insufficient role', {
            userId: req.user.userId,
            userRole: req.user.roleId,
            requiredRoles: allowedRoles,
          });

          res.status(403).json({
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'Insufficient permissions',
            },
          });
          return;
        }

        next();
      } catch (error) {
        this.logger.error('Role authorization middleware error', error as Error);
        res.status(500).json({
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'An unexpected error occurred',
          },
        });
      }
    };
  };

  public requirePermission = (permission: string) => {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
      try {
        if (!req.user) {
          res.status(401).json({
            success: false,
            error: {
              code: 'UNAUTHORIZED',
              message: 'Authentication required',
            },
          });
          return;
        }

        // In a real implementation, you would fetch the user's permissions
        // from the database or cache based on their role
        // For now, we'll assume the permission check passes
        
        // TODO: Implement permission checking logic
        // const hasPermission = await this.checkUserPermission(req.user.userId, permission);
        const hasPermission = true; // Placeholder

        if (!hasPermission) {
          this.logger.warn('Access denied - missing permission', {
            userId: req.user.userId,
            requiredPermission: permission,
          });

          res.status(403).json({
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: `Permission '${permission}' required`,
            },
          });
          return;
        }

        next();
      } catch (error) {
        this.logger.error('Permission authorization middleware error', error as Error);
        res.status(500).json({
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'An unexpected error occurred',
          },
        });
      }
    };
  };
}

@injectable()
export class RateLimitMiddleware {
  private readonly requests = new Map<string, { count: number; resetTime: number }>();
  private readonly cleanupInterval: NodeJS.Timeout;

  constructor(
    @inject('ILogger') private readonly logger: ILogger,
    private readonly windowMs: number = 15 * 60 * 1000, // 15 minutes
    private readonly maxRequests: number = 100
  ) {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  public limit = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const key = this.getKey(req);
      const now = Date.now();
      const windowStart = now - this.windowMs;

      let requestData = this.requests.get(key);

      if (!requestData || requestData.resetTime <= now) {
        // New window or expired window
        requestData = {
          count: 1,
          resetTime: now + this.windowMs,
        };
        this.requests.set(key, requestData);
      } else {
        // Within current window
        requestData.count++;
      }

      // Set rate limit headers
      res.set({
        'X-RateLimit-Limit': this.maxRequests.toString(),
        'X-RateLimit-Remaining': Math.max(0, this.maxRequests - requestData.count).toString(),
        'X-RateLimit-Reset': new Date(requestData.resetTime).toISOString(),
      });

      if (requestData.count > this.maxRequests) {
        this.logger.warn('Rate limit exceeded', {
          key,
          count: requestData.count,
          limit: this.maxRequests,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
        });

        res.status(429).json({
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests, please try again later',
            retryAfter: Math.ceil((requestData.resetTime - now) / 1000),
          },
        });
        return;
      }

      next();
    } catch (error) {
      this.logger.error('Rate limit middleware error', error as Error);
      next(); // Continue on error to avoid blocking legitimate requests
    }
  };

  private getKey(req: Request): string {
    // Use IP address as the key, but could be enhanced to use user ID for authenticated requests
    const authReq = req as AuthenticatedRequest;
    return authReq.user?.userId || req.ip || 'unknown';
  }

  private cleanup(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, data] of this.requests.entries()) {
      if (data.resetTime <= now) {
        this.requests.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      this.logger.debug('Rate limit cleanup completed', {
        cleanedEntries: cleanedCount,
        remainingEntries: this.requests.size,
      });
    }
  }

  public destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.requests.clear();
  }
}
