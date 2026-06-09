# Attack Path Agent (`codex-changes` Branch) — Full Summary

## What Makes This Branch Different

The `codex-changes` branch is a **fundamentally redesigned architecture** with two core innovations:

1. Attack path reasoning is moved into a **deterministic backend engine** (`attackPathEngine.js`) rather than frontend scripted logic.
2. A **TruConfirm active validation integration** replaces theoretical CVSS scores with empirical, real-world proof of exploitability — validated per-node on every simulated attack path.

It also introduces a **dual-mode UI** (Manual vs Agentic) and a **standalone Agent Iris** interface designed for executive and product demos.

---

## Architecture

**Full dashboard** — three-column layout:

| Left (350px) | Center (flex) | Right (350px) |
|---|---|---|
| Manual Dashboard **or** Agent Iris Chat | ReactFlow attack path graph | Live Metrics (PCS gauge, active exposures, timer) |

A **mode toggle** at the top switches between the two left-panel experiences, triggering a cinematic blackout animation on transition.

**Standalone Agent Iris** (`/iris`) — single centered chat column, no metrics or graph. Designed for focused demos and the TruConfirm validation flow.

---

## The Two Modes

**Manual Mode (the "before"):**
A deliberately friction-heavy legacy workflow — static CVE table, 3.5-second artificial scan delay, confirmation dialogs, no intelligent ranking. Used to show what SecOps looks like *without* the agent.

**Agentic Mode (the "after"):**
A conversational AI progression through three demo phases, backed by real graph computation and real-world exploit validation on every step.

---

## Three Demo Phases

| Phase | Scenario | Key Concept |
|---|---|---|
| **Phase 1** — Critical Path Discovery | Dev VM exposes Shadow API via BOLA exploit | Basic path selection, simulation, and mitigation |
| **Phase 2** — AI Agent Posture | Finance Auto-Billing AI exposed to internet with DB access | AI supply chain risk, prompt injection as traversal vector |
| **Phase 3** — Advanced Command Center | Multi-entry DMZ + phishing + VPN paths converging on Active Directory | Full end-to-end: ranked paths, blast radius, choke points, TruConfirm validation, policy-as-code, executive report |

---

## Five Agent Personas

Each step of the agentic workflow is presented as a handoff between specialists:

| Agent | Color | Responsibility |
|---|---|---|
| **Mapping Agent** | Blue | Attack path discovery & graph topology |
| **Simulation Agent** | Purple | Exploit propagation & blast-radius enumeration |
| **Agent Iris · TruConfirm** | Blue | Active validation delegation & proof receipt |
| **Remediation Agent** | Orange | Mitigation ranking & trade-off analysis |
| **Reporting Agent** | Teal | Executive report & policy-as-code generation |
| **Analytics Agent** | Indigo | What-if analysis & residual risk calculation |

---

## TruConfirm Active Validation Integration

After Phase 3 simulation completes, the agent automatically delegates each node on the active path to **TruConfirm** for real-world exploit testing. This replaces theoretical CVSS risk scores with empirical proof.

### End-to-End Flow

```
Phase 3 Simulation completes
        ↓
AgentDaeChat builds PathValidationRequest
  (node_id, ip_address, cve_id, ingress_port per node)
        ↓
POST /api/validation-delegate
        ↓
ActiveValidationClient → TruConfirm engine
  POST {VALIDATION_ENGINE_URL}/v1/validations/submit
        ↓
TruConfirm tests each CVE against live target
        ↓
POST /api/validation-callback  (async webhook)
        ↓
validationStore broadcasts result via SSE
        ↓
GET /api/validation-events  (AgentDaeChat subscribes)
        ↓
Chat renders validation_results message with proof evidence
        ↓
Mitigation deployed → re-validation confirms EXPLOIT_MITIGATED
```

### Validation Phases in Chat

| Phase | What the user sees |
|---|---|
| `phase3_validating` | `ValidationProgressCard` — live elapsed timer, per-node CVE/IP rows with animated testing dots |
| `phase3_validation_complete` | `validation_results` message — per-node status badge + proof evidence |
| `phase3_revalidating` | Same card, re-runs after mitigation to confirm blocking |
| Re-validation complete | `EXPLOIT_MITIGATED` per node with plain-English explanation |

