import { defineField, FieldType, RelationType } from 'twenty-sdk/define';
import { EQUIPMENT_UNIVERSAL_IDENTIFIER } from '../objects/equipment.object';
import { SERVICE_JOB_UNIVERSAL_IDENTIFIER } from '../objects/service-job.object';
import {
  EQUIPMENT_ON_SERVICE_JOB_FIELD_UNIVERSAL_IDENTIFIER,
  SERVICE_JOBS_ON_EQUIPMENT_FIELD_UNIVERSAL_IDENTIFIER,
} from './equipment-on-service-job.field';

export default defineField({
  universalIdentifier: SERVICE_JOBS_ON_EQUIPMENT_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: EQUIPMENT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'serviceJobs',
  label: 'Service jobs',
  icon: 'IconCalendarEvent',
  relationTargetObjectMetadataUniversalIdentifier:
    SERVICE_JOB_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    EQUIPMENT_ON_SERVICE_JOB_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
