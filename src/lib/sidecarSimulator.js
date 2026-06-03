import { EventBus } from './eventBus';

export const triggerConfigDrift = () => {
  return EventBus.publish({
    header: {
      agent_id: 'sidecar-observer-workload-dev-discovery',
      event_type: 'config_drift'
    },
    context: {
      resource_id: 'workload-dev-discovery',
      environment: 'production-k8s-cluster'
    },
    payload: {
      category: 'Configuration Drift',
      finding: 'Unauthorized network configuration drift detected. Shadow API ingress port 8080 exposed to external traffic.',
      severity: 'CRITICAL',
      evidence: {
        interface: 'eth0',
        exposedPort: 8080,
        protocol: 'TCP',
        processOwner: 'root',
        binaryPath: '/usr/local/bin/shadow-service'
      }
    },
    path_metadata: {
      is_critical_path: true,
      exploitability_score: 9.2
    }
  });
};

export const triggerCveInjection = () => {
  return EventBus.publish({
    header: {
      agent_id: 'sentinel-simulator-cve',
      event_type: 'simulation_injected'
    },
    context: {
      resource_id: 'workload-vpn',
      environment: 'production-k8s-cluster'
    },
    payload: {
      category: 'Impact Simulation',
      finding: 'Simulating hypothetical exploitability of external VPN gateway vulnerability (CVE-2024-XXXX) reaching Active Directory Core.',
      severity: 'HIGH',
      evidence: {
        targetVulnerability: 'CVE-2024-XXXX',
        simulationModel: 'Monte-Carlo Reachability Model',
        identityBinding: 'vpn-read-only-sa'
      }
    },
    path_metadata: {
      is_critical_path: true,
      exploitability_score: 8.5
    }
  });
};

export const triggerMultipleVulns = () => {
  const events = [
    {
      workload: 'workload-dev-discovery',
      finding: 'Shadow API CVE-2023-50164: File upload vulnerability leads to remote execution on exposed endpoint.',
      severity: 'CRITICAL',
      score: 9.6,
      crit: true
    },
    {
      workload: 'workload-vpn',
      finding: 'VPN Gateway CVE-2023-38646: Pre-auth command injection vulnerability enables tunnel privilege escalation.',
      severity: 'HIGH',
      score: 8.1,
      crit: true
    },
    {
      workload: 'workload-finance-ai',
      finding: 'Finance Auto-Billing Agent: Insecure Prompt Egress vulnerability allows customer data exfiltration.',
      severity: 'HIGH',
      score: 10.0,
      crit: true
    }
  ];

  return events.map(e => EventBus.publish({
    header: {
      agent_id: `sidecar-observer-${e.workload}`,
      event_type: 'vulnerability_discovery'
    },
    context: {
      resource_id: e.workload,
      environment: 'production-k8s-cluster'
    },
    payload: {
      category: 'Vulnerability Analysis',
      finding: e.finding,
      severity: e.severity,
      evidence: {
        scanType: 'Dynamic Container Security Telemetry',
        exploitVector: 'Network boundary',
        cveRank: e.score
      }
    },
    path_metadata: {
      is_critical_path: e.crit,
      exploitability_score: e.score
    }
  }));
};

export const triggerMitigationTelemetry = (workloadId, mitigationLabel, scoreReduction) => {
  return EventBus.publish({
    header: {
      agent_id: `sidecar-observer-${workloadId}`,
      event_type: 'mitigation_applied'
    },
    context: {
      resource_id: workloadId,
      environment: 'production-k8s-cluster'
    },
    payload: {
      category: 'Autonomous Remediation',
      finding: `Enforced policy mitigation: ${mitigationLabel}. Security posture hardened successfully.`,
      severity: 'INFO',
      evidence: {
        appliedMitigation: mitigationLabel,
        remediationStatus: 'SUCCESS',
        scoreDelta: `-${scoreReduction}`
      }
    },
    path_metadata: {
      is_critical_path: false,
      exploitability_score: 0.0
    }
  });
};
