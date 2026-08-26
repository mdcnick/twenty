import { createHash, createHmac } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import { startSinchCall, SinchVoiceError } from '../src/clients/sinch-voice-client';
import { parseSinchCallEvent, mapSinchCallStatus } from '../src/utils/normalize-sinch-call-event';
import { verifySinchVoiceSignature } from '../src/utils/sinch-voice-signature';
import { callEventWriteDto, createTwentyCallEventRepository, decideCallEventUpsert, mergeCallEvent } from '../src/utils/upsert-call-event';

const secret = 'BeIukql3pTKJ8RGL5zo0DA==';
const body = '{"event":"ace","callid":"822aa4b7-05b4-4d83-87c7-1f835ee0b6f6_257","timestamp":"2014-09-24T10:59:41Z","version":1}';
const timestamp = '2014-09-24T10:59:41Z';
const signature = createHmac('sha256', Buffer.from(secret, 'base64')).update(`POST\n${createHash('md5').update(body).digest('base64')}\napplication/json\nx-timestamp:${timestamp}\n/calls/sinch/voice`).digest('base64');

describe('Sinch Voice callback utilities', () => {
  it('verifies the official raw-body callback signature contract', () => expect(verifySinchVoiceSignature({ rawBody: body, headers: { authorization: `application test-key:${signature}`, 'content-type': 'application/json', 'x-timestamp': timestamp }, method: 'POST', path: '/calls/sinch/voice', applicationKey: 'test-key', applicationSecret: secret, now: new Date(timestamp) })).toEqual({ valid: true }));
  it('rejects modified raw callback data', () => expect(verifySinchVoiceSignature({ rawBody: `${body} `, headers: { authorization: `application test-key:${signature}`, 'content-type': 'application/json', 'x-timestamp': timestamp }, method: 'POST', path: '/calls/sinch/voice', applicationKey: 'test-key', applicationSecret: secret }).valid).toBe(false));
  it('binds signatures to method, resource path, and fresh timestamp', () => {
    const input = { rawBody: body, headers: { authorization: `application test-key:${signature}`, 'content-type': 'application/json', 'x-timestamp': timestamp }, applicationKey: 'test-key', applicationSecret: secret, now: new Date(timestamp) };
    expect(verifySinchVoiceSignature({ ...input, method: 'PUT', path: '/calls/sinch/voice' }).valid).toBe(false);
    expect(verifySinchVoiceSignature({ ...input, method: 'POST', path: '/calls/other' }).valid).toBe(false);
    expect(verifySinchVoiceSignature({ ...input, method: 'POST', path: '/calls/sinch/voice', now: new Date('2014-09-24T11:10:00Z') })).toMatchObject({ valid: false, error: expect.stringMatching(/stale/) });
  });
  it('normalizes events without retaining the raw payload', () => {
    const event = parseSinchCallEvent(body);
    expect(event).toMatchObject({ providerCallId: '822aa4b7-05b4-4d83-87c7-1f835ee0b6f6_257', direction: 'OUTBOUND', status: 'ANSWERED', providerEventType: 'ace' });
    expect(event.payloadHash).toHaveLength(64);
  });
  it('parses official ICE, ACE, and DiCE shapes and moves lifecycle forward', () => {
    const ice = parseSinchCallEvent(JSON.stringify({ event: 'ice', callid: 'call-ice', timestamp: '2026-08-25T14:00:00Z', from: { endpoint: '+13125550100' }, to: { endpoint: '+13125550101' } }));
    const ace = parseSinchCallEvent(JSON.stringify({ event: 'ace', callid: 'call-ice', timestamp: '2026-08-25T14:00:03Z' }));
    const dice = parseSinchCallEvent(JSON.stringify({ event: 'dice', callid: 'call-ice', timestamp: '2026-08-25T14:00:11Z', duration: 8 }));
    expect(ice).toMatchObject({ direction: 'INBOUND', fromNumber: '+13125550100', toNumber: '+13125550101', startedAt: '2026-08-25T14:00:00Z' });
    expect(ace.status).toBe('ANSWERED'); expect(dice).toMatchObject({ status: 'COMPLETED', endedAt: '2026-08-25T14:00:11Z', durationSeconds: 8 });
    expect(decideCallEventUpsert({ id: 'event-1', payloadHash: ice.payloadHash, status: ice.status }, ace)).toEqual({ action: 'update', id: 'event-1' });
    expect(decideCallEventUpsert({ id: 'event-1', payloadHash: dice.payloadHash, status: dice.status }, ace)).toEqual({ action: 'ignore', id: 'event-1' });
    expect(mergeCallEvent({ id: 'event-1', status: ice.status, direction: ice.direction, fromNumber: { primaryPhoneNumber: ice.fromNumber }, toNumber: { primaryPhoneNumber: ice.toNumber }, startedAt: ice.startedAt }, ace)).toMatchObject({ direction: 'INBOUND', fromNumber: '+13125550100', toNumber: '+13125550101', startedAt: '2026-08-25T14:00:00Z', status: 'ANSWERED' });
  });
  it('retains ICE identity fields through the complete repository ICE-to-ACE-to-DiCE sequence', async () => {
    const ice = parseSinchCallEvent(JSON.stringify({ event: 'ice', callid: 'call-sequence', timestamp: '2026-08-25T14:00:00Z', from: { endpoint: '+13125550100' }, to: { endpoint: '+13125550101' } }));
    const ace = parseSinchCallEvent(JSON.stringify({ event: 'ace', callid: 'call-sequence', timestamp: '2026-08-25T14:00:03Z' }));
    const dice = parseSinchCallEvent(JSON.stringify({ event: 'dice', callid: 'call-sequence', timestamp: '2026-08-25T14:00:11Z', duration: 8 }));
    const client = { query: vi.fn()
      .mockResolvedValueOnce({ callEvents: { edges: [] } })
      .mockResolvedValueOnce({ callEvents: { edges: [{ node: { id: 'event-1', payloadHash: ice.payloadHash, status: 'RINGING', direction: 'INBOUND', fromNumber: { primaryPhoneNumber: '+13125550100' }, toNumber: { primaryPhoneNumber: '+13125550101' }, startedAt: '2026-08-25T14:00:00Z' } }] } })
      .mockResolvedValueOnce({ callEvents: { edges: [{ node: { id: 'event-1', payloadHash: ace.payloadHash, status: 'ANSWERED', direction: 'INBOUND', fromNumber: { primaryPhoneNumber: '+13125550100' }, toNumber: { primaryPhoneNumber: '+13125550101' }, startedAt: '2026-08-25T14:00:00Z' } }] } }), mutation: vi.fn().mockResolvedValue({}) };
    const repository = createTwentyCallEventRepository(client);
    await repository.upsert(ice); await repository.upsert(ace); await repository.upsert(dice);
    const [iceWrite, aceWrite, diceWrite] = client.mutation.mock.calls.map(([request]) => request.createCallEvent.__args.data);
    expect(iceWrite).toMatchObject({ direction: 'INBOUND', fromNumber: { primaryPhoneNumber: '+13125550100' }, toNumber: { primaryPhoneNumber: '+13125550101' }, startedAt: '2026-08-25T14:00:00Z' });
    expect(aceWrite).toMatchObject({ direction: 'INBOUND', fromNumber: { primaryPhoneNumber: '+13125550100' }, toNumber: { primaryPhoneNumber: '+13125550101' }, startedAt: '2026-08-25T14:00:00Z', status: 'ANSWERED' });
    expect(diceWrite).toMatchObject({ direction: 'INBOUND', fromNumber: { primaryPhoneNumber: '+13125550100' }, toNumber: { primaryPhoneNumber: '+13125550101' }, startedAt: '2026-08-25T14:00:00Z', endedAt: '2026-08-25T14:00:11Z', durationSeconds: 8, status: 'COMPLETED' });
  });
  it('maps terminal failures and call lifecycle states', () => {
    expect(mapSinchCallStatus('ice')).toBe('RINGING'); expect(mapSinchCallStatus('ace')).toBe('ANSWERED'); expect(mapSinchCallStatus('dice')).toBe('COMPLETED'); expect(mapSinchCallStatus('dice', 'busy')).toBe('MISSED'); expect(mapSinchCallStatus('error')).toBe('FAILED');
  });
  it('makes idempotent upsert decisions', () => {
    const incoming = parseSinchCallEvent(body);
    expect(decideCallEventUpsert(null, incoming).action).toBe('create');
    expect(decideCallEventUpsert({ id: 'record-1', payloadHash: incoming.payloadHash }, incoming)).toEqual({ action: 'ignore', id: 'record-1' });
    expect(decideCallEventUpsert({ id: 'record-1', payloadHash: 'previous', status: 'RINGING' }, incoming)).toEqual({ action: 'update', id: 'record-1' });
  });
  it('writes PHONE composite values and performs the generated client create path', async () => {
    const incoming = parseSinchCallEvent(JSON.stringify({ event: 'ice', callid: 'call-write', timestamp: '2026-08-25T14:00:00Z', from: { endpoint: '+13125550100' }, to: { endpoint: '+13125550101' } }));
    expect(callEventWriteDto(incoming)).toMatchObject({ fromNumber: { primaryPhoneNumber: '+13125550100' }, toNumber: { primaryPhoneNumber: '+13125550101' } });
    const client = { query: vi.fn().mockResolvedValue({ callEvents: { edges: [] } }), mutation: vi.fn().mockResolvedValue({ createCallEvent: { id: 'event-1' } }) };
    await expect(createTwentyCallEventRepository(client).upsert(incoming)).resolves.toMatchObject({ action: 'create' });
    expect(client.mutation).toHaveBeenCalledWith(expect.objectContaining({ createCallEvent: expect.any(Object) }));
  });
});

