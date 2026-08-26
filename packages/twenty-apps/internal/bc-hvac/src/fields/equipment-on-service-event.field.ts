import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
} from 'twenty-sdk/define';
import { EQUIPMENT_UNIVERSAL_IDENTIFIER } from '../objects/equipment.object';
import { SERVICE_EVENT_UNIVERSAL_IDENTIFIER } from '../objects/service-event.object';

export const EQUIPMENT_ON_SERVICE_EVENT_FIELD_UNIVERSAL_IDENTIFIER =
  '132fcb3f-c96f-4ceb-91f2-a5ef00f2bb15';
export const SERVICE_EVENTS_ON_EQUIPMENT_FIELD_UNIVERSAL_IDENTIFIER =
  'd6fd805a-d0c9-4654-8a1e-12efcce7c6ae';

export default defineField({
  universalIdentifier: EQUIPMENT_ON_SERVICE_EVENT_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: SERVICE_EVENT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'equipment',
  label: 'Equipment',
  icon: 'IconAirConditioning',
  relationTargetObjectMetadataUniversalIdentifier: EQUIPMENT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    SERVICE_EVENTS_ON_EQUIPMENT_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'equipmentId',
  },
});
