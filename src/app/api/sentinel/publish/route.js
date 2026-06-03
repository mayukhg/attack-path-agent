import { NextResponse } from 'next/server';
import { EventBus } from '../../../../lib/eventBus';
import { triggerConfigDrift, triggerCveInjection, triggerMultipleVulns, triggerMitigationTelemetry } from '../../../../lib/sidecarSimulator';

export async function POST(request) {
  try {
    const body = await request.json();

    // Support pre-defined simulator triggers
    if (body.trigger) {
      if (body.trigger === 'config_drift') {
        const event = triggerConfigDrift();
        return NextResponse.json({ success: true, event });
      }
      if (body.trigger === 'cve_injection') {
        const event = triggerCveInjection();
        return NextResponse.json({ success: true, event });
      }
      if (body.trigger === 'multiple_vulns') {
        const events = triggerMultipleVulns();
        return NextResponse.json({ success: true, events });
      }
      if (body.trigger === 'mitigation') {
        const event = triggerMitigationTelemetry(body.workloadId, body.label, body.scoreReduction);
        return NextResponse.json({ success: true, event });
      }
      return NextResponse.json({ error: `Unknown simulator trigger: ${body.trigger}` }, { status: 400 });
    }

    // Publish direct raw JSON-LD event (validating the schema)
    const event = EventBus.publish(body);
    return NextResponse.json({ success: true, event });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
