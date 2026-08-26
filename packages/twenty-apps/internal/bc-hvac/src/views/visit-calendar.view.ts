import {
  defineView,
  ViewCalendarLayout,
  ViewType,
} from 'twenty-sdk/define';

import { MAINTENANCE_AGREEMENT_ON_MAINTENANCE_VISIT_FIELD_UNIVERSAL_IDENTIFIER } from 'src/fields/maintenance-agreement-on-maintenance-visit.field';
import { SERVICE_JOB_ON_MAINTENANCE_VISIT_FIELD_UNIVERSAL_IDENTIFIER } from 'src/fields/service-job-on-maintenance-visit.field';
import {
  MAINTENANCE_VISIT_DUE_DATE_FIELD_UNIVERSAL_IDENTIFIER,
  MAINTENANCE_VISIT_SERVICE_TYPE_FIELD_UNIVERSAL_IDENTIFIER,
  MAINTENANCE_VISIT_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
  MAINTENANCE_VISIT_UNIVERSAL_IDENTIFIER,
} from 'src/objects/maintenance-visit.object';

export default defineView({
  universalIdentifier: 'ad44fd28-4d81-4702-925c-e10578665678',
  name: 'Visit calendar',
  objectUniversalIdentifier: MAINTENANCE_VISIT_UNIVERSAL_IDENTIFIER,
  type: ViewType.CALENDAR,
  icon: 'IconCalendarCheck',
  position: 0,
  calendarLayout: ViewCalendarLayout.MONTH,
  calendarFieldMetadataUniversalIdentifier:
    MAINTENANCE_VISIT_DUE_DATE_FIELD_UNIVERSAL_IDENTIFIER,
  fields: [
    {
      universalIdentifier: 'a6107e81-3c9d-43a7-a76c-c590c336c261',
      fieldMetadataUniversalIdentifier:
        MAINTENANCE_VISIT_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
      position: 0,
      isVisible: true,
      size: 140,
    },
    {
      universalIdentifier: 'acc6185c-2083-4aa8-ac02-aaeff3e37ac1',
      fieldMetadataUniversalIdentifier:
        MAINTENANCE_VISIT_SERVICE_TYPE_FIELD_UNIVERSAL_IDENTIFIER,
      position: 1,
      isVisible: true,
      size: 180,
    },
    {
      universalIdentifier: '6b6276aa-dd76-4e9e-907a-f66c5992f78f',
      fieldMetadataUniversalIdentifier:
        MAINTENANCE_AGREEMENT_ON_MAINTENANCE_VISIT_FIELD_UNIVERSAL_IDENTIFIER,
      position: 2,
      isVisible: true,
      size: 200,
    },
    {
      universalIdentifier: '7f0f3f4f-ee01-447c-8e5d-61de7771f7ae',
      fieldMetadataUniversalIdentifier:
        SERVICE_JOB_ON_MAINTENANCE_VISIT_FIELD_UNIVERSAL_IDENTIFIER,
      position: 3,
      isVisible: true,
      size: 200,
    },
  ],
});
