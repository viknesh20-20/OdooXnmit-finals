import { inject, injectable } from 'inversify';

import { Result, success, failure } from '@/types/common';
import { IUserRepository } from '@domain/repositories/IUserRepository';
import { IRefreshTokenRepository } from '@domain/repositories/IUserRepository';
import { EntityNotFoundError, ValidationError, BusinessRuleViolationError } from '@domain/exceptions/DomainException';
import { Email, Username } from '@domain/value-objects/Email';
import { LoginCommandDTO, LoginResponseDTO, UserResponseDTO, AuthTokensResponseDTO } from '@application/dtos/UserDTOs';
import { IPasswordService } from '@application/interfaces/IPasswordService';
import { IJWTService } from '@application/interfaces/IJWTService';
import { IEventPublisher } from '@application/interfaces/IEventPublisher';
import { UserMapper } from '@application/mappers/UserMapper';

export interface ILoginUseCase {
  execute(command: LoginCommandDTO): Promise<Result<LoginResponseDTO>>;
}

@injectable()
export class LoginUseCase implements ILoginUseCase {
  constructor(
    @inject('IUserRepository') private readonly userRepository: IUserRepository,
    @inject('IRefreshTokenRepository') private readonly refreshTokenRepository: IRefreshTokenRepository,
    @inject('IPasswordService') private readonly passwordService: IPasswordService,
    @inject('IJWTService') private readonly jwtService: IJWTService,
    @inject('IEventPublisher') private readonly eventPublisher: IEventPublisher,
    @inject('UserMapper') private readonly userMapper: UserMapper
  ) {}

  public async execute(command: LoginCommandDTO): Promise<Result<LoginResponseDTO>> {
    try {
      // Validate input
      if (!command.usernameOrEmail || !command.password) {
        return failure(new ValidationError('Username/email and password are required').toDomainError());
      }

      // Find user by email or username
      const user = await this.findUserByEmailOrUsername(command.usernameOrEmail);
      if (!user) {
        return failure(new EntityNotFoundError('User', command.usernameOrEmail).toDomainError());
      }

      // Check if user can login
      if (!user.canLogin()) {
        if (!user.isActive()) {
          return failure(new BusinessRuleViolationError('User account is not active').toDomainError());
        }
        if (user.isLocked()) {
          return failure(new BusinessRuleViolationError('User account is temporarily locked due to failed login attempts').toDomainError());
        }
        if (!user.emailVerified) {
          return failure(new BusinessRuleViolationError('Email address must be verified before login').toDomainError());
        }
      }

      // Verify password
      const isPasswordValid = await this.passwordService.verify(command.password, user.password.hash);
      if (!isPasswordValid) {
        // Increment failed login attempts
        const updatedUser = user.incrementFailedLoginAttempts();
        await this.userRepository.save(updatedUser);

        return failure(new ValidationError('Invalid credentials').toDomainError());
      }

      // Reset failed login attempts and record successful login
      const loggedInUser = user.resetFailedLoginAttempts().recordLogin();
      await this.userRepository.save(loggedInUser);

      // Generate tokens
      const accessToken = await this.jwtService.generateAccessToken({
        userId: loggedInUser.id,
        username: loggedInUser.username.value,
        email: loggedInUser.email.value,
        roleId: loggedInUser.roleId || undefined,
      });

      const { token: refreshToken } = await this.jwtService.generateRefreshToken(loggedInUser.id);

      // Map to response DTOs
      const userResponse = this.userMapper.toResponseDTO(loggedInUser);
      const tokensResponse: AuthTokensResponseDTO = {
        accessToken,
        refreshToken,
        expiresIn: this.jwtService.getTokenExpirationTime(accessToken) || 900,
        tokenType: 'Bearer',
      };

      const response: LoginResponseDTO = {
        user: userResponse,
        tokens: tokensResponse,
      };

      // Publish login event (optional)
      // await this.eventPublisher.publish(createUserLoginEvent(loggedInUser.id, { ... }));

      return success(response);
    } catch (error) {
      if (error instanceof Error) {
        return failure({
          code: 'LOGIN_ERROR',
          message: error.message,
          details: { originalError: error.name },
        });
      }
      return failure({
        code: 'UNKNOWN_ERROR',
        message: 'An unexpected error occurred during login',
      });
    }
  }

