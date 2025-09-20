import { User } from '@domain/entities/User';
import { Email, Username, PersonName } from '@domain/value-objects/Email';
import { Password } from '@domain/value-objects/Email';

describe('User Entity', () => {
  const validUserData = {
    username: 'testuser',
    email: 'test@example.com',
    password: 'SecurePassword123!',
    firstName: 'John',
    lastName: 'Doe',
    phone: '+1234567890',
  };

  describe('User Creation', () => {
    it('should create a user with valid data', () => {
      const user = User.create(validUserData);

      expect(user.username.value).toBe(validUserData.username);
      expect(user.email.value).toBe(validUserData.email);
      expect(user.name.firstName).toBe(validUserData.firstName);
      expect(user.name.lastName).toBe(validUserData.lastName);
      expect(user.name.fullName).toBe('John Doe');
      expect(user.phone).toBe(validUserData.phone);
      expect(user.status).toBe('active');
      expect(user.emailVerified).toBe(false);
      expect(user.failedLoginAttempts).toBe(0);
      expect(user.isActive()).toBe(true);
      expect(user.canLogin()).toBe(false); // Email not verified
    });

    it('should generate a unique ID for each user', () => {
      const user1 = User.create(validUserData);
      const user2 = User.create({ ...validUserData, username: 'testuser2', email: 'test2@example.com' });

      expect(user1.id).not.toBe(user2.id);
      expect(user1.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it('should set created and updated timestamps', () => {
      const beforeCreation = new Date();
      const user = User.create(validUserData);
      const afterCreation = new Date();

      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);
      expect(user.createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
      expect(user.createdAt.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
      expect(user.updatedAt.getTime()).toBe(user.createdAt.getTime());
    });
  });

  describe('Email Verification', () => {
    it('should verify email successfully', () => {
      const user = User.create(validUserData);
      expect(user.emailVerified).toBe(false);
      expect(user.canLogin()).toBe(false);

      const verifiedUser = user.verifyEmail();
      expect(verifiedUser.emailVerified).toBe(true);
      expect(verifiedUser.canLogin()).toBe(true);
      expect(verifiedUser.emailVerificationToken).toBeUndefined();
      expect(verifiedUser.emailVerificationExpires).toBeUndefined();
    });

    it('should generate email verification token', () => {
      const user = User.create(validUserData);
      const userWithToken = user.generateEmailVerificationToken();

      expect(userWithToken.emailVerificationToken).toBeDefined();
      expect(userWithToken.emailVerificationExpires).toBeDefined();
      expect(userWithToken.emailVerificationExpires!.getTime()).toBeGreaterThan(Date.now());
    });
  });

  describe('Password Management', () => {
    it('should generate password reset token', () => {
      const user = User.create(validUserData);
      const userWithToken = user.generatePasswordResetToken();

      expect(userWithToken.passwordResetToken).toBeDefined();
      expect(userWithToken.passwordResetExpires).toBeDefined();
      expect(userWithToken.passwordResetExpires!.getTime()).toBeGreaterThan(Date.now());
    });

    it('should reset password successfully', () => {
      const user = User.create(validUserData);
      const userWithToken = user.generatePasswordResetToken();
      const newPassword = 'NewSecurePassword456!';

      const userWithNewPassword = userWithToken.resetPassword(newPassword);

      expect(userWithNewPassword.password.hash).not.toBe(user.password.hash);
      expect(userWithNewPassword.passwordResetToken).toBeUndefined();
      expect(userWithNewPassword.passwordResetExpires).toBeUndefined();
    });
  });

  describe('Login Management', () => {
    it('should record successful login', () => {
      const user = User.create(validUserData).verifyEmail();
      const beforeLogin = new Date();
      
      const loggedInUser = user.recordLogin();
      const afterLogin = new Date();

      expect(loggedInUser.lastLogin).toBeInstanceOf(Date);
      expect(loggedInUser.lastLogin!.getTime()).toBeGreaterThanOrEqual(beforeLogin.getTime());
      expect(loggedInUser.lastLogin!.getTime()).toBeLessThanOrEqual(afterLogin.getTime());
      expect(loggedInUser.failedLoginAttempts).toBe(0);
    });

    it('should increment failed login attempts', () => {
      const user = User.create(validUserData);
      
      const userAfterFailure = user.incrementFailedLoginAttempts();
      expect(userAfterFailure.failedLoginAttempts).toBe(1);
      expect(userAfterFailure.isLocked()).toBe(false);

      // Simulate multiple failures
      let currentUser = userAfterFailure;
      for (let i = 1; i < 5; i++) {
        currentUser = currentUser.incrementFailedLoginAttempts();
        expect(currentUser.failedLoginAttempts).toBe(i + 1);
      }

      // Should be locked after 5 attempts
      expect(currentUser.isLocked()).toBe(true);
      expect(currentUser.canLogin()).toBe(false);
    });

    it('should reset failed login attempts', () => {
      const user = User.create(validUserData);
      const userWithFailures = user
        .incrementFailedLoginAttempts()
        .incrementFailedLoginAttempts()
        .incrementFailedLoginAttempts();

      expect(userWithFailures.failedLoginAttempts).toBe(3);

      const resetUser = userWithFailures.resetFailedLoginAttempts();
      expect(resetUser.failedLoginAttempts).toBe(0);
      expect(resetUser.lockedUntil).toBeUndefined();
    });
  });

  describe('User Status Management', () => {
    it('should activate user', () => {
      const user = User.create(validUserData);
      const inactiveUser = user.deactivate();
      expect(inactiveUser.status).toBe('inactive');
      expect(inactiveUser.isActive()).toBe(false);

      const reactivatedUser = inactiveUser.activate();
      expect(reactivatedUser.status).toBe('active');
      expect(reactivatedUser.isActive()).toBe(true);
    });

    it('should deactivate user', () => {
      const user = User.create(validUserData);
      const deactivatedUser = user.deactivate();

      expect(deactivatedUser.status).toBe('inactive');
      expect(deactivatedUser.isActive()).toBe(false);
      expect(deactivatedUser.canLogin()).toBe(false);
    });
  });

  describe('Profile Updates', () => {
    it('should update profile information', () => {
      const user = User.create(validUserData);
      const updates = {
        firstName: 'Jane',
        lastName: 'Smith',
        phone: '+9876543210',
      };

      const updatedUser = user.updateProfile(updates);

      expect(updatedUser.name.firstName).toBe(updates.firstName);
      expect(updatedUser.name.lastName).toBe(updates.lastName);
      expect(updatedUser.name.fullName).toBe('Jane Smith');
      expect(updatedUser.phone).toBe(updates.phone);
      expect(updatedUser.updatedAt.getTime()).toBeGreaterThan(user.updatedAt.getTime());
    });

    it('should assign role', () => {
      const user = User.create(validUserData);
      const roleId = 'role-123';

      const userWithRole = user.assignRole(roleId);
      expect(userWithRole.roleId).toBe(roleId);
    });
  });

  describe('Business Rules', () => {
    it('should enforce business rules for login capability', () => {
      const user = User.create(validUserData);

      // New user cannot login (email not verified)
      expect(user.canLogin()).toBe(false);

      // Verified user can login
      const verifiedUser = user.verifyEmail();
      expect(verifiedUser.canLogin()).toBe(true);

      // Inactive user cannot login
      const inactiveUser = verifiedUser.deactivate();
      expect(inactiveUser.canLogin()).toBe(false);

      // Locked user cannot login
      const activeUser = inactiveUser.activate();
      let lockedUser = activeUser;
      for (let i = 0; i < 5; i++) {
        lockedUser = lockedUser.incrementFailedLoginAttempts();
      }
      expect(lockedUser.canLogin()).toBe(false);
    });
  });

  describe('Persistence', () => {
    it('should convert to persistence format', () => {
      const user = User.create(validUserData);
      const persistenceData = user.toPersistence();

      expect(persistenceData.id).toBe(user.id);
      expect(persistenceData.username).toBe(user.username);
      expect(persistenceData.email).toBe(user.email);
      expect(persistenceData.password).toBe(user.password);
      expect(persistenceData.name).toBe(user.name);
      expect(persistenceData.status).toBe(user.status);
      expect(persistenceData.createdAt).toBe(user.createdAt);
      expect(persistenceData.updatedAt).toBe(user.updatedAt);
    });

    it('should create from persistence format', () => {
      const persistenceData = {
        id: 'test-id',
        username: Username.create('testuser'),
        email: Email.create('test@example.com'),
        password: Password.create('hashedpassword'),
        name: PersonName.create('John', 'Doe'),
        phone: '+1234567890',
        status: 'active' as const,
        roleId: 'role-123',
        emailVerified: true,
        emailVerificationToken: undefined,
        emailVerificationExpires: undefined,
        passwordResetToken: undefined,
        passwordResetExpires: undefined,
        lastLogin: new Date(),
        failedLoginAttempts: 0,
        lockedUntil: undefined,
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const user = User.fromPersistence(persistenceData);

      expect(user.id).toBe(persistenceData.id);
      expect(user.username.value).toBe(persistenceData.username.value);
      expect(user.email.value).toBe(persistenceData.email.value);
      expect(user.name.fullName).toBe(persistenceData.name.fullName);
      expect(user.status).toBe(persistenceData.status);
      expect(user.emailVerified).toBe(persistenceData.emailVerified);
    });
  });
});
