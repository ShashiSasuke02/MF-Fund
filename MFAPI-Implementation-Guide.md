# Mutual Fund API – Implementation Guide

> **Version:** 1.0.0  
> **Base URL:** `https://api.mfapi.in`  
> **Source Documentation:** <https://www.mfapi.in/docs/>  
> **OpenAPI Spec:** <https://www.mfapi.in/docs/openapi.json>

---

## Table of Contents

1. [Overview](#overview)
2. [API Conventions](#api-conventions)
3. [Endpoints](#endpoints)
   - [Search Schemes](#1-search-schemes)
   - [List All Schemes](#2-list-all-schemes)
   - [Get NAV History](#3-get-nav-history-for-a-scheme)
   - [Get Latest NAV for a Scheme](#4-get-latest-nav-for-a-scheme)
   - [Get Latest NAV for All Schemes](#5-get-latest-nav-for-all-schemes)
4. [Data Models](#data-models)
5. [Error Handling](#error-handling)
6. [Client Implementation Examples](#client-implementation-examples)
   - [JavaScript / TypeScript (fetch)](#javascripttypescript-fetch)
   - [Python (requests)](#python-requests)
7. [Best Practices](#best-practices)

---

## Overview

The **Mutual Fund API** provides free access to Indian mutual-fund data:

| Feature | Description |
|---------|-------------|
| Scheme search | Full-text search by scheme name |
| Scheme listing | Paginated list of all schemes with ISIN codes |
| NAV history | Historical NAV for a scheme with optional date filters |
| Latest NAV | Most recent NAV for one or all schemes |

**Authentication:** None required (public API).  
**Content-Type:** Responses are `application/json`.

---

## API Conventions

| Aspect | Details |
|--------|---------|
| Request dates | ISO-8601 format `YYYY-MM-DD` (query params `startDate`, `endDate`) |
| Response dates | `DD-MM-YYYY` string in NAV data |
| NAV precision | String with 5 decimal places, e.g. `"45.12300"` |
| Pagination | `limit` (max results) + `offset` (skip count) |
| HTTP methods | All endpoints use **GET** |

---

## Endpoints

### 1. Search Schemes

Search mutual-fund schemes by name.

| | |
|-|-|
| **Method** | GET |
| **Path** | `/mf/search` |

#### Query Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `q` | string | Yes | Search term (e.g., `HDFC`) |

#### Example Request

```bash
curl "https://api.mfapi.in/mf/search?q=HDFC"
```

#### Example Response

```json
[
  {
    "schemeCode": 100119,
    "schemeName": "HDFC Balanced Advantage Fund - Direct Plan - Growth"
  },
  {
    "schemeCode": 100120,
    "schemeName": "HDFC Banking and PSU Debt Fund - Direct Plan - Growth"
  }
]
```

#### Errors

| Status | Cause |
|--------|-------|
| 400 | Missing `q` parameter |

---

### 2. List All Schemes

Retrieve a paginated list of all available schemes.

| | |
|-|-|
| **Method** | GET |
| **Path** | `/mf` |

#### Query Parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `limit` | int | No | – | Results per page (max 1000) |
| `offset` | int | No | 0 | Records to skip |

#### Example Request

```bash
curl "https://api.mfapi.in/mf?limit=2&offset=0"
```

#### Example Response

```json
[
  {
    "schemeCode": 100119,
    "schemeName": "HDFC Balanced Advantage Fund - Direct Plan - Growth",
    "isinGrowth": "INF179K01BB2",
    "isinDivReinvestment": "INF179K01BC0"
  }
]
```

---

### 3. Get NAV History for a Scheme

Fetch historical NAV data for a specific scheme.

| | |
|-|-|
| **Method** | GET |
| **Path** | `/mf/{scheme_code}` |

#### Path Parameters

| Name | Type | Description |
|------|------|-------------|
| `scheme_code` | int | Unique scheme identifier |

#### Query Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `startDate` | date | No | Filter start (YYYY-MM-DD) |
| `endDate` | date | No | Filter end (YYYY-MM-DD) |

#### Example Request

```bash
curl "https://api.mfapi.in/mf/125497?startDate=2023-01-01&endDate=2023-01-31"
```

#### Example Response

```json
{
  "meta": {
    "fund_house": "HDFC Mutual Fund",
    "scheme_type": "Open Ended Schemes",
    "scheme_category": "Balanced Advantage Fund",
    "scheme_code": 125497,
    "scheme_name": "HDFC Balanced Advantage Fund - Direct Plan - Growth",
    "isin_growth": "INF179K01BB2",
    "isin_div_reinvestment": "INF179K01BC0"
  },
  "data": [
    { "date": "31-01-2023", "nav": "45.12300" },
    { "date": "30-01-2023", "nav": "45.00100" }
  ],
  "status": "SUCCESS"
}
```

#### Errors

| Status | Cause |
|--------|-------|
| 404 | Invalid or unknown scheme code |

---

### 4. Get Latest NAV for a Scheme

Get the most recent NAV for a single scheme.

| | |
|-|-|
| **Method** | GET |
| **Path** | `/mf/{scheme_code}/latest` |

#### Path Parameters

| Name | Type | Description |
|------|------|-------------|
| `scheme_code` | int | Scheme identifier |

#### Example Request

```bash
curl "https://api.mfapi.in/mf/125497/latest"
```

#### Example Response

```json
{
  "meta": { /* same as NAV history */ },
  "data": [
    { "date": "26-10-2024", "nav": "48.56700" }
  ],
  "status": "SUCCESS"
}
```

---

### 5. Get Latest NAV for All Schemes

Bulk fetch the latest NAV for every scheme (with pagination).

| | |
|-|-|
| **Method** | GET |
| **Path** | `/mf/latest` |

#### Query Parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `limit` | int | No | – | Max 10000 |
| `offset` | int | No | 0 | Records to skip |

#### Example Request

```bash
curl "https://api.mfapi.in/mf/latest?limit=2&offset=0"
```

#### Example Response

```json
[
  {
    "schemeCode": 125497,
    "schemeName": "HDFC Balanced Advantage Fund - Direct Plan - Growth",
    "fundHouse": "HDFC Mutual Fund",
    "schemeType": "Open Ended Schemes",
    "schemeCategory": "Balanced Advantage Fund",
    "isinGrowth": "INF179K01BB2",
    "isinDivReinvestment": "INF179K01BC0",
    "nav": "48.56700",
    "date": "26-10-2024"
  }
]
```

---

## Data Models

### SchemeSearchResult

| Field | Type | Description |
|-------|------|-------------|
| `schemeCode` | int | Unique ID |
| `schemeName` | string | Full scheme name |

### SchemeListItem

| Field | Type | Description |
|-------|------|-------------|
| `schemeCode` | int | Unique ID |
| `schemeName` | string | Full scheme name |
| `isinGrowth` | string \| null | Growth option ISIN |
| `isinDivReinvestment` | string \| null | Dividend reinvestment ISIN |

### NAVData

| Field | Type | Description |
|-------|------|-------------|
| `date` | string | Date (DD-MM-YYYY) |
| `nav` | string | NAV value (5 decimals) |

### SchemeMeta

| Field | Type | Description |
|-------|------|-------------|
| `fund_house` | string | Fund house name |
| `scheme_type` | string | Type (e.g., "Open Ended Schemes") |
| `scheme_category` | string | Category |
| `scheme_code` | int | Unique ID |
| `scheme_name` | string | Scheme name |
| `isin_growth` | string \| null | Growth ISIN |
| `isin_div_reinvestment` | string \| null | Div reinvestment ISIN |

### NAVHistoryResponse

| Field | Type | Description |
|-------|------|-------------|
| `meta` | SchemeMeta | Scheme metadata |
| `data` | NAVData[] | Array of NAV records |
| `status` | "SUCCESS" \| "ERROR" | Response status |

### LatestNAVItem

| Field | Type | Description |
|-------|------|-------------|
| `schemeCode` | int | Unique ID |
| `schemeName` | string | Scheme name |
| `fundHouse` | string | Fund house |
| `schemeType` | string | Type |
| `schemeCategory` | string | Category |
| `isinGrowth` | string \| null | Growth ISIN |
| `isinDivReinvestment` | string \| null | Dividend ISIN |
| `nav` | string | NAV value |
| `date` | string | NAV date (DD-MM-YYYY) |

---

## Error Handling

| HTTP Code | Meaning | Recommended Action |
|-----------|---------|--------------------|
| 400 | Bad request (missing params) | Validate input before calling |
| 404 | Scheme not found | Check scheme code from `/mf` or `/mf/search` |
| 5xx | Server error | Retry with exponential back-off |

---

## Client Implementation Examples

### JavaScript/TypeScript (fetch)

```typescript
const BASE_URL = "https://api.mfapi.in";

export async function searchSchemes(query: string) {
  const res = await fetch(`${BASE_URL}/mf/search?q=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error(`Search failed: ${res.status}`);
  return res.json(); // SchemeSearchResult[]
}

export async function getSchemes(limit = 100, offset = 0) {
  const res = await fetch(`${BASE_URL}/mf?limit=${limit}&offset=${offset}`);
  if (!res.ok) throw new Error(`List schemes failed: ${res.status}`);
  return res.json(); // SchemeListItem[]
}

export async function getNAVHistory(
  schemeCode: number,
  startDate?: string,
  endDate?: string
) {
  let url = `${BASE_URL}/mf/${schemeCode}`;
  const params = new URLSearchParams();
  if (startDate) params.set("startDate", startDate);
  if (endDate) params.set("endDate", endDate);
  if (params.toString()) url += `?${params}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`NAV history failed: ${res.status}`);
  return res.json(); // NAVHistoryResponse
}

export async function getLatestNAV(schemeCode: number) {
  const res = await fetch(`${BASE_URL}/mf/${schemeCode}/latest`);
  if (!res.ok) throw new Error(`Latest NAV failed: ${res.status}`);
  return res.json(); // NAVHistoryResponse
}

export async function getAllLatestNAV(limit = 1000, offset = 0) {
  const res = await fetch(`${BASE_URL}/mf/latest?limit=${limit}&offset=${offset}`);
  if (!res.ok) throw new Error(`All latest NAV failed: ${res.status}`);
  return res.json(); // LatestNAVItem[]
}
```

### Python (requests)

```python
import requests

BASE_URL = "https://api.mfapi.in"

def search_schemes(query: str):
    r = requests.get(f"{BASE_URL}/mf/search", params={"q": query})
    r.raise_for_status()
    return r.json()

def get_schemes(limit: int = 100, offset: int = 0):
    r = requests.get(f"{BASE_URL}/mf", params={"limit": limit, "offset": offset})
    r.raise_for_status()
    return r.json()

def get_nav_history(scheme_code: int, start_date: str = None, end_date: str = None):
    params = {}
    if start_date:
        params["startDate"] = start_date
    if end_date:
        params["endDate"] = end_date
    r = requests.get(f"{BASE_URL}/mf/{scheme_code}", params=params)
    r.raise_for_status()
    return r.json()

def get_latest_nav(scheme_code: int):
    r = requests.get(f"{BASE_URL}/mf/{scheme_code}/latest")
    r.raise_for_status()
    return r.json()

def get_all_latest_nav(limit: int = 1000, offset: int = 0):
    r = requests.get(f"{BASE_URL}/mf/latest", params={"limit": limit, "offset": offset})
    r.raise_for_status()
    return r.json()
```

---

## Best Practices

1. **Cache scheme lists** – The scheme universe changes infrequently; cache `/mf` results daily.
2. **Paginate large fetches** – Use `limit` & `offset` to avoid timeouts when listing all schemes or NAVs.
3. **Parse NAV as Decimal** – NAV strings have 5 decimals; use a decimal library (e.g., `Decimal` in Python, `decimal.js` in JS) to avoid float precision issues.
4. **Handle date format conversion** – Response dates are `DD-MM-YYYY`; convert to ISO for storage/comparison.
5. **Implement retry logic** – For 5xx errors use exponential back-off.
6. **Set reasonable timeouts** – e.g., 10 seconds per request.

---

*Generated from the official OpenAPI spec at mfapi.in.*
