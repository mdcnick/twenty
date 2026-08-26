import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import { MAINTENANCE_AGREEMENT_UNIVERSAL_IDENTIFIER } from 'src/objects/maintenance-agreement.object';

export const PRIMARY_CONTACT_ON_MAINTENANCE_AGREEMENT_FIELD_UNIVERSAL_IDENTIFIER =
  'a5cbb646-8deb-49d6-9554-9e3577ae7799';
export const MAINTENANCE_AGREEMENTS_ON_PERSON_FIELD_UNIVERSAL_IDENTIFIER =
  '5a96a111-9032-42f5-8c8a-0dd83d21fe35';

export default defineField({
  universalIdentifier:
    PRIMARY_CONTACT_ON_MAINTENANCE_AGREEMENT_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: MAINTENANCE_AGREEMENT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'primaryContact',
  label: 'Primary contact',
  icon: 'IconUser',
  relationTargetObjectMetadataUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier,
  relationTargetFieldMetadataUniversalIdentifier:
    MAINTENANCE_AGREEMENTS_ON_PERSON_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'primaryContactId',
  },
});
