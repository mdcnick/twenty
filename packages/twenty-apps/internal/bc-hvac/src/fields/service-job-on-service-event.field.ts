import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
} from 'twenty-sdk/define';
import { SERVICE_EVENT_UNIVERSAL_IDENTIFIER } from '../objects/service-event.object';
import { SERVICE_JOB_UNIVERSAL_IDENTIFIER } from '../objects/service-job.object';

export const SERVICE_JOB_ON_SERVICE_EVENT_FIELD_UNIVERSAL_IDENTIFIER =
  'c9ed817b-b30e-4854-bf35-63ab1edde2e9';
export const SERVICE_EVENTS_ON_SERVICE_JOB_FIELD_UNIVERSAL_IDENTIFIER =
  '10bef226-5ba1-4bfd-a9ac-218bc875d82f';

export default defineField({
  universalIdentifier: SERVICE_JOB_ON_SERVICE_EVENT_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: SERVICE_EVENT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'serviceJob',
  label: 'Service job',
  icon: 'IconCalendarEvent',
  relationTargetObjectMetadataUniversalIdentifier:
    SERVICE_JOB_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    SERVICE_EVENTS_ON_SERVICE_JOB_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'serviceJobId',
  },
});
