import { createHash, randomUUID } from 'node:crypto';
import { defineLogicFunction } from 'twenty-sdk/define';
import { type StartCallInput, type StartCallResponse, SinchVoiceError, startSinchCall } from '../clients/sinch-voice-client';
import { SINCH_VOICE_BASE_URL, SINCH_VOICE_FROM_NUMBER, SINCH_VOICE_TOKEN, START_SINCH_CALL_UNIVERSAL_IDENTIFIER } from '../constants';
import { type CallEventRepository } from '../domain/call-event';
import { createTwentyCallRequestRepository, type CallRequestRepository } from '../utils/call-request-repository';
import { createTwentyCallEventRepository } from '../utils/upsert-call-event';

export type StartSinchCallInput = { toNumber: string; message: string; requestKey?: string };
export type StartSinchCallResult = { success: boolean; providerAccepted: boolean; retrySafe?: boolean; recovered?: boolean; callId?: string; requestKey: string; persistence?: 'confirmed' | 'uncertain'; error?: string };
type Configuration = { baseUrl: string; token: string; fromNumber: string };
type OutboundRequestRepository = Pick<CallRequestRepository, 'findByRequestKey' | 'createPending' | 'markProviderAccepted' | 'markPersistenceUncertain'>;
const REQUEST_KEY = /^[A-Za-z0-9._:-]{8,128}$/;

export const startSinchCallWithDependencies = async (input: StartSinchCallInput, dependencies: { configuration: Configuration; requests: OutboundRequestRepository; events: CallEventRepository; startProviderCall: (input: { baseUrl: string; token: string; input: StartCallInput }) => Promise<StartCallResponse> }): Promise<StartSinchCallResult> => {
  const requestKey = input.requestKey?.trim() || randomUUID();
  if (!REQUEST_KEY.test(requestKey)) return { success: false, providerAccepted: false, retrySafe: true, requestKey, error: 'requestKey must be 8-128 URL-safe characters' };
  if (!input.toNumber.trim() || !input.message.trim()) return { success: false, providerAccepted: false, retrySafe: true, requestKey, error: 'toNumber and message are required' };
  const existing = await dependencies.requests.findByRequestKey(requestKey);
  if (existing?.providerCallId) return { success: true, providerAccepted: true, recovered: true, callId: existing.providerCallId, requestKey, persistence: existing.status === 'PERSISTENCE_UNCERTAIN' ? 'uncertain' : 'confirmed' };
  if (existing?.status === 'PENDING' || existing?.status === 'PERSISTENCE_UNCERTAIN') return { success: false, providerAccepted: false, retrySafe: false, requestKey, persistence: 'uncertain', error: 'A prior call attempt is still pending reconciliation. Do not retry with a new request key.' };
  const request = existing ?? await dependencies.requests.createPending({ requestKey, fromNumber: dependencies.configuration.fromNumber, toNumber: input.toNumber.trim() });
  let provider: StartCallResponse;
  try {
    provider = await dependencies.startProviderCall({ baseUrl: dependencies.configuration.baseUrl, token: dependencies.configuration.token, input: { fromNumber: dependencies.configuration.fromNumber, toNumber: input.toNumber.trim(), message: input.message.trim(), idempotencyKey: requestKey } });
  } catch (error) {
    const message = error instanceof SinchVoiceError ? error.message : 'Unable to start Sinch Voice call';
    const kind = error instanceof SinchVoiceError ? error.kind : (error as { kind?: string }).kind;
    if (kind === 'timeout' || kind === 'network') {
      await dependencies.requests.markPersistenceUncertain(request.id);
      return { success: false, providerAccepted: false, retrySafe: false, requestKey, persistence: 'uncertain', error: 'Sinch call acceptance is unknown after a transport failure. Do not retry with a new request key.' };
    }
    return { success: false, providerAccepted: false, retrySafe: true, requestKey, error: message };
  }
  await dependencies.requests.markProviderAccepted(request.id, provider.callId);
  try {
    const occurredAt = new Date().toISOString();
    await dependencies.events.upsert({ providerCallId: provider.callId, fromNumber: dependencies.configuration.fromNumber, toNumber: input.toNumber.trim(), direction: 'OUTBOUND', status: 'RINGING', providerEventType: 'callout', payloadHash: createHash('sha256').update(`${requestKey}:${provider.callId}`).digest('hex'), externalSourceId: requestKey, startedAt: occurredAt, occurredAt });
    return { success: true, providerAccepted: true, callId: provider.callId, requestKey, persistence: 'confirmed' };
  } catch {
    await dependencies.requests.markPersistenceUncertain(request.id, provider.callId);
    return { success: false, providerAccepted: true, retrySafe: false, callId: provider.callId, requestKey, persistence: 'uncertain', error: 'Sinch accepted the call, but CallEvent persistence is uncertain. Do not retry with a new request key.' };
  }
};

export const startSinchCallHandler = async (input: StartSinchCallInput): Promise<StartSinchCallResult> => {
  const baseUrl = process.env[SINCH_VOICE_BASE_URL];
  const token = process.env[SINCH_VOICE_TOKEN];
  const fromNumber = process.env[SINCH_VOICE_FROM_NUMBER];
  const requestKey = input.requestKey?.trim() || randomUUID();
  if (!baseUrl || !token || !fromNumber) return { success: false, providerAccepted: false, retrySafe: true, requestKey, error: 'Sinch Voice outbound call configuration is incomplete' };
  return startSinchCallWithDependencies({ ...input, requestKey }, { configuration: { baseUrl, token, fromNumber }, requests: createTwentyCallRequestRepository(), events: createTwentyCallEventRepository(), startProviderCall: startSinchCall });
};

export default defineLogicFunction({
  universalIdentifier: START_SINCH_CALL_UNIVERSAL_IDENTIFIER, name: 'start-sinch-call',
  description: 'Durably reserves an idempotency key, starts a Sinch call, and records provider acceptance before reporting the result.', timeoutSeconds: 30,
  workflowActionTriggerSettings: { label: 'Start Sinch Call', icon: 'IconPhoneCall', inputSchema: [{ type: 'object', properties: { toNumber: { type: 'string' }, message: { type: 'string' }, requestKey: { type: 'string' } } }], outputSchema: [{ type: 'object', properties: { success: { type: 'boolean' }, providerAccepted: { type: 'boolean' }, retrySafe: { type: 'boolean' }, callId: { type: 'string' }, requestKey: { type: 'string' }, persistence: { type: 'string' }, error: { type: 'string' } } }] },
  handler: startSinchCallHandler,
});
