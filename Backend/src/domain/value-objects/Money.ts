import { ValidationError } from '@domain/exceptions/DomainException';

export class Money {
  private readonly _amount: number;
  private readonly _currency: string;

  constructor(amount: number, currency: string = 'USD') {
    this.validateAmount(amount);
    this.validateCurrency(currency);
    this._amount = Math.round(amount * 100) / 100; // Round to 2 decimal places
    this._currency = currency.toUpperCase();
  }

  public get amount(): number {
    return this._amount;
  }

  public get currency(): string {
    return this._currency;
  }

  private validateAmount(amount: number): void {
    if (typeof amount !== 'number' || isNaN(amount)) {
      throw new ValidationError('Amount must be a valid number');
    }

    if (amount < 0) {
      throw new ValidationError('Amount cannot be negative');
    }

    if (amount > Number.MAX_SAFE_INTEGER) {
      throw new ValidationError('Amount is too large');
    }
  }

  private validateCurrency(currency: string): void {
    if (!currency || typeof currency !== 'string') {
      throw new ValidationError('Currency is required and must be a string');
    }

    const trimmedCurrency = currency.trim();
    if (trimmedCurrency.length !== 3) {
      throw new ValidationError('Currency must be a 3-letter ISO code');
    }

    const currencyRegex = /^[A-Z]{3}$/;
    if (!currencyRegex.test(trimmedCurrency.toUpperCase())) {
      throw new ValidationError('Currency must be a valid 3-letter ISO code');
    }
  }

  public add(other: Money): Money {
    this.ensureSameCurrency(other);
    return new Money(this._amount + other._amount, this._currency);
  }

  public subtract(other: Money): Money {
    this.ensureSameCurrency(other);
    const result = this._amount - other._amount;
    if (result < 0) {
      throw new ValidationError('Subtraction would result in negative amount');
    }
    return new Money(result, this._currency);
  }

  public multiply(factor: number): Money {
    if (typeof factor !== 'number' || isNaN(factor)) {
      throw new ValidationError('Factor must be a valid number');
    }
    if (factor < 0) {
      throw new ValidationError('Factor cannot be negative');
    }
    return new Money(this._amount * factor, this._currency);
  }

  public divide(divisor: number): Money {
    if (typeof divisor !== 'number' || isNaN(divisor)) {
      throw new ValidationError('Divisor must be a valid number');
    }
    if (divisor <= 0) {
      throw new ValidationError('Divisor must be positive');
    }
    return new Money(this._amount / divisor, this._currency);
  }

  public isGreaterThan(other: Money): boolean {
    this.ensureSameCurrency(other);
    return this._amount > other._amount;
  }

  public isLessThan(other: Money): boolean {
    this.ensureSameCurrency(other);
    return this._amount < other._amount;
  }

  public isEqualTo(other: Money): boolean {
    return this._currency === other._currency && this._amount === other._amount;
  }

  public isZero(): boolean {
    return this._amount === 0;
  }

  private ensureSameCurrency(other: Money): void {
    if (this._currency !== other._currency) {
      throw new ValidationError(`Cannot perform operation on different currencies: ${this._currency} and ${other._currency}`);
    }
  }

  public equals(other: Money): boolean {
    return this.isEqualTo(other);
  }

  public toString(): string {
    return `${this._amount.toFixed(2)} ${this._currency}`;
  }

  public toJSON(): { amount: number; currency: string } {
    return {
      amount: this._amount,
      currency: this._currency,
    };
  }

  public static zero(currency: string = 'USD'): Money {
    return new Money(0, currency);
  }

  public static create(amount: number, currency?: string): Money {
    return new Money(amount, currency);
  }
}

export class Quantity {
  private readonly _value: number;
  private readonly _unit: string;

  constructor(value: number, unit: string) {
    this.validateValue(value);
    this.validateUnit(unit);
    this._value = value;
    this._unit = unit.toLowerCase().trim();
  }

  public get value(): number {
    return this._value;
  }

  public get unit(): string {
    return this._unit;
  }

  private validateValue(value: number): void {
    if (typeof value !== 'number' || isNaN(value)) {
      throw new ValidationError('Quantity value must be a valid number');
    }

    if (value < 0) {
      throw new ValidationError('Quantity value cannot be negative');
    }

    if (value > Number.MAX_SAFE_INTEGER) {
      throw new ValidationError('Quantity value is too large');
    }
  }

  private validateUnit(unit: string): void {
    if (!unit || typeof unit !== 'string') {
      throw new ValidationError('Unit is required and must be a string');
    }

    const trimmedUnit = unit.trim();
    if (trimmedUnit.length === 0) {
      throw new ValidationError('Unit cannot be empty');
    }

    if (trimmedUnit.length > 10) {
      throw new ValidationError('Unit cannot exceed 10 characters');
    }
  }

  public add(other: Quantity): Quantity {
    this.ensureSameUnit(other);
    return new Quantity(this._value + other._value, this._unit);
  }

  public subtract(other: Quantity): Quantity {
    this.ensureSameUnit(other);
    const result = this._value - other._value;
    if (result < 0) {
      throw new ValidationError('Subtraction would result in negative quantity');
    }
    return new Quantity(result, this._unit);
  }

  public multiply(factor: number): Quantity {
    if (typeof factor !== 'number' || isNaN(factor)) {
      throw new ValidationError('Factor must be a valid number');
    }
    if (factor < 0) {
      throw new ValidationError('Factor cannot be negative');
    }
    return new Quantity(this._value * factor, this._unit);
  }

  public isGreaterThan(other: Quantity): boolean {
    this.ensureSameUnit(other);
    return this._value > other._value;
  }

  public isLessThan(other: Quantity): boolean {
    this.ensureSameUnit(other);
    return this._value < other._value;
  }

  public isEqualTo(other: Quantity): boolean {
    return this._unit === other._unit && this._value === other._value;
  }

  public isZero(): boolean {
    return this._value === 0;
  }

  private ensureSameUnit(other: Quantity): void {
    if (this._unit !== other._unit) {
      throw new ValidationError(`Cannot perform operation on different units: ${this._unit} and ${other._unit}`);
    }
  }

  public equals(other: Quantity): boolean {
    return this.isEqualTo(other);
  }

  public toString(): string {
    return `${this._value} ${this._unit}`;
  }

  public toJSON(): { value: number; unit: string } {
    return {
      value: this._value,
      unit: this._unit,
    };
  }

  public static zero(unit: string): Quantity {
    return new Quantity(0, unit);
  }

  public static create(value: number, unit: string): Quantity {
    return new Quantity(value, unit);
  }
}
