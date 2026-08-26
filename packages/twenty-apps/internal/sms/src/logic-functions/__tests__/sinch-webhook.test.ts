import { createHmac } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';

import { sinchWebhookHandler } from 'src/logic-functions/sinch-webhook';
import { type SmsRepository } from 'src/logic-functions/sms-repository';
import { type RoutePayload } from 'twenty-sdk/define';

const secret = 'test-webhook-secret';
const timestamp = String(Math.floor(Date.now() / 1000));
const nonce = 'unique-nonce';

const signedPayload = (rawBody: string): RoutePayload<unknown> => ({
  headers: {
    'x-sinch-webhook-signature': createHmac('sha256', secret).update(`${rawBody}.${nonce}.${timestamp}`, 'utf8').digest('base64'),
    'x-sinch-webhook-signature-nonce': nonce,
    'x-sinch-webhook-signature-timestamp': timestamp,
    'x-sinch-webhook-signature-algorithm': 'HmacSHA256',
  },
  rawBody,
} as unknown as RoutePayload<unknown>);

const staleSignedPayload = (rawBody: string): RoutePayload<unknown> => {
  const staleTimestamp = String(Math.floor(Date.now() / 1000) - 301);
  return {
    headers: {
      'x-sinch-webhook-signature': createHmac('sha256', secret).update(`${rawBody}.${nonce}.${staleTimestamp}`, 'utf8').digest('base64'),
      'x-sinch-webhook-signature-nonce': nonce,
      'x-sinch-webhook-signature-timestamp': staleTimestamp,
      'x-sinch-webhook-signature-algorithm': 'HmacSHA256',
    }, rawBody,
  } as unknown as RoutePayload<unknown>;
};

const repository = (): SmsRepository => ({
  findMessageIdByDedupeKey: vi.fn().mockResolvedValue(null),
  recordInbound: vi.fn().mockResolvedValue({ created: true }),
  recordDelivery: vi.fn().mockResolvedValue({ created: true }),
  recordSubmit: vi.fn().mockResolvedValue({ created: true }),
  isOutboundSuppressed: vi.fn().mockResolvedValue(false),
  recordOutboundAccepted: vi.fn().mockResolvedValue({ created: true }),
});

const dependencies = (repo: SmsRepository) => ({ repository: () => repo, webhookSecret: () => secret });
const fixture = async (name: string): Promise<string> => readFile(path.join(process.cwd(), 'test/fixtures', name), 'utf8');

describe('Sinch synchronous webhook routes', () => {
  it('rejects an unauthenticated request before parsing the body', async () => {
    const payload = { headers: {}, rawBody: '{bad-json}', get body(): never { throw new Error('body must not be read'); } } as unknown as RoutePayload<unknown>;
    await expect(sinchWebhookHandler(payload, dependencies(repository()))).resolves.toMatchObject({ __twentyHttpResponse: true, status: 401, body: { error: 'unauthorized' } });
  });

  it('returns 403 for an otherwise valid but stale signed callback', async () => {
    await expect(sinchWebhookHandler(staleSignedPayload(await fixture('sinch-message-inbound.json')), dependencies(repository()))).resolves.toMatchObject({ status: 403, body: { error: 'unauthorized' } });
  });

  it('returns 200 only after an authenticated official inbound callback is persisted', async () => {
    const repo = repository();
    const response = await sinchWebhookHandler(signedPayload(await fixture('sinch-message-inbound.json')), dependencies(repo));
    expect(response).toMatchObject({ __twentyHttpResponse: true, status: 200, headers: { 'content-type': 'application/json' }, body: { ok: true, duplicate: false } });
    expect(repo.recordInbound).toHaveBeenCalledOnce();
  });

  it('returns 400 for authenticated malformed JSON and 503 when inbound persistence is unavailable', async () => {
    await expect(sinchWebhookHandler(signedPayload('{bad-json}'), dependencies(repository()))).resolves.toMatchObject({ status: 400, body: { error: 'malformed_callback' } });
    const unavailable = repository();
    unavailable.recordInbound = vi.fn().mockRejectedValue(new Error('database unavailable'));
    await expect(sinchWebhookHandler(signedPayload(await fixture('sinch-message-inbound.json')), dependencies(unavailable))).resolves.toMatchObject({ status: 503, body: { error: 'persistence_unavailable' } });
  });

  it('uses the same synchronous response contract for authenticated delivery callbacks', async () => {
    const repo = repository();
    const response = await sinchWebhookHandler(signedPayload(await fixture('sinch-message-delivery.json')), dependencies(repo));
    expect(response).toMatchObject({ __twentyHttpResponse: true, status: 200, headers: { 'content-type': 'application/json' }, body: { ok: true, duplicate: false } });
    expect(repo.recordDelivery).toHaveBeenCalledOnce();
  });

  it.each([
    ['sinch-message-inbound.json', 'recordInbound'],
    ['sinch-message-delivery.json', 'recordDelivery'],
    ['sinch-message-submit.json', 'recordSubmit'],
  ] as const)('dispatches %s through the single Sinch webhook route', async (fixtureName, repositoryMethod) => {
    const repo = repository();
    const response = await sinchWebhookHandler(
      signedPayload(await fixture(fixtureName)),
      dependencies(repo),
    );

    expect(response).toMatchObject({
      __twentyHttpResponse: true,
      status: 200,
      body: { ok: true, duplicate: false },
    });
    expect(repo[repositoryMethod]).toHaveBeenCalledOnce();
  });
});
