# Project "Sentinel": Agentic Attack Path Orchestration Console

Project Sentinel transitions the "Antigravity" security posture dashboard from a periodic, static scanner interface to a real-time, event-driven agentic orchestrator. By utilizing Kubernetes-style sidecar security observers and a streaming Next.js Event Bus, Sentinel monitors configuration drift, calculates attack propagation vectors, and highlights prioritized remediations in under 1 second.

---

## Technical Stack & Architecture

- **Core Framework**: Next.js App Router (React 19, Turbopack compiling).
- **Graph Visualizer**: React Flow (for real-time path traversals, asset states, and legend indicators).
- **Communication Layer**: Server-Sent Events (SSE) streaming (`text/event-stream`) for pushing updates without polling or reloading.
- **Payload Contract**: Validated JSON-LD schema representing workload contexts, threat headers, payload categories, and path metadata.

---

## Directory Structure

```text
attack-path-agent/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── sentinel/
│   │   │   │   ├── events/       # Server-Sent Events pipeline (ReadableStream)
│   │   │   │   ├── publish/      # JSON-LD event ingestion and validation router
│   │   │   │   └── store/        # Time-series audit store ledger database API
│   │   ├── globals.css           # Dashboard layout styling and glows
│   │   ├── page.js               # Reactive split-screen container & SSE listener
│   ├── components/
│   │   ├── AgentAttackPathAgentChat.js # Agent Iris welcome orchestrator
│   │   ├── SentinelConsole.js    # Visual graph & audit replay timeline
│   │   └── CustomNodes.js        # React Flow custom security node styling
│   ├── lib/
│   │   ├── eventBus.js           # Memory broker, store ledger & JSON-LD validation
│   │   ├── sidecarSimulator.js   # Background Kubernetes workload simulators
│   │   └── attackPathEngine.js   # Path criticality & mitigation ranking calculator
```

---

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Start the development server

```bash
npm run dev
```

### 3. Open the Dashboard Console

Access the interface in your browser:
- **Sentinel Console UI**: `http://localhost:3000`
- **SSE Stream Endpoint**: `http://localhost:3000/api/sentinel/events`
- **Publish Event Ingest**: `http://localhost:3000/api/sentinel/publish`
- **Time-series Audit Ledger**: `http://localhost:3000/api/sentinel/store`

---

## Interactive Validation Walkthrough

1. **Monitored Workloads Registry**: On opening the dashboard, four sidecar telemetry agents (`workload-dev-discovery`, `workload-finance-ai`, `workload-database-core`, and `workload-vpn`) connect and report `ONLINE` health telemetry on the dashboard.
2. **Case 1: Telemetry Config Drift**: 
   - Under Agent Iris, trigger Case 1.
   - The simulator publishes a `config_drift` event on the Event Bus.
   - The Path Engine recalculates risks, shifting the visual graph node `B` (Shadow API) and `A` to `compromised` (pulsing red) and animating the active attack edge, raising the PCS score to `9.2`.
   - Deploying the mitigation publishes `mitigation_applied`, restoring the sidecar to `SECURED` and securing the node visual state (green).
3. **Case 2: AI Posture Telemetry**:
   - Trigger Case 2 to simulate Prompt Injection on the AI Agent workload.
   - The visual nodes `W2` (Finance AI Agent) and `W3` (Customer Root Database) highlight compromise states and display native threat badges (`🌐 INTERNET EXPOSED`, `🔒 SENSITIVE CUSTOMER DATA`).
   - Merging the egress policy secures the AI sidecar and severs the prompt injection vector.
4. **Case 3: Hypothetical CVE Injection & Prioritized Remediation**:
   - Trigger Case 3 to simulate multiple competing vulnerabilities.
   - Click `Simulate CVE-2024-XXXX Reachability` to fire a simulated vulnerability on the VPN workload.
   - Inspect the prioritized remediations ranked by the engine. Deploy the highest-impact policy to sever the routes.
5. **Timeline Replay Audit**:
   - Pause the live stream using `Pause & Audit Replay`.
   - Use the slider control to rewind the environment's threat history step-by-step, watching the visual graph nodes and edge animations revert to their corresponding historical state.
