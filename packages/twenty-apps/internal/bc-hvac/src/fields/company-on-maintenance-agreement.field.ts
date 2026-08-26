import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import { MAINTENANCE_AGREEMENT_UNIVERSAL_IDENTIFIER } from 'src/objects/maintenance-agreement.object';

export const COMPANY_ON_MAINTENANCE_AGREEMENT_FIELD_UNIVERSAL_IDENTIFIER =
  '06b0b6a4-ef0e-4a10-87b7-a6c7f25b7491';
export const MAINTENANCE_AGREEMENTS_ON_COMPANY_FIELD_UNIVERSAL_IDENTIFIER =
  '9f677555-958b-444f-bdc9-32c7e7aad933';

export default defineField({
  universalIdentifier:
    COMPANY_ON_MAINTENANCE_AGREEMENT_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: MAINTENANCE_AGREEMENT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'company',
  label: 'Company',
  icon: 'IconBuilding',
  relationTargetObjectMetadataUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.company.universalIdentifier,
  relationTargetFieldMetadataUniversalIdentifier:
    MAINTENANCE_AGREEMENTS_ON_COMPANY_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'companyId',
  },
});
