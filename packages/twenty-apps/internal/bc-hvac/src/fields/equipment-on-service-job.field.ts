import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
} from 'twenty-sdk/define';
import { EQUIPMENT_UNIVERSAL_IDENTIFIER } from '../objects/equipment.object';
import { SERVICE_JOB_UNIVERSAL_IDENTIFIER } from '../objects/service-job.object';

export const EQUIPMENT_ON_SERVICE_JOB_FIELD_UNIVERSAL_IDENTIFIER =
  '0129554f-c9fb-4062-a208-42dfa66b8607';
export const SERVICE_JOBS_ON_EQUIPMENT_FIELD_UNIVERSAL_IDENTIFIER =
  '6666edc4-e49b-417a-8e09-4fe4ca4cb582';

export default defineField({
  universalIdentifier: EQUIPMENT_ON_SERVICE_JOB_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: SERVICE_JOB_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'equipment',
  label: 'Equipment',
  icon: 'IconAirConditioning',
  relationTargetObjectMetadataUniversalIdentifier: EQUIPMENT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    SERVICE_JOBS_ON_EQUIPMENT_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'equipmentId',
  },
});
