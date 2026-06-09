# TruConfirm Integration Plan — codex-changes Branch

## Scope

**Standalone Agent Iris only** (`/iris` route). No graph panel, no live metrics sidebar. All TruConfirm validation states are rendered entirely as chat messages within the Agent Iris conversation.

## Overview

Port the Active Validation Framework from `master` into the `codex-changes` agentic chat flow. TruConfirm validation slots in after the Phase 3 simulation step — instead of mock results, the agent delegates real CVE validation to an external engine and renders empirical proof as chat messages in the standalone Agent Iris interface.

---

## Architecture

```
AgentDaeChat (Phase 3) — standalone /iris route
      │
      │  POST /api/validation-delegate
      ▼
ActiveValidationClient (JS port of Python client)
      │  POST {VALIDATION_ENGINE_URL}/v1/validations/submit
      ▼
TruConfirm Validation Engine  (external)
      │  POST /api/validation-callback  (async webhook)
      ▼
validation-callback route.js
      │  writes activeGraphState.json + publishes SSE
      ▼
/api/validation-events (SSE stream)
      │
      ▼
AgentDaeChat useEffect subscriber
      │  updates chat phase + pushes validation message
      ▼
Chat renders validation_in_progress / validation_results bubble
      (no graph overlay — standalone chat only)
```

---

## Changes Required

### 1. Data Model — extend node metadata

**File:** `src/data/attackScenarios.js`

Add `ipAddress`, `primaryCVE`, `ingressPort` to every node in `advancedScenario.nodes`:

```js
// Example: node B (Shadow API)
{ id: 'B', data: { ..., ipAddress: '10.1.2.3', primaryCVE: 'CVE-2023-50164', ingressPort: 443 } }
```

Nodes to update: A, B, C, D, F, G, H, I, J, K (10 nodes)

---

### 2. New API Routes (3 files)

#### 2a. `src/app/api/validation-delegate/route.js`
- Accepts `POST` with `PathValidationRequest` body
- Instantiates `ActiveValidationClient` using `VALIDATION_ENGINE_URL` + `VALIDATION_ENGINE_TOKEN` env vars
- POSTs to `{engine}/v1/validations/submit`
- Returns `{ status: 'delegated', path_id, pending: true }` on 202

#### 2b. `src/app/api/validation-callback/route.js`
- Accepts `POST` with `PathValidationCallback` body
- Iterates `results[]`, writes per-node state to `src/data/activeGraphState.json`
  - `EXPLOIT_VALIDATED` → `{ state: 'PROVEN_ATTACK_VECTOR', evidence: {...} }`
  - `EXPLOIT_MITIGATED` → `{ state: 'BLOCKED_PATH_JUNCTION' }`
  - `INCONCLUSIVE`      → `{ state: 'UNVERIFIED' }`
- Publishes SSE event to in-memory broadcast channel
- Returns `{ status: 'success', processed_nodes: N }`

#### 2c. `src/app/api/validation-events/route.js`
- SSE endpoint: `GET /api/validation-events?path_id=XXX`
- Subscribes to broadcast channel
- Streams validation result events to AgentDaeChat
- Closes stream when final result received

---

### 3. New Library — `src/lib/validationClient.js`

JavaScript port of `validation_client.py`:

```js
export class ActiveValidationClient {
  constructor(endpointUrl, authToken) { ... }
  async delegatePathValidation(request) { ... }  // → bool
}
```

---

### 4. AgentDaeChat Changes

**New state variables:**
```js
const [validationStatus, setValidationStatus]   = useState('idle');
const [validationTargets, setValidationTargets] = useState([]);
const [validationResults, setValidationResults] = useState(null);
const [validationElapsed, setValidationElapsed] = useState(0);
```

**New chat phases:**
- `phase3_validating` — after delegation, awaiting callback
- `phase3_validation_complete` — results received, rendering proof

**Modified function: `handlePhase3Simulate()` (lines 309-340)**
After existing simulate call completes, build `PathValidationRequest` from `selectedPath.nodeIds` and call `/api/validation-delegate`. Push `validation_in_progress` message, transition phase to `phase3_validating`.

**New useEffect: SSE subscription**
When `chatPhase === 'phase3_validating'`, open `EventSource('/api/validation-events?path_id=...')`. On message, call `setValidationResults`, transition to `phase3_validation_complete`, push `validation_results` message.

**New message types in `renderMessageContent()`:**

| Type | Description |
|---|---|
| `validation_in_progress` | Live elapsed timer, spinner, per-node CVE/IP rows with animated testing dots, footer status |
| `validation_results` | Per-node proof cards: status badge (EXPLOIT_VALIDATED / EXPLOIT_MITIGATED / INCONCLUSIVE), proof method label, extracted output / hash / OAST badge, inconclusive note |

No graph overlay or page.js changes required — all output is chat-only.

---

### 5. Environment Variables

Add to `.env.local`:
```
VALIDATION_ENGINE_URL=http://localhost:8000
VALIDATION_ENGINE_TOKEN=your-token-here
```

---

## Phased Delivery

| Phase | Work | Effort |
|---|---|---|
| **P1 — Data** | Extend 10 nodes in `attackScenarios.js` with `ipAddress`, `primaryCVE`, `ingressPort` | ~30 min |
| **P2 — Backend** | 3 new API routes (`validation-delegate`, `validation-callback`, `validation-events`) + `validationClient.js` | ~2 hrs |
| **P3 — Chat UI** | New state vars, 2 new chat phases, 2 new message types in `AgentDaeChat.js` (`src/app/iris/page.js` target) | ~2 hrs |
| **P4 — Polish** | Elapsed timer, retry/error states, re-validation post-mitigation, inconclusive conservative posture | ~1 hr |

**Total estimated: ~5.5 hours** *(P4/Graph step removed — standalone chat only)*

---

## Key Decisions to Confirm

1. **Callback URL**: For local dev, TruConfirm cannot reach `localhost`. Use polling (`/api/validation-status/{path_id}`) instead of webhooks, OR expose via ngrok. **Recommendation: polling for dev, webhooks for prod.**

2. **Blast radius validation**: Validate primary path only, mark blast-radius nodes as speculative — OR submit separate validation requests for blast-radius paths. **Recommendation: primary path only in v1.**

3. **Re-validation after mitigation**: After `handlePhase3Mitigate()` completes, automatically re-delegate the same targets to confirm `EXPLOIT_MITIGATED`. **Recommendation: include in P5 polish.**

4. **Python vs JS validation client**: Keep the Python FastAPI server from `master` running on port 8000, or port `ActiveValidationClient` fully to JS. **Recommendation: port to JS to keep single runtime.**