describe('Sinch Voice outbound client', () => {
  const base = { baseUrl: 'https://calling-use1.api.sinch.com/v1', token: 'app-key:BeIukql3pTKJ8RGL5zo0DA==', input: { fromNumber: '+15555550100', toNumber: '+15555550101', message: 'Hello', idempotencyKey: 'request-0001' } };
  it('uses native fetch with the expected basic authorization and payload', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response('{"callId":"call-1"}', { status: 200 }));
    await expect(startSinchCall({ ...base, fetchImpl })).resolves.toEqual({ callId: 'call-1' });
    expect(fetchImpl).toHaveBeenCalledWith('https://calling-use1.api.sinch.com/v1/callouts', expect.objectContaining({ method: 'POST', headers: expect.objectContaining({ authorization: expect.stringMatching(/^application app-key:/), 'content-md5': expect.any(String), 'x-timestamp': expect.any(String) }) }));
    expect(JSON.parse(fetchImpl.mock.calls[0][1].body)).toMatchObject({ method: 'ttsCallout', ttsCallout: { cli: base.input.fromNumber, destination: { endpoint: base.input.toNumber }, text: base.input.message } });
  });
  it('classifies HTTP and network failures', async () => {
    await expect(startSinchCall({ ...base, fetchImpl: vi.fn().mockResolvedValue(new Response('bad', { status: 503 })) })).rejects.toMatchObject({ kind: 'http', status: 503 } satisfies Partial<SinchVoiceError>);
    await expect(startSinchCall({ ...base, fetchImpl: vi.fn().mockRejectedValue(new Error('offline')) })).rejects.toMatchObject({ kind: 'network' } satisfies Partial<SinchVoiceError>);
  });
  it('classifies an aborted request as timeout', async () => {
    const fetchImpl = vi.fn((_url: string, init: RequestInit) => new Promise<Response>((_resolve, reject) => init.signal?.addEventListener('abort', () => reject(new Error('aborted')))));
    await expect(startSinchCall({ ...base, fetchImpl, timeoutMs: 1 })).rejects.toMatchObject({ kind: 'timeout' } satisfies Partial<SinchVoiceError>);
  });
});
