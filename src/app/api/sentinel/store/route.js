import { NextResponse } from 'next/server';
import { EventBus } from '../../../../lib/eventBus';

export async function GET() {
  return NextResponse.json({
    history: EventBus.getHistory()
  });
}

export async function DELETE() {
  EventBus.clearStore();
  return NextResponse.json({
    success: true,
    message: 'Event store cleared and re-seeded with registration events.',
    history: EventBus.getHistory()
  });
}
