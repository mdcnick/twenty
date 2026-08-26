import {
  defineField,
  FieldType,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';
import { SERVICE_JOB_UNIVERSAL_IDENTIFIER } from '../objects/service-job.object';
import {
  COMPANY_ON_SERVICE_JOB_FIELD_UNIVERSAL_IDENTIFIER,
  SERVICE_JOBS_ON_COMPANY_FIELD_UNIVERSAL_IDENTIFIER,
} from './company-on-service-job.field';

export default defineField({
  universalIdentifier: SERVICE_JOBS_ON_COMPANY_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.company.universalIdentifier,
  type: FieldType.RELATION,
  name: 'serviceJobs',
  label: 'Service jobs',
  icon: 'IconCalendarEvent',
  relationTargetObjectMetadataUniversalIdentifier:
    SERVICE_JOB_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    COMPANY_ON_SERVICE_JOB_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
