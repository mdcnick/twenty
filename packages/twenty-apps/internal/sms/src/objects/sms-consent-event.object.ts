import { defineObject, FieldType } from 'twenty-sdk/define';

import {
  SMS_CONSENT_DEDUPE_KEY_FIELD_UNIVERSAL_IDENTIFIER,
  SMS_CONSENT_EVENT_TYPE_FIELD_UNIVERSAL_IDENTIFIER,
  SMS_CONSENT_EVENT_OBJECT_UNIVERSAL_IDENTIFIER,
  SMS_CONSENT_OCCURRED_AT_FIELD_UNIVERSAL_IDENTIFIER,
  SMS_CONSENT_PHONE_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineObject({
  universalIdentifier: SMS_CONSENT_EVENT_OBJECT_UNIVERSAL_IDENTIFIER,
  nameSingular: 'smsConsentEvent',
  namePlural: 'smsConsentEvents',
  labelSingular: 'SMS consent event',
  labelPlural: 'SMS consent events',
  description: 'Auditable opt-out or opt-in event derived from a customer SMS.',
  icon: 'IconShieldCheck',
  labelIdentifierFieldMetadataUniversalIdentifier: SMS_CONSENT_PHONE_FIELD_UNIVERSAL_IDENTIFIER,
  fields: [
    { universalIdentifier: SMS_CONSENT_DEDUPE_KEY_FIELD_UNIVERSAL_IDENTIFIER, type: FieldType.TEXT, name: 'dedupeKey', label: 'Dedupe key', description: 'Stable provider event key used for idempotency.', icon: 'IconFingerprint' },
    { universalIdentifier: SMS_CONSENT_PHONE_FIELD_UNIVERSAL_IDENTIFIER, type: FieldType.TEXT, name: 'phoneE164', label: 'Phone (E.164)', description: 'Normalized phone number affected by the event.', icon: 'IconPhone' },
    { universalIdentifier: SMS_CONSENT_EVENT_TYPE_FIELD_UNIVERSAL_IDENTIFIER, type: FieldType.SELECT, name: 'eventType', label: 'Event type', description: 'Consent change inferred from the customer message.', icon: 'IconShieldCheck', defaultValue: "'OPT_OUT'", options: [{ id: '3d741a5c-e820-4f7d-a3e9-f51fd9cb220c', value: 'OPT_OUT', label: 'Opt out', color: 'red', position: 0 }, { id: 'a22d7807-5df8-4f96-b972-c42055627a8c', value: 'OPT_IN', label: 'Opt in', color: 'green', position: 1 }] },
    { universalIdentifier: SMS_CONSENT_OCCURRED_AT_FIELD_UNIVERSAL_IDENTIFIER, type: FieldType.DATE_TIME, name: 'occurredAt', label: 'Occurred at', description: 'Provider event timestamp.', icon: 'IconClock' },
  ],
});
