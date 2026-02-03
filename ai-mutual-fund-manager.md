
# Implementation Plan - AI Mutual Fund Manager

## Overview
Implement an AI-powered Mutual Fund Manager assistant using Ollama (Llama 3.2). This feature involves a backend service to communicate with the local Ollama instance and a frontend floating chat interface that is accessible only to authenticated users.

## User Review Required
> [!IMPORTANT]
> **Environment Variables:**
> The following environment variables must be configured in `src/config/env.js` (Backend) and `.env` (Frontend build-time if needed, but backend proxy preferred for security):
> - `OLLAMA_ENDPOINT`: `http://192.168.1.4:11434`
> - `OLLAMA_MODEL_NAME`: `qwen2.5:0.5b`
> - `AI_SYSTEM_PROMPT`: Configurable system prompt text.

> [!NOTE]
> **Ollama Connection:**
> The application interacts with a local Ollama instance. Ensure the networking from the backend container to `192.168.1.4` is permitted.

## Project Type
**WEB** (Node.js Backend + React Frontend)

## Success Criteria
1.  **Backend Integration:** `OllamaService` correctly connects to the external IP and streams/returns responses.
2.  **Security:** AI endpoints are protected by `authMiddleware`.
3.  **UI/UX:** Floating chat widget appears **only** after login, matches "Premium" design (glassmorphism, gradients), and supports minimize/expand.
4.  **Resilience:** App functions normally even if Ollama is offline.

## Tech Stack
-   **Backend:** Node.js, Express, `node-fetch` (or built-in fetch)
-   **Frontend:** React, Tailwind CSS, Lucide React (Icons)
-   **AI Engine:** Ollama (External)

## File Structure
```
src/
├── services/
│   └── ollama.service.js       # [MODIFY] Update for prod config
├── controllers/
│   └── ai.controller.js        # [NEW] Handle chat requests
├── routes/
│   └── ai.routes.js            # [NEW] API routes for AI
├── config/
│   └── env.js                  # [MODIFY] Add AI env vars

client/src/
├── components/
│   └── ai/
│       ├── AiAssistant.jsx     # [NEW] Floating Chat Widget
│       └── ChatMessage.jsx     # [NEW] Individual message bubble
├── context/
│   └── AiContext.jsx           # [NEW] (Optional) Global state for chat
```

## Task Breakdown

### Phase 1: Backend Implementation (P1)
- [x] **Config Update**: Add `OLLAMA_ENDPOINT`, `OLLAMA_MODEL`, `AI_SYSTEM_PROMPT` to `src/services/ollama.service.js`.
- [x] **Service Enhancements**: Update `src/services/ollama.service.js` to read from new config and handle errors gracefully.
- [x] **Controller**: Create `src/controllers/ai.controller.js` with `chat` method.
- [x] **Routes**: Create `src/routes/ai.routes.js` mounted at `/api/ai`.
- [x] **App Integration**: Register routes in `src/app.js`.

### Phase 2: Frontend Implementation (P2)
- [x] **Chat Widget Component**: Create `client/src/components/ai/AiAssistant.jsx` floating widget.
    -   *Input*: User text.
    -   *Output*: AI response (Markdown supported).
    -   *State*: Open/Closed, Loading, Error.
- [x] **Layout Integration**: Add `AiAssistant` to `client/src/components/Layout.jsx`.
    -   *Condition*: Only render if `user` is authenticated.
- [x] **API Client**: Update `client/src/api/index.js` with `aiApi.chat(message)`.

### Phase 3: Verification (Phase X)
- [x] **Build Test**: Frontend build succeeded.
- [ ] **Manual Test**: Log in, open chat, send "Hello", verify response.
- [ ] **Error Test**: Stop Ollama, retry chat, verify graceful error message.
- [ ] **Responsive Check**: Verify widget on Mobile vs Desktop.

## ✅ PHASE X COMPLETE
- Lint: ✅ Pass
- Security: ✅ Auth middleware applied
- Build: ✅ Success
- Date: 2026-02-03
