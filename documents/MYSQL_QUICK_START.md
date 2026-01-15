# MySQL Quick Start Guide

## Quick Setup (Development)

### 1. Install MySQL
```bash
# Windows (using Chocolatey)
choco install mysql

# Or download from: https://dev.mysql.com/downloads/mysql/
```

### 2. Start MySQL Server
```bash
# Windows
net start MySQL80

# Or use MySQL Workbench
```

### 3. Create Database
```bash
mysql -u root -p
```

```sql
CREATE DATABASE mfselection CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

### 4. Configure Application

Update `.env`:
```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=mfselection
DB_USER=root
DB_PASSWORD=your_mysql_root_password
```

### 5. Install Dependencies
```bash
npm install
```

### 6. Start Application
```bash
npm run dev
```

The database schema will be created automatically on first run!

## Common Commands

### Inspect Database
```bash
node scripts/inspect-db.js
```

### Clean Up Data
```bash
node scripts/cleanup-db.js
```

### Migrate from SQLite (if needed)
```bash
node scripts/migrate-sqlite-to-mysql.js
```

## Database Schema

### Tables
- `amc_master` - AMC/fund house information
- `api_cache` - API response cache
- `users` - User accounts
- `demo_accounts` - Demo trading accounts (₹10L starting balance)
- `transactions` - All transactions (SIP, Lump Sum, SWP, STP)
- `holdings` - Current portfolio holdings

### Important Fields

#### Timestamps
All timestamps are stored as BIGINT (milliseconds since epoch):
```javascript
const timestamp = Date.now(); // Current time
const date = new Date(timestamp); // Convert back to date
```

#### Decimal Precision
- Money: `DECIMAL(15,2)` - e.g., 1000000.00
- Units: `DECIMAL(15,4)` - e.g., 123.4567
- NAV: `DECIMAL(15,4)` - e.g., 45.6789

## Code Examples

### Query Data
```javascript
// Get all users
const users = await query('SELECT * FROM users ORDER BY id');

// Get single user
const user = await queryOne('SELECT * FROM users WHERE username = ?', [username]);
```

### Insert Data
```javascript
const result = await run(
  'INSERT INTO users (full_name, email_id, username, password_hash) VALUES (?, ?, ?, ?)',
  [fullName, email, username, hash]
);

const userId = result.lastInsertRowid; // Get inserted ID
```

### Update Data
```javascript
await run(
  'UPDATE demo_accounts SET balance = ? WHERE user_id = ?',
  [newBalance, userId]
);
```

### Delete Data
```javascript
await run('DELETE FROM transactions WHERE id = ?', [transactionId]);
```

## Troubleshooting

### Can't Connect
- Check MySQL is running: `mysql --version`
- Verify credentials in `.env`
- Check database exists: `SHOW DATABASES;`

### Authentication Error
```sql
-- Reset password
ALTER USER 'root'@'localhost' IDENTIFIED BY 'newpassword';
FLUSH PRIVILEGES;
```

### Schema Not Created
```bash
# Manually run schema
mysql -u root -p mfselection < src/db/schema.sql
```

## Important Notes

⚠️ **All database operations are now async** - Always use `await`:
```javascript
// ✅ Correct
const user = await userModel.findById(userId);

// ❌ Wrong
const user = userModel.findById(userId);
```

⚠️ **No manual save needed** - MySQL auto-persists changes:
```javascript
// SQLite (old way)
run('UPDATE ...');
saveDatabase(); // ❌ Not needed anymore

// MySQL (new way)
await run('UPDATE ...'); // ✅ Automatically saved
```

⚠️ **Connection pooling** - Connections are reused automatically:
```javascript
// No need to manually manage connections
// Pool handles it automatically
```

## Performance Tips

1. Use indexes (already in schema)
2. Batch operations when possible
3. Use prepared statements (default)
4. Monitor slow queries
5. Adjust pool size for production

## Security Checklist

✅ Use parameterized queries (✅ Done)
✅ Never commit `.env` file (✅ In .gitignore)
✅ Use strong passwords
✅ Restrict database user permissions
✅ Enable SSL for remote connections
✅ Regular backups

## API Remains Same

**Good News**: Controllers and routes don't need changes! The database adapter maintains the same interface.

Example:
```javascript
// This works the same way
app.post('/api/auth/register', async (req, res) => {
  const user = await userModel.create(userData);
  // Rest of code unchanged
});
```

## Need Help?

1. Check [MYSQL_MIGRATION_GUIDE.md](./MYSQL_MIGRATION_GUIDE.md) for detailed info
2. Run `node scripts/inspect-db.js` to check data
3. Check MySQL error logs
4. Verify .env configuration

---

**You're all set!** 🚀 The application now uses MySQL with improved performance and scalability.
