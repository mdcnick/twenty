import { defineIndex } from 'twenty-sdk/define';

import {
  SERVICE_JOB_SOURCE_FIELD_UNIVERSAL_IDENTIFIER,
  SERVICE_JOB_SOURCE_REQUEST_ID_FIELD_UNIVERSAL_IDENTIFIER,
  SERVICE_JOB_UNIVERSAL_IDENTIFIER,
} from '../objects/service-job.object';

export default defineIndex({
  universalIdentifier: 'd3c7e69b-0e66-4ea8-893d-f2f4443f28ce',
  objectUniversalIdentifier: SERVICE_JOB_UNIVERSAL_IDENTIFIER,
  isUnique: true,
  fields: [
    {
      universalIdentifier: 'c524f9fb-5f06-46ed-ae99-2cf4f5108603',
      fieldUniversalIdentifier: SERVICE_JOB_SOURCE_FIELD_UNIVERSAL_IDENTIFIER,
    },
    {
      universalIdentifier: '97cb2240-8574-40d4-8a13-85fa462cab13',
      fieldUniversalIdentifier:
        SERVICE_JOB_SOURCE_REQUEST_ID_FIELD_UNIVERSAL_IDENTIFIER,
    },
  ],
});
