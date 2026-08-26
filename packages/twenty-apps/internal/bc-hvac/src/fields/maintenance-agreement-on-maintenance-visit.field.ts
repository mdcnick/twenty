import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
} from 'twenty-sdk/define';

import { MAINTENANCE_AGREEMENT_UNIVERSAL_IDENTIFIER } from 'src/objects/maintenance-agreement.object';
import { MAINTENANCE_VISIT_UNIVERSAL_IDENTIFIER } from 'src/objects/maintenance-visit.object';

export const MAINTENANCE_AGREEMENT_ON_MAINTENANCE_VISIT_FIELD_UNIVERSAL_IDENTIFIER =
  '659799f1-7b68-406a-9bb0-fa15450f82ef';
export const MAINTENANCE_VISITS_ON_MAINTENANCE_AGREEMENT_FIELD_UNIVERSAL_IDENTIFIER =
  '292b5532-7b5a-47fd-bd4c-ff1bc3ade814';

export default defineField({
  universalIdentifier:
    MAINTENANCE_AGREEMENT_ON_MAINTENANCE_VISIT_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: MAINTENANCE_VISIT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'maintenanceAgreement',
  label: 'Maintenance agreement',
  icon: 'IconContract',
  relationTargetObjectMetadataUniversalIdentifier:
    MAINTENANCE_AGREEMENT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    MAINTENANCE_VISITS_ON_MAINTENANCE_AGREEMENT_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.RESTRICT,
    joinColumnName: 'maintenanceAgreementId',
  },
});
