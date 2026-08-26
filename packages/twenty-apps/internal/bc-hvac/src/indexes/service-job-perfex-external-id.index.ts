import { defineIndex } from 'twenty-sdk/define';

import {
  SERVICE_JOB_UNIVERSAL_IDENTIFIER,
  SERVICE_JOB_PERFEX_EXTERNAL_ID_FIELD_UNIVERSAL_IDENTIFIER,
} from '../objects/service-job.object';

export default defineIndex({
  universalIdentifier: 'e3528469-ea96-4472-b9fd-50c00f3b2f91',
  objectUniversalIdentifier: SERVICE_JOB_UNIVERSAL_IDENTIFIER,
  isUnique: true,
  fields: [
    {
      universalIdentifier: '6320ddbe-dc7b-4f66-a7b4-35b0c1527f92',
      fieldUniversalIdentifier:
        SERVICE_JOB_PERFEX_EXTERNAL_ID_FIELD_UNIVERSAL_IDENTIFIER,
    },
  ],
});
