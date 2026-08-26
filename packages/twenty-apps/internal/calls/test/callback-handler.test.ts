import { createHash, createHmac } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import { processSinchVoiceCallback } from '../src/logic-functions/process-sinch-voice-callback';

const secret = 'BeIukql3pTKJ8RGL5zo0DA==';
const method = 'POST';
const path = '/calls/sinch/voice';
const body = JSON.stringify({ event: 'ice', callid: 'fda71a45-f531-4bde-928c-ecc7720078a0', timestamp: '2026-08-25T14:00:00.000Z', from: { endpoint: '+13125550100' }, to: { endpoint: '+13125550101' } });
const signedHeaders = (rawBody = body) => {
  const timestamp = '2026-08-25T14:00:00.000Z';
  const md5 = createHash('md5').update(rawBody).digest('base64');
  const signature = createHmac('sha256', Buffer.from(secret, 'base64')).update(`${method}\n${md5}\napplication/json\nx-timestamp:${timestamp}\n${path}`).digest('base64');
  return { authorization: `application app-key:${signature}`, 'content-type': 'application/json', 'x-timestamp': timestamp };
};

describe('Sinch callback HTTP behavior', () => {
  it('persists a valid ICE before returning connectPstn SVAML', async () => {
    const upsert = vi.fn().mockResolvedValue({ action: 'create', id: 'call-event-1' });
    const response = await processSinchVoiceCallback({ rawBody: body, headers: signedHeaders(), method, path, now: new Date('2026-08-25T14:00:30.000Z'), configuration: { applicationKey: 'app-key', webhookSecret: secret, forwardTo: '+13125550199' }, repository: { upsert } });
    expect(upsert).toHaveBeenCalledTimes(1);
    expect(response).toMatchObject({ __twentyHttpResponse: true, status: 200, body: { action: { name: 'connectPstn', number: '+13125550199' } } });
  });
  it('returns marked 401, 400, and 503 response objects for signature, parsing, and persistence failures', async () => {
    const repository = { upsert: vi.fn().mockRejectedValue(new Error('database unavailable')) };
    await expect(processSinchVoiceCallback({ rawBody: body, headers: { ...signedHeaders(), authorization: 'application app-key:bad' }, method, path, now: new Date('2026-08-25T14:00:30.000Z'), configuration: { applicationKey: 'app-key', webhookSecret: secret }, repository })).resolves.toMatchObject({ __twentyHttpResponse: true, status: 401 });
    await expect(processSinchVoiceCallback({ rawBody: '{', headers: signedHeaders('{'), method, path, now: new Date('2026-08-25T14:00:30.000Z'), configuration: { applicationKey: 'app-key', webhookSecret: secret }, repository })).resolves.toMatchObject({ __twentyHttpResponse: true, status: 400 });
    await expect(processSinchVoiceCallback({ rawBody: body, headers: signedHeaders(), method, path, now: new Date('2026-08-25T14:00:30.000Z'), configuration: { applicationKey: 'app-key', webhookSecret: secret }, repository })).resolves.toMatchObject({ __twentyHttpResponse: true, status: 503 });
  });
  it('reconciles callback custom requestKey before responding successfully', async () => {
    const rawBody = JSON.stringify({ event: 'ace', callid: 'provider-call-1', timestamp: '2026-08-25T14:00:00.000Z', custom: 'request-0001' });
    const rawHeaders = signedHeaders(rawBody);
    const requests = { markProviderAcceptedByRequestKey: vi.fn().mockResolvedValue(undefined) };
    const response = await processSinchVoiceCallback({ rawBody, headers: rawHeaders, method, path, now: new Date('2026-08-25T14:00:30.000Z'), configuration: { applicationKey: 'app-key', webhookSecret: secret }, repository: { upsert: vi.fn().mockResolvedValue({ action: 'update', id: 'event-1' }) }, requests });
    expect(requests.markProviderAcceptedByRequestKey).toHaveBeenCalledWith('request-0001', 'provider-call-1');
    expect(response).toMatchObject({ __twentyHttpResponse: true, status: 200 });
  });
});
