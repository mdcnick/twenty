import { defineIndex } from 'twenty-sdk/define';

import {
  JOB_PHOTO_UNIVERSAL_IDENTIFIER,
  JOB_PHOTO_PERFEX_EXTERNAL_ID_FIELD_UNIVERSAL_IDENTIFIER,
} from '../objects/job-photo.object';

export default defineIndex({
  universalIdentifier: 'ab7411ec-e143-49e5-b2e2-62e3321882e1',
  objectUniversalIdentifier: JOB_PHOTO_UNIVERSAL_IDENTIFIER,
  isUnique: true,
  fields: [
    {
      universalIdentifier: '8b9a7cc9-80f0-4241-b4a1-f72f1aec410c',
      fieldUniversalIdentifier:
        JOB_PHOTO_PERFEX_EXTERNAL_ID_FIELD_UNIVERSAL_IDENTIFIER,
    },
  ],
});