  private async findUserByEmailOrUsername(usernameOrEmail: string): Promise<import('@domain/entities/User').User | null> {
    // Try to determine if it's an email or username
    const isEmail = usernameOrEmail.includes('@');

    if (isEmail) {
      try {
        const email = Email.create(usernameOrEmail);
        return await this.userRepository.findByEmail(email);
      } catch {
        // Invalid email format, try as username
        try {
          const username = Username.create(usernameOrEmail);
          return await this.userRepository.findByUsername(username);
        } catch {
          return null;
        }
      }
    } else {
      try {
        const username = Username.create(usernameOrEmail);
        return await this.userRepository.findByUsername(username);
      } catch {
        // Invalid username format, try as email
        try {
          const email = Email.create(usernameOrEmail);
          return await this.userRepository.findByEmail(email);
        } catch {
          return null;
        }
      }
    }
  }
}

@injectable()
export class RefreshTokenUseCase {
  constructor(
    @inject('IUserRepository') private readonly userRepository: IUserRepository,
    @inject('IRefreshTokenRepository') private readonly refreshTokenRepository: IRefreshTokenRepository,
    @inject('IJWTService') private readonly jwtService: IJWTService
  ) {}

  public async execute(refreshToken: string): Promise<Result<AuthTokensResponseDTO>> {
    try {
      if (!refreshToken) {
        return failure(new ValidationError('Refresh token is required').toDomainError());
      }

      // Find and validate refresh token
      const tokenEntity = await this.refreshTokenRepository.findByToken(refreshToken);

      if (!tokenEntity || !tokenEntity.isValid()) {
        return failure(new ValidationError('Invalid or expired refresh token').toDomainError());
      }

      // Get user from token
      const user = await this.userRepository.findById(tokenEntity.userId);
      if (!user || !user.canLogin()) {
        return failure(new BusinessRuleViolationError('User cannot login').toDomainError());
      }

      // Generate new tokens
      const newAccessToken = await this.jwtService.generateAccessToken({
        userId: user.id,
        username: user.username.value,
        email: user.email.value,
        roleId: user.roleId,
      });

      const { token: newRefreshToken, refreshToken: newRefreshTokenEntity } = 
        await this.jwtService.generateRefreshToken(user.id);

      // Revoke old refresh token
      const revokedToken = tokenEntity.revoke(user.id, newRefreshTokenEntity.id);
      await this.refreshTokenRepository.save(revokedToken);

      const response: AuthTokensResponseDTO = {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresIn: this.jwtService.getTokenExpirationTime(newAccessToken) || 900,
        tokenType: 'Bearer',
      };

      return success(response);
    } catch (error) {
      if (error instanceof Error) {
        return failure({
          code: 'REFRESH_TOKEN_ERROR',
          message: error.message,
          details: { originalError: error.name },
        });
      }
      return failure({
        code: 'UNKNOWN_ERROR',
        message: 'An unexpected error occurred during token refresh',
      });
    }
  }
}

@injectable()
export class LogoutUseCase {
  constructor(
    @inject('IRefreshTokenRepository') private readonly refreshTokenRepository: IRefreshTokenRepository,
    @inject('IJWTService') private readonly jwtService: IJWTService
  ) {}

  public async execute(userId: string, refreshToken?: string): Promise<Result<void>> {
    try {
      if (refreshToken) {
        // Revoke specific refresh token
        const tokenEntity = await this.refreshTokenRepository.findByToken(refreshToken);
        
        if (tokenEntity && tokenEntity.userId === userId) {
          const revokedToken = tokenEntity.revoke(userId);
          await this.refreshTokenRepository.save(revokedToken);
        }
      } else {
        // Revoke all user's refresh tokens
        await this.refreshTokenRepository.revokeAllUserTokens(userId);
      }

      return success(undefined);
    } catch (error) {
      if (error instanceof Error) {
        return failure({
          code: 'LOGOUT_ERROR',
          message: error.message,
          details: { originalError: error.name },
        });
      }
      return failure({
        code: 'UNKNOWN_ERROR',
        message: 'An unexpected error occurred during logout',
      });
    }
  }
}
