import { advancedScenario } from '../data/attackScenarios';

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const nodeLabel = (scenario, nodeId) => {
  const node = scenario.nodes.find((item) => item.id === nodeId);
  return node?.data?.label || nodeId;
};

const edgeRisk = (edge) => {
  const data = edge.data || {};
  const confidence = data.confidence ?? 0.7;
  const exploitability = data.exploitability ?? 0.7;
  const privilegeGain = data.privilegeGain ?? 0.5;
  const controlWeakness = data.controlWeakness ?? 0.7;
  return confidence * 0.28 + exploitability * 0.28 + privilegeGain * 0.22 + controlWeakness * 0.22;
};

const getNode = (scenario, nodeId) => scenario.nodes.find((item) => item.id === nodeId);

const pathOwners = (scenario, nodeIds) => (
  [...new Set(nodeIds.map((nodeId) => getNode(scenario, nodeId)?.data?.owner).filter(Boolean))]
);

const explainPcs = (scenario, path, blastRadius, averageEdgeRisk, pcs) => {
  const crownValue = getNode(scenario, path.nodeIds.at(-1))?.data?.businessValue || 8;
  const convergenceBonus = path.nodeIds.includes('B') || path.nodeIds.includes('F') ? 0.7 : 0;
  const blastRadiusScore = blastRadius.length * 0.23;

  return [
    { label: 'Exploit confidence', value: Number((averageEdgeRisk * 10).toFixed(1)), weight: 'Composite edge confidence, exploitability, privilege gain, and control weakness.' },
    { label: 'Crown-jewel value', value: Number((crownValue * 0.18).toFixed(1)), weight: `${nodeLabel(scenario, path.nodeIds.at(-1))} is rated ${crownValue}/10 business value.` },
    { label: 'Blast radius', value: Number(blastRadiusScore.toFixed(1)), weight: `${blastRadius.length} modeled adjacent business asset(s) become exposed.` },
    { label: 'Convergence bonus', value: Number(convergenceBonus.toFixed(1)), weight: convergenceBonus > 0 ? 'Path crosses a known choke point used by multiple routes.' : 'No convergence bonus on this route.' },
    { label: 'Final PCS', value: Number(pcs.toFixed(1)), weight: 'Normalized 0-10 score used to rank autonomous action.' },
  ];
};

const buildAdjacency = (scenario, blockedEdges = []) => {
  const blocked = new Set(blockedEdges);
  return scenario.edges.reduce((acc, edge) => {
    if (blocked.has(edge.id)) return acc;
    if (!acc[edge.source]) acc[edge.source] = [];
    acc[edge.source].push(edge);
    return acc;
  }, {});
};

const findPathsFrom = (scenario, source, target, blockedEdges = [], maxDepth = 8) => {
  const adjacency = buildAdjacency(scenario, blockedEdges);
  const results = [];

  const walk = (nodeId, pathNodes, pathEdges) => {
    if (nodeId === target) {
      results.push({ nodeIds: pathNodes, edgeIds: pathEdges.map((edge) => edge.id), edges: pathEdges });
      return;
    }
    if (pathNodes.length > maxDepth) return;

    for (const edge of adjacency[nodeId] || []) {
      if (pathNodes.includes(edge.target)) continue;
      walk(edge.target, [...pathNodes, edge.target], [...pathEdges, edge]);
    }
  };

  walk(source, [source], []);
  return results;
};

