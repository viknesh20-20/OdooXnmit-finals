const express = require('express');
require('dotenv').config();

const app = express();

// Basic middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

// Basic auth endpoints (mock for testing)
app.post('/api/v1/auth/login', (req, res) => {
  const { usernameOrEmail, password } = req.body;
  
  if (!usernameOrEmail || !password) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Username/email and password are required'
      }
    });
  }

  // Mock successful login
  const mockUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    username: 'admin',
    email: 'admin@example.com',
    firstName: 'Admin',
    lastName: 'User',
    fullName: 'Admin User',
    status: 'active',
    emailVerified: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const mockTokens = {
    accessToken: 'mock-access-token-' + Date.now(),
    refreshToken: 'mock-refresh-token-' + Date.now(),
    expiresIn: 900,
    tokenType: 'Bearer'
  };

  // Note: In a real implementation, set refresh token as httpOnly cookie

  res.status(200).json({
    success: true,
    data: {
      user: mockUser,
      accessToken: mockTokens.accessToken,
      expiresIn: mockTokens.expiresIn,
      message: 'Login successful'
    }
  });
});

app.post('/api/v1/auth/refresh', (req, res) => {
  const refreshToken = req.body.refreshToken;
  
  if (!refreshToken) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Refresh token is required'
      }
    });
  }

  // Mock token refresh
  const newTokens = {
    accessToken: 'mock-new-access-token-' + Date.now(),
    refreshToken: 'mock-new-refresh-token-' + Date.now(),
    expiresIn: 900,
    tokenType: 'Bearer'
  };

  // Note: In a real implementation, set new refresh token as httpOnly cookie

  res.status(200).json({
    success: true,
    data: {
      accessToken: newTokens.accessToken,
      expiresIn: newTokens.expiresIn,
      message: 'Token refreshed successfully'
    }
  });
});

app.post('/api/v1/auth/logout', (req, res) => {
  // Note: In a real implementation, clear refresh token cookie
  
  res.status(200).json({
    success: true,
    data: {
      message: 'Logout successful'
    }
  });
});

// API info endpoint
app.get('/api/v1', (req, res) => {
  res.status(200).json({
    name: 'Manufacturing ERP Backend API',
    version: '1.0.0',
    description: 'RESTful API for Manufacturing ERP System',
    endpoints: {
      health: 'GET /health',
      auth: {
        login: 'POST /api/v1/auth/login',
        refresh: 'POST /api/v1/auth/refresh',
        logout: 'POST /api/v1/auth/logout'
      }
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`
    }
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred'
    }
  });
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`🚀 Manufacturing ERP Backend (Simple Mode) started successfully!`);
  console.log(`📍 Server running on port ${port}`);
  console.log(`🏥 Health check: http://localhost:${port}/health`);
  console.log(`📚 API info: http://localhost:${port}/api/v1`);
  console.log(`🔐 Login endpoint: http://localhost:${port}/api/v1/auth/login`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
