# MySQL Migration Guide

## Overview

This document provides step-by-step instructions for migrating the Mutual Fund Selection application from SQLite to MySQL. The migration has been completed with full backward compatibility maintained.

## What Changed

### 1. Database System
- **Before**: SQLite (sql.js) - File-based database
- **After**: MySQL - Client-server database system

### 2. Files Modified

#### Core Database Files
- `src/db/database.js` - Complete rewrite to use mysql2 instead of sql.js
- `src/db/schema.sql` - Updated with MySQL-compatible syntax

#### Model Files (Made Async)
- `src/models/user.model.js`
- `src/models/transaction.model.js`
- `src/models/holding.model.js`
- `src/models/demoAccount.model.js`
- `src/models/amc.model.js`

#### Service Files
- `src/services/cache.service.js` - Updated for async MySQL operations

#### Utility Scripts
- `scripts/inspect-db.js` - Rewritten for MySQL
- `scripts/cleanup-db.js` - Rewritten for MySQL
- `scripts/migrate-sqlite-to-mysql.js` - New migration script

#### Configuration Files
- `package.json` - Replaced sql.js with mysql2
- `.env` - Added MySQL connection parameters

## Prerequisites

Before starting the migration, ensure you have:

1. **MySQL Server Installed**
   - MySQL 8.0 or higher recommended
   - MySQL server running and accessible

2. **Database Created**
   ```sql
   CREATE DATABASE mfselection CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

3. **Database User with Permissions**
   ```sql
   CREATE USER 'mfuser'@'localhost' IDENTIFIED BY 'your_password';
   GRANT ALL PRIVILEGES ON mfselection.* TO 'mfuser'@'localhost';
   FLUSH PRIVILEGES;
   ```

4. **Backup of Existing SQLite Database**
   - Location: `data/mfselection.db`
   - Create a backup before migration

## Migration Steps

### Step 1: Configure MySQL Connection

Update the `.env` file with your MySQL credentials:

```env
# MySQL Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=mfselection
DB_USER=root
DB_PASSWORD=your_password_here
```

### Step 2: Install Dependencies

```bash
npm install
```

This will install the `mysql2` package and remove the old `sql.js` dependency.

### Step 3: Initialize MySQL Schema

The application will automatically create the schema on first run. Alternatively, you can manually run:

```bash
mysql -u root -p mfselection < src/db/schema.sql
```

### Step 4: Migrate Existing Data (Optional)

If you have existing data in SQLite that needs to be migrated:

```bash
node scripts/migrate-sqlite-to-mysql.js
```

This script will:
- Connect to both SQLite and MySQL databases
- Disable foreign key checks temporarily
- Migrate all tables in the correct order
- Verify data integrity
- Provide a detailed migration report

**Important**: The migration script requires the SQLite file to exist at `data/mfselection.db`.

### Step 5: Verify Migration

After migration, inspect the database:

```bash
node scripts/inspect-db.js
```

This will show:
- All users and demo accounts
- Transactions and holdings
- Data integrity checks

### Step 6: Test the Application

Start the development server:

```bash
npm run dev
```

Test all critical functionalities:
- User registration and login
- Fund browsing and search
- Transaction creation (SIP, Lump Sum, etc.)
- Portfolio viewing
- Calculator features

## Key Technical Changes

### 1. Async/Await Pattern

All database operations are now asynchronous:

```javascript
// Before (SQLite)
const user = userModel.findByUsername(username);

// After (MySQL)
const user = await userModel.findByUsername(username);
```

### 2. Connection Pooling

MySQL uses connection pooling for better performance:

```javascript
const pool = mysql.createPool({
  connectionLimit: 10,
  enableKeepAlive: true
});
```

### 3. Schema Differences

| Feature | SQLite | MySQL |
|---------|--------|-------|
| Auto Increment | `AUTOINCREMENT` | `AUTO_INCREMENT` |
| Text Types | `TEXT` | `VARCHAR`, `TEXT`, `LONGTEXT` |
| Decimal | `REAL` | `DECIMAL(15,2)` |
| Timestamps | `INTEGER` (milliseconds) | `BIGINT` (milliseconds) |
| Enums | CHECK constraints | `ENUM` type |
| Insert/Replace | `INSERT OR REPLACE` | `ON DUPLICATE KEY UPDATE` |

### 4. No Manual Save Required

Unlike SQLite, MySQL doesn't require manual saves:

```javascript
// SQLite required
saveDatabase();

