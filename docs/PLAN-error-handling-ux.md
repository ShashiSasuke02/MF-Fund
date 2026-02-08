# Implementation Plan - Error Handling & UX Refinement

This plan addresses the need for a standardized error handling architecture in the Node.js backend and improved user experience for error reporting in the React frontend.

## Goals
1.  **Standardize Backend Errors:** Replace ad-hoc error handling with a centralized `AppError` class and middleware.
2.  **Fix API Communication:** Ensure error codes (e.g., `HOLDING_NOT_FOUND`) are propagated from Backend -> API Client -> Frontend Components.
3.  **Enhance UX:** Implement "Scroll-to-Error" behavior and visual improvements for error messages.

## User Review Required
> [!IMPORTANT]
> **Breaking Change (Internal):** The `errorHandler` middleware response format will change to include `code` and `details`.
> **Breaking Change (Frontend Client):** The `fetchApi` utility in `client/src/api/index.js` will be updated to throw an enhanced Error object containing backend properties.

## Proposed Changes

### 1. Backend Infrastructure

#### [NEW] [src/utils/errors/AppError.js](file:///c:/Users/shashidhar/Desktop/MF-Investments/src/utils/errors/AppError.js)
-   Create a class extending `Error` with `statusCode`, `errorCode`, `isOperational`, and `details`.

#### [MODIFY] [src/middleware/errorHandler.js](file:///c:/Users/shashidhar/Desktop/MF-Investments/src/middleware/errorHandler.js)
-   Update to handle `AppError` instances explicitly.
-   Include `errorCode` (e.g., `VAL_001`, `AUTH_001`) in the JSON response.
-   Standardize logging based on `isOperational`.

### 2. Service & Controller Refactoring

#### [MODIFY] [src/services/demo.service.js](file:///c:/Users/shashidhar/Desktop/MF-Investments/src/services/demo.service.js)
-   Replace generic `Error` throws with `new AppError(...)`.
-   Specifically regarding SWP/Sell: Throw `AppError` with code `HOLDING_NOT_FOUND`.

#### [MODIFY] [src/controllers/auth.controller.js](file:///c:/Users/shashidhar/Desktop/MF-Investments/src/controllers/auth.controller.js)
-   Replace manual `res.status().json()` with `next(new AppError(...))`.

### 3. Frontend Core

#### [MODIFY] [client/src/api/index.js](file:///c:/Users/shashidhar/Desktop/MF-Investments/client/src/api/index.js)
-   Update `fetchApi` to attach `data.code` and `data.details` to the thrown Error object.
-   This fixes the issue where `Invest.jsx` checks `err.code` but receives undefined.

#### [MODIFY] [client/src/hooks/useErrorFocus.js](file:///c:/Users/shashidhar/Desktop/MF-Investments/client/src/hooks/useErrorFocus.js)
-   (Optional) Verify logic matches requirements (already seems correct).

### 4. Frontend UI Components

#### [MODIFY] [client/src/components/ErrorMessage.jsx](file:///c:/Users/shashidhar/Desktop/MF-Investments/client/src/components/ErrorMessage.jsx)
-   Add support for `variant` prop (banner, modal, inline).
-   Add icons and animations.

#### [MODIFY] [client/src/pages/Invest.jsx](file:///c:/Users/shashidhar/Desktop/MF-Investments/client/src/pages/Invest.jsx)
-   Ensure `HOLDING_NOT_FOUND` is handled gracefully (logic exists, just verify with new API client).

## Verification Plan

### Automated Tests
-   Create unit tests for `AppError` and `errorHandler`.
-   Run existing backend tests to ensuring refactoring didn't break auth/demo flows.

### Manual Verification
1.  **SWP Error:** Try to SWP a fund with 0 holdings. Verify "You do not own this fund" message appears (requires `HOLDING_NOT_FOUND` code propagation).
2.  **Form Focus:** Trigger validation error on Register/Login and verify auto-scroll.
3.  **Auth Error:** Try logging in with wrong password. Verify standardized error response.
