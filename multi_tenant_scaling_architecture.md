# Multi-Tenant Scaling Architecture: attack-path-agent

This document outlines the architectural recommendations to scale the **Project Sentinel** attack path validation platform from a single-tenant local mockup to a enterprise-grade, multi-tenant Software-as-a-Service (SaaS) platform operating across thousands of customer environments.

---

## 1. High-Level Multi-Tenant Architecture

To scale, the platform must decouple **Telemetry Ingestion**, **Risk Computation**, and **Visual Presentation** into independent tiers:

```mermaid
graph TD
    subgraph Customer Environments
        SubA[Customer A EKS Cluster] -->|mTLS Ingest| Gateway
        SubB[Customer B GKE Cluster] -->|mTLS Ingest| Gateway
    end

    subgraph SaaS Control Plane (Ingestion & Compute)
        Gateway[API Gateway / NLB] --> IngestBus[Apache Kafka / AWS Kinesis]
        IngestBus --> Consumers[Ingestion Worker Microservices]
        Consumers --> DBTime[TimescaleDB Event Log]
        Consumers --> DBGraph[(Neptune / Neo4j Graph DB)]
        
        DBGraph --> ComputePool[Lambda / Worker Risk Engine]
        ComputePool --> RealtimeGW[AWS API Gateway WebSockets]
    end

    subgraph SaaS Presentation Tier
        RealtimeGW --> DashboardA[Customer A Dashboard]
        RealtimeGW --> DashboardB[Customer B Dashboard]
    end

    style SubA fill:#1e293b,stroke:#3b82f6,stroke-width:2px
    style SubB fill:#1e293b,stroke:#10b981,stroke-width:2px
    style IngestBus fill:#0f172a,stroke:#8b5cf6,stroke-width:2px
    style DBGraph fill:#0f172a,stroke:#fb923c,stroke-width:2px
```

---

## 2. Decoupled Architectural Components

### A. Secure Distributed Telemetry Ingestion
Instead of local in-memory event buses, sidecar telemetry agents must push alerts to a central SaaS ingestion endpoint.

- **Zero-Trust Connection**: Implement Mutual TLS (mTLS) where each customer sidecar is provisioned with a cryptographic identity certificate via an automated PKI (such as HashiCorp Vault or cert-manager).
- **Ingestion Queue**: Telemetry events land on a distributed partition broker (e.g., **Apache Kafka**, **AWS Kinesis**, or **GCP Pub/Sub**). 
- **Partitioning Strategy**: Partition the stream by `tenant_id` to guarantee in-order processing of configuration logs for any specific customer.

> [!IMPORTANT]  
> **Rate Limiting & Shielding**: Put an API Gateway (like Kong or AWS API Gateway) in front of the ingestion workers to enforce tenant-level rate limits (e.g. max 500 alerts/sec) and prevent a noisy tenant from starving resource pipelines.

---

### B. Scalable Data Tier (Graph & Logs Partitioning)
Attack path analysis is fundamentally a graph traversal problem. Standard relational databases become slow as node chains grow.

1. **Topology Storage (Graph Database)**:
   - Use a managed graph database like **Amazon Neptune** or **Neo4j Aura Enterprise**.
   - **Multi-Tenant Design**: Store graphs with strict label separation using a composite key: `(tenant_id, node_id)`. Ensure all Cypher/Gremlin queries append the `tenant_id` filter to prevent cross-tenant queries.
2. **Audit Ledger (Time-Series Database)**:
   - Move from JSON stores to a time-series optimized store like **TimescaleDB (PostgreSQL extension)** or **AWS DynamoDB**.
   - Use **Row-Level Security (RLS)** in PostgreSQL to isolate tenant tables at the database layer.

---

### C. Asynchronous Risk Engine (Calculations off Next.js)
Currently, risk scores are computed directly in Next.js backend API routes. This will lock resources at scale.

- **Serverless Worker Pools**: Trigger an asynchronous serverless function (e.g. **AWS Lambda**, **GCP Cloud Run**) whenever a `config_drift` or `vulnerability_discovery` event is committed to the database.
- **Micro-calc Engine**: The Lambda queries the tenant's current Graph topology, recalculates active paths using shortest-path search algorithms, calculates the new PCS (Posture Criticality Score), and writes the output back to the database.
- **Broadcast Trigger**: Upon writing to the database, a Pub/Sub trigger notifies the websocket gateway to push the new graph payload to active dashboard sessions.

---

### D. Zero-Trust Pull-Based Remediations
In a multi-tenant environment, the central control plane **must not** possess SSH keys or admin API keys to the customer's cloud accounts (AWS/GCP/Kubernetes).

- **Pull-Based Operator**: Deploy a local controller (similar to **ArgoCD** or a **Kubernetes Operator**) inside the customer's VPC.
- ** rem Queue**: When the customer clicks "Remediate" in the dashboard, the SaaS control plane publishes a signed Policy payload (e.g., an Istio AuthorizationPolicy or WAF Rule definition) to a secure, outgoing queue.
- **Local Application**: The customer's local Operator polls this queue, verifies the payload signature, and applies the policy locally. The SaaS control plane remains secure and has no direct incoming network access into customer workloads.

---

## 3. Technology Stack Recommendation

| Requirement | Local Mockup Stack | Scaled Enterprise Stack |
| :--- | :--- | :--- |
| **Streaming Queue** | In-memory EventEmitter (`eventBus.js`) | Apache Kafka / Confluent SaaS |
| **Graph Calculations** | Local calculation (`attackPathEngine.js`) | AWS Lambda / Go-based microservices |
| **Topology Data Store**| In-memory JavaScript arrays | Neo4j Aura / Amazon Neptune |
| **Audit Logs** | In-memory Javascript array | TimescaleDB with Row-Level Security |
| **Real-time Push** | Server-Sent Events (SSE) | AWS API Gateway WebSockets + Redis Pub/Sub |
| **Remediation Execution**| Direct mock REST endpoint calls | Zero-trust Kubernetes Operator (pull-based) |

---

## 4. Key Security & Compliance Considerations

> [!CAUTION]  
> **Data Residency (GDPR/SOC2)**: Some enterprise customers require their threat data and audit ledgers to remain within their geographic boundaries (e.g. EU-only). Build the SaaS control plane to support Regional Deployments (US, EU, APAC regions) where the data storage tiers run in separate cloud regions, while using a unified container registry for deployment.
