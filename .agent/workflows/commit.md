---
description: Pre-commit audit and push changes with validation
---

# /commit - Pre-Commit Audit & Push

$ARGUMENTS

---

## Purpose

This command performs a comprehensive audit before committing and pushing changes to ensure deployment readiness.

---

## Pre-Commit Checklist

### 1. Database Schema Audit
- [ ] Verify `docker/init-db.sql` has all required tables
- [ ] Check `src/db/schema.sql` matches init-db.sql
- [ ] Verify all model column names match schema

### 2. Model-Schema Validation
Check these models match their tables:
- `fund.model.js` → `funds` table
- `fundNavHistory.model.js` → `fund_nav_history` table
- `user.model.js` → `users` table
- `transaction.model.js` → `transactions` table
- `holding.model.js` → `holdings` table
- `executionLog.model.js` → `execution_logs` table

### 3. Docker Deployment Audit
- [ ] Verify `Dockerfile` is up-to-date (multi-stage build)
- [ ] Check `docker-compose.yml` configuration
- [ ] Verify volume mounts and networking
- [ ] Check all new dependencies are installable in container

### 4. Environment Configuration
- [ ] Ensure `.env.example` has all required variables
- [ ] Verify NO real credentials in `.env.example` (use placeholders)
- [ ] Check docker-compose.yml env mapping matches .env variables

### 5. Dependencies Check
- [ ] Backend: All packages in `package.json`
- [ ] Client: All packages in `client/package.json`
- [ ] New packages added during session are included

### 6. Fresh Installation Test
- [ ] No hardcoded paths or values
- [ ] Init scripts work correctly
- [ ] All migrations/seeds included

---

## Execution Steps

// turbo-all

1. **Run ESLint (if configured)**
```bash
npm run lint --if-present
```

2. **Check for uncommitted changes**
```bash
git status
```

3. **Stage all changes**
```bash
git add .
```

4. **Commit with descriptive message**
```bash
git commit -m "$COMMIT_MESSAGE"
```

5. **Push to remote**
```bash
git push
```

---

## Audit Output Format

```markdown
## ✅ Pre-Commit Audit

| Category | Status | Details |
|----------|--------|---------|
| Database Schema | ✅/❌ | [details] |
| SQL Queries | ✅/❌ | [details] |
| Docker Config | ✅/❌ | [details] |
| Environment | ✅/❌ | [details] |
| Dependencies | ✅/❌ | [details] |
```

---

## Usage Examples

```
/commit feat: Add NAV chart component
/commit fix: Resolve login issue
/commit chore: Update dependencies
```

---

## Key Files to Audit

| File | Purpose |
|------|---------|
| `docker/init-db.sql` | Production database schema |
| `src/db/schema.sql` | Development schema reference |
| `Dockerfile` | Container build configuration |
| `docker-compose.yml` | Service orchestration |
| `.env.example` | Environment template |
| `package.json` | Backend dependencies |
| `client/package.json` | Frontend dependencies |

---

## Security Checks

Before committing, verify:
1. ❌ NO real passwords in `.env.example`
2. ❌ NO API keys in committed files
3. ❌ NO hardcoded secrets
4. ✅ All sensitive values use placeholders
5. ✅ JWT_SECRET marked as "CHANGE THIS"
