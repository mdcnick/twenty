import { defineIndex } from 'twenty-sdk/define';

import {
  EQUIPMENT_UNIVERSAL_IDENTIFIER,
  EQUIPMENT_PERFEX_EXTERNAL_ID_FIELD_UNIVERSAL_IDENTIFIER,
} from '../objects/equipment.object';

export default defineIndex({
  universalIdentifier: '419647af-8be6-439e-8553-09126d263c84',
  objectUniversalIdentifier: EQUIPMENT_UNIVERSAL_IDENTIFIER,
  isUnique: true,
  fields: [
    {
      universalIdentifier: '3a27a968-4c12-4312-9193-9a6665a0e591',
      fieldUniversalIdentifier:
        EQUIPMENT_PERFEX_EXTERNAL_ID_FIELD_UNIVERSAL_IDENTIFIER,
    },
  ],
});
