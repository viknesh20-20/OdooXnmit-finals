# Manufacturing ERP System

A comprehensive Enterprise Resource Planning (ERP) system designed specifically for manufacturing operations, built with modern web technologies and following clean architecture principles.

## 🎥 Demo Video

[**Watch the System Demo**](https://drive.google.com/file/d/1Hy_BGSzdIJ7Wt2i84qfPT21iVzFV21Rr/view?usp=sharing)
> *Click the link above to see the Manufacturing ERP system in action*

## 🚀 Features

### Core Manufacturing Modules
- **Manufacturing Orders** - Plan, track, and manage production orders
- **Work Orders** - Detailed operation scheduling and execution
- **Bills of Materials (BOM)** - Product structure and component management
- **Work Centers** - Production resource planning and utilization
- **Stock Management** - Inventory tracking with real-time stock movements
- **Quality Control** - Built-in quality checks and compliance tracking

### Advanced Capabilities
- **Real-time Dashboard** - Live production metrics and KPIs
- **Comprehensive Reports** - Production efficiency, inventory, and utilization reports
- **Export Functions** - CSV/Excel export for all major data sets
- **User Management** - Role-based access control and authentication
- **Responsive Design** - Works seamlessly on desktop, tablet, and mobile

## 🛠 Technology Stack

### Backend
- **Node.js** with **TypeScript** - Type-safe server-side development
- **Express.js** - Fast, minimalist web framework
- **PostgreSQL** - Robust relational database with advanced features
- **Sequelize ORM** - Database abstraction and migrations
- **JWT Authentication** - Secure token-based authentication
- **Clean Architecture** - Separation of concerns with dependency injection

### Frontend
- **React 18** with **TypeScript** - Modern, type-safe UI development
- **Vite** - Lightning-fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Beautiful, customizable icons
- **React Router** - Client-side routing
- **Axios** - HTTP client for API communication

### Database
- **PostgreSQL 14+** - Primary database with JSONB support
- **Custom Enums** - Type-safe status management
- **Foreign Key Constraints** - Data integrity enforcement
- **Indexes** - Optimized query performance

## 📋 Prerequisites

Before running the Manufacturing ERP system, ensure you have:

- **Node.js** (v18 or higher)
- **npm** or **yarn** package manager
- **PostgreSQL** (v14 or higher)
- **Git** for version control

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd manufacturing-erp
```

### 2. Database Setup
```bash
# Create PostgreSQL database
createdb ERPDB

# Update database credentials in Backend/.env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ERPDB
DB_USER=your_username
DB_PASSWORD=your_password
```

### 3. Backend Setup
```bash
cd Backend
npm install
npm run build
npm start
```
The backend will start on `http://localhost:3000`

### 4. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
The frontend will start on `http://localhost:5174` (or next available port)

### 5. Default Login
- **Email**: `admin@manufacturing.com`
- **Password**: `admin123`

## 📁 Project Structure

```
manufacturing-erp/
├── Backend/                 # Node.js/Express backend
│   ├── src/
│   │   ├── application/     # Business logic layer
│   │   ├── domain/         # Domain entities and interfaces
│   │   ├── infrastructure/ # Database, external services
│   │   └── presentation/   # Controllers, routes, validators
│   ├── dist/              # Compiled JavaScript
│   └── package.json
├── frontend/              # React frontend
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/        # Page components
│   │   ├── hooks/        # Custom React hooks
│   │   ├── lib/          # Utilities and services
│   │   └── types/        # TypeScript type definitions
│   └── package.json
└── README.md
```

## 🔧 Configuration

### Environment Variables (Backend/.env)
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ERPDB
DB_USER=your_username
DB_PASSWORD=your_password

# Server Configuration
PORT=3000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

# CORS Configuration
CORS_ORIGIN=http://localhost:5174
```

## 📊 Key Features Walkthrough

### Manufacturing Orders
- Create and manage production orders
- Track order status from planning to completion
- Link orders to BOMs and work centers
- Monitor progress with real-time updates

### Work Orders
- Break down manufacturing orders into specific operations
- Assign work to specific work centers
- Track time and resource utilization
- Quality control checkpoints

### Inventory Management
- Real-time stock tracking
- Automated stock movements
- Low stock alerts and reorder points
- Comprehensive stock reports

### Reports & Analytics
- Production efficiency metrics
- Work center utilization reports
- Inventory summary and valuation
- Export capabilities for external analysis

## 🧪 Testing

### Backend Tests
```bash
cd Backend
npm test
```

### Frontend Tests
```bash
cd frontend
npm test
```

## 🚀 Production Deployment

### Backend Production Build
```bash
cd Backend
npm run build
npm run start:prod
```

### Frontend Production Build
```bash
cd frontend
npm run build
# Serve the dist/ folder with your preferred web server
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the documentation in the `/docs` folder
- Review the demo video for usage examples

## 🔄 Version History

- **v1.0.0** - Initial release with core manufacturing features
- **v1.1.0** - Added advanced reporting and export capabilities
- **v1.2.0** - Enhanced UI/UX and mobile responsiveness

---

**Built with ❤️ for modern manufacturing operations**
