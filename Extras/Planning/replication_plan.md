# Mobile App Replication Master Plan

## 1. Discovery Phase (Inventory)

**Objective:** Map every screen and interaction in the web app to replicating it in the mobile demo.

### A. Core Page Inventory
| View | Route | Features to Replicate | Status |
|:--- |:--- |:--- |:--- |
| **Landing** | `/` | Hero, "Start Practice" CTA, Feature Grid, Footer | ✅ Done |
| **Login/Register** | `/auth` | Bento Grid Layout (Left), Form (Right), Password Strength | ✅ Done |
| **Portfolio** | `/portfolio` | **Home**: Total Wealth Card (Animated), Quick Actions, Holdings List | ✅ Done |
| **Browse** | `/browse` | AMC Grid (Simple Logos) | ✅ Done |
| **Fund List** | `/amc/:id` | List of Schemes, Returns Badges | ✅ Done |
| **Fund Details**| `/fund/:id` | **Dynamic Branding** (Header Color), NAV Chart, Returns Grid | ✅ Done |
| **Invest** | `/invest` | "Swipe to Pay", Balance Check, Scheme Name Display | ✅ Done |
| **Calculators** | `/tools` | SIP/Lumpsum Toggle, Sliders, Projection Graph | ✅ Done |
| **Admin** | `/admin` | Stats Grid, System Health, Logs Button | ✅ Done |

### B. Component Inventory
- **Navigation**:
    -   *Desktop*: Top Navbar (Hidden in Mobile Demo).
    -   *Mobile*: Bottom Navigation Bar (Visible only when logged in).
-   **UI Pattern**: "Glassmorphism" Cards (White/80%, Blur 12px).
-   **Theme**: Emerald (`#10b981`) & Gold (`#fbbf24`).

## 2. Implementation Strategy

### A. The "Single File" Approach
Instead of a React Build, we use a single `mobile_demo.html` for portability.
-   **Router**: `router(viewId, params)` function handles view switching (Display: block/none).
-   **State**: Simple Global Variables (`historyStack`, `AMCS`).
-   **Icons**: Lucide Icons (CDN).
-   **Styles**: Tailwind CSS (CDN).

### B. Key Technical Decisions
1.  **Dynamic Routing**:
    -   Passing parameters (e.g., `router('details', {id: 'sbi', amc: 'sbi'})`) to render the same HTML template with different data/colors.
2.  **Z-Index Management**:
    -   `header` (z-50) > `bottom-nav` (z-40) > `glass-card` > `background`.
3.  **Interaction Design**:
    -   "Swipe to Confirm" for investment (Addictive UX).
    -   "Confetti" on Success.

## 3. Current Status & Next Steps

### Completed
- [x] Full UI Built (Views 1-12)
- [x] Routing Logic Implemented
- [x] Assets (Background) Integrated

### Known Issues / To-Do
- [ ] **Fix**: Bottom Nav overlaps "Invest Button" on Details page. -> *Hide Bottom Nav on Deep Views.*
- [ ] **Fix**: scheme name not passing to Invest page. -> *Update Router params.*
