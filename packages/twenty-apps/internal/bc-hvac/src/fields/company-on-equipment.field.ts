import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';
import { EQUIPMENT_UNIVERSAL_IDENTIFIER } from '../objects/equipment.object';

export const COMPANY_ON_EQUIPMENT_FIELD_UNIVERSAL_IDENTIFIER =
  '5e9c62f6-40c9-494c-b19b-83ccce1428a6';
export const EQUIPMENT_ON_COMPANY_FIELD_UNIVERSAL_IDENTIFIER =
  '00eb9415-a3e9-43bc-bf6e-e5ad1a69b0d0';

export default defineField({
  universalIdentifier: COMPANY_ON_EQUIPMENT_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: EQUIPMENT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'company',
  label: 'Company',
  icon: 'IconBuilding',
  relationTargetObjectMetadataUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.company.universalIdentifier,
  relationTargetFieldMetadataUniversalIdentifier:
    EQUIPMENT_ON_COMPANY_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'companyId',
  },
});
