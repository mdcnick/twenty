import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';
import { Response } from 'twenty-sdk/logic-function';
import { SINCH_VOICE_FORWARD_TO, SINCH_VOICE_TOKEN, SINCH_VOICE_WEBHOOK_SECRET, SINCH_VOICE_WEBHOOK_UNIVERSAL_IDENTIFIER } from '../constants';
import { processSinchVoiceCallback } from './process-sinch-voice-callback';
import { createTwentyCallEventRepository } from '../utils/upsert-call-event';
import { createTwentyCallRequestRepository } from '../utils/call-request-repository';

const applicationKeyFromToken = (token: string) => token.split(':', 1)[0];

export const sinchVoiceWebhookHandler = async (payload: RoutePayload): Promise<Response> => {
  const rawBody = payload.rawBody;
  const token = process.env[SINCH_VOICE_TOKEN];
  const secret = process.env[SINCH_VOICE_WEBHOOK_SECRET];
  if (!rawBody || !token || !secret) return new Response({ error: 'Sinch Voice callback configuration is incomplete' }, { status: 503 });
  return processSinchVoiceCallback({ rawBody, headers: payload.headers, method: payload.requestContext.http.method, path: payload.requestContext.http.path, configuration: { applicationKey: applicationKeyFromToken(token), webhookSecret: secret, forwardTo: process.env[SINCH_VOICE_FORWARD_TO]?.trim() }, repository: createTwentyCallEventRepository(), requests: createTwentyCallRequestRepository() });
};

export default defineLogicFunction({
  universalIdentifier: SINCH_VOICE_WEBHOOK_UNIVERSAL_IDENTIFIER,
  name: 'sinch-voice-webhook',
  description: 'Public Sinch Voice callback receiver. It verifies signed callbacks, atomically persists CallEvents, and returns event-appropriate SVAML.',
  timeoutSeconds: 30,
  handler: sinchVoiceWebhookHandler,
  httpRouteTriggerSettings: { path: '/calls/sinch/voice', httpMethod: 'POST', isAuthRequired: false, forwardedRequestHeaders: ['authorization', 'content-type', 'x-timestamp'] },
});
