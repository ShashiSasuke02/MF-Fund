# Plan: Google AdSense Visibility Control

## Goal
Implement a strict, environment-variable-based toggle to control the visibility of all AdSense units and the loading of external scripts.

## User Review Required
> [!IMPORTANT]
> **Environment Variable:** We will uses `VITE_isAdsEnabled` (true/false) as the single source of truth.
> **Visibility Rule:** When `false`, **NO** placeholders will be shown, and **NO** external scripts will be loaded. The layout will reflow naturally.
> **Dynamic Loading:** The hardcoded script in `index.html` will be removed in favor of a dynamic React hook.

## Proposed Changes

### 1. Environment Configuration

#### [MODIFY] [.env.example](file:///c:/Users/shashidhar/Desktop/MF-Investments/.env.example)
Add the new control flag.
```env
# ... existing config
VITE_isAdsEnabled=true
```

### 2. AdSense Component Refactoring

#### [MODIFY] [AdSense.jsx](file:///c:/Users/shashidhar/Desktop/MF-Investments/client/src/components/AdSense.jsx)
Refactor to:
1.  Check `import.meta.env.VITE_isAdsEnabled`.
2.  If `false`: Return `null` immediately (removing placeholders).
3.  Implements a `useAdSenseScript` hook that only injects the `<script>` tag into `<head>` when:
    *   `VITE_isAdsEnabled` is true.
    *   The script is not already present.
4.  Remove the "Development Placeholder" logic unless `VITE_isAdsEnabled=true` is explicitly set in dev.

### 3. Entry Point Cleanup

#### [MODIFY] [index.html](file:///c:/Users/shashidhar/Desktop/MF-Investments/client/index.html)
- [DELETE] The hardcoded `<script async src="https://pagead2.googlesyndication.com...` tag.
- This ensures no network calls are made to Google unless the feature is enabled.

### 4. Verification Plan

#### Manual Verification
1.  **Scenario A (Enabled)**:
    - Set `VITE_isAdsEnabled=true`.
    - Verify ads (or placeholders in dev) appear.
    - Verify `adsbygoogle.js` is requested in the Network tab.
2.  **Scenario B (Disabled)**:
    - Set `VITE_isAdsEnabled=false`.
    - Verify **zero** ad elements in the DOM.
    - Verify **zero** network requests to `googlesyndication.com`.
    - Verify layout reflows without gaps.

#### Automated Tests
- Add a simple test case to check if `AdSense` component returns null when env var is false.
