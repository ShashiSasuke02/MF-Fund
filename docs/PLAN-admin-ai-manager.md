# Admin AI Manager Implementation Plan

## Goal
Empower Administrators to dynamically manage the AI Assistant features without server restarts. This includes enabling/disabling the feature globally, viewing available Ollama models, and saving the active model configuration.

## User Review Required
> [!IMPORTANT]
> **Database Schema Change**: A new `system_settings` table will be introduced to store dynamic configuration. This allows settings to persist across container restarts.

## Proposed Architecture

### 1. Database Layer
**New Table: `system_settings`**
A key-value store for application-wide dynamic configuration.
```sql
CREATE TABLE system_settings (
    setting_key VARCHAR(50) PRIMARY KEY,
    setting_value TEXT, 
    description VARCHAR(255),
    updated_at BIGINT
);
-- Keys: 'ai_enabled' ('true'/'false'), 'ai_model' ('qwen2.5:0.5b')
```

### 2. Backend Changes
#### [NEW] `src/services/settings.service.js`
- Methods: `get(key)`, `set(key, value)`, `getAll()`.
- Caching: Implement simple in-memory cache (1-minute TTL) to reduce DB hits on every request.

#### [MODIFY] `src/services/ollama.service.js`
- Remove exclusive reliance on `constructor` config.
- Update `chat()` and `listModels()` to check `SettingsService`.
    - **Model Selection:** settings.get('ai_model') -> process.env.OLLAMA_MODEL_NAME -> default.
    - **Feature Flag:** If settings.get('ai_enabled') is false, throw ServiceUnavailable error.

#### [MODIFY] `src/controllers/api.controller.js` (or new `settings.controller.js`)
- `chat`: Handle "AI Disabled" error gracefully.
- `getModels`: Add endpoint to proxy Ollama's model list (Admin only).
- `getStatus`: Public/Protected endpoint returning `{ enabled: boolean }`.

#### [MODIFY] `src/routes/admin.routes.js`
- Add routes for managing settings:
    - `POST /api/admin/settings` (Upsert setting)
    - `GET /api/admin/ai/models` (Fetch available models from Ollama via Backend)

### 3. Frontend Changes
#### [NEW] `client/src/components/admin/AiManager.jsx`
- **UI Components:**
    - **Master Toggle:** Switch to Enable/Disable AI globally.
    - **Model Selector:** Dropdown populated by real-time Ollama model list.
    - **Status Indicator:** Shows if Ollama server is reachable.
- **Actions:** Safe save functionality.

#### [MODIFY] `client/src/components/ai/AiAssistant.jsx`
- **Initialization:** Check `{ enabled }` status on mount.
- **Behavior:** If disabled, unmount/hide widget entirely.

## Implementation Steps

### Phase 1: Foundation (DB & Service)
1. Create migration script for `system_settings`.
2. Implement `SettingsService`.
3. Update `OllamaService` to use dynamic settings.

### Phase 2: API Layer
1. Create `SettingsController` (or add to `AdminController`).
2. Add Admin routes for settings & model listing.
3. Update `AiController` to respect the "Enabled" flag.

### Phase 3: Frontend Admin
1. Create `AiManager` component.
2. Integrate into `AdminDashboard.jsx`.

### Phase 4: Frontend User
1. Update `AiAssistant` to respect global flag.

## Verification Plan

### Automated Tests
- **Unit:** Test `SettingsService` caching and persistence.
- **Unit:** Test `OllamaService` fallback logic (DB -> Env -> Default).
- **Integration:** Verify `chat` endpoint returns 503 when disabled.

### Manual Verification
1. **Toggle Test:** Turn AI OFF in Admin → Verify Chat Widget disappears for User.
2. **Model Switch:** Change Model to valid alternative → Verify Chat works.
3. **Invalid Model:** Select non-existent model (mock) → Verify graceful error.
