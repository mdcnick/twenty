import { defineField, FieldType, RelationType } from 'twenty-sdk/define';
import { SERVICE_EVENT_UNIVERSAL_IDENTIFIER } from '../objects/service-event.object';
import { SERVICE_JOB_UNIVERSAL_IDENTIFIER } from '../objects/service-job.object';
import {
  SERVICE_EVENTS_ON_SERVICE_JOB_FIELD_UNIVERSAL_IDENTIFIER,
  SERVICE_JOB_ON_SERVICE_EVENT_FIELD_UNIVERSAL_IDENTIFIER,
} from './service-job-on-service-event.field';

export default defineField({
  universalIdentifier: SERVICE_EVENTS_ON_SERVICE_JOB_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: SERVICE_JOB_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'serviceEvents',
  label: 'Service events',
  icon: 'IconHistory',
  relationTargetObjectMetadataUniversalIdentifier:
    SERVICE_EVENT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    SERVICE_JOB_ON_SERVICE_EVENT_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
