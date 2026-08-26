import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';
import { Response } from 'twenty-sdk/logic-function';

import { SMS_WEBHOOK_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { processInboundSms, processSmsDelivery, processSmsSubmit, type SmsWebhookResult } from 'src/logic-functions/handlers';
import { createTwentySmsRepository, type SmsRepository } from 'src/logic-functions/sms-repository';
import { isStaleSinchWebhookTimestamp, verifySinchWebhookSignature } from 'src/logic-functions/utils/verify-sinch-webhook-signature';

type WebhookDependencies = {
  repository: () => SmsRepository;
  webhookSecret: () => string | undefined;
};

const defaultDependencies: WebhookDependencies = {
  repository: createTwentySmsRepository,
  webhookSecret: () => process.env.SINCH_WEBHOOK_SECRET,
};

const jsonResponse = (status: number, body: Record<string, unknown>) =>
  new Response(body, {
    status,
    headers: { 'content-type': 'application/json' },
  });

const processCallback = async (
  body: unknown,
  repository: SmsRepository,
): Promise<SmsWebhookResult> => {
  for (const processor of [processInboundSms, processSmsDelivery, processSmsSubmit]) {
    const result = await processor(body, repository);

    if (result.accepted) {
      return result;
    }
  }

  return { accepted: false, duplicate: false };
};

export const sinchWebhookHandler = async (
  payload: RoutePayload<unknown>,
  dependencies: WebhookDependencies = defaultDependencies,
): Promise<Response> => {
  const rawBody = payload.rawBody;
  const secret = dependencies.webhookSecret();
  const valid =
    typeof rawBody === 'string' &&
    Boolean(secret) &&
    verifySinchWebhookSignature({
      rawBody,
      secret: secret ?? '',
      signature: payload.headers['x-sinch-webhook-signature'],
      nonce: payload.headers['x-sinch-webhook-signature-nonce'],
      timestamp: payload.headers['x-sinch-webhook-signature-timestamp'],
      algorithm: payload.headers['x-sinch-webhook-signature-algorithm'],
    });

  if (!valid) {
    return jsonResponse(
      isStaleSinchWebhookTimestamp(
        payload.headers['x-sinch-webhook-signature-timestamp'],
      )
        ? 403
        : 401,
      { error: 'unauthorized' },
    );
  }

  let body: unknown;

  try {
    body = JSON.parse(rawBody);
  } catch {
    return jsonResponse(400, { error: 'malformed_callback' });
  }

  try {
    const result = await processCallback(body, dependencies.repository());

    return result.accepted
      ? jsonResponse(200, { ok: true, duplicate: result.duplicate })
      : jsonResponse(400, { error: 'unsupported_callback' });
  } catch {
    return jsonResponse(503, { error: 'persistence_unavailable' });
  }
};

export default defineLogicFunction({
  universalIdentifier: SMS_WEBHOOK_UNIVERSAL_IDENTIFIER,
  name: 'sinch-webhook',
  description:
    'Verifies and persists Sinch SMS inbound, delivery, and submit callbacks.',
  timeoutSeconds: 30,
  handler: (payload) => sinchWebhookHandler(payload),
  httpRouteTriggerSettings: {
    path: '/sms/sinch/webhook',
    httpMethod: 'POST',
    isAuthRequired: false,
    forwardedRequestHeaders: [
      'x-sinch-webhook-signature',
      'x-sinch-webhook-signature-nonce',
      'x-sinch-webhook-signature-timestamp',
      'x-sinch-webhook-signature-algorithm',
    ],
  },
});
