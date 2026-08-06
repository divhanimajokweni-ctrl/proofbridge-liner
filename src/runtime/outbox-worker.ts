// OutboxWorker — stubbed for build compatibility
// Original implementation used drizzle-orm/pg which is not the active DB layer (Prisma is).
// This stub satisfies the import chain without pulling in drizzle-orm.

export class OutboxWorker {
  private isRunning = false;

  async start() {
    this.isRunning = true;
    console.log('[OutboxWorker] stubbed — not connected to drizzle-orm');
  }

  async stop() {
    this.isRunning = false;
  }

  get running() {
    return this.isRunning;
  }
}