### Three Validation Outcomes

| Status | What it means | Evidence shown |
|---|---|---|
| `EXPLOIT_VALIDATED` | Real-world exploit confirmed | Pattern-based CLI output, cryptographic hash, or OAST callback badge |
| `EXPLOIT_MITIGATED` | Mitigation confirmed blocking exploitation | Plain-English explanation per node |
| `INCONCLUSIVE` | No definitive proof either way | Conservative posture note; retry or proceed options offered |

### Evidence Types

| Method | Example |
|---|---|
| **Pattern-Based Output** | `uid=0(root) gid=0(root)` — regex-captured CLI proof of RCE |
| **Cryptographic Hash** | `sha256:a1b2c3...` — hash-based code execution proof |
| **Out-of-Band Callback (OAST)** | `📡 Blind callback confirmed · dns.oast.live/abc123` — for blind/SSRF-style vulnerabilities |

### New API Routes

| Route | Purpose |
|---|---|
| `POST /api/validation-delegate` | Accepts `PathValidationRequest`, calls TruConfirm (or fires realistic mock in demo mode) |
| `POST /api/validation-callback` | Receives `PathValidationCallback` webhook, notifies SSE subscribers |
| `GET /api/validation-events?path_id=X` | SSE stream — pushes result to chat when callback arrives |

### Node Metadata (Extended)

All nodes in `advancedScenario` now carry `ipAddress`, `primaryCVE`, and `ingressPort` — the fields TruConfirm requires to run active tests:

```js
{ id: 'B', data: { ..., ipAddress: '10.1.2.3', primaryCVE: 'CVE-2023-21716', ingressPort: 443 } }
```

### Demo Mode

When `VALIDATION_ENGINE_URL` is not configured, the delegate route automatically simulates TruConfirm responses after a realistic delay (~4.5s for validation, ~3s for re-validation), making the full flow demonstrable without a live TruConfirm engine.

---

## Backend Attack Path Engine

The engine (`src/lib/attackPathEngine.js`) provides deterministic, auditable graph reasoning:

**Path Criticality Score (PCS):**
```
PCS = (avgEdgeRisk × 7.3) + (crownJewelValue × 0.18) + (blastRadius × 0.23) + convergenceBonus
EdgeRisk = confidence(28%) + exploitability(28%) + privilegeGain(22%) + controlWeakness(22%)
```

After TruConfirm validation, PCS is **proof-backed** — grounded in empirical evidence rather than static CVSS estimates.

**Key engine functions:**

| Function | What it does |
|---|---|
| `discoverAttackPaths()` | BFS traversal, all paths from entry nodes to crown jewels (max 8 hops) |
| `findChokePoints()` | Identifies nodes shared across multiple paths — highest-leverage mitigation targets |
| `simulatePath()` | Returns MITRE technique chain, evidence, blast-radius assets, PCS breakdown + validation targets |
| `rankMitigations()` | Scores options: `(scoreReduction×2) + (pathsClosed×1.4) + effectiveness` |
| `applyMitigation()` | Blocks edges, recomputes residual paths and PCS |
| `generatePolicyPreview()` | Produces Kubernetes NetworkPolicy, Terraform WAF rules, or GitHub PR payload |
| `createExecutiveReport()` | Business impact, approval gates, rollback plan for stakeholder handoff |
| `answerWhatIf()` | Graph-backed natural language responses to hypothetical scenarios |

---

## Data Layer — Attack Scenarios

Four graph datasets in `attackScenarios.js`, each with full MITRE annotations and validation metadata:

