import { NextResponse } from 'next/server';
import { EventBus } from '../../../../lib/eventBus';
import fs from 'fs';
import path from 'path';

export async function GET() {
  return NextResponse.json({
    history: EventBus.getHistory()
  });
}

export async function DELETE() {
  EventBus.clearStore();
  
  const stateFilePath = path.join(process.cwd(), 'src/data/activeGraphState.json');
  if (fs.existsSync(stateFilePath)) {
    try {
      fs.unlinkSync(stateFilePath);
    } catch (err) {
      console.error('Failed to delete activeGraphState.json during reset:', err);
    }
  }

  return NextResponse.json({
    success: true,
    message: 'Event store cleared and re-seeded with registration events.',
    history: EventBus.getHistory()
  });
}
