import { IntegrationHealthState } from '@/types/events';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function formatSseData(data: unknown): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`);
}

function createDefaultStatus() {
  return {
    overall: 'UNKNOWN' as IntegrationHealthState,
    integrations: {},
    updatedAt: new Date().toISOString(),
  };
}

export async function GET(request: Request): Promise<Response> {
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(
        formatSseData({
          type: 'snapshot',
          payload: {
            events: [],
            systemStatus: createDefaultStatus(),
          },
        }),
      );

      const keepAlive = setInterval(() => {
        controller.enqueue(
          new TextEncoder().encode(`: keep-alive ${new Date().toISOString()}\n\n`),
        );
      }, 15000);

      const abortHandler = () => {
        clearInterval(keepAlive);
        controller.close();
      };

      request.signal.addEventListener('abort', abortHandler, { once: true });
    },
    cancel() {
      // The request abort handler tears down the keepalive timer.
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
