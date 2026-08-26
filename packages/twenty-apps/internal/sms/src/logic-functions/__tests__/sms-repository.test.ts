import { describe, expect, it, vi } from 'vitest';

import { createTwentySmsRepository } from 'src/logic-functions/sms-repository';

const inbound = {
  dedupeKey: 'sinch:inbound:message-1', providerMessageId: 'message-1', providerConversationId: 'conversation-1', providerContactId: 'contact-1', phoneE164: '+13125550100', body: 'STOP', occurredAt: '2020-04-24T08:02:50.179021Z',
};

const submit = {
  dedupeKey: 'sinch:submit:message-1', providerMessageId: 'message-1', providerConversationId: 'conversation-1', providerContactId: 'contact-1', phoneE164: '+13125550100', body: 'Hello', occurredAt: '2020-01-01T00:00:01Z',
};

describe('Twenty SMS repository', () => {
  it('uses the generated custom-object API names and exact writer DTOs', async () => {
    let conversationReads = 0;
    const client = {
      query: vi.fn(async (request: Record<string, unknown>) => {
        if ('smsConversations' in request) {
          conversationReads += 1;
          return { smsConversations: { edges: conversationReads <= 2 ? [] : [{ node: { id: 'conversation-record-1' } }] } };
        }
        return { smsMessages: { edges: [] } };
      }),
      mutation: vi.fn().mockResolvedValue({}),
    };
    await expect(createTwentySmsRepository(client).recordInbound(inbound, true)).resolves.toEqual({ created: true });
    expect(client.mutation).toHaveBeenNthCalledWith(1, { createSmsConversation: { __args: { data: expect.objectContaining({ providerConversationId: 'conversation-1', phoneE164: '+13125550100', status: 'OPEN' }), upsert: true }, id: true } });
    expect(client.mutation).toHaveBeenNthCalledWith(2, { createSmsMessage: { __args: { data: expect.objectContaining({ providerMessageId: 'message-1', providerContactId: 'contact-1', dedupeKey: 'sinch:inbound:message-1', phoneE164: '+13125550100', body: 'STOP', direction: 'INBOUND', status: 'RECEIVED', occurredAt: '2020-04-24T08:02:50.179021Z', conversationId: 'conversation-record-1' }), upsert: true }, id: true } });
    expect(client.mutation).toHaveBeenNthCalledWith(3, { createSmsConsentEvent: { __args: { data: expect.objectContaining({ dedupeKey: 'consent:sinch:inbound:message-1', phoneE164: '+13125550100', eventType: 'OPT_OUT', occurredAt: '2020-04-24T08:02:50.179021Z' }), upsert: true }, id: true } });
  });

  it('treats an existing provider event as an idempotent no-op and updates delivery status only once', async () => {
    const client = {
      query: vi.fn(async (request: Record<string, unknown>) => {
        if ('smsMessages' in request) return { smsMessages: { edges: [{ node: { id: 'message-record-1', status: 'PENDING' } }] } };
        return { smsConsentEvents: { edges: [] } };
      }),
      mutation: vi.fn().mockResolvedValue({}),
    };
    const repository = createTwentySmsRepository(client);
    await expect(repository.recordOutboundAccepted({ providerMessageId: 'message-1', providerConversationId: null, toE164: '+13125550100', text: 'Hello', idempotencyKey: 'send-1', occurredAt: '2020-01-01T00:00:00Z' })).resolves.toEqual({ created: false });
    await expect(repository.recordDelivery({ dedupeKey: 'sinch:delivery:message-1:DELIVERED', providerMessageId: 'message-1', providerConversationId: 'conversation-1', providerContactId: 'contact-1', status: 'DELIVERED', providerStatus: 'DELIVERED', occurredAt: '2020-01-01T00:01:00Z' })).resolves.toEqual({ created: true });
    expect(client.mutation).toHaveBeenCalledWith({ updateSmsMessage: { __args: { id: 'message-record-1', data: { status: 'DELIVERED', providerContactId: 'contact-1', lastDeliveryDedupeKey: 'sinch:delivery:message-1:DELIVERED', lastDeliveryOccurredAt: '2020-01-01T00:01:00Z', lastProviderDeliveryStatus: 'DELIVERED' } }, id: true } });
  });

  it('creates an outbound message from a submit callback when the provider message is not known yet', async () => {
    const client = {
      query: vi.fn(async (request: Record<string, unknown>) => {
        if ('smsConversations' in request) return { smsConversations: { edges: [{ node: { id: 'conversation-record-1' } }] } };
        return { smsMessages: { edges: [] } };
      }),
      mutation: vi.fn().mockResolvedValue({}),
    };

    await expect(createTwentySmsRepository(client).recordSubmit(submit)).resolves.toEqual({ created: true });
    expect(client.mutation).toHaveBeenCalledWith({ createSmsMessage: { __args: { data: expect.objectContaining({ providerMessageId: 'message-1', providerContactId: 'contact-1', dedupeKey: 'sinch:submit:message-1', phoneE164: '+13125550100', body: 'Hello', direction: 'OUTBOUND', status: 'PENDING', occurredAt: '2020-01-01T00:00:01Z', conversationId: 'conversation-record-1' }), upsert: true }, id: true } });
  });

  it('enriches an existing outbound message once when the submit callback adds provider relations', async () => {
    const client = {
      query: vi.fn(async (request: Record<string, unknown>) => {
        if ('smsConversations' in request) return { smsConversations: { edges: [{ node: { id: 'conversation-record-1' } }] } };
        return { smsMessages: { edges: [{ node: { id: 'message-record-1', status: 'PENDING' } }] } };
      }),
      mutation: vi.fn().mockResolvedValue({}),
    };

    await expect(createTwentySmsRepository(client).recordSubmit(submit)).resolves.toEqual({ created: true });
    expect(client.mutation).toHaveBeenCalledWith({ updateSmsMessage: { __args: { id: 'message-record-1', data: { providerContactId: 'contact-1', conversationId: 'conversation-record-1' } }, id: true } });
  });

  it('does not downgrade READ when an older DELIVERED receipt is replayed', async () => {
    const client = {
      query: vi.fn().mockResolvedValue({ smsMessages: { edges: [{ node: { id: 'message-record-1', status: 'READ', lastDeliveryDedupeKey: 'sinch:delivery:message-1:READ', lastDeliveryOccurredAt: '2020-01-01T00:02:00Z' } }] } }),
      mutation: vi.fn().mockResolvedValue({}),
    };
    const result = await createTwentySmsRepository(client).recordDelivery({
      dedupeKey: 'sinch:delivery:message-1:DELIVERED', providerMessageId: 'message-1', providerConversationId: 'conversation-1', providerContactId: 'contact-1', status: 'DELIVERED', providerStatus: 'DELIVERED', occurredAt: '2020-01-01T00:01:00Z',
    });
    expect(result).toEqual({ created: false });
    expect(client.mutation).not.toHaveBeenCalled();
  });

  it('treats an exact delivery-event replay as a no-op', async () => {
    const client = {
      query: vi.fn().mockResolvedValue({ smsMessages: { edges: [{ node: { id: 'message-record-1', status: 'READ', lastDeliveryDedupeKey: 'sinch:delivery:message-1:READ', lastDeliveryOccurredAt: '2020-01-01T00:02:00Z' } }] } }),
      mutation: vi.fn().mockResolvedValue({}),
    };
    await expect(createTwentySmsRepository(client).recordDelivery({ dedupeKey: 'sinch:delivery:message-1:READ', providerMessageId: 'message-1', providerConversationId: 'conversation-1', providerContactId: 'contact-1', status: 'READ', providerStatus: 'READ', occurredAt: '2020-01-01T00:02:00Z' })).resolves.toEqual({ created: false });
    expect(client.mutation).not.toHaveBeenCalled();
  });

  it('records a newer unknown provider status without advancing the CRM delivery state', async () => {
    const client = {
      query: vi.fn().mockResolvedValue({ smsMessages: { edges: [{ node: { id: 'message-record-1', status: 'READ', lastDeliveryDedupeKey: 'sinch:delivery:message-1:READ', lastDeliveryOccurredAt: '2020-01-01T00:02:00Z' } }] } }),
      mutation: vi.fn().mockResolvedValue({}),
    };
    await expect(createTwentySmsRepository(client).recordDelivery({ dedupeKey: 'sinch:delivery:message-1:NEW_STATUS', providerMessageId: 'message-1', providerConversationId: 'conversation-1', providerContactId: 'contact-1', status: null, providerStatus: 'NEW_STATUS', occurredAt: '2020-01-01T00:03:00Z' })).resolves.toEqual({ created: true });
    expect(client.mutation).toHaveBeenCalledWith({ updateSmsMessage: { __args: { id: 'message-record-1', data: { providerContactId: 'contact-1', lastDeliveryDedupeKey: 'sinch:delivery:message-1:NEW_STATUS', lastDeliveryOccurredAt: '2020-01-01T00:03:00Z', lastProviderDeliveryStatus: 'NEW_STATUS' } }, id: true } });
  });
});
