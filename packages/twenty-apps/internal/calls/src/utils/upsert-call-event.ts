import { createHash } from 'node:crypto';
import { CoreApiClient } from 'twenty-client-sdk/core';
import { type CallEventRepository, type CallEventUpsertResult, type NormalizedCallEvent } from '../domain/call-event';

type PhoneValue = { primaryPhoneNumber?: string | null } | null;
type StoredCallEvent = { id: string; payloadHash?: string; status?: string; providerStatus?: string; direction?: string; fromNumber?: PhoneValue; toNumber?: PhoneValue; parentCallId?: string | null; durationSeconds?: number | null; answeredBy?: string | null; startedAt?: string | null; endedAt?: string | null; providerError?: string | null; externalSourceId?: string | null };
type CoreClient = { query(request: Record<string, unknown>): Promise<unknown>; mutation(request: Record<string, unknown>): Promise<unknown> };
const lifecycleRank: Record<string, number> = { RINGING: 1, ANSWERED: 2, COMPLETED: 3, MISSED: 3, FAILED: 3 };

export const callEventRecordId = (providerCallId: string) => {
  const hex = createHash('sha256').update(`calls:${providerCallId}`).digest('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-${((Number.parseInt(hex[16], 16) & 3) | 8).toString(16)}${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
};

export const decideCallEventUpsert = (existing: StoredCallEvent | null, incoming: NormalizedCallEvent): CallEventUpsertResult => {
  const id = existing?.id ?? callEventRecordId(incoming.providerCallId);
  if (existing?.payloadHash === incoming.payloadHash) return { action: 'ignore', id };
  if (existing && (lifecycleRank[existing.status ?? 'RINGING'] ?? 0) > lifecycleRank[incoming.status]) return { action: 'ignore', id };
  return existing ? { action: 'update', id } : { action: 'create', id };
};

export const mergeCallEvent = (existing: StoredCallEvent | null, incoming: NormalizedCallEvent): NormalizedCallEvent => ({
  ...incoming,
  parentCallId: incoming.parentCallId ?? existing?.parentCallId ?? undefined,
  fromNumber: incoming.fromNumber ?? existing?.fromNumber?.primaryPhoneNumber ?? undefined,
  toNumber: incoming.toNumber ?? existing?.toNumber?.primaryPhoneNumber ?? undefined,
  direction: (existing?.direction as NormalizedCallEvent['direction'] | undefined) ?? incoming.direction,
  providerStatus: incoming.providerStatus ?? existing?.providerStatus ?? undefined,
  durationSeconds: incoming.durationSeconds ?? existing?.durationSeconds ?? undefined,
  answeredBy: incoming.answeredBy ?? existing?.answeredBy ?? undefined,
  startedAt: incoming.startedAt ?? existing?.startedAt ?? undefined,
  endedAt: incoming.endedAt ?? existing?.endedAt ?? undefined,
  providerError: incoming.providerError ?? existing?.providerError ?? undefined,
  externalSourceId: incoming.externalSourceId ?? existing?.externalSourceId ?? undefined,
});

export const callEventWriteDto = (event: NormalizedCallEvent) => ({
  providerCallId: event.providerCallId,
  parentCallId: event.parentCallId ?? null,
  fromNumber: event.fromNumber ? { primaryPhoneNumber: event.fromNumber } : null,
  toNumber: event.toNumber ? { primaryPhoneNumber: event.toNumber } : null,
  direction: event.direction,
  status: event.status,
  providerStatus: event.providerStatus ?? null,
  durationSeconds: event.durationSeconds ?? null,
  answeredBy: event.answeredBy ?? null,
  startedAt: event.startedAt ?? null,
  endedAt: event.endedAt ?? null,
  providerEventType: event.providerEventType,
  providerError: event.providerError ?? null,
  payloadHash: event.payloadHash,
  externalSourceId: event.externalSourceId ?? null,
});

const readOne = (result: unknown): StoredCallEvent | null => {
  const edges = (result as { callEvents?: { edges?: Array<{ node?: StoredCallEvent }> } })?.callEvents?.edges;
  return edges?.[0]?.node ?? null;
};

export const createTwentyCallEventRepository = (client: CoreClient = new CoreApiClient() as unknown as CoreClient): CallEventRepository => ({
  async upsert(event) {
    const existing = readOne(await client.query({ callEvents: { __args: { filter: { providerCallId: { eq: event.providerCallId } }, first: 1 }, edges: { node: { id: true, payloadHash: true, status: true, providerStatus: true, direction: true, fromNumber: { primaryPhoneNumber: true }, toNumber: { primaryPhoneNumber: true }, parentCallId: true, durationSeconds: true, answeredBy: true, startedAt: true, endedAt: true, providerError: true, externalSourceId: true } } } }));
    const decision = decideCallEventUpsert(existing, event);
    if (decision.action === 'ignore') return decision;
    const data = callEventWriteDto(mergeCallEvent(existing, event));
    // Twenty's create mutation delegates `upsert: true` to its database upsert path on unique fields; providerCallId is unique.
    await client.mutation({ createCallEvent: { __args: { data: { id: decision.id, ...data }, upsert: true }, id: true } });
    return decision;
  },
});
