import { defineIndex } from 'twenty-sdk/define';

import {
  MAINTENANCE_AGREEMENT_NUMBER_FIELD_UNIVERSAL_IDENTIFIER,
  MAINTENANCE_AGREEMENT_UNIVERSAL_IDENTIFIER,
} from 'src/objects/maintenance-agreement.object';

export default defineIndex({
  universalIdentifier: 'e1310be5-ffd2-4c3e-ac7c-d607f54eae8d',
  objectUniversalIdentifier: MAINTENANCE_AGREEMENT_UNIVERSAL_IDENTIFIER,
  isUnique: true,
  fields: [
    {
      universalIdentifier: 'd754233c-46d8-4af9-8d65-8872ed37dae9',
      fieldUniversalIdentifier:
        MAINTENANCE_AGREEMENT_NUMBER_FIELD_UNIVERSAL_IDENTIFIER,
    },
  ],
});
