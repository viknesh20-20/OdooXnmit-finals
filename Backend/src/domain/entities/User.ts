import { UUID, Timestamp, UserStatus } from '@/types/common';
import { ValidationError, BusinessRuleViolationError } from '@domain/exceptions/DomainException';
import { Email, Username, Password, PersonName } from '@domain/value-objects/Email';

export interface UserProps {
  readonly id: UUID;
  readonly username: Username;
  readonly email: Email;
  readonly password: Password;
  readonly name: PersonName;
  readonly phone?: string;
  readonly status: UserStatus;
  readonly roleId?: UUID;
  readonly emailVerified: boolean;
  readonly emailVerificationToken?: string;
  readonly emailVerificationExpires?: Timestamp;
  readonly passwordResetToken?: string;
  readonly passwordResetExpires?: Timestamp;
  readonly lastLogin?: Timestamp;
  readonly failedLoginAttempts: number;
  readonly lockedUntil?: Timestamp;
  readonly metadata: Record<string, unknown>;
  readonly createdAt: Timestamp;
  readonly updatedAt: Timestamp;
}

export interface CreateUserProps {
  readonly username: string;
  readonly email: string;
  readonly password: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly phone?: string;
  readonly roleId?: UUID;
  readonly metadata?: Record<string, unknown>;
}

export class User {
  private constructor(private readonly props: UserProps) {
    this.validate();
  }

  public get id(): UUID {
    return this.props.id;
  }

  public get username(): Username {
    return this.props.username;
  }

  public get email(): Email {
    return this.props.email;
  }

  public get password(): Password {
    return this.props.password;
  }

  public get name(): PersonName {
    return this.props.name;
  }

  public get phone(): string | undefined {
    return this.props.phone;
  }

  public get status(): UserStatus {
    return this.props.status;
  }

  public get roleId(): UUID | undefined {
    return this.props.roleId;
  }

  public get emailVerified(): boolean {
    return this.props.emailVerified;
  }

  public get emailVerificationToken(): string | undefined {
    return this.props.emailVerificationToken;
  }

  public get emailVerificationExpires(): Timestamp | undefined {
    return this.props.emailVerificationExpires;
  }

  public get passwordResetToken(): string | undefined {
    return this.props.passwordResetToken;
  }

  public get passwordResetExpires(): Timestamp | undefined {
    return this.props.passwordResetExpires;
  }

  public get lastLogin(): Timestamp | undefined {
    return this.props.lastLogin;
  }

  public get failedLoginAttempts(): number {
    return this.props.failedLoginAttempts;
  }

  public get lockedUntil(): Timestamp | undefined {
    return this.props.lockedUntil;
  }

  public get metadata(): Record<string, unknown> {
    return { ...this.props.metadata };
  }

  public get createdAt(): Timestamp {
    return this.props.createdAt;
  }

  public get updatedAt(): Timestamp {
    return this.props.updatedAt;
  }

  private validate(): void {
    if (this.props.phone && !this.isValidPhone(this.props.phone)) {
      throw new ValidationError('Invalid phone number format');
    }

    if (this.props.failedLoginAttempts < 0) {
      throw new ValidationError('Failed login attempts cannot be negative');
    }

    if (this.props.emailVerificationExpires && this.props.emailVerificationExpires <= new Date()) {
      // Allow expired tokens but validate the date format
    }

    if (this.props.passwordResetExpires && this.props.passwordResetExpires <= new Date()) {
      // Allow expired tokens but validate the date format
    }
  }

  private isValidPhone(phone: string): boolean {
    // Allow international phone numbers with common formatting
    const phoneRegex = /^[\+]?[\d\s\-\(\)]{7,20}$/;
    return phoneRegex.test(phone);
  }

  public isActive(): boolean {
    return this.props.status === UserStatus.ACTIVE;
  }

  public isLocked(): boolean {
    return this.props.lockedUntil !== undefined && this.props.lockedUntil > new Date();
  }

  public canLogin(): boolean {
    return this.isActive() && !this.isLocked() && this.props.emailVerified;
  }

  public activate(): User {
    if (this.props.status === UserStatus.ACTIVE) {
      return this;
    }

    return new User({
      ...this.props,
      status: UserStatus.ACTIVE,
      updatedAt: new Date(),
    });
  }

