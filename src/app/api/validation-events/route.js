import { waitForValidationResult } from '../../../lib/validationStore';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const pathId = searchParams.get('path_id');

  if (!pathId) {
    return new Response('path_id required', { status: 400 });
  }

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data) => {
        controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        const result = await waitForValidationResult(pathId, 35000);
        send(result);
      } catch {
        send({ error: 'timeout', path_id: pathId });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
