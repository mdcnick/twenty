export type IdempotencyDecision = 'PROCESS' | 'NOOP_DUPLICATE';

export const decideIdempotency = (existingRecordId: string | null): IdempotencyDecision =>
  existingRecordId ? 'NOOP_DUPLICATE' : 'PROCESS';
