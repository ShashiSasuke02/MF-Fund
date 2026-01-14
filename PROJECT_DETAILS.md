# RealEE - Mutual Fund Selection & Demo Investment Platform

## Project Overview
A full-stack web application for browsing mutual funds and testing investment strategies with a demo account. Users start with ₹10,00,000 virtual balance and can execute various transaction types (SIP, STP, Lump Sum, SWP) using real-time NAV data from MFApi.

## Technology Stack

### Backend
- **Runtime**: Node.js v22.19.0
- **Framework**: Express.js (ES Modules)
- **Database**: sql.js (SQLite in-memory with file persistence)
- **Authentication**: JWT (jsonwebtoken) + bcrypt
- **API Integration**: Axios (MFApi.in)
- **Port**: 4000

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite v5.4.21
- **Routing**: React Router v6
- **Styling**: TailwindCSS
- **Port**: 5173

### Key Dependencies
```json
{
  "bcrypt": "^5.1.1",
  "jsonwebtoken": "^9.0.2",
  "express-validator": "^7.2.1",
  "sql.js": "^1.12.0",
  "axios": "^1.7.9"
}
```

## Database Schema

### Tables

#### 1. users
```sql
- id (INTEGER PRIMARY KEY AUTOINCREMENT)
- full_name (TEXT NOT NULL)
- email_id (TEXT NOT NULL)
- username (TEXT NOT NULL UNIQUE)
- password_hash (TEXT NOT NULL)
- created_at (INTEGER)
- updated_at (INTEGER)
```

#### 2. demo_accounts
```sql
- id (INTEGER PRIMARY KEY AUTOINCREMENT)
- user_id (INTEGER NOT NULL UNIQUE) FK -> users(id)
- balance (REAL NOT NULL DEFAULT 1000000.00)
- created_at (INTEGER)
- updated_at (INTEGER)
```

#### 3. transactions
```sql
- id (INTEGER PRIMARY KEY AUTOINCREMENT)
- user_id (INTEGER NOT NULL) FK -> users(id)
- scheme_code (INTEGER NOT NULL)
- scheme_name (TEXT NOT NULL)
- transaction_type (TEXT NOT NULL) -- 'SIP', 'STP', 'LUMP_SUM', 'SWP'
- amount (REAL NOT NULL)
- units (REAL)
- nav (REAL)
- frequency (TEXT) -- 'MONTHLY', 'QUARTERLY', 'WEEKLY'
- start_date (TEXT) -- ISO date
- end_date (TEXT) -- ISO date (optional)
- installments (INTEGER)
- status (TEXT NOT NULL DEFAULT 'SUCCESS') -- 'PENDING', 'SUCCESS', 'FAILED', 'CANCELLED'
- executed_at (INTEGER)
- created_at (INTEGER)
```

#### 4. holdings
```sql
- id (INTEGER PRIMARY KEY AUTOINCREMENT)
- user_id (INTEGER NOT NULL) FK -> users(id)
- scheme_code (INTEGER NOT NULL)
- scheme_name (TEXT NOT NULL)
- total_units (REAL NOT NULL DEFAULT 0)
- invested_amount (REAL NOT NULL DEFAULT 0)
- current_value (REAL)
- last_nav (REAL)
- last_nav_date (TEXT)
- created_at (INTEGER)
- updated_at (INTEGER)
- UNIQUE(user_id, scheme_code)
```

#### 5. amc_master
```sql
- fund_house (TEXT PRIMARY KEY)
- display_name (TEXT NOT NULL)
- display_order (INTEGER NOT NULL DEFAULT 0)
- logo_url (TEXT)
- created_at (INTEGER)
```

#### 6. api_cache
```sql
- cache_key (TEXT PRIMARY KEY)
- response_json (TEXT NOT NULL)
- fetched_at (INTEGER NOT NULL)
- expires_at (INTEGER NOT NULL)
```

**Database File**: `data/mfselection.db`

## API Endpoints

### Authentication (Public)
- `POST /api/auth/register` - Register new user with ₹10L demo account
- `POST /api/auth/login` - Login and get JWT token
- `GET /api/auth/profile` - Get user profile (Protected)

