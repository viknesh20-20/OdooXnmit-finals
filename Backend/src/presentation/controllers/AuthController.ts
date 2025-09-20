import { Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import { body, validationResult } from 'express-validator';

import { ILoginUseCase, RefreshTokenUseCase, LogoutUseCase } from '@application/use-cases/auth/LoginUseCase';
import { IRegisterUserUseCase, RegisterCommandDTO } from '@application/use-cases/auth/RegisterUserUseCase';
import { IForgotPasswordUseCase, ForgotPasswordCommandDTO } from '@application/use-cases/auth/ForgotPasswordUseCase';
import { IResetPasswordUseCase, ResetPasswordCommandDTO } from '@application/use-cases/auth/ResetPasswordUseCase';
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
    @inject('IRegisterUserUseCase') private readonly registerUseCase: IRegisterUserUseCase,
    @inject('IForgotPasswordUseCase') private readonly forgotPasswordUseCase: IForgotPasswordUseCase,
    @inject('IResetPasswordUseCase') private readonly resetPasswordUseCase: IResetPasswordUseCase,
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
        
        this.logger.error('Login failed with detailed error', new Error(`Login failed: ${result.error.message}`), {
          errorCode: result.error.code,
          usernameOrEmail,
          statusCode,
          fullError: result.error,
        });

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

  public async register(req: Request, res: Response): Promise<void> {
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

      const { username, email, password, firstName, lastName, roleId } = req.body;

      const command: RegisterCommandDTO = {
        username,
        email,
        password,
        firstName,
        lastName,
        roleId,
      };

      const result = await this.registerUseCase.execute(command);

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

      this.logger.info('User registered successfully', {
        userId: result.value.user.id,
        username: result.value.user.username,
        email: result.value.user.email,
      });

      res.status(201).json({
        success: true,
        data: {
          user: result.value.user,
          accessToken: result.value.tokens.accessToken,
          expiresIn: result.value.tokens.expiresIn,
          message: result.value.message,
        },
      });
    } catch (error) {
      this.logger.error('Registration error', error as Error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred',
        },
      });
    }
  }

  public async forgotPassword(req: Request, res: Response): Promise<void> {
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

      const { email } = req.body;

      const command: ForgotPasswordCommandDTO = { email };

      const result = await this.forgotPasswordUseCase.execute(command);

      if (!result.success) {
        const statusCode = this.getStatusCodeFromError(result.error.code);
        res.status(statusCode).json({
          success: false,
          error: result.error,
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: result.value.message,
      });
    } catch (error) {
      this.logger.error('Forgot password error', error as Error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred',
        },
      });
    }
  }

  public async resetPassword(req: Request, res: Response): Promise<void> {
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

      const { token, newPassword, confirmPassword } = req.body;

      const command: ResetPasswordCommandDTO = {
        token,
        newPassword,
        confirmPassword,
      };

      const result = await this.resetPasswordUseCase.execute(command);

      if (!result.success) {
        const statusCode = this.getStatusCodeFromError(result.error.code);
        res.status(statusCode).json({
          success: false,
          error: result.error,
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: result.value.message,
      });
    } catch (error) {
      this.logger.error('Reset password error', error as Error);
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

  public async validateToken(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // If we reach here, the token is already validated by the auth middleware
      // Just return success with user info
      const { user } = req;
      
      if (!user) {
        res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_TOKEN',
            message: 'Invalid or expired token',
          },
        });
        return;
      }

      this.logger.info('Token validated successfully', { userId: user.userId });

      res.status(200).json({
        success: true,
        data: {
          user: {
            id: user.userId,
            username: user.username,
            email: user.email,
            roleId: user.roleId,
          },
        },
        message: 'Token is valid',
      });
    } catch (error) {
      this.logger.error('Token validation error', error as Error);
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired token',
        },
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

export const registerValidation = [
  body('username')
    .notEmpty()
    .withMessage('Username is required')
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  
  body('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be between 8 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  
  body('firstName')
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ min: 1, max: 50 })
    .withMessage('First name must be between 1 and 50 characters')
    .trim(),
  
  body('lastName')
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name must be between 1 and 50 characters')
    .trim(),
  
  body('roleId')
    .optional()
    .isUUID()
    .withMessage('Role ID must be a valid UUID'),
];

export const forgotPasswordValidation = [
  body('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
];

export const resetPasswordValidation = [
  body('token')
    .notEmpty()
    .withMessage('Reset token is required')
    .isLength({ min: 10 })
    .withMessage('Invalid reset token'),
  
  body('newPassword')
    .notEmpty()
    .withMessage('New password is required')
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be between 8 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  
  body('confirmPassword')
    .notEmpty()
    .withMessage('Confirm password is required')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),
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