- **Base graph** (Phase 1): 6 nodes, CVE chain — Discovery VM → BOLA Exploit → Web Shell → NTLM Extract → Active Directory
- **AI graph** (Phase 2): 3 nodes — Finance User → AI Billing Agent → Customer Database
- **Advanced graph** (Phase 3): 12 nodes including 2 hidden blast-radius nodes (HR Database, Finance API); all nodes carry `ipAddress`, `primaryCVE`, `ingressPort`
- **`advancedScenario`**: Structured JSON with 3 pre-built mitigations (Emergency WAF, CVE Patch, Network Segmentation + MFA), each carrying `blockedEdges`, `deployTime`, `downtime`, `approvalGate`, `policyType`, `residualRisk`

---

## Full API Surface

| Route | Method | Purpose |
|---|---|---|
| `/api/attack-path` | GET | Scenario graph + initial ranked path analysis |
| `/api/attack-path` | POST `simulate` | Path, MITRE chain, blast radius, PCS breakdown, **validationTargets** |
| `/api/attack-path` | POST `mitigate` | Residual paths/PCS after mitigation |
| `/api/attack-path` | POST `what-if` | Graph-backed answer + affected node IDs |
| `/api/attack-path` | POST `policy` | Policy-as-code (YAML / Terraform / PR markdown) |
| `/api/attack-path` | POST `report` | Executive package: headline, business impact, technical summary, rollback |
| `/api/validation-delegate` | POST | Delegates path to TruConfirm for active testing |
| `/api/validation-callback` | POST | Receives TruConfirm webhook results |
| `/api/validation-events` | GET (SSE) | Streams validation result to Agent Iris chat |

---

## Components

| Component | Role |
|---|---|
| `page.js` | Root container — manages mode toggle, node/edge state, cinematic transitions, shared metrics state |
| `AgentDaeChat.js` | Multi-phase conversational AI — state machine, API calls, TruConfirm SSE subscription, audit trail |
| `src/app/iris/page.js` | Standalone Agent Iris — centered chat, no metrics, for focused demos |
| `ManualDashboard.js` | Legacy contrast UI — static table, artificial delays, confirmation dialogs |
| `CustomNodes.js` | ReactFlow node renderers — BaseNode, CrownJewelNode (gold), AiAgentNode (purple + threat tags) |
| `LiveMetrics.js` | Right panel — PCS semi-arc gauge, active exposures counter, time-to-remediate stopwatch |
| `attackPathEngine.js` | Core backend reasoning — path discovery, PCS scoring, choke points, mitigations, policy gen, reports |
| `attackScenarios.js` | Graph definitions — nodes (with ip/CVE/port), edges, MITRE annotations, mitigation metadata |
| `validationClient.js` | JS port of `ActiveValidationClient` — delegates to TruConfirm HTTP endpoint |
| `validationStore.js` | In-memory pub/sub — callback route writes, SSE route reads |

---

## Key Capabilities

1. **TruConfirm active validation** — real-world exploit proof replaces theoretical CVSS; three evidence methods (pattern, hash, OAST)
2. **Proof-backed PCS** — after validation, risk scores are grounded in empirical evidence
3. **Re-validation after mitigation** — automatically confirms `EXPLOIT_MITIGATED` per node post-fix
4. **Demo mode** — works fully without a live TruConfirm engine; realistic mock delays and evidence
5. **Explainable PCS** — score decomposed into 5 weighted factors; no black-box scoring
6. **Choke-point detection** — automatically identifies highest-leverage remediation nodes
7. **Hidden blast-radius nodes** — only revealed post-simulation, avoiding visual clutter during discovery
8. **Phase 3 audit trail** — collapsible compliance log with timestamps for every backend-driven decision
9. **Policy-as-code generation** — directly from graph reasoning, not templated strings
10. **Manual vs Agentic contrast** — shows the business case side-by-side in a single demo flow
11. **Cinematic mode transition** — blackout overlay when switching modes for demo polish
12. **Multi-agent narrative** — Mapping → Simulation → TruConfirm → Remediation → Reporting handoffs simulate real SecOps coordination
13. **Natural language what-if** — graph-backed answers to hypothetical removal/hardening scenarios
14. **Executive report package** — headline, business impact, technical summary, approval gates, rollback plan
15. **Standalone Agent Iris** (`/iris`) — clean single-column chat for focused product demos
