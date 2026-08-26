import { defineApplication, FieldType } from 'twenty-sdk/define';
import {
  CALLS_APPLICATION_UNIVERSAL_IDENTIFIER,
  SINCH_VOICE_BASE_URL,
  SINCH_VOICE_FORWARD_TO,
  SINCH_VOICE_FROM_NUMBER,
  SINCH_VOICE_TOKEN,
  SINCH_VOICE_WEBHOOK_SECRET,
} from './constants';

export default defineApplication({
  universalIdentifier: CALLS_APPLICATION_UNIVERSAL_IDENTIFIER,
  displayName: 'Calls',
  description: 'Sinch Voice call history and outbound call control for Twenty.',
  serverVariables: {
    [SINCH_VOICE_BASE_URL]: {
      description: 'Regional Sinch Voice API base URL, for example https://calling-use1.api.sinch.com/v1.',
      isSecret: false,
      isRequired: true,
      type: FieldType.TEXT,
    },
    [SINCH_VOICE_TOKEN]: {
      description: 'Sinch Voice application key and application secret as applicationKey:applicationSecret. This is used for Basic auth and identifies callback signatures.',
      isSecret: true,
      isRequired: true,
      type: FieldType.TEXT,
    },
    [SINCH_VOICE_FROM_NUMBER]: {
      description: 'Verified Sinch caller ID in E.164 format.',
      isSecret: false,
      isRequired: true,
      type: FieldType.TEXT,
    },
    [SINCH_VOICE_FORWARD_TO]: {
      description: 'Optional E.164 number to receive authenticated inbound Sinch Voice calls. When unset, inbound calls receive a safe hangup SVAML response.',
      isSecret: false,
      isRequired: false,
      type: FieldType.TEXT,
    },
    [SINCH_VOICE_WEBHOOK_SECRET]: {
      description: 'Base64-encoded Sinch Voice application secret used to verify signed callbacks. It must match the secret portion of SINCH_VOICE_TOKEN.',
      isSecret: true,
      isRequired: true,
      type: FieldType.TEXT,
    },
  },
});
