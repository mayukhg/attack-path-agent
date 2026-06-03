export const edgeStyling = { stroke: 'rgba(255,255,255,0.2)', strokeWidth: 1 };

export const baseNodes = [
  { id: 'A', position: { x: 50, y: 50 }, type: 'base', data: { label: 'Discovery Asset', assetType: 'DEV ENVIRONMENT', icon: '💻', status: 'normal', businessValue: 3, owner: 'DevOps' } },
  { id: 'B', position: { x: 50, y: 150 }, type: 'base', data: { label: 'BOLA Exploit', assetType: 'SHADOW API', icon: '🔗', status: 'normal', businessValue: 8, owner: 'AppSec' } },
  { id: 'C', position: { x: 50, y: 250 }, type: 'base', data: { label: 'Web Shell Exec', assetType: 'VM INSTANCE', icon: '🖥️', status: 'normal', businessValue: 6, owner: 'Platform' } },
  { id: 'D', position: { x: -100, y: 350 }, type: 'base', data: { label: 'Escape to Host', assetType: 'CONTAINER', icon: '📦', status: 'normal', businessValue: 6, owner: 'Container Platform' } },
  { id: 'F', position: { x: 200, y: 350 }, type: 'base', data: { label: 'NTLM Extraction', assetType: 'IDENTITY PROV', icon: '🔑', status: 'normal', businessValue: 9, owner: 'IAM' } },
  { id: 'G', position: { x: 50, y: 450 }, type: 'crown', data: { label: 'Active Directory Core', status: 'normal', businessValue: 10, owner: 'IAM' } },
];

export const baseEdges = [
  { id: 'eA-B', source: 'A', target: 'B', animated: false, style: edgeStyling, data: { techniqueId: 'T1190', confidence: 0.9, exploitability: 0.95, privilegeGain: 0.5, controlWeakness: 0.9, evidence: 'Shadow API endpoint lacks object-level authorization.' } },
  { id: 'eB-C', source: 'B', target: 'C', animated: false, style: edgeStyling, data: { techniqueId: 'T1505', confidence: 0.88, exploitability: 0.83, privilegeGain: 0.7, controlWeakness: 0.8, evidence: 'Web shell write path observed after BOLA validation.' } },
  { id: 'eC-D', source: 'C', target: 'D', animated: false, style: edgeStyling, data: { techniqueId: 'T1611', confidence: 0.72, exploitability: 0.7, privilegeGain: 0.7, controlWeakness: 0.65, evidence: 'Container runtime has elevated host mount.' } },
  { id: 'eC-F', source: 'C', target: 'F', animated: false, style: edgeStyling, data: { techniqueId: 'T1003', confidence: 0.76, exploitability: 0.78, privilegeGain: 0.9, controlWeakness: 0.8, evidence: 'Credential material available in process memory.' } },
  { id: 'eD-G', source: 'D', target: 'G', animated: false, style: edgeStyling, data: { techniqueId: 'T1068', confidence: 0.68, exploitability: 0.64, privilegeGain: 0.85, controlWeakness: 0.7, evidence: 'Host escape enables privileged domain-adjacent access.' } },
  { id: 'eF-G', source: 'F', target: 'G', animated: false, style: edgeStyling, data: { techniqueId: 'T1550', confidence: 0.99, exploitability: 0.92, privilegeGain: 1, controlWeakness: 0.95, evidence: 'Extracted NTLM material can be replayed to AD core.' } },
];

export const aiNodes = [
  { id: 'W1', position: { x: 50, y: 50 }, type: 'base', data: { label: 'Finance Desktop User', assetType: 'REMOTE HOST', icon: '👤', status: 'normal' } },
  { id: 'W2', position: { x: 50, y: 250 }, type: 'ai', data: { label: 'Finance Auto-Billing Agent', assetType: 'AI AGENT', showThreats: true, status: 'normal' } },
  { id: 'W3', position: { x: 50, y: 450 }, type: 'crown', data: { label: 'Customer Root Database (PII)', status: 'normal' } },
];

export const aiEdges = [
  { id: 'eW1-W2', source: 'W1', target: 'W2', animated: false, style: edgeStyling },
  { id: 'eW2-W3', source: 'W2', target: 'W3', animated: false, style: edgeStyling },
];

export const advancedNodes = [
  ...baseNodes,
  { id: 'H', position: { x: -250, y: 50 }, type: 'base', data: { label: 'External DMZ', assetType: 'LOAD BALANCER', icon: '🌐', status: 'normal', businessValue: 5, owner: 'Network' } },
  { id: 'I', position: { x: -250, y: 150 }, type: 'base', data: { label: 'Kubelet Exploit', assetType: 'K8S NODE', icon: '☸️', status: 'normal', businessValue: 7, owner: 'Kubernetes Platform' } },
  { id: 'J', position: { x: 350, y: 50 }, type: 'base', data: { label: 'Phishing Target', assetType: 'EMPLOYEE LAPTOP', icon: '🎣', status: 'normal', businessValue: 4, owner: 'Endpoint Security' } },
  { id: 'K', position: { x: 350, y: 150 }, type: 'base', data: { label: 'VPN Access', assetType: 'VPN GATEWAY', icon: '🛡️', status: 'normal', businessValue: 7, owner: 'Network' } },
  { id: 'BR1', position: { x: 250, y: 250 }, type: 'base', data: { label: 'HR Database', assetType: 'INTERNAL DB', icon: '🗄️', status: 'normal', isBlastRadius: true, businessValue: 8, owner: 'HR Apps' }, hidden: true },
  { id: 'BR2', position: { x: 250, y: 150 }, type: 'base', data: { label: 'Finance API', assetType: 'MICROSERVICE', icon: '⚙️', status: 'normal', isBlastRadius: true, businessValue: 9, owner: 'Finance Apps' }, hidden: true },
];

