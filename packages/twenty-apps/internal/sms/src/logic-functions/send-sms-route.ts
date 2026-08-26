import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';
import { Response } from 'twenty-sdk/logic-function';

import { SMS_SEND_ROUTE_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { sendSms } from 'src/logic-functions/handlers';

type SendSmsRouteBody = {
  toNumber?: unknown;
  text?: unknown;
  idempotencyKey?: unknown;
};

const asString = (value: unknown): string =>
  typeof value === 'string' ? value : '';

export const sendSmsRouteHandler = async (
  event: RoutePayload<SendSmsRouteBody>,
): Promise<Response> => {
  const result = await sendSms({
    toNumber: asString(event.body?.toNumber),
    text: asString(event.body?.text),
    idempotencyKey: asString(event.body?.idempotencyKey),
  });

  return new Response(JSON.stringify(result), {
    status: result.success ? 200 : 400,
    headers: { 'Content-Type': 'application/json' },
  });
};

export default defineLogicFunction({
  universalIdentifier: SMS_SEND_ROUTE_UNIVERSAL_IDENTIFIER,
  name: 'send-sms-route',
  description: 'Authenticated HTTP endpoint used by the SMS inbox composer.',
  timeoutSeconds: 30,
  handler: sendSmsRouteHandler,
  httpRouteTriggerSettings: {
    path: '/sms/send',
    httpMethod: 'POST',
    isAuthRequired: true,
  },
});
