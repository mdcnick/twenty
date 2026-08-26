import { type InboundSmsEvent, type SmsDeliveryEvent, type SmsSubmitEvent, parseInboundSmsCallback, parseSmsDeliveryCallback, parseSmsSubmitCallback } from 'src/logic-functions/utils/sinch-callback';
import { decideIdempotency } from 'src/logic-functions/utils/idempotency-decision';
import { isSuppressionKeyword } from 'src/logic-functions/utils/is-suppression-keyword';
import { normalizeE164Phone } from 'src/logic-functions/utils/normalize-e164-phone';
import { readSinchConfiguration, sendSinchSms, type SinchConfiguration, type SinchSendInput, type SinchSendResult } from 'src/logic-functions/sinch-client';
import { createTwentySmsRepository, type SmsRepository } from 'src/logic-functions/sms-repository';

export type SmsWebhookResult = { accepted: boolean; duplicate: boolean; error?: string };

export const processInboundSms = async (
  body: unknown,
  repository: SmsRepository = createTwentySmsRepository(),
): Promise<SmsWebhookResult> => {
  const event: InboundSmsEvent | null = parseInboundSmsCallback(body);
  if (!event) return { accepted: false, duplicate: false, error: 'Unsupported inbound Sinch callback.' };
  const decision = decideIdempotency(await repository.findMessageIdByDedupeKey(event.dedupeKey));
  if (decision === 'NOOP_DUPLICATE') return { accepted: true, duplicate: true };
  const persistence = await repository.recordInbound(event, isSuppressionKeyword(event.body));
  return { accepted: true, duplicate: !persistence.created };
};

export const processSmsDelivery = async (
  body: unknown,
  repository: SmsRepository = createTwentySmsRepository(),
): Promise<SmsWebhookResult> => {
  const event: SmsDeliveryEvent | null = parseSmsDeliveryCallback(body);
  if (!event) return { accepted: false, duplicate: false, error: 'Unsupported Sinch delivery callback.' };
  const persistence = await repository.recordDelivery(event);
  return { accepted: true, duplicate: !persistence.created };
};

export const processSmsSubmit = async (
  body: unknown,
  repository: SmsRepository = createTwentySmsRepository(),
): Promise<SmsWebhookResult> => {
  const event: SmsSubmitEvent | null = parseSmsSubmitCallback(body);
  if (!event) return { accepted: false, duplicate: false, error: 'Unsupported Sinch submit callback.' };
  const persistence = await repository.recordSubmit(event);
  return { accepted: true, duplicate: !persistence.created };
};

export type SendSmsInput = { toNumber: string; text: string; idempotencyKey: string };
export type SendSmsResult = { success: boolean; providerMessageId?: string; error?: string; persistence: 'durable_repository' };

type SendSmsDependencies = {
  readConfiguration: () => SinchConfiguration | null;
  send: (configuration: SinchConfiguration, input: SinchSendInput) => Promise<SinchSendResult>;
};

const defaultSendSmsDependencies: SendSmsDependencies = {
  readConfiguration: readSinchConfiguration,
  send: sendSinchSms,
};

export const sendSms = async (
  input: SendSmsInput,
  repository: SmsRepository = createTwentySmsRepository(),
  dependencies: SendSmsDependencies = defaultSendSmsDependencies,
): Promise<SendSmsResult> => {
  const phoneE164 = normalizeE164Phone(input.toNumber, 'US');
  const text = input.text.trim();
  const idempotencyKey = input.idempotencyKey.trim();
  if (!phoneE164 || !text || !idempotencyKey) return { success: false, error: 'toNumber, text, and idempotencyKey are required.', persistence: 'durable_repository' };
  if (await repository.isOutboundSuppressed(phoneE164)) return { success: false, error: 'Outbound SMS is blocked because this phone number is suppressed.', persistence: 'durable_repository' };
  const configuration = dependencies.readConfiguration();
  if (!configuration) return { success: false, error: 'Sinch outbound configuration is incomplete.', persistence: 'durable_repository' };
  const sent = await dependencies.send(configuration, { toE164: phoneE164, text, idempotencyKey });
  if (!sent.ok) return { success: false, error: sent.error, persistence: 'durable_repository' };
  await repository.recordOutboundAccepted({ providerMessageId: sent.providerMessageId, providerConversationId: sent.providerConversationId, toE164: phoneE164, text, idempotencyKey, occurredAt: new Date().toISOString() });
  return { success: true, providerMessageId: sent.providerMessageId, persistence: 'durable_repository' };
};
