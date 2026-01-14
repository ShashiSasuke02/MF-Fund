# Test Suite Documentation

## Overview
Comprehensive unit and integration tests for TryMutualFunds application ensuring zero defects in production.

## Test Coverage

### Backend Tests (Unit)
1. **Models** (`tests/unit/models/`)
   - `user.model.test.js` - User CRUD operations, validation
   - `demoAccount.model.test.js` - Demo account operations
   - `transaction.model.test.js` - Transaction management
   - `holding.model.test.js` - Portfolio holdings
   - `amc.model.test.js` - AMC master data

2. **Services** (`tests/unit/services/`)
   - `demo.service.test.js` - Investment execution logic
   - `mfapi.service.test.js` - External API integration
   - `cache.service.test.js` - Caching mechanisms

3. **Controllers** (`tests/unit/controllers/`)
   - `auth.controller.test.js` - Authentication flows
   - `demo.controller.test.js` - Portfolio & transactions
   - `fund.controller.test.js` - Fund data retrieval
   - `amc.controller.test.js` - AMC listings

4. **Middleware** (`tests/unit/middleware/`)
   - `auth.middleware.test.js` - JWT validation
   - `errorHandler.test.js` - Error handling

### Integration Tests
1. **API Endpoints** (`tests/integration/`)
   - `auth.api.test.js` - Registration/login flows
   - `portfolio.api.test.js` - Portfolio operations
   - `investment.api.test.js` - Transaction execution
   - `funds.api.test.js` - Fund browsing

### Frontend Tests
Located in `client/tests/` with React Testing Library

## Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration

# Watch mode for development
npm run test:watch
```

## Coverage Goals
- **Overall**: >90%
- **Critical paths**: 100%
- **Edge cases**: Fully covered
- **Error scenarios**: All tested

## Test Patterns

### Unit Test Structure
```javascript
describe('ComponentName', () => {
  describe('methodName', () => {
    it('should handle successful case', () => {});
    it('should handle error case', () => {});
    it('should validate input', () => {});
    it('should handle edge cases', () => {});
  });
});
```

### Mocking Strategy
- External API calls mocked in unit tests
- Database operations mocked where appropriate
- Integration tests use test database

## Key Test Scenarios

### Authentication
- ✅ User registration with valid data
- ✅ User registration with duplicate username/email
- ✅ Password hashing verification
- ✅ JWT token generation and validation
- ✅ Login with valid credentials
- ✅ Login with invalid credentials
- ✅ Token expiration handling

### Portfolio Management
- ✅ Empty portfolio for new users
- ✅ Portfolio calculation accuracy
- ✅ Holdings aggregation
- ✅ Returns calculation
- ✅ NAV updates

### Investment Execution
- ✅ Lump sum investment
- ✅ SIP creation
- ✅ Insufficient balance handling
- ✅ Invalid scheme code
- ✅ Units calculation accuracy
- ✅ Balance deduction
- ✅ Holdings update

### Data Integrity
- ✅ User ID validation (>0)
- ✅ Foreign key constraints
- ✅ Transaction atomicity
- ✅ Concurrent access handling

## Continuous Integration
Tests run automatically on:
- Pull requests
- Main branch commits
- Pre-deployment validation

## Issues Identified
See `TEST_FINDINGS.md` for bugs discovered during testing.
