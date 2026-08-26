import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
} from 'twenty-sdk/define';

import { MAINTENANCE_AGREEMENT_UNIVERSAL_IDENTIFIER } from 'src/objects/maintenance-agreement.object';
import { MAINTENANCE_COVERAGE_UNIVERSAL_IDENTIFIER } from 'src/objects/maintenance-coverage.object';

export const MAINTENANCE_AGREEMENT_ON_MAINTENANCE_COVERAGE_FIELD_UNIVERSAL_IDENTIFIER =
  '5a5c8c2c-b3b5-4612-bdd5-832f3ea6c100';
export const MAINTENANCE_COVERAGES_ON_MAINTENANCE_AGREEMENT_FIELD_UNIVERSAL_IDENTIFIER =
  '36e9e275-448c-4914-97d1-9768d9e56be2';

export default defineField({
  universalIdentifier:
    MAINTENANCE_AGREEMENT_ON_MAINTENANCE_COVERAGE_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: MAINTENANCE_COVERAGE_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'maintenanceAgreement',
  label: 'Maintenance agreement',
  icon: 'IconContract',
  relationTargetObjectMetadataUniversalIdentifier:
    MAINTENANCE_AGREEMENT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    MAINTENANCE_COVERAGES_ON_MAINTENANCE_AGREEMENT_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.RESTRICT,
    joinColumnName: 'maintenanceAgreementId',
  },
});
