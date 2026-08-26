import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';
import { SERVICE_EVENT_UNIVERSAL_IDENTIFIER } from '../objects/service-event.object';

export const COMPANY_ON_SERVICE_EVENT_FIELD_UNIVERSAL_IDENTIFIER =
  'dae2cbff-abb5-4bed-9283-0b4587d6087d';
export const SERVICE_EVENTS_ON_COMPANY_FIELD_UNIVERSAL_IDENTIFIER =
  '240f15dd-2213-4424-b5cd-6a9bfe8daf15';

export default defineField({
  universalIdentifier: COMPANY_ON_SERVICE_EVENT_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: SERVICE_EVENT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'company',
  label: 'Company',
  icon: 'IconBuilding',
  relationTargetObjectMetadataUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.company.universalIdentifier,
  relationTargetFieldMetadataUniversalIdentifier:
    SERVICE_EVENTS_ON_COMPANY_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'companyId',
  },
});
