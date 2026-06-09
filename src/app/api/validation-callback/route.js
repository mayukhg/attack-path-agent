import { NextResponse } from 'next/server';
import { setValidationResult } from '../../../lib/validationStore';

export async function POST(request) {
  const payload = await request.json();
  const { path_id, results } = payload;

  if (!path_id || !Array.isArray(results)) {
    return NextResponse.json({ error: 'Invalid callback payload' }, { status: 400 });
  }

  setValidationResult(path_id, payload);

  return NextResponse.json({ status: 'success', processed_nodes: results.length });
}
