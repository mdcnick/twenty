import { defineField, FieldType, RelationType } from 'twenty-sdk/define';
import { EQUIPMENT_UNIVERSAL_IDENTIFIER } from '../objects/equipment.object';
import { SERVICE_EVENT_UNIVERSAL_IDENTIFIER } from '../objects/service-event.object';
import {
  EQUIPMENT_ON_SERVICE_EVENT_FIELD_UNIVERSAL_IDENTIFIER,
  SERVICE_EVENTS_ON_EQUIPMENT_FIELD_UNIVERSAL_IDENTIFIER,
} from './equipment-on-service-event.field';

export default defineField({
  universalIdentifier: SERVICE_EVENTS_ON_EQUIPMENT_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: EQUIPMENT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'serviceEvents',
  label: 'Service events',
  icon: 'IconHistory',
  relationTargetObjectMetadataUniversalIdentifier:
    SERVICE_EVENT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    EQUIPMENT_ON_SERVICE_EVENT_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
