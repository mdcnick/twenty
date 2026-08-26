import {
  defineField,
  FieldType,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import {
  MAINTENANCE_AGREEMENTS_ON_PERSON_FIELD_UNIVERSAL_IDENTIFIER,
  PRIMARY_CONTACT_ON_MAINTENANCE_AGREEMENT_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/fields/primary-contact-on-maintenance-agreement.field';
import { MAINTENANCE_AGREEMENT_UNIVERSAL_IDENTIFIER } from 'src/objects/maintenance-agreement.object';

export default defineField({
  universalIdentifier:
    MAINTENANCE_AGREEMENTS_ON_PERSON_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier,
  type: FieldType.RELATION,
  name: 'maintenanceAgreements',
  label: 'Maintenance agreements',
  icon: 'IconContract',
  relationTargetObjectMetadataUniversalIdentifier:
    MAINTENANCE_AGREEMENT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    PRIMARY_CONTACT_ON_MAINTENANCE_AGREEMENT_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: { relationType: RelationType.ONE_TO_MANY },
});
