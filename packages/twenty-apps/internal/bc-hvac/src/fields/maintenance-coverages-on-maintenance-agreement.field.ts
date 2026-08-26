import { defineField, FieldType, RelationType } from 'twenty-sdk/define';

import {
  MAINTENANCE_AGREEMENT_ON_MAINTENANCE_COVERAGE_FIELD_UNIVERSAL_IDENTIFIER,
  MAINTENANCE_COVERAGES_ON_MAINTENANCE_AGREEMENT_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/fields/maintenance-agreement-on-maintenance-coverage.field';
import { MAINTENANCE_AGREEMENT_UNIVERSAL_IDENTIFIER } from 'src/objects/maintenance-agreement.object';
import { MAINTENANCE_COVERAGE_UNIVERSAL_IDENTIFIER } from 'src/objects/maintenance-coverage.object';

export default defineField({
  universalIdentifier:
    MAINTENANCE_COVERAGES_ON_MAINTENANCE_AGREEMENT_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: MAINTENANCE_AGREEMENT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'maintenanceCoverages',
  label: 'Covered equipment',
  icon: 'IconShieldCheck',
  relationTargetObjectMetadataUniversalIdentifier:
    MAINTENANCE_COVERAGE_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    MAINTENANCE_AGREEMENT_ON_MAINTENANCE_COVERAGE_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: { relationType: RelationType.ONE_TO_MANY },
});