export const discoverAttackPaths = (scenario = advancedScenario, blockedEdges = []) => {
  const paths = scenario.entryNodes.flatMap((entryNode) =>
    scenario.crownJewels.flatMap((crownJewel) => findPathsFrom(scenario, entryNode, crownJewel, blockedEdges))
  );

  return paths
    .map((path, index) => {
      const edgeScores = path.edges.map(edgeRisk);
      const averageEdgeRisk = edgeScores.reduce((sum, score) => sum + score, 0) / edgeScores.length;
      const crownValue = scenario.nodes.find((node) => node.id === path.nodeIds.at(-1))?.data?.businessValue || 8;
      const blastRadius = getBlastRadius(scenario, path.nodeIds, blockedEdges);
      const convergenceBonus = path.nodeIds.includes('B') || path.nodeIds.includes('F') ? 0.7 : 0;
      const pcs = clamp((averageEdgeRisk * 7.3) + (crownValue * 0.18) + (blastRadius.length * 0.23) + convergenceBonus, 0, 10);
      const pcsScore = Number(pcs.toFixed(1));

      return {
        id: `PATH-${String(index + 1).padStart(3, '0')}`,
        title: `${nodeLabel(scenario, path.nodeIds[0])} -> ${nodeLabel(scenario, path.nodeIds.at(-1))}`,
        nodeIds: path.nodeIds,
        edgeIds: path.edgeIds,
        techniques: [...new Set(path.edges.map((edge) => edge.data?.techniqueId).filter(Boolean))],
        confidence: averageEdgeRisk,
        pcs: pcsScore,
        owners: pathOwners(scenario, path.nodeIds),
        blastRadius,
        pcsBreakdown: explainPcs(scenario, path, blastRadius, averageEdgeRisk, pcs),
        evidence: path.edges.map((edge) => edge.data?.evidence).filter(Boolean),
      };
    })
    .sort((a, b) => b.pcs - a.pcs);
};

export const getBlastRadius = (scenario = advancedScenario, compromisedNodes = ['B'], blockedEdges = []) => {
  const adjacency = buildAdjacency(scenario, blockedEdges);
  const seen = new Set(compromisedNodes);
  const queue = [...compromisedNodes];
  const blastAssets = [];

  while (queue.length) {
    const current = queue.shift();
    for (const edge of adjacency[current] || []) {
      if (seen.has(edge.target)) continue;
      seen.add(edge.target);
      queue.push(edge.target);
      const node = scenario.nodes.find((item) => item.id === edge.target);
      if (node?.data?.isBlastRadius) {
        blastAssets.push({ id: node.id, label: node.data.label, owner: node.data.owner, businessValue: node.data.businessValue || 5 });
      }
    }
  }

  return blastAssets;
};

export const findChokePoints = (paths) => {
  const counts = new Map();
  paths.forEach((path) => {
    path.nodeIds.slice(1, -1).forEach((nodeId) => counts.set(nodeId, (counts.get(nodeId) || 0) + 1));
  });
  return [...counts.entries()]
    .map(([nodeId, count]) => ({ nodeId, count }))
    .sort((a, b) => b.count - a.count);
};

export const analyzeScenario = (scenario = advancedScenario, blockedEdges = []) => {
  const paths = discoverAttackPaths(scenario, blockedEdges);
  const chokePoints = findChokePoints(paths).map((point) => ({
    ...point,
    label: nodeLabel(scenario, point.nodeId),
  }));
  const topPath = paths[0] || null;

  return {
    scenarioId: scenario.id,
    paths,
    topPath,
    activePaths: paths.length,
    pcsScore: topPath?.pcs || 0,
    chokePoints,
    mitigationOptions: rankMitigations(scenario),
  };
};

export const rankMitigations = (scenario = advancedScenario) => {
  const before = discoverAttackPaths(scenario);
  const beforeTopScore = before[0]?.pcs || 0;
  const beforeCount = before.length;

  return scenario.mitigations
    .map((mitigation) => {
      const after = discoverAttackPaths(scenario, mitigation.blockedEdges);
      const afterTopScore = after[0]?.pcs || 0;
      const pathsClosed = Math.max(0, beforeCount - after.length);
      const scoreReduction = Number((beforeTopScore - afterTopScore).toFixed(1));
      const rankScore = scoreReduction * 2 + pathsClosed * 1.4 + mitigation.effectiveness;

      return {
        ...mitigation,
        owner: getNode(scenario, mitigation.targetNode)?.data?.owner || 'Security',
        pathsClosed,
        scoreReduction,
        residualPcs: afterTopScore,
        rankScore: Number(rankScore.toFixed(2)),
      };
    })
    .sort((a, b) => b.rankScore - a.rankScore);
};

export const createExecutiveReport = (scenario = advancedScenario, mitigationId) => {
  const before = analyzeScenario(scenario);
  const after = mitigationId ? applyMitigation(scenario, mitigationId) : applyMitigation(scenario, rankMitigations(scenario)[0].id);
  const mitigation = after.mitigation;

  return {
    headline: `${mitigation.label} reduces top PCS from ${before.pcsScore.toFixed(1)} to ${after.pcsScore.toFixed(1)}.`,
    businessImpact: `${before.topPath?.blastRadius?.length || 0} adjacent business asset(s) are exposed before mitigation; residual active paths after mitigation: ${after.activePaths}.`,
    technicalSummary: `Top path ${before.topPath?.id} uses ${(before.topPath?.techniques || []).join(', ')} across owners ${(before.topPath?.owners || []).join(', ')}.`,
    recommendedAction: mitigation.summary,
    approvalGate: mitigation.approvalGate,
    rollback: mitigation.rollback,
  };
};

