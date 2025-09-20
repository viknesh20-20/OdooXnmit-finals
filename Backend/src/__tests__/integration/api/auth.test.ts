import request from 'supertest';
import { Application } from 'express';
import { createApp } from '@/app';
import { DIContainer } from '@infrastructure/di/Container';
import { DatabaseConnection } from '@infrastructure/database/config/DatabaseConfig';

describe('Authentication API Integration Tests', () => {
  let app: Application;
  let databaseConnection: DatabaseConnection;

  beforeAll(async () => {
    // Initialize test environment
    process.env.NODE_ENV = 'test';
    process.env.DB_NAME = 'manufacturing_erp_test';
    
    const appInstance = createApp();
    app = appInstance.getApp();
    
    // Get database connection from DI container
    databaseConnection = DIContainer.getInstance().get<DatabaseConnection>('DatabaseConnection');
    
    // Connect to test database
    await databaseConnection.connect();
    
    // Run migrations for test database
    // await runMigrations();
  });

  afterAll(async () => {
    // Clean up test database
    await databaseConnection.disconnect();
    DIContainer.destroy();
  });

  beforeEach(async () => {
    // Clean up test data before each test
    // await cleanupTestData();
  });

  describe('POST /api/v1/auth/login', () => {
    const loginEndpoint = '/api/v1/auth/login';

    it('should login successfully with valid credentials', async () => {
      // First, create a test user
      const testUser = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'SecurePassword123!',
        firstName: 'Test',
        lastName: 'User',
      };

      // Create user through API or directly in database
      // await createTestUser(testUser);

      const loginData = {
        usernameOrEmail: testUser.email,
        password: testUser.password,
      };

      const response = await request(app)
        .post(loginEndpoint)
        .send(loginData)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          user: {
            username: testUser.username,
            email: testUser.email,
            firstName: testUser.firstName,
            lastName: testUser.lastName,
          },
          accessToken: expect.any(String),
          expiresIn: expect.any(Number),
        },
      });

      // Check that refresh token is set as httpOnly cookie
      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies.some((cookie: string) => cookie.startsWith('refreshToken='))).toBe(true);
    });

    it('should login successfully with username', async () => {
      const testUser = {
        username: 'testuser2',
        email: 'test2@example.com',
        password: 'SecurePassword123!',
        firstName: 'Test',
        lastName: 'User2',
      };

      // await createTestUser(testUser);

      const loginData = {
        usernameOrEmail: testUser.username,
        password: testUser.password,
      };

      const response = await request(app)
        .post(loginEndpoint)
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.username).toBe(testUser.username);
    });

    it('should return 400 for missing credentials', async () => {
      const response = await request(app)
        .post(loginEndpoint)
        .send({})
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
        },
      });
    });

    it('should return 400 for invalid email format', async () => {
      const loginData = {
        usernameOrEmail: 'invalid-email',
        password: 'SecurePassword123!',
      };

      const response = await request(app)
        .post(loginEndpoint)
        .send(loginData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 404 for non-existent user', async () => {
      const loginData = {
        usernameOrEmail: 'nonexistent@example.com',
        password: 'SecurePassword123!',
      };

      const response = await request(app)
        .post(loginEndpoint)
        .send(loginData)
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'ENTITY_NOT_FOUND',
        },
      });
    });

    it('should return 400 for invalid password', async () => {
      const testUser = {
        username: 'testuser3',
        email: 'test3@example.com',
        password: 'SecurePassword123!',
        firstName: 'Test',
        lastName: 'User3',
      };

      // await createTestUser(testUser);

      const loginData = {
        usernameOrEmail: testUser.email,
        password: 'WrongPassword123!',
      };

      const response = await request(app)
        .post(loginEndpoint)
        .send(loginData)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid credentials',
        },
      });
    });

    it('should return 422 for inactive user', async () => {
      const testUser = {
        username: 'inactiveuser',
        email: 'inactive@example.com',
        password: 'SecurePassword123!',
        firstName: 'Inactive',
        lastName: 'User',
        status: 'inactive',
      };

      // await createTestUser(testUser);

      const loginData = {
        usernameOrEmail: testUser.email,
        password: testUser.password,
      };

      const response = await request(app)
        .post(loginEndpoint)
        .send(loginData)
        .expect(422);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'BUSINESS_RULE_VIOLATION',
          message: 'User account is not active',
        },
      });
    });

    it('should return 422 for unverified email', async () => {
      const testUser = {
        username: 'unverifieduser',
        email: 'unverified@example.com',
        password: 'SecurePassword123!',
        firstName: 'Unverified',
        lastName: 'User',
        emailVerified: false,
      };

      // await createTestUser(testUser);

      const loginData = {
        usernameOrEmail: testUser.email,
        password: testUser.password,
      };

      const response = await request(app)
        .post(loginEndpoint)
        .send(loginData)
        .expect(422);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'BUSINESS_RULE_VIOLATION',
          message: 'Email address must be verified before login',
        },
      });
    });

    it('should handle rate limiting', async () => {
      const loginData = {
        usernameOrEmail: 'test@example.com',
        password: 'SecurePassword123!',
      };

      // Make multiple rapid requests to trigger rate limiting
      const requests = Array(10).fill(null).map(() =>
        request(app).post(loginEndpoint).send(loginData)
      );

      const responses = await Promise.all(requests);
      
      // Some requests should be rate limited
      const rateLimitedResponses = responses.filter(res => res.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    const refreshEndpoint = '/api/v1/auth/refresh';

    it('should refresh token successfully with valid refresh token', async () => {
      // First login to get refresh token
      const testUser = {
        username: 'refreshuser',
        email: 'refresh@example.com',
        password: 'SecurePassword123!',
        firstName: 'Refresh',
        lastName: 'User',
      };

      // await createTestUser(testUser);

      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          usernameOrEmail: testUser.email,
          password: testUser.password,
        });

      const cookies = loginResponse.headers['set-cookie'];
      const refreshTokenCookie = cookies.find((cookie: string) => 
        cookie.startsWith('refreshToken=')
      );

      expect(refreshTokenCookie).toBeDefined();

      // Use refresh token to get new access token
      const response = await request(app)
        .post(refreshEndpoint)
        .set('Cookie', refreshTokenCookie!)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          accessToken: expect.any(String),
          expiresIn: expect.any(Number),
        },
      });

      // Should set new refresh token cookie
      const newCookies = response.headers['set-cookie'];
      expect(newCookies).toBeDefined();
      expect(newCookies.some((cookie: string) => cookie.startsWith('refreshToken='))).toBe(true);
    });

    it('should return 401 for missing refresh token', async () => {
      const response = await request(app)
        .post(refreshEndpoint)
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'MISSING_REFRESH_TOKEN',
          message: 'Refresh token is required',
        },
      });
    });

    it('should return 401 for invalid refresh token', async () => {
      const response = await request(app)
        .post(refreshEndpoint)
        .set('Cookie', 'refreshToken=invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    const logoutEndpoint = '/api/v1/auth/logout';

    it('should logout successfully', async () => {
      // First login to get access token
      const testUser = {
        username: 'logoutuser',
        email: 'logout@example.com',
        password: 'SecurePassword123!',
        firstName: 'Logout',
        lastName: 'User',
      };

      // await createTestUser(testUser);

      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          usernameOrEmail: testUser.email,
          password: testUser.password,
        });

      const accessToken = loginResponse.body.data.accessToken;
      const cookies = loginResponse.headers['set-cookie'];

      const response = await request(app)
        .post(logoutEndpoint)
        .set('Authorization', `Bearer ${accessToken}`)
        .set('Cookie', cookies)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Logged out successfully',
      });

      // Should clear refresh token cookie
      const setCookieHeaders = response.headers['set-cookie'];
      if (setCookieHeaders) {
        const refreshTokenCookie = setCookieHeaders.find((cookie: string) => 
          cookie.startsWith('refreshToken=')
        );
        if (refreshTokenCookie) {
          expect(refreshTokenCookie).toContain('Max-Age=0');
        }
      }
    });

    it('should return 401 for missing access token', async () => {
      const response = await request(app)
        .post(logoutEndpoint)
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'MISSING_TOKEN',
          message: 'Authorization token is required',
        },
      });
    });
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        timestamp: expect.any(String),
        uptime: expect.any(Number),
        environment: 'test',
        version: '1.0.0',
        health: expect.any(Object),
      });
    });
  });
});
