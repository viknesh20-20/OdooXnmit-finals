import { injectable, inject } from 'inversify';
import { Result, success, failure } from '@/types/common';
import { IUserRepository } from '@domain/repositories/IUserRepository';
import { ILogger } from '@application/interfaces/IPasswordService';
import { Email } from '@domain/value-objects/Email';
import { ValidationError, EntityNotFoundError } from '@domain/exceptions/DomainException';
import { UserMapper } from '@application/mappers/UserMapper';
import crypto from 'crypto';

export interface ForgotPasswordCommandDTO {
  email: string;
}

export interface ForgotPasswordResultDTO {
  message: string;
  success: boolean;
}

export interface IEmailService {
  sendPasswordResetEmail(email: string, resetToken: string, userName: string): Promise<boolean>;
}

export interface IForgotPasswordUseCase {
  execute(command: ForgotPasswordCommandDTO): Promise<Result<ForgotPasswordResultDTO>>;
}

@injectable()
export class ForgotPasswordUseCase implements IForgotPasswordUseCase {
  constructor(
    @inject('IUserRepository') private readonly userRepository: IUserRepository,
    @inject('IEmailService') private readonly emailService: IEmailService,
    @inject('ILogger') private readonly logger: ILogger
  ) {}

  public async execute(command: ForgotPasswordCommandDTO): Promise<Result<ForgotPasswordResultDTO>> {
    try {
      // Validate input
      if (!command.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(command.email)) {
        return failure(new ValidationError('Valid email address is required').toDomainError());
      }

      // Find user by email
      const email = Email.create(command.email);
      const user = await this.userRepository.findByEmail(email);

      // Always return success for security reasons (don't reveal if email exists)
      const successMessage = 'If an account with that email address exists, you will receive a password reset email shortly.';

      if (!user) {
        this.logger.info('Password reset requested for non-existent email', { email: command.email });
        return success({
          message: successMessage,
          success: true,
        });
      }

      if (!user.isActive()) {
        this.logger.info('Password reset requested for inactive user', { 
          userId: user.id, 
          email: command.email 
        });
        return success({
          message: successMessage,
          success: true,
        });
      }

      // Generate password reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetExpires = new Date(Date.now() + 3600000); // 1 hour from now

      // Update user with reset token
      const updatedUser = user.setPasswordResetToken(resetToken, resetExpires);
      await this.userRepository.save(updatedUser);

      // Send password reset email
      try {
        const emailSent = await this.emailService.sendPasswordResetEmail(
          command.email,
          resetToken,
          `${updatedUser.name.firstName} ${updatedUser.name.lastName}`
        );

        if (!emailSent) {
          this.logger.error('Failed to send password reset email', undefined, {
            userId: user.id,
            email: command.email,
          });
        }
      } catch (emailError) {
        this.logger.error('Error sending password reset email', emailError as Error, {
          userId: user.id,
          email: command.email,
        });
      }

      this.logger.info('Password reset requested successfully', {
        userId: user.id,
        email: command.email,
      });

      return success({
        message: successMessage,
        success: true,
      });
    } catch (error) {
      this.logger.error('Forgot password error', error as Error, {
        email: command.email,
      });

      return failure({
        code: 'FORGOT_PASSWORD_FAILED',
        message: 'Failed to process password reset request',
      });
    }
  }
}