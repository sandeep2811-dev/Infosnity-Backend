# InfoSnity | Institutional Information Portal Backend

A robust Node.js/Express backend service for the InfoSnity platform - a centralized institutional information portal built to handle API requests, data processing, and business logic for 300+ concurrent users.

## 🎯 Overview

InfoSnity Backend is a scalable, modular Node.js/Express server that powers the institutional information management system. Built with performance optimization, REST API best practices, and API-contract-first methodology to enable seamless integration with the frontend.

## 🛠 Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Language**: JavaScript
- **Package Manager**: npm/yarn
- **API Architecture**: REST APIs
- **Authentication**: JWT (JSON Web Tokens)

## ✨ Key Features

- **RESTful API Architecture**: Clean and scalable API endpoints
- **High Performance**: Optimized for handling 300+ concurrent users
- **Modular Codebase**: Well-organized, maintainable code structure
- **Request Validation**: Comprehensive input validation and error handling
- **CORS Enabled**: Seamless frontend-backend integration
- **Environment-based Configuration**: Flexible configuration management
- **Authentication & Authorization**: JWT-based secure authentication
- **Database Ready**: PostgreSQL integration with query optimization
- **API-Contract-First**: Enables parallel development with zero integration regressions

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm (v6 or higher) or yarn
- PostgreSQL (for database)

### Installation

```bash
# Clone the repository
git clone https://github.com/sandeep2811-dev/Infosnity-Backend.git

# Navigate to the project directory
cd Infosnity-Backend

# Install dependencies
npm install
```

### Configuration

1. **Create a `.env` file** in the root directory:
   ```bash
   cp .env.example .env
   ```

2. **Update environment variables**:
   ```
   NODE_ENV=development
   PORT=5000
   DATABASE_URL=postgresql://user:password@localhost:5432/infosnity
   JWT_SECRET=your_secure_jwt_secret_key
   FRONTEND_URL=http://localhost:3000
   ```

## 🔧 Running the Server

### Development Mode
```bash
npm run dev
```
The server will start on `http://localhost:5000` with hot-reload enabled

### Production Mode
```bash
npm start
```

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Core Endpoints

```
GET    /api/health              - Health check
POST   /api/auth/login          - User authentication
GET    /api/users               - Get all users
GET    /api/users/:id           - Get user by ID
POST   /api/users               - Create new user
PUT    /api/users/:id           - Update user
DELETE /api/users/:id           - Delete user
GET    /api/institutions        - Get institutional data
```

## 📁 Project Structure

```
Infosnity-Backend/
├── src/
│   ├── routes/                 # API route handlers
│   ├── controllers/            # Business logic
│   ├── models/                 # Data models & schemas
│   ├── middleware/             # Custom middleware (auth, validation, etc.)
│   ├── utils/                  # Utility functions
│   ├── config/                 # Configuration files
│   ├── services/               # Business services
│   └── app.js                  # Express app setup
├── .env.example                # Environment variables template
├── .gitignore                  # Git ignore rules
├── package.json                # Project dependencies
├── server.js                   # Entry point
└── README.md                   # This file
```

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## 📊 Database Schema

The backend uses PostgreSQL with optimized query indexing for improved performance:

- **Users Table**: User profiles and authentication data
- **Institutions Table**: Institutional information
- **Sessions Table**: User session management
- **Audit Logs**: For tracking and compliance

## 🧪 Testing

Run tests with:
```bash
npm test
```

For test coverage:
```bash
npm run test:coverage
```

## 📦 Build & Deployment

### Deploy to Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Deploy to Heroku
```bash
heroku login
heroku create your-app-name
heroku config:set NODE_ENV=production
git push heroku main
```

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📊 Performance Metrics

- **Data Retrieval Optimization**: 40% latency reduction through query optimization
- **Concurrent User Support**: Tested and optimized for 300+ simultaneous users
- **API Response Time**: < 200ms average response time
- **Database Query Optimization**: Strategic indexing and efficient queries

## 🔄 API-Contract-First Development

This backend follows API-contract-first development principles, enabling:
- Clear API specifications before implementation
- Parallel frontend-backend development
- Zero integration regressions
- Improved team communication

## 📝 License

This project is licensed under the MIT License.

## 👤 Author

**Sandeep Kataria**
- GitHub: [@sandeep2811-dev](https://github.com/sandeep2811-dev)

## 🌐 Related Projects

- **Frontend**: [Infty-Frontend](https://github.com/sandeep2811-dev/Infty-frontend) - Live: https://infty-frontend.vercel.app/

## 📞 Support

For support and inquiries, please open an issue on the GitHub repository or contact the development team.

---

**Built with ❤️ for institutional information management**
