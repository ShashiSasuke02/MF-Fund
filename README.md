# MF Investments - Mutual Fund Explorer & Demo Trading Platform

A comprehensive full-stack web application for exploring mutual funds and practicing investments with virtual money. Built with Express.js, SQLite, and React.

[![Tests](https://img.shields.io/badge/tests-67%20passed-success)](./tests)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org)

---

## 🚀 Quick Start

```bash
# Install dependencies
npm run install:all

# Start development servers
npm run dev

# Run tests
npm test
```

**Access Application:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:4000

---

## ✨ Key Features

### 💰 Demo Trading System
- **₹10,00,000 Virtual Balance** - Practice investing without risk
- **Real-time NAV Updates** - Live mutual fund prices
- **Complete Portfolio Tracking** - Monitor investments and returns

### 📊 Investment Options
- **Lump Sum** - One-time investments
- **SIP** - Systematic Investment Plan (Daily/Weekly/Monthly/Quarterly)
- **STP** - Systematic Transfer Plan between funds
- **SWP** - Systematic Withdrawal Plan
- **Redemption** - Sell holdings anytime

### 📱 Modern Features
- **40+ AMCs** - Browse top Asset Management Companies
- **1000+ Mutual Funds** - Complete fund database
- **Responsive Design** - Works on all devices
- **Google Ads Integration** - Revenue-optimized placement
- **Secure Authentication** - JWT-based user sessions

---

## 📚 Documentation

### 📖 Complete Guides
- **[Installation & Deployment Guide](./documents/INSTALLATION_AND_DEPLOYMENT.md)** - Step-by-step setup for development and production
- **[Project Details](./documents/PROJECT_DETAILS.md)** - Technical architecture and API documentation
- **[Google Ads Implementation](./documents/GOOGLE_ADS_IMPLEMENTATION.md)** - AdSense setup and optimization
- **[Deployment Guide](./documents/DEPLOYMENT_GUIDE.md)** - Cloud deployment options
- **[Systematic Plans Feature](./documents/SYSTEMATIC_PLANS_FEATURE.md)** - SIP/STP/SWP implementation details

### 📋 Additional Documentation
- **[Mobile Optimization](./documents/MOBILE_OPTIMIZATION.md)** - Responsive design details
- **[Production Readiness Report](./documents/PRODUCTION_READINESS_REPORT.md)** - Quality assurance checklist
- **[Bug Fix Report](./documents/BUG_FIX_REPORT.md)** - Issues resolved
- **[Test Findings](./documents/TEST_FINDINGS.md)** - Test coverage and results
- **[MFapi Implementation Guide](./documents/MFAPI-Implementation-Guide.md)** - External API integration

---

## 🛠️ Tech Stack

**Backend:**
- Express.js 4.x
- SQLite (sql.js)
- JWT Authentication
- Bcrypt Password Hashing
- Axios API Client
- Helmet Security
- Rate Limiting

**Frontend:**
- React 18
- React Router 6
- TailwindCSS 3
- Vite 5
- Context API

**Testing:**
- Jest 29
- 67 Unit Tests
- 100% Pass Rate

---

## 📦 Installation

### Prerequisites
- Node.js 18+ and NPM 9+
- 4GB RAM minimum
- Internet connection (for API access)

### Development Setup

```bash
# 1. Clone repository
git clone https://github.com/ShashidharBelavankiTR/MF-Investments.git
cd MF-Investments

# 2. Install all dependencies
npm run install:all

# 3. Create environment files
cp .env.example .env
cp client/.env.example client/.env

# 4. Configure environment variables
# Edit .env and client/.env with your credentials

# 5. Start development servers
npm run dev
```

**Detailed Instructions:** See [Installation & Deployment Guide](./documents/INSTALLATION_AND_DEPLOYMENT.md)

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific suites
npm run test:unit
npm run test:integration

# Watch mode
npm run test:watch
```

**Test Results:**
- ✅ 67 tests passing
- ✅ 100% pass rate
- ✅ Controllers, Services, Models covered

---

## 🏗️ Production Build

```bash
# Build frontend for production
npm run build:client

# Preview production build
cd client && npm run preview

# Start production server
npm start
```

**Production Deployment:** See [Installation & Deployment Guide](./documents/INSTALLATION_AND_DEPLOYMENT.md#production-deployment)

---

## 📁 Project Structure

```
MF-Investments/
├── client/                 # React Frontend
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── contexts/      # React Context (Auth)
│   │   ├── api/           # API client
│   │   └── App.jsx        # Main app component
│   └── package.json
│
├── src/                    # Express Backend
│   ├── controllers/       # Request handlers
│   ├── models/            # Database models
│   ├── routes/            # API routes
│   ├── services/          # Business logic
│   ├── middleware/        # Auth, error handling
│   ├── db/               # Database utilities
│   ├── app.js            # Express app setup
│   └── server.js         # Server entry point
│
├── tests/                 # Test Suite
│   ├── unit/             # Unit tests
│   └── README.md         # Testing documentation
│
├── scripts/              # Utility scripts
│   ├── cleanup-db.js    # Database cleanup
│   └── inspect-db.js    # Database inspection
│
├── documents/            # Documentation
│   ├── INSTALLATION_AND_DEPLOYMENT.md
│   ├── PROJECT_DETAILS.md
│   ├── GOOGLE_ADS_IMPLEMENTATION.md
│   └── ... (see above for complete list)
│
├── .env                  # Backend environment variables
├── package.json          # Backend dependencies
└── README.md            # This file
```

---

## 🔒 Security Features

- **JWT Authentication** - Secure token-based auth
- **Password Hashing** - Bcrypt with salt rounds
- **Rate Limiting** - 100 requests per minute
- **Helmet.js** - Security headers
- **CORS Protection** - Configured origins
- **Input Validation** - Express-validator
- **SQL Injection Prevention** - Parameterized queries
- **XSS Protection** - React's built-in protection

---

## 🌐 API Endpoints

### Public Endpoints
- `GET /api/health` - Health check
- `GET /api/amcs` - List all AMCs
- `GET /api/amcs/:id/funds` - Get funds by AMC
- `GET /api/funds/:code` - Get fund details
- `GET /api/funds/search` - Search funds

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile (protected)

### Demo Trading (Protected)
- `POST /api/demo/invest` - Execute investment
- `GET /api/demo/portfolio` - Get portfolio
- `GET /api/demo/transactions` - Get transaction history
- `GET /api/demo/systematic-plans` - Get active SIP/STP/SWP plans
- `GET /api/demo/balance` - Get account balance

**Full API Documentation:** See [Project Details](./documents/PROJECT_DETAILS.md#api-endpoints)

---

## 🎨 Features in Detail

### Demo Trading Account
Every registered user gets:
- ₹10,00,000 virtual starting balance
- Real-time NAV updates for holdings
- Complete transaction history
- Portfolio performance tracking

### Systematic Plans
- **SIP (Systematic Investment Plan)**
  - Invest fixed amounts regularly
  - Daily, Weekly, Monthly, or Quarterly frequency
  - Automatic execution on scheduled dates

- **STP (Systematic Transfer Plan)**
  - Transfer between funds regularly
  - Same frequency options as SIP
  - Maintain investment balance

- **SWP (Systematic Withdrawal Plan)**
  - Withdraw fixed amounts regularly
  - Generate regular income from investments
  - Flexible withdrawal schedules

### Google AdSense Integration
- Strategic ad placement on 6+ pages
- Banner, Display, Rectangle, and In-Feed ads
- Revenue-optimized placement
- Google policy compliant (3-4 ads per page max)

---

## 🚢 Deployment Options

### Traditional Server (VPS)
- Ubuntu/CentOS with Nginx
- PM2 process manager
- Let's Encrypt SSL
- **Guide:** [Installation & Deployment](./documents/INSTALLATION_AND_DEPLOYMENT.md#option-1-traditional-server)

### Cloud Platforms
- Heroku
- Railway
- Render
- AWS/Azure/GCP
- **Guide:** [Installation & Deployment](./documents/INSTALLATION_AND_DEPLOYMENT.md#option-2-cloud-platform)

### Docker
- Containerized deployment
- Docker Compose support
- **Guide:** [Installation & Deployment](./documents/INSTALLATION_AND_DEPLOYMENT.md#option-3-docker-deployment)

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👥 Authors

- **Shashidhar Belavanki** - *Initial work* - [ShashidharBelavankiTR](https://github.com/ShashidharBelavankiTR)

---

## 🙏 Acknowledgments

- **MFapi.in** - For providing the mutual fund data API
- **Google AdSense** - For monetization support
- **Thomson Reuters** - For project support
- All contributors and testers

---

## 📧 Support

- **GitHub Issues**: [Report a bug](https://github.com/ShashidharBelavankiTR/MF-Investments/issues)
- **Documentation**: See [documents folder](./documents)
- **Email**: support@trymutualfunds.com

---

## 🗺️ Roadmap

### Planned Features
- [ ] Email notifications for SIP/STP/SWP executions
- [ ] Export portfolio to PDF
- [ ] Advanced charting and analytics
- [ ] Comparison tool for multiple funds
- [ ] Investment recommendations based on risk profile
- [ ] Mobile app (React Native)
- [ ] Social sharing of portfolio performance
- [ ] Tax calculation and reports

---

**Built with ❤️ using Node.js, React, and modern web technologies**

**Last Updated:** January 14, 2026  
**Version:** 1.0.0
