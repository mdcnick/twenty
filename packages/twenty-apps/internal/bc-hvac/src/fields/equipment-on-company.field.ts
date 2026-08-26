import {
  defineField,
  FieldType,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';
import { EQUIPMENT_UNIVERSAL_IDENTIFIER } from '../objects/equipment.object';
import {
  COMPANY_ON_EQUIPMENT_FIELD_UNIVERSAL_IDENTIFIER,
  EQUIPMENT_ON_COMPANY_FIELD_UNIVERSAL_IDENTIFIER,
} from './company-on-equipment.field';

export default defineField({
  universalIdentifier: EQUIPMENT_ON_COMPANY_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.company.universalIdentifier,
  type: FieldType.RELATION,
  name: 'equipment',
  label: 'Equipment',
  icon: 'IconAirConditioning',
  relationTargetObjectMetadataUniversalIdentifier: EQUIPMENT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    COMPANY_ON_EQUIPMENT_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
