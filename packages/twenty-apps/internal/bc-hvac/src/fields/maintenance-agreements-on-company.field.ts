import {
  defineField,
  FieldType,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import {
  COMPANY_ON_MAINTENANCE_AGREEMENT_FIELD_UNIVERSAL_IDENTIFIER,
  MAINTENANCE_AGREEMENTS_ON_COMPANY_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/fields/company-on-maintenance-agreement.field';
import { MAINTENANCE_AGREEMENT_UNIVERSAL_IDENTIFIER } from 'src/objects/maintenance-agreement.object';

export default defineField({
  universalIdentifier:
    MAINTENANCE_AGREEMENTS_ON_COMPANY_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.company.universalIdentifier,
  type: FieldType.RELATION,
  name: 'maintenanceAgreements',
  label: 'Maintenance agreements',
  icon: 'IconContract',
  relationTargetObjectMetadataUniversalIdentifier:
    MAINTENANCE_AGREEMENT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    COMPANY_ON_MAINTENANCE_AGREEMENT_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: { relationType: RelationType.ONE_TO_MANY },
});
