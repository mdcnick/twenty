import {
  defineField,
  FieldType,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';
import { SERVICE_EVENT_UNIVERSAL_IDENTIFIER } from '../objects/service-event.object';
import {
  COMPANY_ON_SERVICE_EVENT_FIELD_UNIVERSAL_IDENTIFIER,
  SERVICE_EVENTS_ON_COMPANY_FIELD_UNIVERSAL_IDENTIFIER,
} from './company-on-service-event.field';

export default defineField({
  universalIdentifier: SERVICE_EVENTS_ON_COMPANY_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.company.universalIdentifier,
  type: FieldType.RELATION,
  name: 'serviceEvents',
  label: 'Service events',
  icon: 'IconHistory',
  relationTargetObjectMetadataUniversalIdentifier:
    SERVICE_EVENT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    COMPANY_ON_SERVICE_EVENT_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