export const advancedEdges = [
  ...baseEdges.map((edge) => ({ ...edge, data: { ...edge.data } })),
  { id: 'eH-I', source: 'H', target: 'I', animated: false, style: { stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }, data: { techniqueId: 'T1611', confidence: 0.82, exploitability: 0.82, privilegeGain: 0.7, controlWeakness: 0.8, evidence: 'Kubelet unauthenticated read path detected from DMZ.' } },
  { id: 'eI-D', source: 'I', target: 'D', animated: false, style: { stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }, data: { techniqueId: 'T1611', confidence: 0.74, exploitability: 0.7, privilegeGain: 0.7, controlWeakness: 0.72, evidence: 'Kubernetes node escape converges on container host.' } },
  { id: 'eJ-K', source: 'J', target: 'K', animated: false, style: { stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }, data: { techniqueId: 'T1566', confidence: 0.7, exploitability: 0.76, privilegeGain: 0.55, controlWeakness: 0.74, evidence: 'Employee endpoint has phishable remote access path.' } },
  { id: 'eK-F', source: 'K', target: 'F', animated: false, style: { stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }, data: { techniqueId: 'T1078', confidence: 0.8, exploitability: 0.78, privilegeGain: 0.75, controlWeakness: 0.85, evidence: 'VPN grants reachability to identity provider segment.' } },
  { id: 'eB-BR1', source: 'B', target: 'BR1', animated: false, style: { stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }, hidden: true, data: { techniqueId: 'T1021', confidence: 0.8, exploitability: 0.75, privilegeGain: 0.4, controlWeakness: 0.8, evidence: 'Shadow API service account can query HR database.' } },
  { id: 'eB-BR2', source: 'B', target: 'BR2', animated: false, style: { stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }, hidden: true, data: { techniqueId: 'T1190', confidence: 0.86, exploitability: 0.84, privilegeGain: 0.4, controlWeakness: 0.82, evidence: 'Finance API trusts Shadow API without service policy.' } },
];

export const advancedScenario = {
  id: 'advanced-command-center',
  name: 'Advanced Command Center',
  entryNodes: ['A', 'H', 'J'],
  crownJewels: ['G'],
  blastRadiusRoots: ['B'],
  nodes: advancedNodes,
  edges: advancedEdges,
  mitigations: [
    {
      id: 'waf-rule',
      label: 'Emergency WAF Rule',
      targetNode: 'B',
      blockedEdges: ['eA-B'],
      deployTime: 'Seconds',
      downtime: 'None',
      approvalGate: 'Auto-approved for 24-hour emergency containment',
      policyType: 'AWS WAF rule',
      rollback: 'Remove temporary managed rule from WAF policy',
      residualRisk: 'Medium',
      effectiveness: 0.62,
      summary: 'Fast temporary containment for the Shadow API ingress vector.',
    },
    {
      id: 'patch-shadow-api',
      label: 'Patch CVE-2023-50164',
      targetNode: 'B',
      blockedEdges: ['eA-B', 'eB-C', 'eB-BR1', 'eB-BR2'],
      deployTime: '4 hours',
      downtime: 'Maintenance window',
      approvalGate: 'App owner and CAB approval required',
      policyType: 'Application patch PR',
      rollback: 'Revert application PR and redeploy previous container image',
      residualRisk: 'Low',
      effectiveness: 0.86,
      summary: 'Permanent application-layer fix that removes the BOLA pivot.',
    },
    {
      id: 'segmentation-mfa',
      label: 'Segment Network + MFA',
      targetNode: 'F',
      blockedEdges: ['eC-F', 'eK-F', 'eF-G'],
      deployTime: 'Minutes',
      downtime: 'None',
      approvalGate: 'IAM and Network dual approval',
      policyType: 'NetworkPolicy + MFA conditional access',
      rollback: 'Disable conditional access rule and restore previous segment policy',
      residualRisk: 'Very low',
      effectiveness: 0.94,
      summary: 'Blocks identity-provider lateral movement from multiple attack paths.',
    },
  ],
};

export const baseScenario = {
  id: 'critical-attack-path-discovery',
  name: 'Critical Attack Path Discovery',
  entryNodes: ['A'],
  crownJewels: ['G'],
  nodes: baseNodes,
  edges: baseEdges,
  mitigations: [
    {
      id: 'waf-rule',
      label: 'Emergency WAF Rule',
      targetNode: 'B',
      blockedEdges: ['eA-B'],
      deployTime: 'Seconds',
      downtime: 'None',
      approvalGate: 'Auto-approved for 24-hour emergency containment',
      policyType: 'AWS WAF rule',
      rollback: 'Remove temporary managed rule from WAF policy',
      residualRisk: 'Medium',
      effectiveness: 0.62,
      summary: 'Fast temporary containment for the Shadow API ingress vector.',
    }
  ]
};

export const aiPostureScenario = {
  id: 'ai-agent-posture',
  name: 'AI Agent Posture Validation',
  entryNodes: ['W1'],
  crownJewels: ['W3'],
  nodes: aiNodes,
  edges: aiEdges,
  mitigations: [
    {
      id: 'secure-ai-egress',
      label: 'Authorize Dev Handoff & Secure',
      targetNode: 'W2',
      blockedEdges: ['eW1-W2', 'eW2-W3'],
      deployTime: 'Minutes',
      downtime: 'None',
      approvalGate: 'Dev & App owner approval required',
      policyType: 'AI security egress policy PR',
      rollback: 'Revert security PR in github repo',
      residualRisk: 'Very low',
      effectiveness: 0.95,
      summary: 'Secures external egress traffic and prompt injection paths.',
    }
  ]
};

