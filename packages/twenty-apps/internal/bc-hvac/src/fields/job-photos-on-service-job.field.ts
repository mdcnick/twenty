import { defineField, FieldType, RelationType } from 'twenty-sdk/define';
import { JOB_PHOTO_UNIVERSAL_IDENTIFIER } from '../objects/job-photo.object';
import { SERVICE_JOB_UNIVERSAL_IDENTIFIER } from '../objects/service-job.object';
import {
  JOB_PHOTOS_ON_SERVICE_JOB_FIELD_UNIVERSAL_IDENTIFIER,
  SERVICE_JOB_ON_JOB_PHOTO_FIELD_UNIVERSAL_IDENTIFIER,
} from './service-job-on-job-photo.field';

export default defineField({
  universalIdentifier: JOB_PHOTOS_ON_SERVICE_JOB_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: SERVICE_JOB_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'jobPhotos',
  label: 'Job photos',
  icon: 'IconPhoto',
  relationTargetObjectMetadataUniversalIdentifier:
    JOB_PHOTO_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    SERVICE_JOB_ON_JOB_PHOTO_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
