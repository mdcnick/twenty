import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
} from 'twenty-sdk/define';
import { JOB_PHOTO_UNIVERSAL_IDENTIFIER } from '../objects/job-photo.object';
import { SERVICE_JOB_UNIVERSAL_IDENTIFIER } from '../objects/service-job.object';

export const SERVICE_JOB_ON_JOB_PHOTO_FIELD_UNIVERSAL_IDENTIFIER =
  'b2ff3614-84d3-49a1-9cea-83833c936ba9';
export const JOB_PHOTOS_ON_SERVICE_JOB_FIELD_UNIVERSAL_IDENTIFIER =
  'eab42b65-5800-4d02-9544-f6ea3c54ce1c';

export default defineField({
  universalIdentifier: SERVICE_JOB_ON_JOB_PHOTO_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: JOB_PHOTO_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'serviceJob',
  label: 'Service job',
  icon: 'IconCalendarEvent',
  relationTargetObjectMetadataUniversalIdentifier:
    SERVICE_JOB_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    JOB_PHOTOS_ON_SERVICE_JOB_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'serviceJobId',
  },
});
