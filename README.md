# MF Selection - Mutual Fund Explorer

A comprehensive Node.js web application for exploring and selecting mutual funds from top Asset Management Companies (AMCs) in India. Built with Express.js backend and React frontend, integrating with MFapi.in API for real-time mutual fund data.

## Features

### Core Features
- **Top AMCs Display**: View top 5 Asset Management Companies with fund counts
- **Fund Listing**: Browse all mutual fund schemes for each AMC with search, filter, and sort capabilities
- **Fund Details**: View comprehensive information about individual funds including NAV, category, and historical data
- **Real-time Data**: Integration with MFapi.in API for up-to-date mutual fund information
- **Caching**: In-memory caching to optimize API calls and improve performance
- **Responsive Design**: Modern, mobile-friendly UI built with React and Tailwind CSS

### Investment Management
- **User Authentication**: Secure registration and login with JWT authentication
- **Demo Trading Account**: Practice investments with virtual balance (₹10,00,000)
- **Multiple Transaction Types**:
  - **Lump Sum**: One-time investments
  - **SIP (Systematic Investment Plan)**: Regular investments with daily, weekly, monthly, or quarterly frequency
  - **STP (Systematic Transfer Plan)**: Regular transfers between funds with daily, weekly, monthly, or quarterly frequency
  - **SWP (Systematic Withdrawal Plan)**: Regular withdrawals with daily, weekly, monthly, or quarterly frequency
  - **Redemption**: Sell existing holdings
- **Portfolio Management**: Track all your investments with real-time NAV updates
- **Transaction History**: View all your past transactions with detailed information
- **Real-time Balance**: Monitor your demo account balance after each transaction

## Tech Stack

### Backend
- **Node.js** with ES Modules
- **Express.js** - Web framework
- **SQLite** (sql.js) - In-memory database for user data and transactions
- **JWT** - JSON Web Tokens for authentication
- **bcrypt** - Password hashing
- **Axios** - HTTP client for MFapi.in integration
- **Helmet** - Security middleware
- **CORS** - Cross-origin resource sharing
- **Morgan** - HTTP request logging
- **express-rate-limit** - API rate limiting
- **dotenv** - Environment configuration

### Frontend
- **React 18** - UI framework
- **React Router 6** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **Vite** - Build tool and dev server
- **Context API** - State management for authentication

### Testing
- **Jest** - Testing framework with ES modules support
- **Supertest** - HTTP assertions for API testing
- **64 unit tests** - Comprehensive test coverage for models, controllers, and services

## Project Structure

```
mf-selection/
├── src/                        # Backend source code
│   ├── controllers/            # Route handlers
│   │   ├── amc.controller.js
│   │   ├── auth.controller.js  # Authentication endpoints
│   │   ├── demo.controller.js  # Demo trading endpoints
│   │   └── fund.controller.js
│   ├── db/                     # Database configuration
│   │   ├── database.js
│   │   └── schema.sql
│   ├── middleware/             # Express middleware
│   │   ├── auth.middleware.js  # JWT authentication
│   │   └── errorHandler.js
│   ├── models/                 # Data models
│   │   ├── amc.model.js
│   │   ├── demoAccount.model.js
│   │   ├── holding.model.js
│   │   ├── transaction.model.js
│   │   └── user.model.js
│   ├── routes/                 # API routes
│   │   ├── amc.routes.js
│   │   ├── auth.routes.js      # Authentication routes
│   │   ├── demo.routes.js      # Demo trading routes
│   │   ├── fund.routes.js
│   │   └── health.routes.js
│   ├── services/               # Business logic
│   │   ├── cache.service.js
│   │   ├── demo.service.js     # Investment logic
│   │   └── mfapi.service.js
│   ├── app.js                  # Express app configuration
│   └── server.js               # Server entry point
├── client/                     # Frontend source code
│   ├── src/
│   │   ├── api/               # API client
│   │   ├── components/        # Reusable components
│   │   ├── contexts/          # React contexts
│   │   │   └── AuthContext.jsx
│   │   ├── pages/             # Page components
│   │   │   ├── AmcList.jsx
│   │   │   ├── FundDetails.jsx
│   │   │   ├── FundList.jsx
│   │   │   ├── Invest.jsx     # Investment page
│   │   │   ├── Login.jsx
│   │   │   ├── Portfolio.jsx  # Portfolio page
│   │   │   └── Register.jsx
│   │   ├── App.jsx            # Main app component
│   │   ├── main.jsx           # Entry point
│   │   └── index.css          # Global styles
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
├── tests/                      # Test files
│   └── unit/                   # Unit tests
│       ├── controllers/
│       ├── models/
│       └── services/
├── scripts/                    # Utility scripts
│   ├── fix-orphaned-data.js
│   └── reset-test-data.js
├── data/                       # SQLite database (auto-created)
├── .env                        # Environment variables
├── .gitignore
├── package.json
└── README.md
```

## Prerequisites

- Node.js 18.x or higher
- npm 9.x or higher

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd mf-selection
   ```

2. **Install backend dependencies**
   ```bash
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd client
   npm install
   cd ..
   ```

4. **Configure environment variables**
   
   The `.env` file is already configured with defaults. Modify if needed:
   ```env
   PORT=4000
   NODE_ENV=development
   MFAPI_BASE_URL=https://api.mfapi.in
   MFAPI_TIMEOUT=15000
   CACHE_TTL=3600000
   RATE_LIMIT_WINDOW_MS=60000
   RATE_LIMIT_MAX_REQUESTS=100
   ```

## Running the Application

### Development Mode (Recommended)

Run both backend and frontend concurrently:
```bash
npm run dev
```
- Backend runs on http://localhost:4000
- Frontend runs on http://localhost:5173

### Testing

Run all unit tests:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

Run tests with coverage:
```bash
npm run test:coverage
```

### Production Mode

1. **Build the frontend**
   ```bash
   cd client
   npm run build
   cd ..
   ```

2. **Start the production server**
   ```bash
   npm start
   ```
   
   The server serves both the API and the built React app on http://localhost:4000

## API Endpoints

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/profile` | Get user profile (requires auth) |

