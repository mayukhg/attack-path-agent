import { NextResponse } from 'next/server';
import { advancedScenario, baseScenario, aiPostureScenario } from '../../../data/attackScenarios';
import { analyzeScenario, applyMitigation, answerWhatIf, createExecutiveReport, generatePolicyPreview, simulatePath } from '../../../lib/attackPathEngine';

import fs from 'fs';
import path from 'path';

const scenarioMap = {
  'critical-attack-path-discovery': baseScenario,
  'ai-agent-posture': aiPostureScenario,
  'advanced-command-center': advancedScenario,
};

const getScenario = (id) => scenarioMap[id] || advancedScenario;

function overlayValidationState(scenarioId, nodes, edges) {
  const stateFilePath = path.join(process.cwd(), 'src/data/activeGraphState.json');
  if (!fs.existsSync(stateFilePath)) {
    return { nodes, edges };
  }

  try {
    const fileContent = fs.readFileSync(stateFilePath, 'utf8');
    const state = JSON.parse(fileContent);
    const scenarioState = state[scenarioId];
    
    if (!scenarioState) {
      return { nodes, edges };
    }

    const nodeValidationStates = scenarioState;

    const updatedNodes = nodes.map(node => {
      const nodeState = nodeValidationStates[node.id];
      if (nodeState) {
        if (nodeState.state === 'PROVEN_ATTACK_VECTOR') {
          return {
            ...node,
            data: {
              ...node.data,
              status: 'compromised',
              validationStatus: 'PROVEN_ATTACK_VECTOR',
              evidence: nodeState.evidence
            }
          };
        } else if (nodeState.state === 'BLOCKED_PATH_JUNCTION') {
          return {
            ...node,
            data: {
              ...node.data,
              status: 'secured',
              validationStatus: 'BLOCKED_PATH_JUNCTION'
            }
          };
        } else if (nodeState.state === 'UNVERIFIED') {
          return {
            ...node,
            data: {
              ...node.data,
              status: 'normal',
              validationStatus: 'UNVERIFIED'
            }
          };
        }
      }
      return node;
    });

    const updatedEdges = edges.map(edge => {
      const targetState = nodeValidationStates[edge.target];
      if (targetState) {
        if (targetState.state === 'PROVEN_ATTACK_VECTOR') {
          return {
            ...edge,
            animated: true,
            style: { stroke: '#FF0033', strokeWidth: 3 },
            data: {
              ...edge.data,
              validationStatus: 'PROVEN_ATTACK_VECTOR',
              validationBadge: 'Exploit Validated: Callback Confirmed',
              evidence: targetState.evidence
            }
          };
        } else if (targetState.state === 'BLOCKED_PATH_JUNCTION') {
          return {
            ...edge,
            animated: false,
            style: { stroke: '#00CC66', strokeWidth: 3, strokeDasharray: '5 5' },
            data: {
              ...edge.data,
              validationStatus: 'BLOCKED_PATH_JUNCTION',
              validationBadge: 'Exploit Mitigated',
              padlock: true,
              note: 'Active validation proved this path is blocked by environmental controls.'
            }
          };
        } else if (targetState.state === 'UNVERIFIED') {
          return {
            ...edge,
            animated: false,
            style: { stroke: '#A0A0A0', strokeWidth: 1.5, strokeDasharray: '2 2' },
            data: {
              ...edge.data,
              validationStatus: 'UNVERIFIED',
              validationBadge: 'Unverified',
              note: 'An absence of explicit proof does not mean an absence of risk, preserving baseline visibility.'
            }
          };
        }
      }
      return edge;
    });

    return { nodes: updatedNodes, edges: updatedEdges };
  } catch (err) {
    console.error('Failed to read or parse activeGraphState.json:', err);
    return { nodes, edges };
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const scenarioId = searchParams.get('scenarioId') || 'advanced-command-center';
  const scenario = getScenario(scenarioId);
  
  const { nodes, edges } = overlayValidationState(scenario.id, scenario.nodes, scenario.edges);

  return NextResponse.json({
    scenario: {
      id: scenario.id,
      name: scenario.name,
      nodes,
      edges,
    },
    analysis: analyzeScenario(scenario),
  });
}

export async function POST(request) {
  const body = await request.json();
  const scenario = getScenario(body.scenarioId);

  if (body.intent === 'simulate') {
    return NextResponse.json(simulatePath(scenario, body.pathId));
  }

  if (body.intent === 'mitigate') {
    return NextResponse.json(applyMitigation(scenario, body.mitigationId));
  }

  if (body.intent === 'what-if') {
    return NextResponse.json(answerWhatIf(body.question || '', scenario));
  }

  if (body.intent === 'report') {
    return NextResponse.json(createExecutiveReport(scenario, body.mitigationId));
  }

  if (body.intent === 'policy') {
    return NextResponse.json(generatePolicyPreview(scenario, body.mitigationId));
  }

  return NextResponse.json(analyzeScenario(scenario));
}
