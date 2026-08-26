import {
  defineView,
  ViewCalendarLayout,
  ViewType,
} from 'twenty-sdk/define';

import { COMPANY_ON_SERVICE_JOB_FIELD_UNIVERSAL_IDENTIFIER } from 'src/fields/company-on-service-job.field';
import { EQUIPMENT_ON_SERVICE_JOB_FIELD_UNIVERSAL_IDENTIFIER } from 'src/fields/equipment-on-service-job.field';
import { SERVICE_CONTACT_ON_SERVICE_JOB_FIELD_UNIVERSAL_IDENTIFIER } from 'src/fields/service-contact-on-service-job.field';
import {
  SERVICE_JOB_APPOINTMENT_WINDOW_FIELD_UNIVERSAL_IDENTIFIER,
  SERVICE_JOB_END_DATETIME_FIELD_UNIVERSAL_IDENTIFIER,
  SERVICE_JOB_START_DATETIME_FIELD_UNIVERSAL_IDENTIFIER,
  SERVICE_JOB_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
  SERVICE_JOB_URGENCY_FIELD_UNIVERSAL_IDENTIFIER,
  SERVICE_JOB_UNIVERSAL_IDENTIFIER,
} from 'src/objects/service-job.object';

export default defineView({
  universalIdentifier: 'c1a15b01-ac00-414a-9422-7daa0cd09b26',
  name: 'Service call booking calendar',
  objectUniversalIdentifier: SERVICE_JOB_UNIVERSAL_IDENTIFIER,
  type: ViewType.CALENDAR,
  icon: 'IconCalendarEvent',
  position: 0,
  calendarLayout: ViewCalendarLayout.WEEK,
  calendarFieldMetadataUniversalIdentifier:
    SERVICE_JOB_START_DATETIME_FIELD_UNIVERSAL_IDENTIFIER,
  calendarEndFieldMetadataUniversalIdentifier:
    SERVICE_JOB_END_DATETIME_FIELD_UNIVERSAL_IDENTIFIER,
  fields: [
    {
      universalIdentifier: 'a688a0dc-4cf0-4238-a614-5278a95353d9',
      fieldMetadataUniversalIdentifier:
        SERVICE_JOB_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
      position: 0,
      isVisible: true,
      size: 140,
    },
    {
      universalIdentifier: 'b053fdc3-4611-4c3b-9dde-5e9b51469bb6',
      fieldMetadataUniversalIdentifier:
        COMPANY_ON_SERVICE_JOB_FIELD_UNIVERSAL_IDENTIFIER,
      position: 1,
      isVisible: true,
      size: 200,
    },
    {
      universalIdentifier: 'e91b798d-929e-4b4d-8a50-b01c5e687058',
      fieldMetadataUniversalIdentifier:
        SERVICE_CONTACT_ON_SERVICE_JOB_FIELD_UNIVERSAL_IDENTIFIER,
      position: 2,
      isVisible: true,
      size: 200,
    },
    {
      universalIdentifier: '4fb1530d-fd1c-45da-99fd-6b35f243cd23',
      fieldMetadataUniversalIdentifier:
        EQUIPMENT_ON_SERVICE_JOB_FIELD_UNIVERSAL_IDENTIFIER,
      position: 3,
      isVisible: true,
      size: 200,
    },
    {
      universalIdentifier: '82d6f67a-519b-439d-a3f1-0d0c0663173b',
      fieldMetadataUniversalIdentifier:
        SERVICE_JOB_APPOINTMENT_WINDOW_FIELD_UNIVERSAL_IDENTIFIER,
      position: 4,
      isVisible: true,
      size: 180,
    },
    {
      universalIdentifier: '517da120-1bd1-4af4-8556-7af5ad6a435b',
      fieldMetadataUniversalIdentifier:
        SERVICE_JOB_URGENCY_FIELD_UNIVERSAL_IDENTIFIER,
      position: 5,
      isVisible: true,
      size: 140,
    },
  ],
});