### Demo Trading Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/demo/balance` | Get demo account balance |
| POST | `/api/demo/transactions` | Create new transaction |
| GET | `/api/demo/transactions` | Get transaction history |
| GET | `/api/demo/portfolio` | Get current holdings |

**Supported Transaction Types:**
- `LUMP_SUM` - One-time investment
- `SIP` - Systematic Investment Plan (daily/weekly/monthly/quarterly)
- `STP` - Systematic Transfer Plan (daily/weekly/monthly/quarterly)
- `SWP` - Systematic Withdrawal Plan (daily/weekly/monthly/quarterly)
- `REDEMPTION` - Sell holdings

### AMC Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/amcs` | Get top 5 AMCs |
| GET | `/api/amcs/:fundHouse` | Get AMC details |
| GET | `/api/amcs/:fundHouse/funds` | Get funds for an AMC |

**Query Parameters for `/api/amcs/:fundHouse/funds`:**
- `search` - Filter by scheme name
- `category` - Filter by category
- `sort` - Sort order (`name_asc`, `name_desc`, `nav_asc`, `nav_desc`)

### Fund Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/funds/search?q=:query` | Search funds by name |
| GET | `/api/funds/:schemeCode` | Get fund details |
| GET | `/api/funds/:schemeCode/nav` | Get latest NAV |
| GET | `/api/funds/:schemeCode/history` | Get NAV history |

**Query Parameters for `/api/funds/:schemeCode/history`:**
- `startDate` - Start date (YYYY-MM-DD)
- `endDate` - End date (YYYY-MM-DD)
- `limit` - Number of records

### Health Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Server health check |
| GET | `/api/health/cache` | Cache statistics |
| POST | `/api/health/cache/clear` | Clear expired cache |

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 4000 | Server port |
| `NODE_ENV` | development | Environment mode |
| `MFAPI_BASE_URL` | https://api.mfapi.in | MFapi.in base URL |
| `MFAPI_TIMEOUT` | 15000 | API request timeout (ms) |
| `CACHE_TTL` | 3600000 | Cache time-to-live (ms) |
| `RATE_LIMIT_WINDOW_MS` | 60000 | Rate limit window (ms) |
| `RATE_LIMIT_MAX_REQUESTS` | 100 | Max requests per window |

### Top AMCs Configuration

The top 5 AMCs are configured in `src/models/amc.model.js`. Modify the `TOP_AMCS` array to change which fund houses are displayed:

```javascript
const TOP_AMCS = [
  'HDFC Mutual Fund',
  'ICICI Prudential Mutual Fund',
  'SBI Mutual Fund',
  'Axis Mutual Fund',
  'Kotak Mahindra Mutual Fund'
];
```

## Database

The application uses SQLite (sql.js) in-memory database for:
- User authentication and profiles
- Demo trading accounts
- Investment holdings tracking
- Transaction history
- Caching AMC and fund data

Database schema includes:
- **users** - User accounts with hashed passwords
- **demo_accounts** - Virtual trading accounts with balance
- **holdings** - Current investment positions
- **transactions** - Complete transaction history
- **amc_master** - Cached AMC information

The database is automatically initialized on first run and persists to `./data/mfselection.db`.

## Caching Strategy

- **In-memory cache** for frequently accessed data
- **Database cache** for AMC and scheme information
- **TTL-based expiration** (default: 1 hour)
- **Automatic cleanup** of expired entries every 30 minutes

## Error Handling

- Centralized error handling middleware
- Graceful handling of MFapi.in API failures
- User-friendly error messages
- Retry logic for transient failures

## Security Features

- Helmet.js for security headers
- CORS protection
- Rate limiting to prevent abuse
- Input validation and sanitization
- SQL injection prevention with parameterized queries

## Google AdSense Integration

The application is ready for Google AdSense monetization. See [ADSENSE_SETUP.md](ADSENSE_SETUP.md) for detailed setup instructions.

### Quick Setup:
1. Get your AdSense Publisher ID
2. Create ad units in AdSense dashboard
3. Copy `.env.adsense.example` to `.env` and update with your IDs
4. Update `client/index.html` with your Publisher ID
5. Deploy to production

**Ad Placements:**
- Landing page (2 ads)
- Fund listing pages (in-feed ads)
- Fund details page (display ad)
- Portfolio page (banner ad)

## Mobile Optimization

The application is fully optimized for mobile devices with a responsive, touch-friendly design. See [MOBILE_OPTIMIZATION.md](MOBILE_OPTIMIZATION.md) for complete details.

### Key Mobile Features:
- ✅ **Hamburger Menu**: Smooth slide-in navigation for mobile devices
- ✅ **Touch-Friendly**: 44px+ minimum touch targets on all interactive elements
- ✅ **Responsive Layout**: Mobile-first design that scales beautifully
- ✅ **Optimized Forms**: Large input fields with proper mobile keyboards
- ✅ **Fast Performance**: Optimized animations and asset loading
- ✅ **PWA Ready**: Meta tags for progressive web app capabilities

### Tested On:
- iPhone (Safari)
- Android devices (Chrome)
- Tablets (iPad, Android tablets)
- Various screen sizes (375px - 1920px)

## License

MIT License - see LICENSE file for details

## Acknowledgments

- [MFapi.in](https://www.mfapi.in) for providing the mutual fund data API
- All contributors and open-source packages used in this project
