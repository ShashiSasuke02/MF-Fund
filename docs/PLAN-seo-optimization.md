# Plan: SEO Optimization Strategy

## 1. Executive Summary
**Goal:** Improve organic search visibility for "MF-Investments" by optimizing public-facing pages (Landing, Fund Details) for search engines (Google/Bing).

**Challenge:** Single Page Applications (SPAs) like React often struggle with SEO because content is rendered client-side.
**Strategy:** Implement **Dynamic Meta Tags**, **Structured Data (JSON-LD)**, and **Sitemap generation** to help crawlers understand our financial data.

## 2. Technical SEO Architecture

### 2.1 Dynamic Meta Tags (React Helmet Async)
-   **Tool:** `react-helmet-async`
-   **Implementation:** Create a reusable `<SEO />` component.
-   **Fields:** Title, Description, Canonical URL, Open Graph (OG) Image, Twitter Card.
-   **Target Pages:**
    -   **Home:** "Best Mutual Fund Analysis Tool"
    -   **Fund Details:** "{Scheme Name} NAV, Performance & Analysis"
    -   **AMC List:** "Top Asset Management Companies in India"

### 2.2 Structured Data (JSON-LD)
-   **Why:** Rich snippets in Google Search (e.g., showing NAV or Star Rating directly in results).
-   **Schema Types:**
    -   `FinancialProduct`: For Mutual Fund schemes.
    -   `Organization`: For AMCs.
    -   `BreadcrumbList`: For navigation hierarchy.

### 2.3 Crawlability
-   **Sitemap:** Dynamic `sitemap.xml` generation script to list all active Fund URLs.
-   **Robots:** `robots.txt` to allow indexing of public pages but block `/portfolio` and `/admin`.

## 3. Implementation Steps

### Phase 1: Foundation
#### [MODIFY] [client/package.json](file:///c:/Users/shashidhar/Desktop/MF-Investments/client/package.json)
-   Install `react-helmet-async`.

#### [NEW] [client/src/components/SEO.jsx](file:///c:/Users/shashidhar/Desktop/MF-Investments/client/src/components/SEO.jsx)
-   Reusable component accepting `title`, `description`, `keywords`, `image`.

#### [MODIFY] [client/src/Main.jsx](file:///c:/Users/shashidhar/Desktop/MF-Investments/client/src/Main.jsx)
-   Wrap app in `<HelmetProvider>`.

### Phase 2: Page-Level Optimization
#### [MODIFY] [client/src/pages/FundDetails.jsx](file:///c:/Users/shashidhar/Desktop/MF-Investments/client/src/pages/FundDetails.jsx)
-   Implement dynamic SEO titles: `SBI Nifty 50 Index Fund - NAV: ₹150 | MF-Investments`
-   Inject JSON-LD schema with Fund Name, NAV, and Returns.

#### [MODIFY] [client/src/pages/Landing.jsx](file:///c:/Users/shashidhar/Desktop/MF-Investments/client/src/pages/Landing.jsx)
-   Optimize keywords for "Mutual Fund Paper Trading" and "Investment Simulator".

### Phase 3: Technical Deliverables
#### [NEW] [public/robots.txt](file:///c:/Users/shashidhar/Desktop/MF-Investments/client/public/robots.txt)
-   Allow `/`
-   Disallow `/portfolio`, `/admin`, `/auth/*`

#### [NEW] [scripts/generate-sitemap.js](file:///c:/Users/shashidhar/Desktop/MF-Investments/scripts/generate-sitemap.js)
-   Node.js script to query DB and generate `sitemap.xml` with 2000+ fund URLs.

## 4. Verification Plan
-   **Meta Check:** Inspect Element -> `<head>` to verify tags change on navigation.
-   **Rich Results Test:** Use Google's Rich Results Test tool on JSON-LD output.
-   **Lighthouse:** Run "SEO" audit in Chrome DevTools (Target: 100/100).
