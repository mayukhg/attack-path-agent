import { NextResponse } from 'next/server';
import { advancedScenario, baseScenario, aiPostureScenario } from '../../../data/attackScenarios';
import { analyzeScenario, applyMitigation, answerWhatIf, createExecutiveReport, generatePolicyPreview, simulatePath } from '../../../lib/attackPathEngine';

const scenarioMap = {
  'critical-attack-path-discovery': baseScenario,
  'ai-agent-posture': aiPostureScenario,
  'advanced-command-center': advancedScenario,
};

const getScenario = (id) => scenarioMap[id] || advancedScenario;

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const scenarioId = searchParams.get('scenarioId');
  const scenario = getScenario(scenarioId);

  return NextResponse.json({
    scenario: {
      id: scenario.id,
      name: scenario.name,
      nodes: scenario.nodes,
      edges: scenario.edges,
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
