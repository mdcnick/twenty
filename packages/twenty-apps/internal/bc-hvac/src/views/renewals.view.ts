import {
  defineView,
  ViewCalendarLayout,
  ViewType,
} from 'twenty-sdk/define';

import { COMPANY_ON_MAINTENANCE_AGREEMENT_FIELD_UNIVERSAL_IDENTIFIER } from 'src/fields/company-on-maintenance-agreement.field';
import {
  MAINTENANCE_AGREEMENT_ANNUAL_VALUE_FIELD_UNIVERSAL_IDENTIFIER,
  MAINTENANCE_AGREEMENT_RENEWAL_DATE_FIELD_UNIVERSAL_IDENTIFIER,
  MAINTENANCE_AGREEMENT_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
  MAINTENANCE_AGREEMENT_UNIVERSAL_IDENTIFIER,
} from 'src/objects/maintenance-agreement.object';

export default defineView({
  universalIdentifier: '4aa7ff72-c875-477a-9d58-f8d9d8c7c7ec',
  name: 'Renewals',
  objectUniversalIdentifier: MAINTENANCE_AGREEMENT_UNIVERSAL_IDENTIFIER,
  type: ViewType.CALENDAR,
  icon: 'IconCalendarRepeat',
  position: 1,
  calendarLayout: ViewCalendarLayout.MONTH,
  calendarFieldMetadataUniversalIdentifier:
    MAINTENANCE_AGREEMENT_RENEWAL_DATE_FIELD_UNIVERSAL_IDENTIFIER,
  fields: [
    {
      universalIdentifier: '05067e0a-8d74-406c-8f60-34db7f9c32b4',
      fieldMetadataUniversalIdentifier:
        COMPANY_ON_MAINTENANCE_AGREEMENT_FIELD_UNIVERSAL_IDENTIFIER,
      position: 0,
      isVisible: true,
      size: 200,
    },
    {
      universalIdentifier: 'e9042062-7c72-4c84-8a9f-0407d4e0205f',
      fieldMetadataUniversalIdentifier:
        MAINTENANCE_AGREEMENT_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
      position: 1,
      isVisible: true,
      size: 140,
    },
    {
      universalIdentifier: '503bd04c-ea39-4c16-8f92-1b88f7514612',
      fieldMetadataUniversalIdentifier:
        MAINTENANCE_AGREEMENT_ANNUAL_VALUE_FIELD_UNIVERSAL_IDENTIFIER,
      position: 2,
      isVisible: true,
      size: 150,
    },
  ],
});
