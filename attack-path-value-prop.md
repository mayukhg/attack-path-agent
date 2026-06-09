# Attack Path Agent ("Project Sentinel") — Full Summary

## Purpose & Vision

Project Sentinel is a **real-time, agentic security orchestration platform** that transforms traditional static, periodic vulnerability scanning into a continuous, event-driven system. It addresses three core problems:

1. **Vulnerability Blind Spots** — Weekly/monthly scans leave 5+ day exposure windows when configuration changes occur
2. **Alert Fatigue** — Flat CVSS-ranked CVE lists waste hundreds of engineering hours
3. **High MTTR** — Manual JIRA tickets and approval processes slow remediation to days/weeks

---

## Architecture Overview

The system has two runtime layers:

**Layer 1 — Next.js Frontend + Node.js API (port 3000)**
Real-time attack path visualization, event streaming, and the Agent Iris chat interface.

**Layer 2 — FastAPI Python Backend (port 8000)**
Active validation webhook server that receives empirical exploitation proof from an external validation engine and drives graph state changes.

---

## Core Components

### Backend Services (Node.js)

| Component | Role |
|---|---|
| **Event Bus** (`eventBus.js`) | Global Pub/Sub broker; validates JSON-LD events and maintains time-series audit store |
| **Attack Path Engine** (`attackPathEngine.js`) | BFS path discovery, PCS calculation, choke point identification, mitigation ranking |
| **Sidecar Simulator** (`sidecarSimulator.js`) | Triggers security scenarios (config drift, CVE injection) into the event bus |
| **SSE Stream** (`/api/sentinel/events`) | Server-Sent Events endpoint pushing real-time updates to browser |

### Active Validation Framework (Python/FastAPI)

| Component | Role |
|---|---|
| **`main.py`** | FastAPI server ("Sentinel Active Validation Webhook Server") |
| **`validation_client.py`** | HTTP client that delegates path validation to an external active testing engine |
| **`webhooks.py`** | Receives `PathValidationCallback` results and drives graph state transitions |
| **`graph_processor.py`** | Reads/writes `activeGraphState.json`; publishes telemetry to the Next.js event bus |
| **`schemas.py`** | Pydantic models defining the full validation contract |

### Frontend Components (React/Next.js)

| Component | Role |
|---|---|
| **Agent Iris Chat** | Conversational AI guiding operators through discovery, simulation, remediation, and validation |
| **React Flow Canvas** | Live graph with animated node/edge states; overlays active validation badges |
| **Timeline Audit Replay** | Scrub through historical event ledger for compliance verification |

---

## AI/Agent Swarm

| Agent | Role | Trigger | Output |
|---|---|---|---|
| **Sentinel Orchestrator (Agent Iris)** | Central chat + orchestration | User request | Path selections, scan triggers, interaction intents |
| **Telemetry Observer (Sidecar)** | Detects config drift / CVEs | System events | JSON-LD alerts to event bus |
| **Simulation Daemon** | Maps exploit propagation | Orchestrator trigger | MITRE technique chains, blast-radius enumeration |
| **Active Validation Client** | Delegates path to external testing engine | Critical path identified | `PathValidationRequest` with CVE targets + callback URL |
| **Webhook Receiver** | Receives empirical exploitation proof | Validation engine callback | Graph edge state transitions + telemetry events |
| **Remediation Engine** | Ranks mitigations by business impact | Critical path / validation result | Ranked mitigations + policy-as-code previews |
| **Reporting Agent** | Compliance summaries + what-if analysis | Mitigation completions | Markdown reports with validation evidence |

---

## Active Validation Flow (End-to-End)

