import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
} from 'twenty-sdk/define';

import { EQUIPMENT_UNIVERSAL_IDENTIFIER } from 'src/constants/bc-hvac-identifiers';
import { MAINTENANCE_COVERAGE_UNIVERSAL_IDENTIFIER } from 'src/objects/maintenance-coverage.object';

export const EQUIPMENT_ON_MAINTENANCE_COVERAGE_FIELD_UNIVERSAL_IDENTIFIER =
  'baf6a149-d245-4749-8028-9800e6af3571';
export const MAINTENANCE_COVERAGES_ON_EQUIPMENT_FIELD_UNIVERSAL_IDENTIFIER =
  'c9dbcf87-04ed-454a-9d37-9abe9379f038';

export default defineField({
  universalIdentifier:
    EQUIPMENT_ON_MAINTENANCE_COVERAGE_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: MAINTENANCE_COVERAGE_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'equipment',
  label: 'Equipment',
  icon: 'IconAirConditioning',
  relationTargetObjectMetadataUniversalIdentifier: EQUIPMENT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    MAINTENANCE_COVERAGES_ON_EQUIPMENT_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.RESTRICT,
    joinColumnName: 'equipmentId',
  },
});
