# Plan: Download All Logs (Admin Dashboard)

**Objective:** Allow administrators to download all system log files as a single compressed ZIP archive from the Admin Dashboard.

## 1. Analysis

### Current State
- **UI:** `LogViewer.jsx` lists individual files with individual "Download" buttons.
- **Backend:** `log.controller.js` handles list fetching and single file download.
- **Storage:** Logs are stored in `logs/` directory (absolute path resolved relative to `src/services/logger.service.js`).

### Requirements
1.  **UI:** A "Download All" button in the `LogViewer` header.
2.  **API:** A new endpoint `GET /api/admin/logs/download-all` that streams a ZIP file.
3.  **Compression:** Use `adm-zip` (pure Node.js implementation) to zip files on the fly.
4.  **Security:** Protected by `authenticateToken` and `requireAdmin`.

---

## 2. Implementation Plan

### Step 1: Install Dependency
Add `adm-zip` to `package.json` to handle ZIP creation.
```bash
npm install adm-zip
```

### Step 2: Backend Implementation

#### A. Update Controller (`src/controllers/log.controller.js`)
Add `downloadAllLogs` function:
1.  Initialize `new AdmZip()`.
2.  Read all files from `LOG_DIR`.
3.  Add each file to the zip archive using `zip.addLocalFile()`.
4.  Generate ZIP buffer.
5.  Send response with headers:
    - `Content-Type: application/zip`
    - `Content-Disposition: attachment; filename=system-logs-YYYY-MM-DD.zip`

#### B. Update Routes (`src/routes/admin.routes.js`)
Register the new route:
```javascript
router.get('/logs/download-all', authenticateToken, requireAdmin, downloadAllLogs);
```

### Step 3: Frontend Implementation

#### A. Update Component (`client/src/components/admin/LogViewer.jsx`)
1.  Add "Download All" button in the header (next to Refresh).
2.  Implement `handleDownloadAll` function using the same token-based native download approach as single file download.

---

## 3. Detailed Changes

### Backend: `transaction.model.js` (No changes needed)

### Backend: `src/controllers/log.controller.js`
```javascript
import AdmZip from 'adm-zip';

export const downloadAllLogs = async (req, res) => {
    try {
        const zip = new AdmZip();
        // Add all files from local folder to zip
        zip.addLocalFolder(LOG_DIR);
        
        const zipName = `system-logs-${new Date().toISOString().split('T')[0]}.zip`;
        const data = zip.toBuffer();
        
        res.set('Content-Type', 'application/octet-stream');
        res.set('Content-Disposition', `attachment; filename=${zipName}`);
        res.set('Content-Length', data.length);
        res.send(data);
    } catch (error) {
        logger.error('Error zipping logs', { error: error.message });
        res.status(500).json({ success: false, message: 'Failed to create zip' });
    }
};
```

### Frontend: `LogViewer.jsx`
```jsx
const handleDownloadAll = () => {
    const token = sessionStorage.getItem('auth_token');
    if (!token) return;
    window.location.href = `${API_URL}/api/admin/logs/download-all?token=${encodeURIComponent(token)}`;
};

// Button UI
<button 
    onClick={handleDownloadAll}
    className="bg-emerald-600 text-white px-3 py-1.5 rounded hover:bg-emerald-700 flex items-center gap-2"
>
    <DownloadIcon /> Download All
</button>
```

---

## 4. Verification
1.  **Dependency:** Verify `adm-zip` is installed.
2.  **API:** Test `GET /api/admin/logs/download-all` via Postman/Browser (should download zip).
3.  **Content:** Extract zip and verify all log files are present.
