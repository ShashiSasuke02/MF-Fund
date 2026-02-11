# Plan: Forgot Password Feature (OTP-Based Reset)

## 1. Context & Requirements
- **Goal**: Allow users to recover access to their account via Email OTP.
- **User Request**: "Verify email -> Send OTP -> Verify OTP -> **User Sets New Password**".
- **Security Constraint**: Passwords are stored as **bcrypt hashes**. We cannot recover the old one, so we must overwrite it.
- **Revised Solution**: 
    1. **Request**: User enters Email -> System sends OTP.
    2. **Verify**: User enters OTP -> System validates.
    3. **Reset**: User enters **New Password** -> System updates Database.
    4. **Login**: User logs in with the new password.

## 2. Architecture & Schema
### Database Changes
- **None**. We will use **Redis** for temporary OTP storage.

### Redis Schema
- **Key**: `auth:reset_otp:{email}`
- **Value**: `{ otp: "123456", attempts: 0 }` (JSON string)
- **TTL**: 10 minutes (600 seconds)

### API Endpoints
- `POST /api/auth/forgot-password`
    - Input: `{ email }`
    - Logic: Check user -> Generate OTP -> Store in Redis (TTL 10m) -> Send Email.
- `POST /api/auth/verify-reset-otp`
    - Input: `{ email, otp }`
    - Logic: Check Redis -> Verify OTP. Returns "Success" to allow UI to show Password Input.
- `POST /api/auth/reset-password`
    - Input: `{ email, otp, newPassword }`
    - Logic: Check Redis (Atomic verify) -> Hash New Password -> Update User DB -> Delete Redis Key -> Email Notification.

## 3. Implementation Steps

### Phase 1: Database & Backend
1.  **Schema**: Add `password_resets` table to `src/db/schema.sql`.
2.  **Model**: Create `src/models/passwordReset.model.js` for OTP lifecycle.
3.  **User Model**: Ensure `updatePassword(userId, newPasswordHash)` exists.
4.  **Email Service**: Use existing `sendOTP` (reusable).
5.  **Controller**: Implement `forgotPassword`, `verifyResetOTP`, and `resetPassword` in `src/controllers/auth.controller.js`.
6.  **Routes**: Register endpoints in `src/routes/auth.routes.js`.

### Phase 2: Frontend
1.  **Component**: Create `client/src/pages/ForgotPassword.jsx`.
    -   **Stage 1 (Request)**: Email Input Form.
    -   **Stage 2 (Verify)**: OTP Input Form.
    -   **Stage 3 (Reset)**: New Password Input Form (with validation).
2.  **Route**: Add `/forgot-password` to `client/src/App.jsx`.
3.  **Navigation**: Add "Forgot Password?" link to `Login.jsx`.

## 4. Security Measures
- **Rate Limiting**: Max 3 OTP generation attempts per IP/Email per hour.
- **OTP Expiry**: 10 minutes.
- **Verification Attempts**: Max 3 invalid OTP attempts before invalidating the record.
- **Session Security**: The final reset request must include the OTP again (or a signed token) to prevent bypassing the verification step.

## 5. Verification Checklist
- [ ] Database table `password_resets` created.
- [ ] API `forgot-password` sends email with OTP.
- [ ] Frontend allows entering OTP.
- [ ] Frontend allows entering New Password ONLY after OTP is correct.
- [ ] API `reset-password` updates the database with the new hash.
- [ ] User can login with the NEW password immediately.
- [ ] Old password no longer works.
