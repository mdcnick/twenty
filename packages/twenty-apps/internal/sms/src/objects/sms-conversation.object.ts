import { defineObject, FieldType } from 'twenty-sdk/define';

import {
  SMS_CONVERSATION_LAST_MESSAGE_AT_FIELD_UNIVERSAL_IDENTIFIER,
  SMS_CONVERSATION_OBJECT_UNIVERSAL_IDENTIFIER,
  SMS_CONVERSATION_PHONE_FIELD_UNIVERSAL_IDENTIFIER,
  SMS_CONVERSATION_PROVIDER_ID_FIELD_UNIVERSAL_IDENTIFIER,
  SMS_CONVERSATION_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineObject({
  universalIdentifier: SMS_CONVERSATION_OBJECT_UNIVERSAL_IDENTIFIER,
  nameSingular: 'smsConversation',
  namePlural: 'smsConversations',
  labelSingular: 'SMS conversation',
  labelPlural: 'SMS conversations',
  description: 'A Sinch SMS conversation linked to a CRM person or company when known.',
  icon: 'IconMessage',
  labelIdentifierFieldMetadataUniversalIdentifier: SMS_CONVERSATION_PHONE_FIELD_UNIVERSAL_IDENTIFIER,
  fields: [
    { universalIdentifier: SMS_CONVERSATION_PROVIDER_ID_FIELD_UNIVERSAL_IDENTIFIER, type: FieldType.TEXT, name: 'providerConversationId', label: 'Provider conversation ID', description: 'Sinch conversation ID used only for matching callbacks.', icon: 'IconKey', isNullable: true, defaultValue: null },
    { universalIdentifier: SMS_CONVERSATION_PHONE_FIELD_UNIVERSAL_IDENTIFIER, type: FieldType.TEXT, name: 'phoneE164', label: 'Phone (E.164)', description: 'Normalized customer phone number.', icon: 'IconPhone' },
    { universalIdentifier: SMS_CONVERSATION_STATUS_FIELD_UNIVERSAL_IDENTIFIER, type: FieldType.SELECT, name: 'status', label: 'Status', description: 'Current conversation availability.', icon: 'IconProgress', defaultValue: "'OPEN'", options: [{ id: '9ff9d7a6-2f27-4609-87fe-ebe18d448dca', value: 'OPEN', label: 'Open', color: 'green', position: 0 }, { id: '1cd7bcc2-c1b6-4dfc-868d-9e7232fc766a', value: 'CLOSED', label: 'Closed', color: 'gray', position: 1 }, { id: 'e4d4e982-890b-4453-a0c7-f0f27af5b00e', value: 'SUPPRESSED', label: 'Suppressed', color: 'red', position: 2 }] },
    { universalIdentifier: SMS_CONVERSATION_LAST_MESSAGE_AT_FIELD_UNIVERSAL_IDENTIFIER, type: FieldType.DATE_TIME, name: 'lastMessageAt', label: 'Last message at', description: 'Timestamp of the latest known SMS event.', icon: 'IconClock', isNullable: true, defaultValue: null },
  ],
});
