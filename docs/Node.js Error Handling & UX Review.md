# Node.js Error Handling & UX Review

## Goal
Improve user-facing error handling, messaging, and visibility while standardizing the backend architecture to follow industry best practices for a Node.js ecosystem.

## User Review Required
> [!IMPORTANT]
> **Refactoring Pattern:** I will replace manual `res.status().json()` calls in controllers with `next(new AppError(...))` to leverage centralized middleware.
> **UX Focus:** A new React hook `useErrorFocus` will be created to handle automatic scrolling and focusing on form errors.

## Proposed Changes

### 1. Backend Architecture (Refinement)

#### [NEW] [AppError.js](file:///c:/Users/shashidhar/Desktop/MF-Investments/src/utils/errors/AppError.js)
Create a centralized `AppError` class that extends the native `Error` object.

| Property | Purpose |
| :--- | :--- |
| `statusCode` | HTTP status code (e.g., 400, 401, 404, 500) |
| `errorCode` | Machine-readable string (e.g., `AUTH_INVALID_CREDENTIALS`) |
| `isOperational` | Distinguish between planned errors vs. system crashes |
| `details` | Optional object for validation field errors |

#### [MODIFY] [errorHandler.js](file:///c:/Users/shashidhar/Desktop/MF-Investments/src/middleware/errorHandler.js)
Refactor the middleware to:
- Detect `AppError` and format the response accordingly.
- Clean up `isAxiosError` logic to provide friendlier messages for external API failures.
- Ensure `NODE_ENV === 'production'` hides all stack traces and internal details.
- Standardize logging levels (operational errors = `warn`, system errors = `error`).

#### [MODIFY] [Controllers](file:///c:/Users/shashidhar/Desktop/MF-Investments/src/controllers/)
Update `auth.controller.js`, `scheduler.controller.js`, etc., to remove redundant `res.status().json()` blocks and use `next(AppError)`.

---

### 2. Frontend UX (Visibility & Focus)

#### [NEW] [useErrorFocus.js](file:///c:/Users/shashidhar/Desktop/MF-Investments/client/src/hooks/useErrorFocus.js)
A reusable hook to handle accessibility and UX requirements.
- **Logic:** When an `errors` object is updated, find the first key with an error, scroll its input into view, and focus the element.

**Implementation:**
```javascript
import { useEffect, useRef } from 'react';

export default function useErrorFocus(errors, containerRef = null) {
  const isFirstRun = useRef(true);

  useEffect(() => {
    // Skip the first render
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }

    const firstErrorKey = Object.keys(errors).find(key => !!errors[key]);
    if (!firstErrorKey) return;

    // Try to find by name or id
    const container = containerRef?.current || document;
    const errorElement = container.querySelector(`[name="${firstErrorKey}"], #${firstErrorKey}`);
    if (errorElement) {
      errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      errorElement.focus({ preventScroll: true });
    }
  }, [errors]);
}
```

#### [MODIFY] [Register.jsx](file:///c:/Users/shashidhar/Desktop/MF-Investments/client/src/pages/Register.jsx)
- Import `useErrorFocus` hook.
- Call `useErrorFocus(errors)` after the `useState` definitions.
- **Result:** On validation error, page scrolls to the first invalid field and highlights it.

#### [MODIFY] [Login.jsx](file:///c:/Users/shashidhar/Desktop/MF-Investments/client/src/pages/Login.jsx)
- Same integration as Register.
- Ensure the error container scrolls into view on API error (e.g., "Invalid credentials").

#### [MODIFY] [Invest.jsx](file:///c:/Users/shashidhar/Desktop/MF-Investments/client/src/pages/Invest.jsx)
- Integrate `useErrorFocus` for validation (amount, date).
- Add specific handling for `HOLDING_NOT_FOUND`.
- **Result:** Form errors scroll smoothly and focus the offending field.

#### [MODIFY] [ErrorMessage.jsx](file:///c:/Users/shashidhar/Desktop/MF-Investments/client/src/components/ErrorMessage.jsx)
Enhance the component with:
- Visual variants (Banner, Inline, Modal).
- Meaningful icons (Warning, Error, Info).
- Smooth entry animations (Slide-down).

---

### 3. Error Classification & Messaging
I will create a standard mapping for internal codes:
- `VAL_001`: Generic Validation Error
- `AUTH_001`: Invalid Credentials
- `SYS_001`: Unexpected Server Error

### 4. Transaction Specific Error Handling (SWP/Sell)
To address user confusion when attempting SWP/Sell without holdings:

#### [MODIFY] [demo.service.js](file:///c:/Users/shashidhar/Desktop/MF-Investments/src/services/demo.service.js)
- Explicitly check for holdings before validation.
- Throw a specific error code: `HOLDING_NOT_FOUND`.

#### [MODIFY] [Invest.jsx](file:///c:/Users/shashidhar/Desktop/MF-Investments/client/src/pages/Invest.jsx)
- Catch `HOLDING_NOT_FOUND` in the submission handler.
- Display a targeted message: *"You do not own units in this scheme. Please make a Lump Sum or SIP investment first."* instead of a generic error.
- Optionally provide a clear "Buy Now" action or redirect.

---

## Verification Plan

### Automated Tests
- Run `npm test` after refactoring to ensure existing coverage passes.
- Create new unit tests for `AppError` and the refactored `errorHandler`.

### Manual Verification
- Trigger validation errors on the **Signup Page** and verify it scrolls/focuses correctly.
- Simulate a network timeout (Axios error) and verify the "Friendly" message shows up instead of a technical one.
- Verify production mode hides internal variable names in responses.
