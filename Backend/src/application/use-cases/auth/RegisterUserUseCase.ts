import { injectable, inject } from 'inversify';
import { Result, success, failure } from '@/types/common';
import { IUserRepository } from '@domain/repositories/IUserRepository';
import { IPasswordService } from '@application/interfaces/IPasswordService';
import { IJWTService } from '@application/interfaces/IJWTService';
import { ILogger } from '@application/interfaces/IPasswordService';
import { User, CreateUserProps } from '@domain/entities/User';
import { Email, Username } from '@domain/value-objects/Email';
import { EntityNotFoundError, ValidationError, BusinessRuleViolationError } from '@domain/exceptions/DomainException';
import { UserMapper } from '@application/mappers/UserMapper';
import { UserResponseDTO, AuthTokensResponseDTO } from '@application/dtos/UserDTOs';

export interface RegisterCommandDTO {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  roleId?: string;
}

export interface RegisterResultDTO {
  user: UserResponseDTO;
  tokens: AuthTokensResponseDTO;
  message: string;
}

export interface IRegisterUserUseCase {
  execute(command: RegisterCommandDTO): Promise<Result<RegisterResultDTO>>;
}

@injectable()
export class RegisterUserUseCase implements IRegisterUserUseCase {
  constructor(
    @inject('IUserRepository') private readonly userRepository: IUserRepository,
    @inject('IPasswordService') private readonly passwordService: IPasswordService,
    @inject('IJWTService') private readonly jwtService: IJWTService,
    @inject('ILogger') private readonly logger: ILogger,
    @inject('UserMapper') private readonly userMapper: UserMapper
  ) {}

  public async execute(command: RegisterCommandDTO): Promise<Result<RegisterResultDTO>> {
    try {
      // Validate input
      const validationError = this.validateCommand(command);
      if (validationError) {
        return failure(validationError.toDomainError());
      }

      // Create Email and Username value objects
      const email = Email.create(command.email);
      const username = Username.create(command.username);

      // Check if user already exists
      const existingUserByEmail = await this.userRepository.findByEmail(email);
      if (existingUserByEmail) {
        return failure(new BusinessRuleViolationError('User with this email already exists').toDomainError());
      }

      const existingUserByUsername = await this.userRepository.findByUsername(username);
      if (existingUserByUsername) {
        return failure(new BusinessRuleViolationError('User with this username already exists').toDomainError());
      }

      // Hash password
      const hashedPassword = await this.passwordService.hash(command.password);

      // Get default role if none provided
      let roleId = command.roleId;
      if (!roleId) {
        // For now, create users without a role - this can be assigned later
        // TODO: Implement proper role assignment after user creation
        this.logger.info('Creating user without role - role can be assigned later');
      }

      // Create user entity
      const createUserProps: CreateUserProps = {
        username: command.username,
        email: command.email,
        password: command.password,
        firstName: command.firstName,
        lastName: command.lastName,
        roleId: roleId,
      };

      const user = User.create(createUserProps, hashedPassword);

      // Save user to database
      const savedUser = await this.userRepository.save(user);

      // Generate tokens
      const tokenPayload = {
        userId: savedUser.id,
        username: savedUser.username.value,
        email: savedUser.email.value,
        roleId: savedUser.roleId,
      };

      const accessToken = await this.jwtService.generateAccessToken(tokenPayload);
      const { token: refreshToken } = await this.jwtService.generateRefreshToken(savedUser.id);

      // Map to response DTOs
      const userResponse = this.userMapper.toResponseDTO(savedUser);
      const tokensResponse: AuthTokensResponseDTO = {
        accessToken,
        refreshToken,
        expiresIn: this.jwtService.getAccessTokenExpirationTime(),
        tokenType: 'Bearer',
      };

      this.logger.info('User registered successfully', {
        userId: savedUser.id,
        username: savedUser.username.value,
        email: savedUser.email.value,
      });

      return success({
        user: userResponse,
        tokens: tokensResponse,
        message: 'Registration successful. Please check your email to verify your account.',
      });
    } catch (error) {
      this.logger.error('Registration error', error as Error, {
        username: command.username,
        email: command.email,
      });

      return failure({
        code: 'REGISTRATION_FAILED',
        message: 'Failed to register user',
      });
    }
  }

  private validateCommand(command: RegisterCommandDTO): ValidationError | null {
    const errors: string[] = [];

    if (!command.username || command.username.length < 3 || command.username.length > 50) {
      errors.push('Username must be between 3 and 50 characters');
    }

    if (!command.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(command.email)) {
      errors.push('Valid email address is required');
    }

    if (!command.password || command.password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (!command.firstName || command.firstName.length < 1 || command.firstName.length > 50) {
      errors.push('First name must be between 1 and 50 characters');
    }

    if (!command.lastName || command.lastName.length < 1 || command.lastName.length > 50) {
      errors.push('Last name must be between 1 and 50 characters');
    }

    if (errors.length > 0) {
      return new ValidationError('Registration validation failed');
    }

    return null;
  }
}