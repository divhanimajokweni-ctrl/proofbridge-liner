type JsonRecord = Record<string, unknown>;

type ProofEvent = {
  id: string;
  paymentId: string;
  eventHash: string;
  status: string;
  receivedAt: Date;
  processedAt?: Date | null;
  txHash?: string | null;
  payload: JsonRecord;
  attempts: number;
  error?: string | null;
};

type ProofSubmission = {
  id: string;
  proofHash: string;
  txHash: string;
  nonce: number;
  status: string;
  createdAt: Date;
  confirmedAt?: Date | null;
};

const events = new Map<string, ProofEvent>();
const eventsByHash = new Map<string, string>();
const submissions = new Map<string, ProofSubmission>();
const submissionsByHash = new Map<string, string>();
const cuid = () => `local_${Date.now()}_${Math.random().toString(36).slice(2)}`;

function applyIncrement(current: number, value: unknown) {
  if (typeof value === 'object' && value && 'increment' in value) {
    return current + Number((value as { increment: number }).increment);
  }
  return Number(value ?? current);
}

export const prisma = {
  proofEvent: {
    async findUnique({ where }: { where: { id?: string; eventHash?: string } }) {
      const id = where.id ?? (where.eventHash ? eventsByHash.get(where.eventHash) : undefined);
      return id ? events.get(id) ?? null : null;
    },
    async create({ data }: { data: Omit<ProofEvent, 'id' | 'receivedAt' | 'attempts'> & Partial<ProofEvent> }) {
      const row: ProofEvent = { id: cuid(), receivedAt: new Date(), attempts: 0, ...data };
      events.set(row.id, row);
      eventsByHash.set(row.eventHash, row.id);
      return row;
    },
    async update({ where, data }: { where: { id: string }; data: Omit<Partial<ProofEvent>, 'attempts'> & { attempts?: unknown } }) {
      const row = events.get(where.id);
      if (!row) throw new Error(`ProofEvent not found: ${where.id}`);
      const next = { ...row, ...data, attempts: data.attempts ? applyIncrement(row.attempts, data.attempts) : row.attempts };
      events.set(where.id, next as ProofEvent);
      return next;
    },
  },
  proofAudit: {
    async create({ data }: { data: { eventHash: string; action: string; actor: string; metadata: JsonRecord } }) {
      return { id: cuid(), timestamp: new Date(), ...data };
    },
  },
  proofSubmission: {
    async findUnique({ where }: { where: { id?: string; proofHash?: string } }) {
      const id = where.id ?? (where.proofHash ? submissionsByHash.get(where.proofHash) : undefined);
      return id ? submissions.get(id) ?? null : null;
    },
    async create({ data }: { data: Omit<ProofSubmission, 'id' | 'createdAt'> & Partial<ProofSubmission> }) {
      const row: ProofSubmission = { id: cuid(), createdAt: new Date(), ...data };
      submissions.set(row.id, row);
      submissionsByHash.set(row.proofHash, row.id);
      return row;
    },
    async update({ where, data }: { where: { id: string }; data: Partial<ProofSubmission> }) {
      const row = submissions.get(where.id);
      if (!row) throw new Error(`ProofSubmission not found: ${where.id}`);
      const next = { ...row, ...data };
      submissions.set(where.id, next);
      return next;
    },
    async findMany({ where, take }: { where: { status: string }; take: number }) {
      return [...submissions.values()].filter((row) => row.status === where.status).slice(0, take);
    },
  },
};