### Demo Accounts (Protected - Requires JWT)
- `POST /api/demo/transactions` - Create transaction
- `GET /api/demo/transactions` - Get user's transaction history
- `GET /api/demo/portfolio` - Get user's holdings with current values
- `GET /api/demo/balance` - Get current demo account balance

### Mutual Funds (Public)
- `GET /api/amcs` - List all AMCs
- `GET /api/amcs/:fundHouse/funds` - Get funds by AMC
- `GET /api/funds/search?q=query` - Search funds
- `GET /api/funds/:schemeCode` - Get fund details with performance
- `GET /api/funds/:schemeCode/nav` - Get latest NAV
- `GET /api/funds/:schemeCode/history` - Get NAV history

### Health Check
- `GET /api/health` - Server health status

## Project Structure

```
RealEE/
├── src/                          # Backend source
│   ├── server.js                # Express server entry point
│   ├── app.js                   # Express app configuration
│   ├── controllers/             # Route handlers
│   │   ├── auth.controller.js   # Register, login, profile
│   │   ├── amc.controller.js    # AMC operations
│   │   ├── fund.controller.js   # Fund operations
│   │   └── demo.controller.js   # Demo account operations
│   ├── models/                  # Database models
│   │   ├── user.model.js        # User CRUD
│   │   ├── demoAccount.model.js # Balance management
│   │   ├── transaction.model.js # Transaction records
│   │   ├── holding.model.js     # Portfolio holdings
│   │   └── amc.model.js         # AMC data
│   ├── services/                # Business logic
│   │   ├── demo.service.js      # Transaction execution
│   │   ├── mfapi.service.js     # MFApi integration
│   │   └── cache.service.js     # In-memory caching
│   ├── middleware/
│   │   ├── auth.middleware.js   # JWT verification
│   │   └── errorHandler.js      # Error handling
│   ├── routes/                  # API routes
│   │   ├── auth.routes.js
│   │   ├── demo.routes.js
│   │   ├── amc.routes.js
│   │   ├── fund.routes.js
│   │   └── health.routes.js
│   └── db/
│       ├── database.js          # sql.js wrapper
│       └── schema.sql           # Database schema
│
└── client/                      # Frontend source
    ├── src/
    │   ├── main.jsx             # React entry point
    │   ├── App.jsx              # Root component with routing
    │   ├── index.css            # Tailwind imports
    │   ├── api/
    │   │   └── index.js         # API client functions
    │   ├── contexts/
    │   │   └── AuthContext.jsx  # Global auth state
    │   ├── components/
    │   │   ├── Layout.jsx       # Main layout with navigation
    │   │   ├── LoadingSpinner.jsx
    │   │   └── ErrorMessage.jsx
    │   └── pages/
    │       ├── AmcList.jsx      # Browse AMCs
    │       ├── FundList.jsx     # Browse funds by AMC
    │       ├── FundDetails.jsx  # Fund detail view
    │       ├── Register.jsx     # User registration
    │       ├── Login.jsx        # User login
    │       ├── Portfolio.jsx    # Holdings & transactions
    │       └── Invest.jsx       # Create transactions
    └── index.html
```

## Key Business Logic

### Transaction Flow

#### Purchase Transactions (SIP, STP, LUMP_SUM)
1. Validate user has sufficient balance
2. Fetch current NAV from MFApi
3. Calculate units: `units = amount / nav`
4. Create transaction record
5. Deduct amount from balance
6. Update or create holding:
   - If holding exists: Add units and amount
   - If new: Create holding with units and amount
7. Save database
8. Return new balance and holding

#### Withdrawal (SWP)
1. Validate user has sufficient units
2. Fetch current NAV from MFApi
3. Calculate units needed: `units = amount / nav`
4. Create transaction record
5. Add amount to balance
6. Reduce holding units and invested amount
7. Delete holding if units reach 0
8. Save database

### Authentication Flow

