---
trigger: always_on
---

# GEMINI.md - Strict User Protocols

> **CRITICAL USER RULE - READ FIRST**

## 🚫 ZERO-TRUST IMPLEMENTATION PROTOCOL

1.  **ABSOLUTE PROHIBITION:** You are FORBIDDEN from writing code, editing files, or executing system changes without **EXPLICIT, DIRECT USER COMMAND**.
2.  **VERIFICATION GATE:** Before starting any implementation phase, you must Ask: *"Do I have your explicit permission to proceed with these changes?"*
3.  **NO ASSUMPTIONS:** Do not assume a logical next step allows you to execute it. Stop and ask.
4.  **PLANNING MODE DEFAULT:** Default to PLANNING mode. Stay in PLANNING mode until the user explicitly says "Execute" or "Implement".

## 🛑 STRICT APPROVAL WORKFLOW
1.  User request received.
2.  AI analyzes and proposes a plan.
3.  AI asks: *"Please confirm if I should proceed with this implementation."*
4.  User approves.
5.  **AI asks AGAIN (Double Check):** *"Just to be double sure, I am about to modify [X] files. Confirm proceed?"* (As requested by user).
6.  User confirms -> AI Implements.

HARD REQUIREMENT: ARCHITECTURE LOCK

Before ANY of the following actions:

Writing new code

Modifying existing code

Refactoring

Adding dependencies

Introducing new flows, files, or abstractions

The agent MUST complete the steps below in order.

1️⃣ Mandatory Architecture Analysis Gate (NO EXCEPTIONS)

Before making ANY change, the agent MUST:

READ ARCHITECTURE.md fully (start to end)

EXTRACT and explicitly identify:

Core system boundaries

Ownership of modules (who owns what)

Approved extension points

Explicitly protected areas (do-not-touch zones)

Existing data flow & control flow

MAP the requested change against architecture

Which layer it belongs to

Whether the architecture already supports it

Whether it violates any stated constraint

❌ If ARCHITECTURE.md is missing, incomplete, or ambiguous → STOP IMMEDIATELY

2️⃣ STRICT NON-DESTRUCTION RULE (IMMUTABILITY GUARANTEE)

The agent is STRICTLY FORBIDDEN from:

Modifying existing logic unless explicitly required

Altering public or internal contracts (API, DTO, events, DB schema)

Changing behavior “incidentally”

Refactoring for cleanliness, performance, or style unless approved

Touching unrelated files “while already there”

Renaming, relocating, or reorganizing existing code

Default stance:

All existing code is assumed CRITICAL and INTENTIONAL.

3️⃣ ALLOWED CHANGE SURFACE (WHITELIST ONLY)

A change is permitted ONLY IF ONE of the following is true:

The architecture explicitly allows extension at that point

The change is confined to:

A newly created file

A clearly documented extension hook

The change is explicitly approved in:

{task-slug}.md

OR newtask.md

❌ “It seems safe” or “It looks unused” is NEVER valid justification

4️⃣ ARCHITECTURE IMPACT DECLARATION (MANDATORY OUTPUT)

Before coding, the agent MUST internally validate and be ready to declare:

### Architecture Compliance Check
- ARCHITECTURE.md read fully: YES
- Existing functionality affected: YES / NO
- Change confined to approved extension points: YES / NO
- Any existing code modified: YES / NO
- Risk of behavioral regression: LOW / MEDIUM / HIGH


❌ If ANY answer is unclear → DO NOT PROCEED

5️⃣ ZERO-TOLERANCE VIOLATIONS

The following actions are considered critical violations:

Updating code before reading ARCHITECTURE.md

Making “small” changes without impact analysis

Breaking backward compatibility without approval

Improving performance at the cost of behavior change

Silent refactors

Touching shared utilities without ownership confirmation

Violation Result:

The task is considered FAILED, regardless of correctness.

6️⃣ ARCHITECTURE IS LAW (FINAL OVERRIDE)

If ANY instruction conflicts with:

User request

Agent rule

Skill rule

Performance guideline

👉 ARCHITECTURE.md WINS — ALWAYS

If architecture blocks the request:

STOP

Explain the conflict

Propose a compliant alternative

WAIT for explicit approval

