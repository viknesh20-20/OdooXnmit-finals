# Manufacturing ERP Backend

A complete, production-ready Manufacturing ERP backend built with TypeScript, Clean Architecture principles, Express.js, and PostgreSQL.

## 🏗️ Architecture

This application follows **Clean Architecture** principles with clear separation of concerns:

```
src/
├── domain/                 # Enterprise Business Rules
│   ├── entities/          # Domain entities with business logic
│   ├── value-objects/     # Immutable value objects
│   ├── repositories/      # Repository interfaces
│   ├── services/          # Domain services
│   ├── events/           # Domain events
│   └── exceptions/       # Domain-specific exceptions
├── application/           # Application Business Rules
│   ├── use-cases/        # Application use cases
│   ├── dtos/            # Data Transfer Objects
│   ├── interfaces/      # Application service interfaces
│   └── mappers/         # Entity-DTO mappers
├── infrastructure/       # Frameworks & Drivers
│   ├── database/        # Database implementations
│   ├── security/        # Security services
│   ├── logging/         # Logging implementations
│   ├── external-services/ # External API integrations
│   └── di/             # Dependency injection container
├── presentation/         # Interface Adapters
│   ├── controllers/     # HTTP controllers
│   ├── middleware/      # Express middleware
│   ├── routes/         # Route definitions
│   └── validators/     # Request validation
└── types/               # Shared TypeScript types
```

## 🚀 Features

### Core Manufacturing ERP Functionality
- **Manufacturing Orders**: Complete lifecycle management from creation to completion
- **Bill of Materials (BOM)**: Multi-level BOM management with versioning
- **Inventory Management**: Real-time stock tracking with reservation system
- **Work Orders**: Detailed production planning and execution
- **Quality Control**: Inspection workflows and quality tracking
- **Cost Tracking**: Material, labor, and overhead cost calculation

### Technical Features
- **Clean Architecture**: Domain-driven design with clear layer separation
- **TypeScript**: Strict type checking for enhanced code quality
- **JWT Authentication**: Secure access and refresh token implementation
- **Role-based Access Control**: Granular permission system
- **Audit Logging**: Comprehensive activity tracking
- **Transaction Safety**: ACID compliance with proper isolation levels
- **Event-Driven Architecture**: Domain events for business workflow coordination
- **Dependency Injection**: IoC container using Inversify
- **Comprehensive Validation**: Input validation with detailed error messages
- **Performance Monitoring**: Request/response logging and performance metrics
- **Rate Limiting**: API protection against abuse
- **Security Headers**: Helmet.js for security best practices

## 🛠️ Technology Stack

- **Runtime**: Node.js 18+
- **Language**: TypeScript 5.3+
- **Framework**: Express.js 4.18+
- **Database**: PostgreSQL 14+
- **ORM**: Sequelize 6.35+
- **Authentication**: JWT with bcrypt
- **Validation**: express-validator + class-validator
- **Logging**: Winston with daily rotation
- **Testing**: Jest with ts-jest
- **Dependency Injection**: Inversify
- **Security**: Helmet, CORS, Rate limiting

## 📋 Prerequisites

- Node.js 18.0.0 or higher
- npm 8.0.0 or higher
- PostgreSQL 14.0 or higher
- Git

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd manufacturing-erp-backend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Create a `.env` file in the root directory:

```env
# Server Configuration
NODE_ENV=development
PORT=3000

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=manufacturing_erp
DB_USER=postgres
DB_PASSWORD=your_password
DB_POOL_MAX=10
DB_POOL_MIN=2

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production-min-32-chars
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production-min-32-chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Security Configuration
BCRYPT_SALT_ROUNDS=12

# CORS Configuration
CORS_ORIGIN=http://localhost:3000,http://localhost:3001

# Logging Configuration
LOG_LEVEL=info
LOG_FILE_PATH=logs/

# Email Configuration (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### 4. Database Setup
```bash
# Create database
createdb manufacturing_erp

# Run migrations
npm run db:migrate