#### Registration
1. Validate input fields (fullName, emailId, username, password)
2. Check username uniqueness
3. Check email uniqueness
4. Hash password with bcrypt (10 salt rounds)
5. Insert user record
6. Create demo account with ₹10,00,000 balance (INSERT OR IGNORE)
7. Generate JWT token (7 days expiry)
8. Return user data + token

#### Login
1. Find user by username
2. Compare password with bcrypt
3. Check if demo account exists, create if missing (backward compatibility)
4. Generate JWT token
5. Return user data + demo account + token

#### Protected Routes
1. Extract JWT from Authorization header: `Bearer <token>`
2. Verify token with JWT_SECRET
3. Attach decoded payload to `req.user`
4. Continue to route handler

### MFApi Integration

#### Data Structure from mfApiService.getSchemeDetails()
```javascript
{
  meta: {
    scheme_code: number,
    scheme_name: string,
    fund_house: string,
    scheme_type: string,
    scheme_category: string
  },
  latestNAV: {
    nav: string,
    date: string // DD-MM-YYYY
  },
  history: [{
    date: string,
    nav: string
  }],
  performance: {
    oneMonth: number,
    threeMonth: number,
    sixMonth: number
  },
  status: string
}
```

**Important**: Always access NAV as `fundDetails.latestNAV.nav` NOT `fundDetails.data[0].nav`

### Database API Pattern

**CRITICAL**: The database.js exports standalone functions, NOT methods on a db object.

✅ **Correct Usage**:
```javascript
import { query, queryOne, run, saveDatabase } from '../db/database.js';

const user = queryOne('SELECT * FROM users WHERE id = ?', [userId]);
run('UPDATE demo_accounts SET balance = ? WHERE user_id = ?', [newBalance, userId]);
saveDatabase();
```

❌ **Incorrect Usage**:
```javascript
db.query()  // ERROR: db.query is not a function
db.run()    // ERROR: db.run is not a function
```

**Note**: sql.js does NOT support SQL transaction commands (BEGIN, COMMIT, ROLLBACK). Use sequential operations instead.

## Common Issues & Solutions

### Issue 1: "db.query is not a function"
**Cause**: Trying to call database functions as methods on db object  
**Solution**: Import and use functions directly: `query()`, `queryOne()`, `run()`

### Issue 2: "Cannot commit - no transaction is active"
**Cause**: Using BEGIN/COMMIT/ROLLBACK SQL commands  
**Solution**: Remove transaction SQL commands, rely on sequential operations

### Issue 3: "Cannot read properties of null (reading 'balance')"
**Cause**: User created before demo_accounts table existed  
**Solution**: Auto-create demo account in login() and getProfile() if missing

### Issue 4: "Cannot read properties of undefined (reading '0')"
**Cause**: Trying to access `fundDetails.data[0]` instead of `fundDetails.latestNAV`  
**Solution**: Use correct property: `fundDetails.latestNAV.nav` and `fundDetails.latestNAV.date`

### Issue 5: "UNIQUE constraint failed: demo_accounts.user_id"
**Cause**: Attempting to create duplicate demo account  
**Solution**: Use `INSERT OR IGNORE INTO demo_accounts` in user creation

### Issue 6: Balance updates incorrectly
**Cause**: Multiple transaction submissions or incorrect calculation  
**Solution**: Add console.log to track balance changes, check for duplicate API calls

## Environment Variables

Create `.env` file in root:
```env
PORT=4000
JWT_SECRET=your-secret-key-min-32-chars
JWT_EXPIRES_IN=7d
NODE_ENV=development
MFAPI_BASE_URL=https://api.mfapi.in
MFAPI_TIMEOUT_MS=15000
CACHE_TTL_LATEST_NAV_MS=3600000
CACHE_TTL_SCHEME_DETAILS_MS=1800000
CACHE_TTL_NAV_HISTORY_MS=21600000
```

## Running the Application

### Development Mode
```bash
npm run dev
```
This runs both backend (port 4000) and frontend (port 5173) concurrently.

### Individual Services
```bash
npm run dev:server  # Backend only
npm run dev:client  # Frontend only
```