🧠 Guiding Principle (Non-Negotiable)

“Preserve first. Extend second. Modify last. Rewrite never.”

---

# GEMINI.md - Maestro Configuration

> Maestro AI Development Orchestrator
> This file defines how the AI behaves in this workspace.

---

## CRITICAL: AGENT & SKILL PROTOCOL (START HERE)

> **MANDATORY:** You MUST read the appropriate agent file and its skills BEFORE performing any implementation. This is the highest priority rule.

### 1. Modular Skill Loading Protocol
```
Agent activated → Check frontmatter "skills:" field
    │
    └── For EACH skill:
        ├── Read SKILL.md (INDEX only)
        ├── Find relevant sections from content map
        └── Read ONLY those section files
```

- **Selective Reading:** DO NOT read ALL files in a skill folder. Read `SKILL.md` first, then only read sections matching the user's request.
- **Rule Priority:** P0 (GEMINI.md) > P1 (Agent .md) > P2 (SKILL.md). All rules are binding.

### 2. Enforcement Protocol
1. **When agent is activated:**
   - ✅ READ all rules inside the agent file.
   - ✅ CHECK frontmatter `skills:` list.
   - ✅ LOAD each skill's `SKILL.md`.
   - ✅ APPLY all rules from agent AND skills.
2. **Forbidden:** Never skip reading agent rules or skill instructions. "Read → Understand → Apply" is mandatory.

---

## 🧪 Regression Safety & Behavior Preservation (ABSOLUTE RULE)

**Primary Objective:**
The AI must preserve all existing behavior unless a change is explicitly authorized and documented.

**Before ANY code modification:**
1. **READ ARCHITECTURE.md completely**
2. **Identify:**
   - Existing contracts (API, DB, UI, events)
   - Critical workflows
   - Shared utilities
3. **Confirm:**
   - What MUST remain unchanged
   - What is allowed to change

**❌ Forbidden Behavior:**
- Silent breaking changes
- “Optimizations” that alter behavior
- Refactors without {task-slug}.md approval
- Removing logic assumed to be unused

---

## 📥 REQUEST CLASSIFIER (STEP 2)

**Before ANY action, classify the request:**

| Request Type | Trigger Keywords | Active Tiers | Result |
|--------------|------------------|--------------|--------|
| **QUESTION** | "what is", "how does", "explain" | TIER 0 only | Text Response |
| **SURVEY/INTEL**| "analyze", "list files", "overview" | TIER 0 + Explorer | Session Intel (No File) |
| **SIMPLE CODE** | "fix", "add", "change" (single file) | TIER 0 + TIER 1 (lite) | Inline Edit |
| **COMPLEX CODE**| "build", "create", "implement", "refactor" | TIER 0 + TIER 1 (full) + Agent | **{task-slug}.md Required** |
| **DESIGN/UI** | "design", "UI", "page", "dashboard" | TIER 0 + TIER 1 + Agent | **{task-slug}.md Required** |
| **SLASH CMD** | /create, /orchestrate, /debug | Command-specific flow | Variable |

---

## TIER 0: UNIVERSAL RULES (Always Active)

### 🌐 Language Handling

When user's prompt is NOT in English:
1. **Internally translate** for better comprehension
2. **Respond in user's language** - match their communication
3. **Code comments/variables** remain in English

### 🧹 Clean Code (Global Mandatory)

**ALL code MUST follow `@[skills/clean-code]` rules. No exceptions.**

- Concise, direct, solution-focused
- No verbose explanations
- No over-commenting
- No over-engineering
- **Self-Documentation:** Every agent is responsible for documenting their own changes in relevant `.md` files.
- **Global Testing Mandate:** Every agent is responsible for writing and running tests for their changes. Follow the "Testing Pyramid" (Unit > Integration > E2E) and the "AAA Pattern" (Arrange, Act, Assert).
- **Global Performance Mandate:** "Measure first, optimize second." Every agent must ensure their changes adhere to 2025 performance standards (Core Web Vitals for Web, query optimization for DB, bundle limits for FS).
- **Infrastructure & Safety Mandate:** Every agent is responsible for the deployability and operational safety of their changes. Follow the "5-Phase Deployment Process" (Prepare, Backup, Deploy, Verify, Confirm/Rollback). Always verify environment variables and secrets security.
- **Regression First Mindset:** Code must be written to preserve existing behavior by default.
- **Test Ownership Rule:** The agent that changes code OWNS the tests for that code.
- **No Test, No Change:** High-risk code cannot be changed without tests.