# Seed initial data
npm run db:seed
```

### 5. Start Development Server
```bash
npm run dev
```

The server will start at `http://localhost:3000`

## 📚 API Documentation

### Authentication Endpoints

#### POST /api/v1/auth/login
Login with username/email and password.

**Request:**
```json
{
  "usernameOrEmail": "admin@example.com",
  "password": "SecurePassword123!"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "username": "admin",
      "email": "admin@example.com",
      "firstName": "Admin",
      "lastName": "User",
      "role": "administrator"
    },
    "accessToken": "jwt-token",
    "expiresIn": 900
  }
}
```

#### POST /api/v1/auth/refresh
Refresh access token using refresh token.

#### POST /api/v1/auth/logout
Logout current session.

#### POST /api/v1/auth/logout-all
Logout from all devices.

### Health Check

#### GET /health
System health check endpoint.

**Response:**
```json
{
  "success": true,
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 3600,
  "environment": "development",
  "version": "1.0.0",
  "health": {
    "database": true,
    "logger": true,
    "containerValidation": true
  }
}
```

## 🧪 Testing

### Run Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration
```

### Test Structure
```
src/
├── __tests__/
│   ├── unit/              # Unit tests
│   │   ├── domain/
│   │   ├── application/
│   │   └── infrastructure/
│   └── integration/       # Integration tests
│       ├── api/
│       └── database/
```

## 🔧 Development

### Code Quality
```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Fix linting issues
npm run lint:fix

# Build for production
npm run build
```

### Database Operations
```bash
# Run migrations
npm run db:migrate

# Undo last migration
npm run db:migrate:undo

# Seed database
npm run db:seed

# Reset database
npm run db:reset
```

## 🐳 Docker Support

### Build and Run with Docker
```bash
# Build Docker image
npm run docker:build

# Start with Docker Compose
npm run docker:up

# Stop Docker containers
npm run docker:down

# View logs
npm run docker:logs
```

## 📊 Monitoring and Logging

### Log Files
- `logs/application-YYYY-MM-DD.log` - Application logs
- `logs/error-YYYY-MM-DD.log` - Error logs only
- `logs/combined-YYYY-MM-DD.log` - All logs combined
- `logs/exceptions.log` - Uncaught exceptions
- `logs/rejections.log` - Unhandled promise rejections

### Performance Monitoring
The application includes built-in performance monitoring for:
- Database query performance
- API request/response times
- Business operation execution times
- Memory usage and system metrics

## 🔒 Security

### Security Features
- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt with configurable salt rounds
- **Rate Limiting**: Protection against brute force attacks
- **CORS Protection**: Configurable cross-origin resource sharing
- **Security Headers**: Helmet.js for security headers
- **Input Validation**: Comprehensive request validation
- **SQL Injection Prevention**: Parameterized queries with Sequelize
- **XSS Protection**: Input sanitization and output encoding

### Security Best Practices
1. Change default JWT secrets in production
2. Use environment variables for sensitive configuration
3. Enable HTTPS in production
4. Regularly update dependencies
5. Monitor security logs
6. Implement proper backup strategies

## 🚀 Production Deployment

### Environment Variables
Ensure all required environment variables are set in production:
- Use strong, unique JWT secrets (minimum 32 characters)
- Configure proper database connection settings
- Set appropriate CORS origins
- Configure SMTP settings for email notifications
- Set LOG_LEVEL to 'warn' or 'error' in production

### Performance Optimization
- Enable database connection pooling
- Configure appropriate cache settings
- Use process managers like PM2
- Set up load balancing for high availability
- Monitor database performance and optimize queries

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript strict mode
- Write comprehensive tests for new features
- Follow Clean Architecture principles
- Document public APIs
- Use conventional commit messages

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the test files for usage examples

## 🗺️ Roadmap

- [ ] GraphQL API support
- [ ] Real-time notifications with WebSockets
- [ ] Advanced reporting and analytics
- [ ] Mobile API optimizations
- [ ] Microservices architecture migration
- [ ] Kubernetes deployment configurations
