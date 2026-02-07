# Debug Plan - Ledger Model Error

## 1. Symptom
`TypeError: Cannot read properties of undefined (reading 'total')` in `LedgerModel.getEntriesByUser`.
Also likely `pool.execute is not a function` in `createEntry` (swallowed by service catch blocks).

## 2. Information Gathered
- **File:** `src/models/ledger.model.js`
- **Import:** `import pool from '../db/database.js';`
- **Source:** `src/db/database.js` default export is a wrapper object `{ query, run, ... }`, NOT the raw MySQL pool.
- **Wrapper Behavior:**
  - `query(sql)` returns `rows` array directly (not `[rows, fields]`).
  - `run(sql)` returns `{ insertId, ... }`.
  - No `execute` method exists on the wrapper.

## 3. Root Cause
The `LedgerModel` was written assuming `pool` is a raw MySQL2 pool/connection, but it is actually the custom wrapper object from `database.js`.

1.  **getEntriesByUser:**
    -   *Code:* `const [entries] = await pool.query(...)`
    -   *Issue:* `pool.query` returns `Array`. Destructuring `const [entries]` sets `entries` to the *first element* (first row), not the array.
    -   *Code:* `const [countResult] = await pool.query(...)`
    -   *Issue:* Same as above. `countResult` becomes the first row object `{ total: X }`.
    -   *Crash:* Accessing `countResult[0].total` fails because `countResult` is the object, not an array. `countResult[0]` is undefined.

2.  **createEntry:**
    -   *Code:* `await pool.execute(...)`
    -   *Issue:* Wrapper has no `execute` method. This throws an error (likely logged but caught in services).
    -   *Code:* `const [result] = ...`
    -   *Issue:* `pool.run` returns an object, not an iterable to destructure (if we switch to `run`).

## 4. Fix Plan
Update `src/models/ledger.model.js` to correctly use the database wrapper API.

### Changes
1.  **createEntry:**
    -   Use `pool.run` instead of `pool.execute`.
    -   Remove destructuring: `const result = await pool.run(...)`.

2.  **getEntriesByUser:**
    -   Remove destructuring for entries: `const entries = await pool.query(...)`.
    -   Correct count handling: `const [countRow] = await pool.query(...)` (this puts the first row in countRow) OR `const countResult = await pool.query(...)` and use `countResult[0].total`.
    -   Given `pool.query` returns an array of rows, `const countResult = await pool.query(...)` is safest. Then `countResult[0].total`.

## 5. Verification
- Verify `GET /api/ledger` returns 200 OK and an array of entries.
- Verify `total` is correct.
