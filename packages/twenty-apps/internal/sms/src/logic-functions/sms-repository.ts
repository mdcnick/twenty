import { createHash } from 'node:crypto';

import { CoreApiClient } from 'twenty-client-sdk/core';

import { type InboundSmsEvent, type SmsDeliveryEvent, type SmsSubmitEvent } from 'src/logic-functions/utils/sinch-callback';

export type OutboundSmsRecord = { providerMessageId: string; providerConversationId: string | null; toE164: string; text: string; idempotencyKey: string; occurredAt: string };
export type PersistenceResult = { created: boolean };

export type SmsRepository = {
  findMessageIdByDedupeKey: (dedupeKey: string) => Promise<string | null>;
  recordInbound: (event: InboundSmsEvent, isSuppression: boolean) => Promise<PersistenceResult>;
  recordDelivery: (event: SmsDeliveryEvent) => Promise<PersistenceResult>;
  recordSubmit: (event: SmsSubmitEvent) => Promise<PersistenceResult>;
  isOutboundSuppressed: (phoneE164: string) => Promise<boolean>;
  recordOutboundAccepted: (record: OutboundSmsRecord) => Promise<PersistenceResult>;
};

type CoreClient = Pick<CoreApiClient, 'query' | 'mutation'>;
type SmsMessageNode = { id?: string; status?: string; providerContactId?: string | null; conversationId?: string | null; lastDeliveryDedupeKey?: string | null; lastDeliveryOccurredAt?: string | null };
type EdgeResult = { edges?: Array<{ node?: SmsMessageNode | null }> } | undefined;

const firstId = (result: EdgeResult): string | null => result?.edges?.[0]?.node?.id ?? null;

const findMessage = async (client: CoreClient, filter: Record<string, unknown>): Promise<{ id: string; status?: string; providerContactId?: string | null; conversationId?: string | null; lastDeliveryDedupeKey?: string | null; lastDeliveryOccurredAt?: string | null } | null> => {
  const result = await client.query({ smsMessages: { __args: { filter, first: 1 }, edges: { node: { id: true, status: true, providerContactId: true, conversationId: true, lastDeliveryDedupeKey: true, lastDeliveryOccurredAt: true } } } }) as { smsMessages?: EdgeResult };
  const node = result.smsMessages?.edges?.[0]?.node;
  return node?.id ? { id: node.id, ...(typeof node.status === 'string' ? { status: node.status } : {}), ...(typeof node.providerContactId === 'string' ? { providerContactId: node.providerContactId } : {}), ...(typeof node.conversationId === 'string' ? { conversationId: node.conversationId } : {}), ...(typeof node.lastDeliveryDedupeKey === 'string' ? { lastDeliveryDedupeKey: node.lastDeliveryDedupeKey } : {}), ...(typeof node.lastDeliveryOccurredAt === 'string' ? { lastDeliveryOccurredAt: node.lastDeliveryOccurredAt } : {}) } : null;
};

const statusCanAdvance = (currentStatus: string | undefined, incomingStatus: SmsDeliveryEvent['status']): boolean => {
  if (!incomingStatus) return false;
  if (incomingStatus === 'FAILED') return currentStatus === 'PENDING' || currentStatus === 'RECEIVED';
  if (currentStatus === 'FAILED') return incomingStatus === 'DELIVERED' || incomingStatus === 'READ';
  const rank: Record<string, number> = { RECEIVED: 0, PENDING: 1, DELIVERED: 2, READ: 3 };
  return (rank[incomingStatus] ?? -1) > (rank[currentStatus ?? 'RECEIVED'] ?? 0);
};

const isNewerDeliveryEvent = (occurredAt: string, latestOccurredAt: string | null | undefined): boolean => {
  if (!latestOccurredAt) return true;
  const incoming = Date.parse(occurredAt);
  const latest = Date.parse(latestOccurredAt);
  return Number.isFinite(incoming) && Number.isFinite(latest) && incoming > latest;
};

const findOne = async (client: CoreClient, objectName: 'smsConversations' | 'smsConsentEvents', filter: Record<string, unknown>): Promise<{ id: string } | null> => {
  const result = await client.query({ [objectName]: { __args: { filter, first: 1 }, edges: { node: { id: true } } } }) as Record<string, EdgeResult>;
  const node = result[objectName]?.edges?.[0]?.node;
  return node?.id ? { id: node.id } : null;
};

