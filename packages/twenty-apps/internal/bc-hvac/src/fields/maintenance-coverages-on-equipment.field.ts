import { defineField, FieldType, RelationType } from 'twenty-sdk/define';

import { EQUIPMENT_UNIVERSAL_IDENTIFIER } from 'src/constants/bc-hvac-identifiers';
import {
  EQUIPMENT_ON_MAINTENANCE_COVERAGE_FIELD_UNIVERSAL_IDENTIFIER,
  MAINTENANCE_COVERAGES_ON_EQUIPMENT_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/fields/equipment-on-maintenance-coverage.field';
import { MAINTENANCE_COVERAGE_UNIVERSAL_IDENTIFIER } from 'src/objects/maintenance-coverage.object';

export default defineField({
  universalIdentifier:
    MAINTENANCE_COVERAGES_ON_EQUIPMENT_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: EQUIPMENT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'maintenanceCoverages',
  label: 'Maintenance coverage',
  icon: 'IconShieldCheck',
  relationTargetObjectMetadataUniversalIdentifier:
    MAINTENANCE_COVERAGE_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    EQUIPMENT_ON_MAINTENANCE_COVERAGE_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: { relationType: RelationType.ONE_TO_MANY },
});
