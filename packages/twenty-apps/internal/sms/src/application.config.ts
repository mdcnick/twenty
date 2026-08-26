import { defineApplication, FieldType } from 'twenty-sdk/define';

import { APPLICATION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';

export default defineApplication({
  universalIdentifier: APPLICATION_UNIVERSAL_IDENTIFIER,
  displayName: 'SMS',
  description: 'Sinch-backed SMS conversations, delivery receipts, and consent history.',
  category: 'Communication',
  serverVariables: {
    SINCH_PROJECT_ID: { description: 'Sinch Conversation API project ID.', isSecret: false, isRequired: true, type: FieldType.TEXT },
    SINCH_CONVERSATION_APP_ID: { description: 'Sinch Conversation API app ID configured for SMS.', isSecret: false, isRequired: true, type: FieldType.TEXT },
    SINCH_KEY_ID: { description: 'Sinch access-key ID used to obtain a short-lived OAuth token.', isSecret: false, isRequired: true, type: FieldType.TEXT },
    SINCH_KEY_SECRET: { description: 'Sinch access-key secret used only to obtain a short-lived OAuth token.', isSecret: true, isRequired: true, type: FieldType.TEXT },
    SINCH_SMS_FROM_NUMBER: { description: 'Configured SMS sender number or sender ID.', isSecret: false, isRequired: true, type: FieldType.TEXT },
    SINCH_WEBHOOK_SECRET: { description: 'HMAC secret configured on the Sinch webhook. Required before callbacks are accepted.', isSecret: true, isRequired: true, type: FieldType.TEXT },
    SINCH_CONVERSATION_REGION: { description: 'Region of the Sinch Conversation API app.', isSecret: false, isRequired: true, type: FieldType.SELECT, options: [{ label: 'US', value: 'us' }, { label: 'Europe', value: 'eu' }, { label: 'Brazil', value: 'br' }] },
  },
});