const stableRecordId = (scope: string, key: string): string => {
  const hex = createHash('sha256').update(`${scope}:${key}`, 'utf8').digest('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-${((Number.parseInt(hex[16], 16) & 3) | 8).toString(16)}${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
};

const createOrFind = async (client: CoreClient, mutationName: string, objectName: 'smsMessages' | 'smsConversations' | 'smsConsentEvents', data: Record<string, unknown>, uniqueFilter: Record<string, unknown>, idScope: string, idKey: string): Promise<PersistenceResult> => {
  const existing = objectName === 'smsMessages' ? await findMessage(client, uniqueFilter) : await findOne(client, objectName, uniqueFilter);
  if (existing) return { created: false };
  await client.mutation({ [mutationName]: { __args: { data: { id: stableRecordId(idScope, idKey), ...data }, upsert: true }, id: true } });
  return { created: true };
};

const ensureConversation = async (client: CoreClient, event: Pick<InboundSmsEvent | SmsSubmitEvent, 'providerConversationId' | 'phoneE164'> | Pick<OutboundSmsRecord, 'providerConversationId' | 'toE164'>): Promise<string | null> => {
  const providerConversationId = event.providerConversationId;
  if (!providerConversationId) return null;
  const existing = await findOne(client, 'smsConversations', { providerConversationId: { eq: providerConversationId } });
  if (existing) return existing.id;
  const phoneE164 = 'phoneE164' in event ? event.phoneE164 : event.toE164;
  await createOrFind(client, 'createSmsConversation', 'smsConversations', { providerConversationId, phoneE164, status: 'OPEN' }, { providerConversationId: { eq: providerConversationId } }, 'sms-conversation', providerConversationId);
  return (await findOne(client, 'smsConversations', { providerConversationId: { eq: providerConversationId } }))?.id ?? null;
};

export const createTwentySmsRepository = (client: CoreClient = new CoreApiClient()): SmsRepository => ({
  findMessageIdByDedupeKey: async (dedupeKey) => firstId((await client.query({ smsMessages: { __args: { filter: { dedupeKey: { eq: dedupeKey } }, first: 1 }, edges: { node: { id: true } } } }) as { smsMessages?: EdgeResult }).smsMessages),
  recordInbound: async (event, isSuppression) => {
    const conversationId = await ensureConversation(client, event);
    const created = await createOrFind(client, 'createSmsMessage', 'smsMessages', { providerMessageId: event.providerMessageId, providerContactId: event.providerContactId, dedupeKey: event.dedupeKey, phoneE164: event.phoneE164, body: event.body, direction: 'INBOUND', status: 'RECEIVED', occurredAt: event.occurredAt, ...(conversationId ? { conversationId } : {}) }, { dedupeKey: { eq: event.dedupeKey } }, 'sms-message', event.dedupeKey);
    if (isSuppression && created.created) await createOrFind(client, 'createSmsConsentEvent', 'smsConsentEvents', { dedupeKey: `consent:${event.dedupeKey}`, phoneE164: event.phoneE164, eventType: 'OPT_OUT', occurredAt: event.occurredAt }, { dedupeKey: { eq: `consent:${event.dedupeKey}` } }, 'sms-consent-event', `consent:${event.dedupeKey}`);
    return created;
  },
  recordDelivery: async (event) => {
    const existing = await findMessage(client, { providerMessageId: { eq: event.providerMessageId } });
    if (!existing) throw new Error('Delivery receipt has no matching SMS message.');
    if (existing.lastDeliveryDedupeKey === event.dedupeKey || !isNewerDeliveryEvent(event.occurredAt, existing.lastDeliveryOccurredAt)) return { created: false };
    await client.mutation({ updateSmsMessage: { __args: { id: existing.id, data: { lastDeliveryDedupeKey: event.dedupeKey, lastDeliveryOccurredAt: event.occurredAt, lastProviderDeliveryStatus: event.providerStatus, ...(statusCanAdvance(existing.status, event.status) ? { status: event.status } : {}), ...(event.providerContactId ? { providerContactId: event.providerContactId } : {}) } }, id: true } });
    return { created: true };
  },
  recordSubmit: async (event) => {
    const conversationId = await ensureConversation(client, event);
    const existing = await findMessage(client, { providerMessageId: { eq: event.providerMessageId } });
    if (!existing) {
      return createOrFind(client, 'createSmsMessage', 'smsMessages', { providerMessageId: event.providerMessageId, providerContactId: event.providerContactId, dedupeKey: event.dedupeKey, phoneE164: event.phoneE164, body: event.body, direction: 'OUTBOUND', status: 'PENDING', occurredAt: event.occurredAt, ...(conversationId ? { conversationId } : {}) }, { providerMessageId: { eq: event.providerMessageId } }, 'sms-message', event.providerMessageId);
    }
    const data = {
      ...(event.providerContactId && event.providerContactId !== existing.providerContactId ? { providerContactId: event.providerContactId } : {}),
      ...(conversationId && conversationId !== existing.conversationId ? { conversationId } : {}),
    };
    if (Object.keys(data).length === 0) return { created: false };
    await client.mutation({ updateSmsMessage: { __args: { id: existing.id, data }, id: true } });
    return { created: true };
  },
  isOutboundSuppressed: async (phoneE164) => Boolean(await findOne(client, 'smsConsentEvents', { phoneE164: { eq: phoneE164 }, eventType: { eq: 'OPT_OUT' } })),
  recordOutboundAccepted: async (record) => {
    const conversationId = await ensureConversation(client, record);
    return createOrFind(client, 'createSmsMessage', 'smsMessages', { providerMessageId: record.providerMessageId, dedupeKey: record.idempotencyKey, phoneE164: record.toE164, body: record.text, direction: 'OUTBOUND', status: 'PENDING', occurredAt: record.occurredAt, ...(conversationId ? { conversationId } : {}) }, { providerMessageId: { eq: record.providerMessageId } }, 'sms-message', record.providerMessageId);
  },
});
