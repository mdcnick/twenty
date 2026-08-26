import { beforeEach, describe, expect, it } from 'vitest';

import { clearSinchAccessTokenCache, sendSinchSms, type SinchConfiguration } from 'src/logic-functions/sinch-client';

const configuration: SinchConfiguration = {
  projectId: 'project-id', appId: 'app-id', keyId: 'key-id', keySecret: 'key-secret', fromNumber: '+13125550199', region: 'us',
};

describe('Sinch SMS client', () => {
  beforeEach(() => clearSinchAccessTokenCache());
  it('sends the documented Conversation API SMS body exactly once', async () => {
    let request: RequestInit | undefined;
    let url = '';
    let calls = 0;
    const fetchMock: typeof fetch = async (input, init) => {
      calls += 1; url = String(input); request = init;
      if (calls === 1) return new Response(JSON.stringify({ access_token: 'short-lived-token', expires_in: 3600 }), { status: 200 });
      return new Response(JSON.stringify({ message_id: 'message-1', conversation_id: 'conversation-1' }), { status: 200 });
    };
    const result = await sendSinchSms(configuration, { toE164: '+13125550100', text: 'Hello', idempotencyKey: 'dedupe-1' }, fetchMock);
    expect(result).toEqual({ ok: true, providerMessageId: 'message-1', providerConversationId: 'conversation-1' });
    expect(url).toBe('https://us.conversation.api.sinch.com/v1/projects/project-id/messages:send');
    expect(request?.headers).toMatchObject({ Authorization: 'Bearer short-lived-token', 'Content-Type': 'application/json', 'Idempotency-Key': 'dedupe-1' });
    expect(JSON.parse(String(request?.body))).toEqual({ app_id: 'app-id', recipient: { identified_by: { channel_identities: [{ channel: 'SMS', identity: '13125550100' }] } }, message: { text_message: { text: 'Hello' } }, channel_priority_order: ['SMS'], channel_properties: { SMS_SENDER: '+13125550199' } });
  });

  it('classifies non-2xx provider responses without retrying', async () => {
    let calls = 0;
    const fetchMock: typeof fetch = async () => { calls += 1; return calls === 1 ? new Response(JSON.stringify({ access_token: 'short-lived-token', expires_in: 3600 }), { status: 200 }) : new Response('bad input', { status: 422 }); };
    await expect(sendSinchSms(configuration, { toE164: '+13125550100', text: 'Hello', idempotencyKey: 'dedupe-2' }, fetchMock)).resolves.toEqual({ ok: false, kind: 'provider', statusCode: 422, error: 'bad input' });
    expect(calls).toBe(2);
  });

  it('classifies aborts and network errors', async () => {
    let timeoutCall = 0;
    const timeoutFetch: typeof fetch = async (_input, init) => { timeoutCall += 1; if (timeoutCall === 1) return new Response(JSON.stringify({ access_token: 'short-lived-token', expires_in: 3600 }), { status: 200 }); return new Promise((_resolve, reject) => init?.signal?.addEventListener('abort', () => reject(new Error('aborted')))); };
    const timeout = await sendSinchSms(configuration, { toE164: '+13125550100', text: 'Hello', idempotencyKey: 'dedupe-3' }, timeoutFetch, 1);
    expect(timeout).toEqual({ ok: false, kind: 'timeout', error: 'Sinch request timed out.' });
    const networkFetch: typeof fetch = async () => { throw new Error('offline'); };
    await expect(sendSinchSms(configuration, { toE164: '+13125550100', text: 'Hello', idempotencyKey: 'dedupe-4' }, networkFetch)).resolves.toEqual({ ok: false, kind: 'network', error: 'offline' });
  });

  it('exchanges access-key credentials once and reuses a valid OAuth token', async () => {
    let calls = 0;
    const fetchMock: typeof fetch = async () => { calls += 1; return calls === 1 ? new Response(JSON.stringify({ access_token: 'cached-token', expires_in: 3600 }), { status: 200 }) : new Response(JSON.stringify({ message_id: `message-${calls}` }), { status: 200 }); };
    await sendSinchSms(configuration, { toE164: '+13125550100', text: 'First', idempotencyKey: 'dedupe-5' }, fetchMock);
    await sendSinchSms(configuration, { toE164: '+13125550100', text: 'Second', idempotencyKey: 'dedupe-6' }, fetchMock);
    expect(calls).toBe(3);
  });
});
