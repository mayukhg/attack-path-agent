import { EventBus } from '../../../../lib/eventBus';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  let unsubscribe;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      // Helper to enqueue a text chunk
      const send = (data) => {
        controller.enqueue(encoder.encode(data));
      };

      // Send initial keepalive
      send(`: sentinel-stream-started\n\n`);

      // Broadcast existing history to catch up the frontend
      const history = EventBus.getHistory();
      history.forEach(event => {
        send(`data: ${JSON.stringify(event)}\n\n`);
      });

      // Subscribe to real-time publications from the EventBus
      unsubscribe = EventBus.subscribe((event) => {
        send(`data: ${JSON.stringify(event)}\n\n`);
      });
    },
    cancel() {
      if (unsubscribe) {
        unsubscribe();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}
