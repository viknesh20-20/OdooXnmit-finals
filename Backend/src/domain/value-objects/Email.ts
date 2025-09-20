import { ValidationError } from '@domain/exceptions/DomainException';

export class Email {
  private readonly _value: string;

  constructor(value: string) {
    this.validate(value);
    this._value = value.toLowerCase().trim();
  }

  public get value(): string {
    return this._value;
  }

  private validate(value: string): void {
    if (!value || typeof value !== 'string') {
      throw new ValidationError('Email is required and must be a string');
    }

    const trimmedValue = value.trim();
    if (trimmedValue.length === 0) {
      throw new ValidationError('Email cannot be empty');
    }

    if (trimmedValue.length > 255) {
      throw new ValidationError('Email cannot exceed 255 characters');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedValue)) {
      throw new ValidationError('Invalid email format');
    }
  }

  public equals(other: Email): boolean {
    return this._value === other._value;
  }

  public toString(): string {
    return this._value;
  }

  public static create(value: string): Email {
    return new Email(value);
  }
}

export class Username {
  private readonly _value: string;

  constructor(value: string) {
    this.validate(value);
    this._value = value.toLowerCase().trim();
  }

  public get value(): string {
    return this._value;
  }

  private validate(value: string): void {
    if (!value || typeof value !== 'string') {
      throw new ValidationError('Username is required and must be a string');
    }

    const trimmedValue = value.trim();
    if (trimmedValue.length < 3) {
      throw new ValidationError('Username must be at least 3 characters long');
    }

    if (trimmedValue.length > 50) {
      throw new ValidationError('Username cannot exceed 50 characters');
    }

    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(trimmedValue)) {
      throw new ValidationError('Username can only contain letters, numbers, and underscores');
    }
  }

  public equals(other: Username): boolean {
    return this._value === other._value;
  }

  public toString(): string {
    return this._value;
  }

  public static create(value: string): Username {
    return new Username(value);
  }
}

export class Password {
  private readonly _hash: string;

  constructor(hash: string) {
    if (!hash || typeof hash !== 'string') {
      throw new ValidationError('Password hash is required and must be a string');
    }
    this._hash = hash;
  }

  public get hash(): string {
    return this._hash;
  }

  public equals(other: Password): boolean {
    return this._hash === other._hash;
  }

  public static fromHash(hash: string): Password {
    return new Password(hash);
  }

  public static validatePlainPassword(password: string): void {
    if (!password || typeof password !== 'string') {
      throw new ValidationError('Password is required and must be a string');
    }

    if (password.length < 8) {
      throw new ValidationError('Password must be at least 8 characters long');
    }

    if (password.length > 128) {
      throw new ValidationError('Password cannot exceed 128 characters');
    }

    // At least one uppercase letter
    if (!/[A-Z]/.test(password)) {
      throw new ValidationError('Password must contain at least one uppercase letter');
    }

    // At least one lowercase letter
    if (!/[a-z]/.test(password)) {
      throw new ValidationError('Password must contain at least one lowercase letter');
    }

    // At least one digit
    if (!/\d/.test(password)) {
      throw new ValidationError('Password must contain at least one digit');
    }

    // At least one special character
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      throw new ValidationError('Password must contain at least one special character');
    }
  }
}

export class PersonName {
  private readonly _firstName: string;
  private readonly _lastName: string;

  constructor(firstName: string, lastName: string) {
    this.validateName(firstName, 'First name');
    this.validateName(lastName, 'Last name');
    this._firstName = firstName.trim();
    this._lastName = lastName.trim();
  }

  public get firstName(): string {
    return this._firstName;
  }

  public get lastName(): string {
    return this._lastName;
  }

  public get fullName(): string {
    return `${this._firstName} ${this._lastName}`;
  }

  private validateName(name: string, fieldName: string): void {
    if (!name || typeof name !== 'string') {
      throw new ValidationError(`${fieldName} is required and must be a string`);
    }

    const trimmedName = name.trim();
    if (trimmedName.length === 0) {
      throw new ValidationError(`${fieldName} cannot be empty`);
    }

    if (trimmedName.length > 100) {
      throw new ValidationError(`${fieldName} cannot exceed 100 characters`);
    }

    const nameRegex = /^[a-zA-Z\s'-]+$/;
    if (!nameRegex.test(trimmedName)) {
      throw new ValidationError(`${fieldName} can only contain letters, spaces, hyphens, and apostrophes`);
    }
  }

  public equals(other: PersonName): boolean {
    return this._firstName === other._firstName && this._lastName === other._lastName;
  }

  public toString(): string {
    return this.fullName;
  }

  public static create(firstName: string, lastName: string): PersonName {
    return new PersonName(firstName, lastName);
  }
}