// MySQL - automatic persistence
// No action needed
```

## Rollback Procedure

If you need to rollback to SQLite:

1. Restore the original files from version control
2. Restore `data/mfselection.db` from backup
3. Run `npm install` to restore sql.js dependency
4. Restart the application

## Performance Considerations

### MySQL Benefits
- Better concurrent access handling
- Improved query optimization
- Connection pooling reduces overhead
- Better suited for production environments

### Migration Impact
- Initial connection takes slightly longer
- Network overhead for each query (if remote)
- Better performance for concurrent users

## Security Considerations

1. **Database Credentials**
   - Never commit `.env` file to version control
   - Use strong passwords for MySQL users
   - Restrict MySQL user permissions to only necessary operations

2. **Network Security**
   - Use SSL/TLS for remote MySQL connections
   - Configure firewall rules appropriately
   - Consider using `localhost` for development

3. **SQL Injection Prevention**
   - All queries use parameterized statements
   - No string concatenation in SQL queries
   - Input validation maintained

## Monitoring and Maintenance

### Check Database Health

```bash
node scripts/inspect-db.js
```

### Clean Up Invalid Data

```bash
node scripts/cleanup-db.js
```

### Monitor Connection Pool

Add logging in `src/db/database.js`:

```javascript
pool.on('connection', (connection) => {
  console.log('New connection established');
});
```

## Troubleshooting

### Connection Refused

**Problem**: Application cannot connect to MySQL

**Solutions**:
- Verify MySQL server is running: `mysql --version`
- Check credentials in `.env` file
- Ensure database exists: `SHOW DATABASES;`
- Check firewall settings

### Foreign Key Constraint Errors

**Problem**: Cannot insert/delete due to foreign key violations

**Solutions**:
- Ensure parent records exist before creating child records
- Use the cleanup script to fix orphaned data
- Check data integrity with inspect script

### Performance Issues

**Problem**: Slow query performance

**Solutions**:
- Check indexes are created (they're in schema.sql)
- Analyze slow queries with MySQL slow query log
- Consider increasing connection pool size
- Optimize queries using EXPLAIN

### Authentication Fails

**Problem**: MySQL authentication errors

**Solutions**:
- Verify user exists: `SELECT User, Host FROM mysql.user;`
- Check password: `ALTER USER 'user'@'host' IDENTIFIED BY 'newpassword';`
- Verify permissions: `SHOW GRANTS FOR 'user'@'host';`

## Production Deployment

### Recommended Configuration

```env
# Production MySQL Configuration
DB_HOST=your-mysql-server.com
DB_PORT=3306
DB_NAME=mfselection_prod
DB_USER=mfapp_user
DB_PASSWORD=<strong-password-here>
NODE_ENV=production
```

### Connection Pool Settings

For production, consider adjusting pool settings in `src/db/database.js`:

```javascript
const config = {
  connectionLimit: 20,  // Increase for high traffic
  queueLimit: 50,
  acquireTimeout: 10000,
  timeout: 60000
};
```

### Backup Strategy

1. **Daily Backups**:
   ```bash
   mysqldump -u root -p mfselection > backup_$(date +%Y%m%d).sql
   ```

2. **Automated Backups**:
   - Set up cron job for regular backups
   - Store backups in secure location
   - Test restore procedures regularly

## Summary of Changes

✅ **Completed Tasks**:
1. Replaced sql.js with mysql2 package
2. Rewrote database adapter with connection pooling
3. Updated schema with MySQL-compatible syntax
4. Made all model functions async
5. Updated cache service for async operations
6. Created data migration script
7. Updated utility scripts (inspect, cleanup)
8. Added MySQL configuration to .env
9. Tested and verified all functionality
10. Ran Snyk security scan

✅ **Maintained**:
- All existing functionality
- API compatibility
- Data integrity
- Application behavior
- Performance levels

## Support

For issues or questions regarding the MySQL migration:
1. Check this guide first
2. Review error logs in console
3. Use inspect-db.js to check data integrity
4. Consult MySQL documentation for server-specific issues

---

**Migration Completed**: Successfully migrated from SQLite to MySQL with zero functionality loss and full backward compatibility.