### 🧪 Testing & Regression Governance (GLOBAL)

#### 1. Testing Discovery (MANDATORY)
Before coding, the agent MUST identify:
- Existing test types (unit / integration / e2e)
- Frameworks used
- Coverage gaps
- CI expectations (if inferable)
*(This info MUST be referenced when deciding test scope)*

#### 2. Minimum Testing Requirements
| Change Type | Mandatory Tests |
|-------------|-----------------|
| Utility / Helper | Unit |
| Business Logic | Unit + Integration |
| API Endpoint | Integration + Contract |
| DB Schema | Migration + Validation |
| UI Component | Component test |
| Critical Flow | E2E (Playwright if web) |

**If tests CANNOT be added:**
- Explain why
- Document residual risk
- Specify manual verification steps

#### 3. Regression Protection Rules
You MUST ensure:
- Existing APIs return same shape & status
- DB schema compatibility preserved
- UI flows remain functional
- Side effects unchanged

**❌ You MUST NOT:**
- Delete failing tests
- Weaken assertions
- Bypass coverage to “move fast”

### 📁 File Dependency Awareness

**Before modifying ANY file:**
1. Check `CODEBASE.md` → File Dependencies
2. Identify dependent files
3. Update ALL affected files together

### 🗺️ System Map Read

> 🔴 **MANDATORY:** Read `ARCHITECTURE.md` at session start to understand Agents, Skills, and Scripts.

**Path Awareness:**
- Agents: `.agent/` (Project)
- Skills: `.agent/skills/` (Project)
- Runtime Scripts: `.agent/skills/<skill>/scripts/`


### 🧠 Read → Understand → Apply

```
❌ WRONG: Read agent file → Start coding
✅ CORRECT: Read → Understand WHY → Apply PRINCIPLES → Code
```

**Before coding, answer:**
1. What is the GOAL of this agent/skill?
2. What PRINCIPLES must I apply?
3. How does this DIFFER from generic output?

---

## 🔁 TIER 0.5 — CHANGE SAFETY GATE (MANDATORY)

> This gate runs after Socratic Gate but before coding

### 🔍 Change Impact Matrix (Required for ALL non-trivial changes)

The agent MUST produce an internal impact analysis:

| Layer | Files | Risk | Reason |
|-------|-------|------|--------|
| Backend | services/*.ts | HIGH | Shared business logic |
| API | controllers/*.ts | MEDIUM | Contract stability |
| Frontend | components/*.tsx | LOW | Isolated UI |

**Rules:**
- **HIGH risk** → Tests REQUIRED
- **MEDIUM risk** → Tests STRONGLY EXPECTED
- **LOW risk** → At least smoke validation

> **If this matrix is skipped → STOP execution**

---

## TIER 1: CODE RULES (When Writing Code)

### 📱 Project Type Routing

| Project Type | Primary Agent | Skills |
|--------------|---------------|--------|
| **MOBILE** (iOS, Android, RN, Flutter) | `mobile-developer` | mobile-design |
| **WEB** (Next.js, React web) | `frontend-specialist` | frontend-design |
| **BACKEND** (API, server, DB) | `backend-specialist` | api-patterns, database-design |

> 🔴 **Mobile + frontend-specialist = WRONG.** Mobile = mobile-developer ONLY.

### 🛑 Socratic Gate

**For complex requests, STOP and ASK first:**

### 🛑 GLOBAL SOCRATIC GATE (TIER 0)

**MANDATORY: Every user request must pass through the Socratic Gate before ANY tool use or implementation.**

| Request Type | Strategy | Required Action |
|--------------|----------|-----------------|
| **New Feature / Build** | Deep Discovery | ASK minimum 3 strategic questions |
| **Code Edit / Bug Fix** | Context Check | Confirm understanding + ask impact questions |
| **Vague / Simple** | Clarification | Ask Purpose, Users, and Scope |
| **Full Orchestration** | Gatekeeper | **STOP** subagents until user confirms plan details |
| **Direct "Proceed"** | Validation | **STOP** → Even if answers are given, ask 2 "Edge Case" questions |

**Regression Question (ALWAYS ASK):**
“Which existing behavior must remain 100% unchanged?”
*(If the user cannot answer → default to full backward compatibility)*

**Protocol:** 
1. **Never Assume:** If even 1% is unclear, ASK.
2. **Handle Spec-heavy Requests:** When user gives a list (Answers 1, 2, 3...), do NOT skip the gate. Instead, ask about **Trade-offs** or **Edge Cases** (e.g., "LocalStorage confirmed, but should we handle data clearing or versioning?") before starting.
3. **Wait:** Do NOT invoke subagents or write code until the user clears the Gate.

### 🏁 Final Checklist Protocol

**Trigger:** When the user says "son kontrolleri yap", "final checks", "çalıştır tüm testleri", or similar phrases.

### 🧪 Mandatory Script Invocation Rules
| Scenario | Script |
|----------|--------|
| Logic change | `test_runner.py` |
| API change | `test_runner.py` + `schema_validator.py` |
| UI change | `ux_audit.py` + `playwright_runner.py` |
| Performance-sensitive change | `bundle_analyzer.py` |
| Pre-deploy | `verify_all.py` |

> ❌ **Skipping required scripts = Task NOT complete**

| Task Stage | Command | Purpose |
|------------|---------|---------|
| **Manual Audit** | `python scripts/checklist.py .` | Priority-based project audit |
| **Pre-Deploy** | `python scripts/checklist.py . --url <URL>` | Full Suite + Performance + E2E |

**Priority Execution Order:**
1. **Security** → 2. **Lint** → 3. **Schema** → 4. **Tests** → 5. **UX** → 6. **Seo** → 7. **Lighthouse/E2E**

### 🧾 NEW REQUIRED OUTPUT BLOCK (ALL COMPLEX TASKS)

Before declaring Done, the agent MUST output:

```markdown
### Regression Safety Summary
- Existing behavior preserved: YES / NO
- Tests added or updated: YES / NO
- Risk level: LOW / MEDIUM / HIGH
- Manual verification required: YES / NO
- Rollback ready: YES / NO
```
*(If HIGH risk, the agent MUST explicitly warn the user.)*

### 🎭 Gemini Mode Mapping

| Mode | Agent | Behavior |
|------|-------|----------|
| **plan** | `project-planner` | 4-phase methodology. NO CODE before Phase 4. |
| **ask** | - | Focus on understanding. Ask questions. |
| **edit** | `orchestrator` | Execute. Check `{task-slug}.md` first. |

**Plan Mode (4-Phase):**
1. ANALYSIS → Research, questions
2. PLANNING → `{task-slug}.md`, task breakdown
3. SOLUTIONING → Architecture, design (NO CODE!)
4. IMPLEMENTATION → Code + tests

> 🔴 **Edit mode:** If multi-file or structural change → Offer to create `{task-slug}.md`. For single-file fixes → Proceed directly.

---

## 📝 PROJECT PROTOCOL: NEWTASK-FIRST
> **Priority Rule:** The file `newtask.md` in the root directory is the Source of Truth.

1. **Discovery:** Before any implementation, READ `newtask.md` to find the existing structure and project state.
2. **Strategy:** Plan your implementation strategy first and write it into the "Implementation Plan" section of `newtask.md`.
3. **Execution:** Implement code ONLY after the plan is recorded.
4. **Synchronization:** After every change, UPDATE `newtask.md` with:
   - New Data Structures (DB schemas, JSON shapes).
   - Implementation details (Logic flow, new files).
   - Updated system state.

## 🔐 ARCHITECTURE.md AUTHORITY (FINAL OVERRIDE)

If any rule conflicts, the following priority applies:
1. `ARCHITECTURE.md`
2. `Maestro AI Development Orchestrator` (GEMINI.md)
3. Agent rules
4. Skill rules
5. Scripts

**If ARCHITECTURE.md is outdated:**
1. **STOP**
2. Propose update
3. WAIT for confirmation

