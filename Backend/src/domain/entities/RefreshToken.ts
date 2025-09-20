import { UUID, Timestamp } from '@/types/common';
import { DomainException, ValidationError } from '@domain/exceptions/DomainException';

export interface RefreshTokenProps {
  readonly id: UUID;
  readonly token: string;
  readonly userId: UUID;
  readonly expiresAt: Timestamp;
  readonly isRevoked: boolean;
  readonly revokedAt?: Timestamp;
  readonly revokedBy?: UUID;
  readonly replacedByToken?: UUID;
  readonly createdAt: Timestamp;
  readonly updatedAt: Timestamp;
}

export interface CreateRefreshTokenProps {
  readonly token: string;
  readonly userId: UUID;
  readonly expiresAt: Timestamp;
}

export class RefreshToken {
  private constructor(private readonly props: RefreshTokenProps) {
    this.validateProps(props);
  }

  public static create(props: CreateRefreshTokenProps): RefreshToken {
    const now = new Date();
    const id = crypto.randomUUID();

    return new RefreshToken({
      id,
      token: props.token,
      userId: props.userId,
      expiresAt: props.expiresAt,
      isRevoked: false,
      createdAt: now,
      updatedAt: now,
    });
  }

  public static fromPersistence(props: RefreshTokenProps): RefreshToken {
    return new RefreshToken(props);
  }

  private validateProps(props: RefreshTokenProps): void {
    if (!props.id) {
      throw new ValidationError('RefreshToken ID is required');
    }
    if (!props.token) {
      throw new ValidationError('RefreshToken token is required');
    }
    if (!props.userId) {
      throw new ValidationError('RefreshToken userId is required');
    }
    if (!props.expiresAt) {
      throw new ValidationError('RefreshToken expiresAt is required');
    }
  }

  // Getters
  public get id(): UUID {
    return this.props.id;
  }

  public get token(): string {
    return this.props.token;
  }

  public get userId(): UUID {
    return this.props.userId;
  }

  public get expiresAt(): Timestamp {
    return this.props.expiresAt;
  }

  public get isRevoked(): boolean {
    return this.props.isRevoked;
  }

  public get revokedAt(): Timestamp | undefined {
    return this.props.revokedAt;
  }

  public get revokedBy(): UUID | undefined {
    return this.props.revokedBy;
  }

  public get replacedByToken(): UUID | undefined {
    return this.props.replacedByToken;
  }

  public get createdAt(): Timestamp {
    return this.props.createdAt;
  }

  public get updatedAt(): Timestamp {
    return this.props.updatedAt;
  }

  // Business methods
  public isExpired(): boolean {
    return new Date() > this.props.expiresAt;
  }

  public isValid(): boolean {
    return !this.props.isRevoked && !this.isExpired();
  }

  public revoke(revokedBy: UUID, replacedByToken?: UUID): RefreshToken {
    if (this.props.isRevoked) {
      throw new ValidationError('RefreshToken is already revoked');
    }

    return new RefreshToken({
      ...this.props,
      isRevoked: true,
      revokedAt: new Date(),
      revokedBy,
      replacedByToken,
      updatedAt: new Date(),
    });
  }

  public toPersistence(): RefreshTokenProps {
    return { ...this.props };
  }

  public equals(other: RefreshToken): boolean {
    return this.props.id === other.props.id;
  }
}
