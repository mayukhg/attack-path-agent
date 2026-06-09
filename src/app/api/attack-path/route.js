import { NextResponse } from 'next/server';
import { advancedScenario } from '../../../data/attackScenarios';
import { analyzeScenario, applyMitigation, answerWhatIf, createExecutiveReport, generatePolicyPreview, simulatePath } from '../../../lib/attackPathEngine';

export async function GET() {
  return NextResponse.json({
    scenario: {
      id: advancedScenario.id,
      name: advancedScenario.name,
      nodes: advancedScenario.nodes,
      edges: advancedScenario.edges,
    },
    analysis: analyzeScenario(advancedScenario),
  });
}

export async function POST(request) {
  const body = await request.json();

  if (body.intent === 'simulate') {
    const result = simulatePath(advancedScenario, body.pathId);
    // Enrich response with validation targets so the chat can delegate to TruConfirm
    const validationTargets = (result.selectedPath?.nodeIds || [])
      .map(nodeId => {
        const node = advancedScenario.nodes.find(n => n.id === nodeId);
        if (!node?.data?.ipAddress) return null;
        return {
          node_id: nodeId,
          ip_address: node.data.ipAddress,
          cve_id: node.data.primaryCVE,
          ingress_port: node.data.ingressPort,
        };
      })
      .filter(Boolean);
    return NextResponse.json({ ...result, validationTargets });
  }

  if (body.intent === 'mitigate') {
    return NextResponse.json(applyMitigation(advancedScenario, body.mitigationId));
  }

  if (body.intent === 'what-if') {
    return NextResponse.json(answerWhatIf(body.question || '', advancedScenario));
  }

  if (body.intent === 'report') {
    return NextResponse.json(createExecutiveReport(advancedScenario, body.mitigationId));
  }

  if (body.intent === 'policy') {
    return NextResponse.json(generatePolicyPreview(advancedScenario, body.mitigationId));
  }

  return NextResponse.json(analyzeScenario(advancedScenario));
}
