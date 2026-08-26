import { defineField, FieldType, RelationType } from 'twenty-sdk/define';

import { SERVICE_JOB_UNIVERSAL_IDENTIFIER } from 'src/constants/bc-hvac-identifiers';
import {
  MAINTENANCE_VISITS_ON_SERVICE_JOB_FIELD_UNIVERSAL_IDENTIFIER,
  SERVICE_JOB_ON_MAINTENANCE_VISIT_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/fields/service-job-on-maintenance-visit.field';
import { MAINTENANCE_VISIT_UNIVERSAL_IDENTIFIER } from 'src/objects/maintenance-visit.object';

export default defineField({
  universalIdentifier:
    MAINTENANCE_VISITS_ON_SERVICE_JOB_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: SERVICE_JOB_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'maintenanceVisits',
  label: 'Maintenance visits',
  icon: 'IconCalendarCheck',
  relationTargetObjectMetadataUniversalIdentifier:
    MAINTENANCE_VISIT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    SERVICE_JOB_ON_MAINTENANCE_VISIT_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: { relationType: RelationType.ONE_TO_MANY },
});