  public deactivate(): User {
    if (this.props.status === UserStatus.INACTIVE) {
      return this;
    }

    return new User({
      ...this.props,
      status: UserStatus.INACTIVE,
      updatedAt: new Date(),
    });
  }

  public suspend(): User {
    if (this.props.status === UserStatus.SUSPENDED) {
      return this;
    }

    return new User({
      ...this.props,
      status: UserStatus.SUSPENDED,
      updatedAt: new Date(),
    });
  }

  public verifyEmail(): User {
    if (this.props.emailVerified) {
      return this;
    }

    return new User({
      ...this.props,
      emailVerified: true,
      emailVerificationToken: undefined,
      emailVerificationExpires: undefined,
      updatedAt: new Date(),
    });
  }

  public setEmailVerificationToken(token: string, expiresAt: Timestamp): User {
    return new User({
      ...this.props,
      emailVerificationToken: token,
      emailVerificationExpires: expiresAt,
      updatedAt: new Date(),
    });
  }

  public setPasswordResetToken(token: string, expiresAt: Timestamp): User {
    return new User({
      ...this.props,
      passwordResetToken: token,
      passwordResetExpires: expiresAt,
      updatedAt: new Date(),
    });
  }

  public clearPasswordResetToken(): User {
    return new User({
      ...this.props,
      passwordResetToken: undefined,
      passwordResetExpires: undefined,
      updatedAt: new Date(),
    });
  }

  public updatePassword(hashedPassword: string): User {
    return new User({
      ...this.props,
      password: Password.fromHash(hashedPassword),
      updatedAt: new Date(),
    });
  }

  public recordLogin(): User {
    return new User({
      ...this.props,
      lastLogin: new Date(),
      failedLoginAttempts: 0,
      lockedUntil: undefined,
      updatedAt: new Date(),
    });
  }

  public incrementFailedLoginAttempts(): User {
    const maxAttempts = 5;
    const lockDurationMs = 30 * 60 * 1000; // 30 minutes
    const newFailedAttempts = this.props.failedLoginAttempts + 1;
    const shouldLock = newFailedAttempts >= maxAttempts;

    return new User({
      ...this.props,
      failedLoginAttempts: newFailedAttempts,
      lockedUntil: shouldLock ? new Date(Date.now() + lockDurationMs) : this.props.lockedUntil,
      updatedAt: new Date(),
    });
  }

  public resetFailedLoginAttempts(): User {
    return new User({
      ...this.props,
      failedLoginAttempts: 0,
      lockedUntil: undefined,
      updatedAt: new Date(),
    });
  }

  public changePassword(newPassword: Password): User {
    return new User({
      ...this.props,
      password: newPassword,
      passwordResetToken: undefined,
      passwordResetExpires: undefined,
      updatedAt: new Date(),
    });
  }

  public updateProfile(updates: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    metadata?: Record<string, unknown>;
  }): User {
    const name = updates.firstName || updates.lastName
      ? PersonName.create(
          updates.firstName ?? this.props.name.firstName,
          updates.lastName ?? this.props.name.lastName
        )
      : this.props.name;

    return new User({
      ...this.props,
      name,
      phone: updates.phone ?? this.props.phone,
      metadata: updates.metadata ? { ...this.props.metadata, ...updates.metadata } : this.props.metadata,
      updatedAt: new Date(),
    });
  }

  public assignRole(roleId: UUID): User {
    return new User({
      ...this.props,
      roleId,
      updatedAt: new Date(),
    });
  }

  public equals(other: User): boolean {
    return this.props.id === other.props.id;
  }

  public static create(props: CreateUserProps, passwordHash: string): User {
    const now = new Date();
    const id = crypto.randomUUID();

    return new User({
      id,
      username: Username.create(props.username),
      email: Email.create(props.email),
      password: Password.fromHash(passwordHash),
      name: PersonName.create(props.firstName, props.lastName),
      phone: props.phone,
      status: UserStatus.ACTIVE,
      roleId: props.roleId,
      emailVerified: false,
      failedLoginAttempts: 0,
      metadata: props.metadata ?? {},
      createdAt: now,
      updatedAt: now,
    });
  }

  public static fromPersistence(props: UserProps): User {
    return new User(props);
  }

  public toPersistence(): UserProps {
    return { ...this.props };
  }
}
