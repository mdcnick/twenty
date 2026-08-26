import { defineIndex } from 'twenty-sdk/define';

import {
  SERVICE_EVENT_UNIVERSAL_IDENTIFIER,
  SERVICE_EVENT_PERFEX_EXTERNAL_ID_FIELD_UNIVERSAL_IDENTIFIER,
} from '../objects/service-event.object';

export default defineIndex({
  universalIdentifier: '5c6a56e6-dcdc-4c5c-a5af-bb76e2c98e61',
  objectUniversalIdentifier: SERVICE_EVENT_UNIVERSAL_IDENTIFIER,
  isUnique: true,
  fields: [
    {
      universalIdentifier: '185e69d3-7a09-4af4-8e38-9b331622bd31',
      fieldUniversalIdentifier:
        SERVICE_EVENT_PERFEX_EXTERNAL_ID_FIELD_UNIVERSAL_IDENTIFIER,
    },
  ],
});
