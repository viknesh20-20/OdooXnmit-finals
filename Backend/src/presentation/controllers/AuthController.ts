import { Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import { body, validationResult } from 'express-validator';

import { ILoginUseCase, RefreshTokenUseCase, LogoutUseCase } from '@application/use-cases/auth/LoginUseCase';
import { ILogger } from '@application/interfaces/IPasswordService';
import { ValidationError } from '@domain/exceptions/DomainException';
import { LoginCommandDTO } from '@application/dtos/UserDTOs';

// Extend Request interface to include user property
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        username: string;
        email: string;
        roleId?: string;
      };
    }
  }
}

@injectable()
export class AuthController {
  constructor(
    @inject('ILoginUseCase') private readonly loginUseCase: ILoginUseCase,
    @inject('RefreshTokenUseCase') private readonly refreshTokenUseCase: RefreshTokenUseCase,
    @inject('LogoutUseCase') private readonly logoutUseCase: LogoutUseCase,
    @inject('ILogger') private readonly logger: ILogger
  ) {}

  public async login(req: Request, res: Response): Promise<void> {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: errors.array(),
          },
        });
        return;
      }

      const { usernameOrEmail, password } = req.body;

      const command: LoginCommandDTO = {
        usernameOrEmail,
        password,
      };

      const result = await this.loginUseCase.execute(command);

      if (!result.success) {
        const statusCode = this.getStatusCodeFromError(result.error.code);
        res.status(statusCode).json({
          success: false,
          error: result.error,
        });
        return;
      }

      // Set refresh token as httpOnly cookie
      res.cookie('refreshToken', result.value.tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      this.logger.info('User logged in successfully', {
        userId: result.value.user.id,
        username: result.value.user.username,
      });

      res.status(200).json({
        success: true,
        data: {
          user: result.value.user,
          accessToken: result.value.tokens.accessToken,
          expiresIn: result.value.tokens.expiresIn,
        },
      });
    } catch (error) {
      this.logger.error('Login error', error as Error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred',
        },
      });
    }
  }

  public async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

      if (!refreshToken) {
        res.status(401).json({
          success: false,
          error: {
            code: 'MISSING_REFRESH_TOKEN',
            message: 'Refresh token is required',
          },
        });
        return;
      }

      const result = await this.refreshTokenUseCase.execute(refreshToken);

      if (!result.success) {
        // Clear invalid refresh token cookie
        res.clearCookie('refreshToken');
        
        const statusCode = this.getStatusCodeFromError(result.error.code);
        res.status(statusCode).json({
          success: false,
          error: result.error,
        });
        return;
      }

      // Set new refresh token as httpOnly cookie
      res.cookie('refreshToken', result.value.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.status(200).json({
        success: true,
        data: {
          accessToken: result.value.accessToken,
          expiresIn: result.value.expiresIn,
        },
      });
    } catch (error) {
      this.logger.error('Refresh token error', error as Error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred',
        },
      });
    }
  }

  public async logout(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const refreshToken = req.cookies.refreshToken;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User not authenticated',
          },
        });
        return;
      }

      const result = await this.logoutUseCase.execute(userId, refreshToken);

      // Clear refresh token cookie
      res.clearCookie('refreshToken');

      if (!result.success) {
        this.logger.warn('Logout error', { error: result.error, userId });
        // Still return success to client as logout should always succeed from client perspective
      }

      this.logger.info('User logged out successfully', { userId });

      res.status(200).json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      this.logger.error('Logout error', error as Error);
      
      // Clear refresh token cookie even on error
      res.clearCookie('refreshToken');
      
      res.status(200).json({
        success: true,
        message: 'Logged out successfully',
      });
    }
  }

  public async logoutAll(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User not authenticated',
          },
        });
        return;
      }

      const result = await this.logoutUseCase.execute(userId); // No refresh token = logout all

      // Clear refresh token cookie
      res.clearCookie('refreshToken');

      if (!result.success) {
        this.logger.warn('Logout all error', { error: result.error, userId });
        // Still return success to client
      }

      this.logger.info('User logged out from all devices', { userId });

      res.status(200).json({
        success: true,
        message: 'Logged out from all devices successfully',
      });
    } catch (error) {
      this.logger.error('Logout all error', error as Error);
      
      // Clear refresh token cookie even on error
      res.clearCookie('refreshToken');
      
      res.status(200).json({
        success: true,
        message: 'Logged out from all devices successfully',
      });
    }
  }

  private getStatusCodeFromError(errorCode: string): number {
    switch (errorCode) {
      case 'VALIDATION_ERROR':
        return 400;
      case 'ENTITY_NOT_FOUND':
        return 404;
      case 'BUSINESS_RULE_VIOLATION':
        return 422;
      case 'UNAUTHORIZED':
        return 401;
      case 'FORBIDDEN':
        return 403;
      default:
        return 500;
    }
  }
}

// Validation middleware for auth endpoints
export const loginValidation = [
  body('usernameOrEmail')
    .notEmpty()
    .withMessage('Username or email is required')
    .isLength({ min: 3, max: 255 })
    .withMessage('Username or email must be between 3 and 255 characters'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be between 8 and 128 characters'),
];

export const refreshTokenValidation = [
  // Refresh token can come from cookie or body, so we don't validate it here
  // The controller will handle the validation
];

// Custom middleware to extract user from JWT
export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    username: string;
    email: string;
    roleId?: string;
  };
}
