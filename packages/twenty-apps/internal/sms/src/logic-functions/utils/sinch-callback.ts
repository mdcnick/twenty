import { normalizeE164Phone } from 'src/logic-functions/utils/normalize-e164-phone';

export type InboundSmsEvent = {
  dedupeKey: string;
  providerMessageId: string;
  providerConversationId: string | null;
  providerContactId: string | null;
  phoneE164: string;
  body: string;
  occurredAt: string;
};

export type SmsDeliveryStatus = 'PENDING' | 'DELIVERED' | 'READ' | 'FAILED';

export type SmsDeliveryEvent = {
  dedupeKey: string;
  providerMessageId: string;
  providerConversationId: string | null;
  providerContactId: string | null;
  status: SmsDeliveryStatus | null;
  providerStatus: string;
  occurredAt: string;
};

export type SmsSubmitEvent = {
  dedupeKey: string;
  providerMessageId: string;
  providerConversationId: string | null;
  providerContactId: string | null;
  phoneE164: string;
  body: string;
  occurredAt: string;
};

type UnknownRecord = Record<string, unknown>;

const asRecord = (value: unknown): UnknownRecord | null =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as UnknownRecord)
    : null;

const asString = (value: unknown): string | null =>
  typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;

const eventTime = (payload: UnknownRecord, message?: UnknownRecord | null): string | null =>
  (message ? asString(message.accept_time) : null) ??
  asString(payload.event_time) ??
  asString(payload.accepted_time);

export const parseInboundSmsCallback = (payload: unknown): InboundSmsEvent | null => {
  const callback = asRecord(payload);
  const message = callback ? asRecord(callback.message) : null;
  const channelIdentity = message ? asRecord(message.channel_identity) : null;
  const providerMessageId = message ? asString(message.id) : null;
  const phoneE164 = channelIdentity
    ? normalizeE164Phone(asString(channelIdentity.identity) ?? '', 'US')
    : null;
  const contactMessage = message ? asRecord(message.contact_message) : null;
  const body = contactMessage ? asRecord(contactMessage.text_message) : null;
  const text = body ? asString(body.text) : null;
  const occurredAt = callback && message ? eventTime(callback, message) : null;

  if (
    !callback ||
    !message ||
    channelIdentity?.channel !== 'SMS' ||
    !providerMessageId ||
    !phoneE164 ||
    !text ||
    !occurredAt
  ) {
    return null;
  }

  return {
    dedupeKey: `sinch:inbound:${providerMessageId}`,
    providerMessageId,
    providerConversationId: asString(message.conversation_id),
    providerContactId: asString(message.contact_id),
    phoneE164,
    body: text,
    occurredAt,
  };
};

export const mapSinchDeliveryStatus = (status: string | null): SmsDeliveryStatus | null => {
  switch (status) {
    case 'QUEUED_ON_CHANNEL':
    case 'SWITCHING_CHANNEL':
      return 'PENDING';
    case 'DELIVERED':
      return 'DELIVERED';
    case 'READ':
      return 'READ';
    case 'FAILED':
      return 'FAILED';
    default:
      return null;
  }
};

export const parseSmsDeliveryCallback = (payload: unknown): SmsDeliveryEvent | null => {
  const callback = asRecord(payload);
  const report = callback ? asRecord(callback.message_delivery_report) : null;
  const providerMessageId = report ? asString(report.message_id) : null;
  const providerStatus = report ? asString(report.status) : null;
  const status = mapSinchDeliveryStatus(providerStatus);
  const occurredAt = callback ? eventTime(callback) : null;

  if (!callback || !report || !providerMessageId || !providerStatus || !occurredAt) {
    return null;
  }

  return {
    dedupeKey: `sinch:delivery:${providerMessageId}:${providerStatus}`,
    providerMessageId,
    providerConversationId: asString(report.conversation_id),
    providerContactId: asString(report.contact_id),
    status,
    providerStatus,
    occurredAt,
  };
};

export const parseSmsSubmitCallback = (payload: unknown): SmsSubmitEvent | null => {
  const callback = asRecord(payload);
  const notification = callback
    ? asRecord(callback.message_submit_notification)
    : null;
  const channelIdentity = notification
    ? asRecord(notification.channel_identity)
    : null;
  const submittedMessage = notification
    ? asRecord(notification.submitted_message)
    : null;
  const textMessage = submittedMessage
    ? asRecord(submittedMessage.text_message)
    : null;
  const providerMessageId = notification
    ? asString(notification.message_id)
    : null;
  const phoneE164 = channelIdentity
    ? normalizeE164Phone(asString(channelIdentity.identity) ?? '', 'US')
    : null;
  const body = textMessage ? asString(textMessage.text) : null;
  const occurredAt = callback ? eventTime(callback) : null;

  if (
    !callback ||
    !notification ||
    channelIdentity?.channel !== 'SMS' ||
    !providerMessageId ||
    !phoneE164 ||
    !body ||
    !occurredAt
  ) {
    return null;
  }

  return {
    dedupeKey: `sinch:submit:${providerMessageId}`,
    providerMessageId,
    providerConversationId: asString(notification.conversation_id),
    providerContactId: asString(notification.contact_id),
    phoneE164,
    body,
    occurredAt,
  };
};
