import { defineField, FieldType, RelationType, STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS } from 'twenty-sdk/define';
import { PERSON_ON_INVOICE_FIELD_UNIVERSAL_IDENTIFIER } from './person-on-invoice.field';
import { INVOICE_UNIVERSAL_IDENTIFIER } from '../objects/invoice.object';

export default defineField({ universalIdentifier: 'cd00b8e2-b9c3-43db-b956-c85866d3d610', objectUniversalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier, type: FieldType.RELATION, name: 'invoices', label: 'Invoices', icon: 'IconFileInvoice', relationTargetObjectMetadataUniversalIdentifier: INVOICE_UNIVERSAL_IDENTIFIER, relationTargetFieldMetadataUniversalIdentifier: PERSON_ON_INVOICE_FIELD_UNIVERSAL_IDENTIFIER, universalSettings: { relationType: RelationType.ONE_TO_MANY } });
