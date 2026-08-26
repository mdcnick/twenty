import { describe, expect, it, vi } from 'vitest';
import { startSinchCallWithDependencies } from '../src/logic-functions/start-sinch-call';

const configuration = { baseUrl: 'https://calling-use1.api.sinch.com/v1', token: 'app-key:BeIukql3pTKJ8RGL5zo0DA==', fromNumber: '+13125550100' };
const input = { toNumber: '+13125550101', message: 'Hello', requestKey: 'request-0001' };

describe('outbound durable request handling', () => {
  it('creates a pending request before calling Sinch and sends the durable request key', async () => {
    const requests = { findByRequestKey: vi.fn().mockResolvedValue(null), createPending: vi.fn().mockResolvedValue({ id: 'request-1', requestKey: input.requestKey, status: 'PENDING' }), markProviderAccepted: vi.fn().mockResolvedValue(undefined), markPersistenceUncertain: vi.fn().mockResolvedValue(undefined) };
    const startProviderCall = vi.fn().mockResolvedValue({ callId: 'provider-call-1' });
    const events = { upsert: vi.fn().mockResolvedValue({ action: 'create', id: 'event-1' }) };
    const result = await startSinchCallWithDependencies(input, { configuration, requests, events, startProviderCall });
    expect(requests.createPending.mock.invocationCallOrder[0]).toBeLessThan(startProviderCall.mock.invocationCallOrder[0]);
    expect(startProviderCall).toHaveBeenCalledWith(expect.objectContaining({ input: expect.objectContaining({ idempotencyKey: input.requestKey }) }));
    expect(events.upsert).toHaveBeenCalledWith(expect.objectContaining({ startedAt: expect.any(String), occurredAt: expect.any(String) }));
    expect(result).toEqual({ success: true, providerAccepted: true, callId: 'provider-call-1', requestKey: input.requestKey, persistence: 'confirmed' });
  });

  it('does not retry a duplicate request key', async () => {
    const requests = { findByRequestKey: vi.fn().mockResolvedValue({ id: 'request-1', requestKey: input.requestKey, status: 'ACCEPTED', providerCallId: 'provider-call-1' }), createPending: vi.fn(), markProviderAccepted: vi.fn(), markPersistenceUncertain: vi.fn() };
    const startProviderCall = vi.fn();
    const result = await startSinchCallWithDependencies(input, { configuration, requests, events: { upsert: vi.fn() }, startProviderCall });
    expect(startProviderCall).not.toHaveBeenCalled();
    expect(result).toMatchObject({ success: true, providerAccepted: true, recovered: true, callId: 'provider-call-1', requestKey: input.requestKey });
  });
  it('does not call Sinch again for an existing pending request key', async () => {
    const requests = { findByRequestKey: vi.fn().mockResolvedValue({ id: 'request-1', requestKey: input.requestKey, status: 'PENDING' }), createPending: vi.fn(), markProviderAccepted: vi.fn(), markPersistenceUncertain: vi.fn(), markProviderAcceptedByRequestKey: vi.fn() };
    const startProviderCall = vi.fn();
    const result = await startSinchCallWithDependencies(input, { configuration, requests, events: { upsert: vi.fn() }, startProviderCall });
    expect(startProviderCall).not.toHaveBeenCalled();
    expect(result).toMatchObject({ success: false, providerAccepted: false, retrySafe: false, requestKey: input.requestKey, persistence: 'uncertain' });
  });
  it('treats timeout or network uncertainty after a provider attempt as non-retryable', async () => {
    const requests = { findByRequestKey: vi.fn().mockResolvedValue(null), createPending: vi.fn().mockResolvedValue({ id: 'request-1', requestKey: input.requestKey, status: 'PENDING' }), markProviderAccepted: vi.fn(), markPersistenceUncertain: vi.fn().mockResolvedValue(undefined), markProviderAcceptedByRequestKey: vi.fn() };
    const result = await startSinchCallWithDependencies(input, { configuration, requests, events: { upsert: vi.fn() }, startProviderCall: vi.fn().mockRejectedValue(Object.assign(new Error('timed out'), { kind: 'timeout' })) });
    expect(requests.markPersistenceUncertain).toHaveBeenCalledWith('request-1');
    expect(result).toMatchObject({ success: false, providerAccepted: false, retrySafe: false, persistence: 'uncertain' });
  });

  it('reports provider acceptance with uncertain persistence instead of a retryable failure', async () => {
    const requests = { findByRequestKey: vi.fn().mockResolvedValue(null), createPending: vi.fn().mockResolvedValue({ id: 'request-1', requestKey: input.requestKey, status: 'PENDING' }), markProviderAccepted: vi.fn().mockResolvedValue(undefined), markPersistenceUncertain: vi.fn().mockResolvedValue(undefined) };
    const result = await startSinchCallWithDependencies(input, { configuration, requests, events: { upsert: vi.fn().mockRejectedValue(new Error('database unavailable')) }, startProviderCall: vi.fn().mockResolvedValue({ callId: 'provider-call-1' }) });
    expect(requests.markPersistenceUncertain).toHaveBeenCalledWith('request-1', 'provider-call-1');
    expect(result).toEqual({ success: false, providerAccepted: true, retrySafe: false, callId: 'provider-call-1', requestKey: input.requestKey, persistence: 'uncertain', error: 'Sinch accepted the call, but CallEvent persistence is uncertain. Do not retry with a new request key.' });
  });
});
