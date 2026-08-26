import { Response } from 'twenty-sdk/logic-function';
import { type CallEventRepository } from '../domain/call-event';
import { type CallRequestRepository } from '../utils/call-request-repository';
import { parseSinchCallEvent } from '../utils/normalize-sinch-call-event';
import { verifySinchVoiceSignature } from '../utils/sinch-voice-signature';

const E164 = /^\+[1-9]\d{7,14}$/;
type CallbackInput = {
  rawBody: string;
  headers: Record<string, string | undefined>;
  method: string;
  path: string;
  now?: Date;
  configuration: { applicationKey: string; webhookSecret: string; forwardTo?: string };
  repository: CallEventRepository;
  requests?: Pick<CallRequestRepository, 'markProviderAcceptedByRequestKey'>;
};

const svamlFor = (eventType: string, forwardTo?: string) => {
  if (eventType === 'ice' && forwardTo && E164.test(forwardTo)) return { action: { name: 'connectPstn', number: forwardTo } };
  if (eventType === 'ice') return { action: { name: 'hangup' } };
  return { action: { name: eventType === 'ace' ? 'continue' : 'hangup' } };
};

export const processSinchVoiceCallback = async ({ rawBody, headers, method, path, now, configuration, repository, requests }: CallbackInput): Promise<Response> => {
  const verification = verifySinchVoiceSignature({ rawBody, headers, method, path, applicationKey: configuration.applicationKey, applicationSecret: configuration.webhookSecret, now });
  if (!verification.valid) return new Response({ error: verification.error }, { status: verification.error.includes('stale') ? 403 : 401 });
  let event;
  try { event = parseSinchCallEvent(rawBody); } catch (error) { return new Response({ error: error instanceof Error ? error.message : 'Malformed Sinch callback' }, { status: 400 }); }
  try {
    await repository.upsert(event);
  } catch {
    return new Response({ error: 'CallEvent persistence is unavailable' }, { status: 503 });
  }
  if (event.externalSourceId && requests) {
    try { await requests.markProviderAcceptedByRequestKey(event.externalSourceId, event.providerCallId); } catch { return new Response({ error: 'Call request reconciliation is unavailable' }, { status: 503 }); }
  }
  return new Response(svamlFor(event.providerEventType.toLowerCase(), configuration.forwardTo), { status: 200, headers: { 'content-type': 'application/json' } });
};
