import { injectable, inject } from 'inversify';
import { Result, success, failure } from '@/types/common';
import { IUserRepository } from '@domain/repositories/IUserRepository';
import { IPasswordService } from '@application/interfaces/IPasswordService';
import { ILogger } from '@application/interfaces/IPasswordService';
import { ValidationError, EntityNotFoundError, BusinessRuleViolationError } from '@domain/exceptions/DomainException';

export interface ResetPasswordCommandDTO {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ResetPasswordResultDTO {
  message: string;
  success: boolean;
}

export interface IResetPasswordUseCase {
  execute(command: ResetPasswordCommandDTO): Promise<Result<ResetPasswordResultDTO>>;
}

@injectable()
export class ResetPasswordUseCase implements IResetPasswordUseCase {
  constructor(
    @inject('IUserRepository') private readonly userRepository: IUserRepository,
    @inject('IPasswordService') private readonly passwordService: IPasswordService,
    @inject('ILogger') private readonly logger: ILogger
  ) {}

  public async execute(command: ResetPasswordCommandDTO): Promise<Result<ResetPasswordResultDTO>> {
    try {
      // Validate input
      const validationError = this.validateCommand(command);
      if (validationError) {
        return failure(validationError.toDomainError());
      }

      // Find user by reset token
      const user = await this.userRepository.findByPasswordResetToken(command.token);
      if (!user) {
        return failure(new ValidationError('Invalid or expired reset token').toDomainError());
      }

      // Check if user is active
      if (!user.isActive()) {
        return failure(new BusinessRuleViolationError('User account is not active').toDomainError());
      }

      // Check if token is expired
      if (!user.passwordResetExpires || user.passwordResetExpires <= new Date()) {
        return failure(new ValidationError('Reset token has expired').toDomainError());
      }

      // Hash new password
      const hashedPassword = await this.passwordService.hash(command.newPassword);

      // Update user password and clear reset token
      const updatedUser = user
        .updatePassword(hashedPassword)
        .clearPasswordResetToken()
        .resetFailedLoginAttempts();

      await this.userRepository.save(updatedUser);

      this.logger.info('Password reset successfully', {
        userId: user.id,
        email: user.email.value,
      });

      return success({
        message: 'Password has been reset successfully. You can now log in with your new password.',
        success: true,
      });
    } catch (error) {
      this.logger.error('Reset password error', error as Error, {
        token: command.token,
      });

      return failure({
        code: 'RESET_PASSWORD_FAILED',
        message: 'Failed to reset password',
      });
    }
  }

  private validateCommand(command: ResetPasswordCommandDTO): ValidationError | null {
    const errors: string[] = [];

    if (!command.token || command.token.length < 10) {
      errors.push('Valid reset token is required');
    }

    if (!command.newPassword || command.newPassword.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (command.newPassword !== command.confirmPassword) {
      errors.push('Passwords do not match');
    }

    // Check password strength
    if (command.newPassword && !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(command.newPassword)) {
      errors.push('Password must contain at least one lowercase letter, one uppercase letter, and one number');
    }

    if (errors.length > 0) {
      return new ValidationError('Password reset validation failed');
    }

    return null;
  }
}