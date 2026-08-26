import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';
import { SERVICE_JOB_UNIVERSAL_IDENTIFIER } from '../objects/service-job.object';

export const SERVICE_CONTACT_ON_SERVICE_JOB_FIELD_UNIVERSAL_IDENTIFIER =
  '4971e489-8cda-4ad6-b027-383eb3f422f6';
export const SERVICE_JOBS_ON_PERSON_FIELD_UNIVERSAL_IDENTIFIER =
  'ec524bbc-9eda-42d0-9674-22483d1a0312';

export default defineField({
  universalIdentifier: SERVICE_CONTACT_ON_SERVICE_JOB_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: SERVICE_JOB_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'serviceContact',
  label: 'Service contact',
  icon: 'IconUser',
  relationTargetObjectMetadataUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier,
  relationTargetFieldMetadataUniversalIdentifier:
    SERVICE_JOBS_ON_PERSON_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'serviceContactId',
  },
});
