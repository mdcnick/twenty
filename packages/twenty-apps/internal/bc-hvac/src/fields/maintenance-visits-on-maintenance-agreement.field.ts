import { defineField, FieldType, RelationType } from 'twenty-sdk/define';

import {
  MAINTENANCE_AGREEMENT_ON_MAINTENANCE_VISIT_FIELD_UNIVERSAL_IDENTIFIER,
  MAINTENANCE_VISITS_ON_MAINTENANCE_AGREEMENT_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/fields/maintenance-agreement-on-maintenance-visit.field';
import { MAINTENANCE_AGREEMENT_UNIVERSAL_IDENTIFIER } from 'src/objects/maintenance-agreement.object';
import { MAINTENANCE_VISIT_UNIVERSAL_IDENTIFIER } from 'src/objects/maintenance-visit.object';

export default defineField({
  universalIdentifier:
    MAINTENANCE_VISITS_ON_MAINTENANCE_AGREEMENT_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: MAINTENANCE_AGREEMENT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'maintenanceVisits',
  label: 'Maintenance visits',
  icon: 'IconCalendarCheck',
  relationTargetObjectMetadataUniversalIdentifier:
    MAINTENANCE_VISIT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    MAINTENANCE_AGREEMENT_ON_MAINTENANCE_VISIT_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: { relationType: RelationType.ONE_TO_MANY },
});
