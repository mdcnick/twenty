import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
} from 'twenty-sdk/define';

import { SERVICE_JOB_UNIVERSAL_IDENTIFIER } from 'src/constants/bc-hvac-identifiers';
import { MAINTENANCE_VISIT_UNIVERSAL_IDENTIFIER } from 'src/objects/maintenance-visit.object';

export const SERVICE_JOB_ON_MAINTENANCE_VISIT_FIELD_UNIVERSAL_IDENTIFIER =
  '768a2f4f-fb0c-465c-bbe8-c62bb688c5f6';
export const MAINTENANCE_VISITS_ON_SERVICE_JOB_FIELD_UNIVERSAL_IDENTIFIER =
  '8b00e916-5e3d-4f74-a954-5fac19644c4d';

export default defineField({
  universalIdentifier:
    SERVICE_JOB_ON_MAINTENANCE_VISIT_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: MAINTENANCE_VISIT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'serviceJob',
  label: 'Service job',
  icon: 'IconCalendarEvent',
  relationTargetObjectMetadataUniversalIdentifier:
    SERVICE_JOB_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    MAINTENANCE_VISITS_ON_SERVICE_JOB_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'serviceJobId',
  },
});
