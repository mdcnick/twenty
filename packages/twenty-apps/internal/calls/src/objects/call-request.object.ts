import { defineObject, FieldType } from 'twenty-sdk/define';
import { CALL_REQUEST_ACCEPTED_AT_FIELD_UNIVERSAL_IDENTIFIER, CALL_REQUEST_FROM_NUMBER_FIELD_UNIVERSAL_IDENTIFIER, CALL_REQUEST_KEY_FIELD_UNIVERSAL_IDENTIFIER, CALL_REQUEST_LAST_ERROR_FIELD_UNIVERSAL_IDENTIFIER, CALL_REQUEST_PROVIDER_CALL_ID_FIELD_UNIVERSAL_IDENTIFIER, CALL_REQUEST_STATUS_FIELD_UNIVERSAL_IDENTIFIER, CALL_REQUEST_TO_NUMBER_FIELD_UNIVERSAL_IDENTIFIER, CALL_REQUEST_UNIVERSAL_IDENTIFIER } from '../constants';

export default defineObject({
  universalIdentifier: CALL_REQUEST_UNIVERSAL_IDENTIFIER,
  nameSingular: 'callRequest', namePlural: 'callRequests', labelSingular: 'Call request', labelPlural: 'Call requests',
  description: 'Durable outbound call idempotency and provider-acceptance state.', icon: 'IconPhoneOutgoing',
  labelIdentifierFieldMetadataUniversalIdentifier: CALL_REQUEST_KEY_FIELD_UNIVERSAL_IDENTIFIER,
  fields: [
    { universalIdentifier: CALL_REQUEST_KEY_FIELD_UNIVERSAL_IDENTIFIER, type: FieldType.TEXT, name: 'requestKey', label: 'Request key', icon: 'IconKey', isUnique: true },
    { universalIdentifier: CALL_REQUEST_STATUS_FIELD_UNIVERSAL_IDENTIFIER, type: FieldType.TEXT, name: 'status', label: 'Status', icon: 'IconProgress' },
    { universalIdentifier: CALL_REQUEST_PROVIDER_CALL_ID_FIELD_UNIVERSAL_IDENTIFIER, type: FieldType.TEXT, name: 'providerCallId', label: 'Provider call ID', icon: 'IconHash', isNullable: true },
    { universalIdentifier: CALL_REQUEST_FROM_NUMBER_FIELD_UNIVERSAL_IDENTIFIER, type: FieldType.PHONES, name: 'fromNumber', label: 'From', icon: 'IconPhone', isNullable: true },
    { universalIdentifier: CALL_REQUEST_TO_NUMBER_FIELD_UNIVERSAL_IDENTIFIER, type: FieldType.PHONES, name: 'toNumber', label: 'To', icon: 'IconPhone', isNullable: true },
    { universalIdentifier: CALL_REQUEST_LAST_ERROR_FIELD_UNIVERSAL_IDENTIFIER, type: FieldType.TEXT, name: 'lastError', label: 'Last error', icon: 'IconAlertTriangle', isNullable: true },
    { universalIdentifier: CALL_REQUEST_ACCEPTED_AT_FIELD_UNIVERSAL_IDENTIFIER, type: FieldType.DATE_TIME, name: 'acceptedAt', label: 'Accepted at', icon: 'IconCircleCheck', isNullable: true },
  ],
});