### Production Build
```bash
npm run build       # Build frontend
npm start          # Start backend
```

## User Journey

### New User Flow
1. Visit home page → Browse AMCs/Funds
2. Click "Register" → Fill form (fullName, emailId, username, password)
3. Auto-login after registration with ₹10L balance
4. Browse funds → Click fund → View details → Click "Invest Now"
5. Enter amount → Select transaction type → Submit
6. View updated portfolio with holdings and transaction history
7. Check balance updates after each transaction

### Returning User Flow
1. Click "Login" → Enter username/password
2. Auto-redirected to portfolio
3. View holdings with current values and returns
4. Click "Invest" → Create more transactions
5. View transaction history in Portfolio tab

## Important Business Rules

1. **No Manual Balance Updates**: Users cannot add/update money directly. Only system through transactions.
2. **Fixed Starting Balance**: Every new user gets exactly ₹10,00,000
3. **Username Uniqueness**: Enforced at database and validation layers
4. **Email Validation**: Must be valid email format
5. **Password Strength**: Minimum 8 characters
6. **Transaction Validation**: 
   - Purchase: Check sufficient balance
   - Withdrawal: Check sufficient units
7. **NAV Source**: Always fetch from MFApi, never hardcoded
8. **Holdings Update**: Automatic on every transaction
9. **Returns Calculation**: `(currentValue - investedAmount) / investedAmount * 100`

## Data Flow Diagrams

### Investment Transaction Flow
```
User (Frontend)
  ↓ POST /api/demo/transactions
Demo Controller
  ↓ validateInput()
Demo Service
  ↓ executeTransaction()
  ├─→ MFApi Service (fetch NAV)
  ├─→ Demo Account Model (update balance)
  ├─→ Transaction Model (create record)
  └─→ Holding Model (upsert holding)
Database (sql.js)
  ↓ saveDatabase()
File System (data/mfselection.db)
```

### Portfolio View Flow
```
User (Frontend)
  ↓ GET /api/demo/portfolio
Demo Controller
  ↓ getPortfolio()
Demo Service
  ├─→ Holding Model (get holdings)
  └─→ MFApi Service (fetch current NAVs)
Response with current values
```

## Testing Checklist

- [ ] Register new user → Check ₹10L balance
- [ ] Login existing user → Verify demo account auto-creation
- [ ] Browse AMCs → Should load top 3
- [ ] Search funds → Should return results
- [ ] View fund details → Should show NAV and performance
- [ ] Create Lump Sum investment → Balance should decrease
- [ ] Create SIP transaction → Should validate frequency
- [ ] View portfolio → Holdings should show correct units
- [ ] View transactions → Should show history
- [ ] Check returns calculation → Should be accurate
- [ ] Logout → Should clear token
- [ ] Protected routes → Should redirect to login

## Debugging Tips

1. **Check terminal logs**: Look for `[Demo Service]`, `[MFApi]`, and error stack traces
2. **Inspect database**: Check `data/mfselection.db` with SQLite browser
3. **Network tab**: Verify API calls and responses in browser DevTools
4. **React DevTools**: Check AuthContext state and component props
5. **Add console.logs**: In demo.service.js to trace balance updates
6. **Check JWT token**: Verify in localStorage as `auth_token`

## Future Enhancements

- [ ] Add real-time portfolio value updates
- [ ] Implement SIP auto-execution on scheduled dates
- [ ] Add charts for NAV history visualization
- [ ] Export portfolio to PDF
- [ ] Add fund comparison feature
- [ ] Implement wishlist/favorites
- [ ] Add email notifications for transactions
- [ ] Implement password reset flow
- [ ] Add 2FA authentication
- [ ] Create admin dashboard

## Contact & Support

For issues or questions, refer to:
- **MFApi Documentation**: https://api.mfapi.in
- **Express.js Docs**: https://expressjs.com
- **React Docs**: https://react.dev
- **sql.js GitHub**: https://github.com/sql-js/sql.js

---

**Last Updated**: January 13, 2026  
**Version**: 1.0.0
