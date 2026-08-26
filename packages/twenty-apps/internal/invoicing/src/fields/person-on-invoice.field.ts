import { defineField, FieldType, OnDeleteAction, RelationType, STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS } from 'twenty-sdk/define';
import { INVOICE_UNIVERSAL_IDENTIFIER } from '../objects/invoice.object';

export const PERSON_ON_INVOICE_FIELD_UNIVERSAL_IDENTIFIER = 'cc7f0e63-07b5-4a9d-aaa5-12482fb44542';
export const INVOICES_ON_PERSON_FIELD_UNIVERSAL_IDENTIFIER = 'cd00b8e2-b9c3-43db-b956-c85866d3d610';

export default defineField({ universalIdentifier: PERSON_ON_INVOICE_FIELD_UNIVERSAL_IDENTIFIER, objectUniversalIdentifier: INVOICE_UNIVERSAL_IDENTIFIER, type: FieldType.RELATION, name: 'person', label: 'Person', icon: 'IconUser', relationTargetObjectMetadataUniversalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier, relationTargetFieldMetadataUniversalIdentifier: INVOICES_ON_PERSON_FIELD_UNIVERSAL_IDENTIFIER, universalSettings: { relationType: RelationType.MANY_TO_ONE, onDelete: OnDeleteAction.SET_NULL, joinColumnName: 'personId' } });