export const generatePolicyPreview = (scenario = advancedScenario, mitigationId) => {
  const mitigation = scenario.mitigations.find((item) => item.id === mitigationId) || rankMitigations(scenario)[0];

  if (mitigation.id === 'secure-ai-egress') {
    return {
      type: mitigation.policyType,
      content: `apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: secure-ai-agent-egress
  namespace: finance
spec:
  selector:
    matchLabels:
      app: finance-auto-billing-agent
  action: DENY
  rules:
  - to:
    - operation:
        hosts: ["public-untrusted-api.net"]`,
    };
  }

  if (mitigation.id === 'segmentation-mfa') {
    return {
      type: mitigation.policyType,
      content: `apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: block-identity-provider-lateral-movement
spec:
  podSelector:
    matchLabels:
      app: identity-provider
  ingress:
    - from:
        - namespaceSelector:
            matchLabels:
              zone: trusted-admin
---
conditionalAccess:
  control: hardware-mfa
  target: identity-provider-admin-actions`,
    };
  }

  if (mitigation.id === 'patch-shadow-api') {
    return {
      type: mitigation.policyType,
      content: `pull_request:
  title: "Patch Shadow API object authorization bypass"
  owner: "AppSec"
  changes:
    - enforce object owner check before invoice retrieval
    - add regression test for cross-tenant object access
    - reject unauthenticated service-to-service calls`,
    };
  }

  return {
    type: mitigation.policyType,
    content: `resource "aws_wafv2_web_acl" "shadow_api_containment" {
  name  = "shadow-api-emergency-containment"
  scope = "REGIONAL"
 
  rule {
    name     = "block-bola-pivot"
    priority = 1
    action { block {} }
  }
}`,
  };
};

export const simulatePath = (scenario = advancedScenario, pathId) => {
  const analysis = analyzeScenario(scenario);
  const selectedPath = analysis.paths.find((path) => path.id === pathId) || analysis.topPath;
  return {
    ...analysis,
    selectedPath,
    blastRadius: selectedPath?.blastRadius || [],
  };
};

export const applyMitigation = (scenario = advancedScenario, mitigationId) => {
  const mitigation = scenario.mitigations.find((item) => item.id === mitigationId) || scenario.mitigations[0];
  const analysis = analyzeScenario(scenario, mitigation.blockedEdges);

  return {
    mitigation,
    ...analysis,
  };
};

export const answerWhatIf = (question, scenario = advancedScenario) => {
  const normalized = question.toLowerCase();
  const vpn = scenario.nodes.find((node) => node.id === 'K');
  const shadowApi = scenario.nodes.find((node) => node.id === 'B');

  if (normalized.includes('vpn') || normalized.includes('node k')) {
    const result = analyzeScenario(scenario, ['eJ-K', 'eK-F']);
    return {
      answer: `Removing ${vpn.data.label} severs the phishing-to-identity-provider route. Active paths fall to ${result.activePaths}, and the top residual PCS becomes ${result.pcsScore.toFixed(1)}.`,
      affectedNodeIds: ['J', 'K', 'F'],
    };
  }

  if (normalized.includes('shadow') || normalized.includes('api') || normalized.includes('node b')) {
    const result = applyMitigation(scenario, 'patch-shadow-api');
    return {
      answer: `Hardening ${shadowApi.data.label} removes the BOLA pivot and hides the attached blast-radius assets. Active paths fall to ${result.activePaths}, with residual PCS ${result.pcsScore.toFixed(1)}.`,
      affectedNodeIds: ['A', 'B', 'C', 'BR1', 'BR2'],
    };
  }

  const best = rankMitigations(scenario)[0];
  return {
    answer: `The strongest current move is ${best.label}. It closes ${best.pathsClosed} path(s), reduces PCS by ${best.scoreReduction.toFixed(1)}, and leaves residual risk marked ${best.residualRisk}.`,
    affectedNodeIds: [best.targetNode],
  };
};
