import { describe, expect, it } from 'vitest';

import {
  createSmsIdempotencyKey,
  filterSmsConversations,
  getSmsConversationDisplayName,
  getSmsConversationPreview,
  type SmsConversation,
} from 'src/front-components/utils/sms-inbox';

const makeConversation = (
  overrides: Partial<SmsConversation> = {},
): SmsConversation => ({
  id: 'conversation-1',
  phoneE164: '+14015550123',
  status: 'OPEN',
  lastMessageAt: '2026-08-25T16:00:00.000Z',
  person: null,
  company: null,
  latestMessage: null,
  ...overrides,
});

describe('SMS inbox conversation helpers', () => {
  it('creates an idempotency key without relying on crypto.randomUUID', () => {
    expect(createSmsIdempotencyKey(1_725_000_000_000, 0.125)).toBe(
      'sms-inbox:1725000000000:4i',
    );
  });

  it('prefers the CRM person name over company and phone', () => {
    const conversation = makeConversation({
      person: {
        id: 'person-1',
        firstName: 'Jamie',
        lastName: 'Rivera',
      },
      company: { id: 'company-1', name: 'Rivera Services' },
    });

    expect(getSmsConversationDisplayName(conversation)).toBe('Jamie Rivera');
  });

  it('falls back to company and then the phone number', () => {
    expect(
      getSmsConversationDisplayName(
        makeConversation({
          company: { id: 'company-1', name: 'Rivera Services' },
        }),
      ),
    ).toBe('Rivera Services');
    expect(getSmsConversationDisplayName(makeConversation())).toBe(
      '+14015550123',
    );
  });

  it('filters by contact, company, phone, or message preview', () => {
    const conversations = [
      makeConversation({
        id: 'conversation-1',
        person: { id: 'person-1', firstName: 'Jamie', lastName: 'Rivera' },
        latestMessage: {
          id: 'message-1',
          body: 'The furnace is making a clicking noise.',
          direction: 'INBOUND',
          status: 'RECEIVED',
          occurredAt: '2026-08-25T16:00:00.000Z',
        },
      }),
      makeConversation({
        id: 'conversation-2',
        phoneE164: '+14015550999',
        company: { id: 'company-2', name: 'Northstar Properties' },
      }),
    ];

    expect(filterSmsConversations(conversations, 'furnace')).toHaveLength(1);
    expect(filterSmsConversations(conversations, 'northstar')).toHaveLength(1);
    expect(filterSmsConversations(conversations, '0999')).toHaveLength(1);
    expect(filterSmsConversations(conversations, 'jamie')).toHaveLength(1);
  });

  it('uses meaningful empty and latest-message previews', () => {
    expect(getSmsConversationPreview(makeConversation())).toBe(
      'No messages yet',
    );
    expect(
      getSmsConversationPreview(
        makeConversation({
          latestMessage: {
            id: 'message-1',
            body: '  Appointment confirmed for tomorrow.  ',
            direction: 'OUTBOUND',
            status: 'DELIVERED',
            occurredAt: '2026-08-25T16:00:00.000Z',
          },
        }),
      ),
    ).toBe('Appointment confirmed for tomorrow.');
  });
});
