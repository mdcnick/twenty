import { defineField, FieldType, OnDeleteAction, RelationType, STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS } from 'twenty-sdk/define';
import { INVOICE_UNIVERSAL_IDENTIFIER } from '../objects/invoice.object';

export const COMPANY_ON_INVOICE_FIELD_UNIVERSAL_IDENTIFIER = 'c2e16d9d-1061-4876-8e69-7176f9b202b9';
export const INVOICES_ON_COMPANY_FIELD_UNIVERSAL_IDENTIFIER = '861d2a86-f250-4058-9cfd-4bc7f1371110';

export default defineField({ universalIdentifier: COMPANY_ON_INVOICE_FIELD_UNIVERSAL_IDENTIFIER, objectUniversalIdentifier: INVOICE_UNIVERSAL_IDENTIFIER, type: FieldType.RELATION, name: 'company', label: 'Company', icon: 'IconBuilding', relationTargetObjectMetadataUniversalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.company.universalIdentifier, relationTargetFieldMetadataUniversalIdentifier: INVOICES_ON_COMPANY_FIELD_UNIVERSAL_IDENTIFIER, universalSettings: { relationType: RelationType.MANY_TO_ONE, onDelete: OnDeleteAction.SET_NULL, joinColumnName: 'companyId' } });
