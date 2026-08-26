import { defineObject, FieldType } from 'twenty-sdk/define';

import {
  SMS_MESSAGE_BODY_FIELD_UNIVERSAL_IDENTIFIER,
  SMS_MESSAGE_DEDUPE_KEY_FIELD_UNIVERSAL_IDENTIFIER,
  SMS_MESSAGE_DIRECTION_FIELD_UNIVERSAL_IDENTIFIER,
  SMS_MESSAGE_LAST_DELIVERY_DEDUPE_KEY_FIELD_UNIVERSAL_IDENTIFIER,
  SMS_MESSAGE_LAST_DELIVERY_OCCURRED_AT_FIELD_UNIVERSAL_IDENTIFIER,
  SMS_MESSAGE_LAST_PROVIDER_DELIVERY_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
  SMS_MESSAGE_OBJECT_UNIVERSAL_IDENTIFIER,
  SMS_MESSAGE_OCCURRED_AT_FIELD_UNIVERSAL_IDENTIFIER,
  SMS_MESSAGE_PHONE_FIELD_UNIVERSAL_IDENTIFIER,
  SMS_MESSAGE_PROVIDER_CONTACT_ID_FIELD_UNIVERSAL_IDENTIFIER,
  SMS_MESSAGE_PROVIDER_ID_FIELD_UNIVERSAL_IDENTIFIER,
  SMS_MESSAGE_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineObject({
  universalIdentifier: SMS_MESSAGE_OBJECT_UNIVERSAL_IDENTIFIER,
  nameSingular: 'smsMessage',
  namePlural: 'smsMessages',
  labelSingular: 'SMS message',
  labelPlural: 'SMS messages',
  description: 'An inbound or outbound SMS record. Webhook payloads and secrets are never retained.',
  icon: 'IconMessage2',
  labelIdentifierFieldMetadataUniversalIdentifier: SMS_MESSAGE_BODY_FIELD_UNIVERSAL_IDENTIFIER,
  fields: [
    { universalIdentifier: SMS_MESSAGE_PROVIDER_ID_FIELD_UNIVERSAL_IDENTIFIER, type: FieldType.TEXT, name: 'providerMessageId', label: 'Provider message ID', description: 'Sinch message ID when one is provided.', icon: 'IconKey', isNullable: true, defaultValue: null },
    { universalIdentifier: SMS_MESSAGE_PROVIDER_CONTACT_ID_FIELD_UNIVERSAL_IDENTIFIER, type: FieldType.TEXT, name: 'providerContactId', label: 'Provider contact ID', description: 'Sinch contact ID when one is provided.', icon: 'IconUser', isNullable: true, defaultValue: null },
    { universalIdentifier: SMS_MESSAGE_LAST_DELIVERY_DEDUPE_KEY_FIELD_UNIVERSAL_IDENTIFIER, type: FieldType.TEXT, name: 'lastDeliveryDedupeKey', label: 'Last delivery event key', description: 'Most recent accepted Sinch delivery event identity.', icon: 'IconFingerprint', isNullable: true, defaultValue: null },
    { universalIdentifier: SMS_MESSAGE_LAST_DELIVERY_OCCURRED_AT_FIELD_UNIVERSAL_IDENTIFIER, type: FieldType.DATE_TIME, name: 'lastDeliveryOccurredAt', label: 'Last delivery event at', description: 'Timestamp of the most recent accepted Sinch delivery event.', icon: 'IconClock', isNullable: true, defaultValue: null },
    { universalIdentifier: SMS_MESSAGE_LAST_PROVIDER_DELIVERY_STATUS_FIELD_UNIVERSAL_IDENTIFIER, type: FieldType.TEXT, name: 'lastProviderDeliveryStatus', label: 'Last provider delivery status', description: 'Raw Sinch delivery status, including unknown values.', icon: 'IconProgress', isNullable: true, defaultValue: null },
    { universalIdentifier: SMS_MESSAGE_DEDUPE_KEY_FIELD_UNIVERSAL_IDENTIFIER, type: FieldType.TEXT, name: 'dedupeKey', label: 'Dedupe key', description: 'Stable provider event key used for idempotency.', icon: 'IconFingerprint' },
    { universalIdentifier: SMS_MESSAGE_PHONE_FIELD_UNIVERSAL_IDENTIFIER, type: FieldType.TEXT, name: 'phoneE164', label: 'Phone (E.164)', description: 'Normalized counterparty phone number.', icon: 'IconPhone' },
    { universalIdentifier: SMS_MESSAGE_BODY_FIELD_UNIVERSAL_IDENTIFIER, type: FieldType.TEXT, name: 'body', label: 'Message', description: 'SMS content.', icon: 'IconTextCaption' },
    { universalIdentifier: SMS_MESSAGE_DIRECTION_FIELD_UNIVERSAL_IDENTIFIER, type: FieldType.SELECT, name: 'direction', label: 'Direction', description: 'Whether the customer or workspace sent the message.', icon: 'IconArrowsExchange', defaultValue: "'INBOUND'", options: [{ id: 'c2bd7aca-a2dc-485f-a24c-d26f7f84c528', value: 'INBOUND', label: 'Inbound', color: 'blue', position: 0 }, { id: 'fa8d9459-80d7-45dc-80b8-f9efc2ef100c', value: 'OUTBOUND', label: 'Outbound', color: 'orange', position: 1 }] },
    { universalIdentifier: SMS_MESSAGE_STATUS_FIELD_UNIVERSAL_IDENTIFIER, type: FieldType.SELECT, name: 'status', label: 'Status', description: 'Most recent provider delivery status.', icon: 'IconProgress', defaultValue: "'RECEIVED'", options: [{ id: '278532a2-0abb-46ef-9f56-296da370f5f4', value: 'RECEIVED', label: 'Received', color: 'blue', position: 0 }, { id: '779cbff5-3657-45a1-907b-5a9de5c77ecc', value: 'PENDING', label: 'Pending', color: 'orange', position: 1 }, { id: 'cce0d18f-eed1-48d9-be10-b4d54fd85640', value: 'DELIVERED', label: 'Delivered', color: 'green', position: 2 }, { id: 'c6aaf2b9-6d9b-4e14-aea0-c9c76619f263', value: 'READ', label: 'Read', color: 'green', position: 3 }, { id: '986f2bd1-565c-4d17-a39d-d93352d8349a', value: 'FAILED', label: 'Failed', color: 'red', position: 4 }] },
    { universalIdentifier: SMS_MESSAGE_OCCURRED_AT_FIELD_UNIVERSAL_IDENTIFIER, type: FieldType.DATE_TIME, name: 'occurredAt', label: 'Occurred at', description: 'Provider event timestamp.', icon: 'IconClock' },
  ],
});