```
1. Attack path identified with critical PCS score
        ↓
2. ActiveValidationClient POSTs PathValidationRequest
   → POST {external_endpoint}/v1/validations/submit
   → Payload: path_id, tenant_id, targets (node_id, ip, CVE, port), callback_url
        ↓
3. External validation engine executes active testing
   (e.g., TruConfirm or equivalent active scanning engine)
        ↓
4. Engine POSTs results to webhook
   → POST /webhooks/validation-callback
   → Payload: path_id, execution_duration_ms, per-node results
        ↓
5. GraphProcessor transitions edge states:
   EXPLOIT_VALIDATED  → PROVEN_ATTACK_VECTOR  (red, animated)
   EXPLOIT_MITIGATED  → BLOCKED_PATH_JUNCTION (green, dashed)
   INCONCLUSIVE       → UNVERIFIED            (unchanged)
        ↓
6. GraphProcessor writes activeGraphState.json
   + publishes JSON-LD telemetry to /api/sentinel/publish
        ↓
7. React Flow UI overlays validation badges in real time
   e.g., "Exploit Validated: Callback Confirmed"
```

### Validation Evidence Types

| Method | What It Captures |
|---|---|
| `PATTERN_BASED_OUTPUT` | Regex-captured command output (e.g., `uid=0(root)`) |
| `CRYPTOGRAPHIC_HASH_MATCHING` | Hash-based proof of code execution |
| `OUT_OF_BAND_CALLBACK` | OAST callback confirming blind vulnerability exploitation |

---

## Path Criticality Score (PCS)

```
PCS = (avgEdgeRisk × 7.3) + (crownJewelValue × 0.18) + (blastRadius × 0.23) + convergenceBonus
```

After active validation, PCS is recalculated with empirically confirmed exploitability — replacing theoretical CVSS estimates with proof-based risk scores.

---

## Three Interactive Scenarios

| Case | Trigger | Business Impact | Validation Layer |
|---|---|---|---|
| **Config Drift** | Dev opens unauthorized ingress port | PCS 0 → 9.2; new Shadow API path activates | Validates CVE on exposed port via pattern match |
| **AI Supply Chain** | Prompt injection targeting billing agent | Bridges to customer PII database | OAST callback confirms blind injection |
| **Prioritized Remediation** | Multiple competing CVEs | Choke point analysis; residual risk recomputed | Post-fix validation confirms `EXPLOIT_MITIGATED` on sealed edges |

---

## Full User Workflow

1. **Dashboard Load** — Four sidecar observers register ONLINE telemetry
2. **Trigger Scenario** — User activates case via Agent Iris chat
3. **Event Broadcast** — Simulator publishes JSON-LD event to Event Bus
4. **Path Recalculation** — Engine recomputes PCS; identifies compromised nodes
5. **Real-time Visualization** — React Flow updates node colors and animates attack edges (<1 second)
6. **Active Validation** — Agent delegates path to external validation engine with CVE targets
7. **Proof Receipt** — Webhook receives empirical results; graph edges transition to `PROVEN_ATTACK_VECTOR` or `BLOCKED_PATH_JUNCTION`
8. **Mitigation Recommendation** — Engine ranks alternatives by impact; shows policy-as-code previews (Terraform, Kubernetes NetworkPolicy, Istio, GitHub PRs)
9. **Deployment + Confirmation** — User deploys fix; sidecar publishes `mitigation_applied`; validation re-run confirms `EXPLOIT_MITIGATED`
10. **Timeline Audit** — User scrubs event ledger for compliance replay with full evidence chain

---

## Performance & Business Value

| Metric | Value |
|---|---|
| Detection latency | <1 second (config drift → visual alert via SSE) |
| Risk basis | Empirically proven exploitability, not theoretical CVSS |
| Remediation handoff | Auto-generated IaC policies eliminate manual JIRA friction |
| Compliance | Full time-series audit ledger with cryptographic/OAST proof evidence |
| Multi-tenancy | `tenant_id` scoped throughout validation contract |

---

## Tech Stack

- **Frontend:** Next.js App Router, React 19, Turbopack, React Flow, Server-Sent Events
- **Backend (JS):** Node.js, JSON-LD schema validation, in-memory event store
- **Backend (Python):** FastAPI, Pydantic v2, httpx async HTTP client
- **Validation Contract:** Pydantic schemas — `PathValidationRequest` / `PathValidationCallback` / `ProofEvidence`
- **State Bridge:** `activeGraphState.json` shared between FastAPI and Next.js runtimes
- **Styling:** Glassmorphism dark theme with animated threat indicators
