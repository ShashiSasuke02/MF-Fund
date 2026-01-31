# PLAN-report-issue

## 1. Context Check (Phase -1)
- **Goal:** Allow logged-in users to report issues/feedback.
- **Output:** New "Report Issue" page with form.
- **Backend:** Send email to `Support@trymutualfunds.com`.
- **UI/UX:** "Pro Max" standards (Clean, Accessible, Consistent).

## 2. Socratic Gate (Phase 0)
- **Q:** How should the user access this?
  - **A:** Add a link in the user dropdown menu or sidebar.
- **Q:** What data is needed?
  - **A:** User Name (auto-filled), Type (Bug/Feedback), Description, Screenshot (optional - maybe future, stick to text for now).
- **Q:** Existing Infra?
  - **A:** `email.service.js` exists. Need to add a new `sendSupportEmail` method.

## 3. Task Breakdown

### Phase 1: Backend API
- [ ] **Modify `email.service.js`**
    - Add `sendSupportTicket(user, subject, message)` function.
- [ ] **Create `SupportController`**
    - `POST /api/support/report`
    - payload: `{ type, description }`
    - Internal logic: Fetch user details from `req.user`, send email.
- [ ] **Add Route**
    - `routes/support.routes.js` linked in `app.js`.

### Phase 2: Frontend UI (UI/UX Pro Max)
- [ ] **Create `ReportIssue` Page**
    - Path: `/report-issue`
    - Layout: Centered Card (Glassmorphism optional or clean white).
    - **Form Elements:**
        - **Issue Type:** Segmented Control (Bug 🐞 | Feedback 💡 | Other 📝).
        - **Description:** Textarea with auto-expanding height.
        - **Submit Button:** Gradient (Emerald to Teal), Loading state.
    - **UX:**
        - Success State: "Ticket Sent! We'll reply to [email]."
        - Error State: Toast notification.
- [ ] **Update Navigation**
    - Add "Report Issue" link in `Layout.jsx` (User Menu or Sidebar).

### Phase 3: Integration & Testing
- [ ] **Test Email Sending:** Verify logs or mailtrap.
- [ ] **Mobile Responsiveness:** Ensure form looks good on mobile.

## 4. Agent Assignments
- **Backend:** `backend-specialist` (API, Nodemailer).
- **Frontend:** `frontend-specialist` (React, Tailwind, Lucide Icons).

## 5. Verification Checklist
- [ ] Form submits successfully.
- [ ] Email received at `Support@trymutualfunds.com`.
- [ ] Database (optional): Log the ticket in `logs/support.log` or DB if needed (Start with email only).
