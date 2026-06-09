# Attack Path Agent (`codex-changes` Branch) — Full Summary

## What Makes This Branch Different

The `codex-changes` branch is a **fundamentally redesigned architecture**. The core shift: attack path reasoning is moved into a **deterministic backend engine** (`attackPathEngine.js`) rather than being driven by frontend scripted logic. It also introduces a **dual-mode UI** — Manual vs Agentic — designed explicitly as a before/after contrast for executive demos.

---

## Architecture

Three-column layout:

| Left (350px) | Center (flex) | Right (350px) |
|---|---|---|
| Manual Dashboard **or** Agent Iris Chat | ReactFlow attack path graph | Live Metrics (PCS gauge, active exposures, timer) |

A **mode toggle** at the top switches between the two left-panel experiences, triggering a cinematic blackout animation on transition.

---

## The Two Modes

**Manual Mode (the "before"):**
A deliberately friction-heavy legacy workflow — static CVE table, 3.5-second artificial scan delay, confirmation dialogs, no intelligent ranking. Used to show what SecOps looks like *without* the agent.

**Agentic Mode (the "after"):**
A conversational AI progression through three demo phases, backed by real graph computation on every step.

---

## Three Demo Phases

| Phase | Scenario | Key Concept |
|---|---|---|
| **Phase 1** — Critical Path Discovery | Dev VM exposes Shadow API via BOLA exploit | Basic path selection, simulation, and mitigation |
| **Phase 2** — AI Agent Posture | Finance Auto-Billing AI exposed to internet with DB access | AI supply chain risk, prompt injection as traversal vector |
| **Phase 3** — Advanced Command Center | Multi-entry DMZ + phishing + VPN paths converging on Active Directory | Full end-to-end: ranked paths, blast radius, choke points, policy-as-code, executive report |

---

## Five Agent Personas

Each step of the agentic workflow is presented as a handoff between specialists:

| Agent | Color | Responsibility |
|---|---|---|
| **Mapping Agent** | Blue | Attack path discovery & graph topology |
| **Simulation Agent** | Purple | Exploit propagation & blast-radius enumeration |
| **Remediation Agent** | Orange | Mitigation ranking & trade-off analysis |
| **Reporting Agent** | Teal | Executive report & policy-as-code generation |
| **Analytics Agent** | Indigo | What-if analysis & residual risk calculation |

---

## Backend Attack Path Engine

The engine (`src/lib/attackPathEngine.js`) is the core innovation on this branch. All reasoning is **deterministic and auditable**:

**Path Criticality Score (PCS):**
```
PCS = (avgEdgeRisk × 7.3) + (crownJewelValue × 0.18) + (blastRadius × 0.23) + convergenceBonus
EdgeRisk = confidence(28%) + exploitability(28%) + privilegeGain(22%) + controlWeakness(22%)
```

**Key engine functions:**

| Function | What it does |
|---|---|
| `discoverAttackPaths()` | BFS traversal, all paths from entry nodes to crown jewels (max 8 hops) |
| `findChokePoints()` | Identifies nodes shared across multiple paths — highest-leverage mitigation targets |
| `simulatePath()` | Returns MITRE technique chain, evidence, blast-radius assets, explainable PCS breakdown |
| `rankMitigations()` | Scores options: `(scoreReduction×2) + (pathsClosed×1.4) + effectiveness` |
| `applyMitigation()` | Blocks edges, recomputes residual paths and PCS |
| `generatePolicyPreview()` | Produces Kubernetes NetworkPolicy, Terraform WAF rules, or GitHub PR payload |
| `createExecutiveReport()` | Business impact, approval gates, rollback plan for stakeholder handoff |
| `answerWhatIf()` | Graph-backed natural language responses to hypothetical scenarios |

---

## Data Layer — Attack Scenarios

Four graph datasets in `attackScenarios.js`, each with full MITRE annotations:

- **Base graph** (Phase 1): 6 nodes, CVE chain — Discovery VM → BOLA Exploit → Web Shell → NTLM Extract → Active Directory
- **AI graph** (Phase 2): 3 nodes — Finance User → AI Billing Agent → Customer Database
- **Advanced graph** (Phase 3): 10 nodes including 2 hidden blast-radius nodes (HR Database, Finance API) revealed only after simulation
- **`advancedScenario`**: Structured JSON with 3 pre-built mitigations (Emergency WAF, CVE Patch, Network Segmentation + MFA), each carrying `blockedEdges`, `deployTime`, `downtime`, `approvalGate`, `policyType`, `residualRisk`

---

## API Surface

Single route `/api/attack-path` handles all backend requests by `intent`:

| Intent | What it returns |
|---|---|
| `GET` | Scenario graph + initial ranked path analysis |
| `simulate` | Selected path, MITRE chain, blast-radius assets, PCS breakdown |
| `mitigate` | Residual paths/PCS after mitigation applied |
| `what-if` | Graph-backed answer + affected node IDs |
| `policy` | Rendered policy-as-code (YAML / Terraform / PR markdown) |
| `report` | Executive package: headline, business impact, technical summary, rollback |

---

## Components

| Component | Role |
|---|---|
| `page.js` | Root container — manages mode toggle, node/edge state, cinematic transitions, shared metrics state |
| `AgentDaeChat.js` | Multi-phase conversational AI — state machine, backend API calls, typed message rendering, audit trail |
| `ManualDashboard.js` | Legacy contrast UI — static table, artificial delays, confirmation dialogs |
| `CustomNodes.js` | ReactFlow node renderers — BaseNode, CrownJewelNode (gold), AiAgentNode (purple + threat tags) |
| `LiveMetrics.js` | Right panel — PCS semi-arc gauge, active exposures counter, time-to-remediate stopwatch |
| `attackPathEngine.js` | Core backend reasoning — path discovery, PCS scoring, choke points, mitigations, policy gen, reports |
| `attackScenarios.js` | Static graph definitions — nodes, edges, MITRE technique annotations, mitigation metadata |

---

## Key Capabilities Unique to This Branch

1. **Explainable PCS** — score decomposed into 5 weighted factors shown to the user; no black-box scoring
2. **Choke-point detection** — automatically identifies highest-leverage remediation nodes
3. **Hidden blast-radius nodes** — only revealed post-simulation, avoiding visual clutter during discovery
4. **Phase 3 audit trail** — collapsible compliance log recording every backend-driven decision with timestamps
5. **Policy-as-code generation** — directly from graph reasoning, not templated strings
6. **Manual vs Agentic contrast** — shows the business case side-by-side in a single demo flow
7. **Cinematic mode transition** — blackout overlay when switching modes for demo polish
8. **Multi-agent narrative** — Mapping → Simulation → Remediation → Reporting → Analytics handoffs simulate real SecOps team coordination
9. **Natural language what-if** — graph-backed answers to hypothetical removal/hardening scenarios
10. **Executive report package** — headline, business impact, technical summary, approval gates, rollback plan ready for stakeholder handoff
