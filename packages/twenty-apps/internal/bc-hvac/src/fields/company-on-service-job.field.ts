import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';
import { SERVICE_JOB_UNIVERSAL_IDENTIFIER } from '../objects/service-job.object';

export const COMPANY_ON_SERVICE_JOB_FIELD_UNIVERSAL_IDENTIFIER =
  'c3127a06-6e5d-40db-8fe4-8800fea76986';
export const SERVICE_JOBS_ON_COMPANY_FIELD_UNIVERSAL_IDENTIFIER =
  '5dd4e362-86d0-472b-84dd-14fcff1626ca';

export default defineField({
  universalIdentifier: COMPANY_ON_SERVICE_JOB_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: SERVICE_JOB_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'company',
  label: 'Company',
  icon: 'IconBuilding',
  relationTargetObjectMetadataUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.company.universalIdentifier,
  relationTargetFieldMetadataUniversalIdentifier:
    SERVICE_JOBS_ON_COMPANY_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'companyId',
  },
});
