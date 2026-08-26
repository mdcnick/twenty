import { defineField, FieldType, RelationType, STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS } from 'twenty-sdk/define';
import { COMPANY_ON_INVOICE_FIELD_UNIVERSAL_IDENTIFIER } from './company-on-invoice.field';
import { INVOICE_UNIVERSAL_IDENTIFIER } from '../objects/invoice.object';

export default defineField({ universalIdentifier: '861d2a86-f250-4058-9cfd-4bc7f1371110', objectUniversalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.company.universalIdentifier, type: FieldType.RELATION, name: 'invoices', label: 'Invoices', icon: 'IconFileInvoice', relationTargetObjectMetadataUniversalIdentifier: INVOICE_UNIVERSAL_IDENTIFIER, relationTargetFieldMetadataUniversalIdentifier: COMPANY_ON_INVOICE_FIELD_UNIVERSAL_IDENTIFIER, universalSettings: { relationType: RelationType.ONE_TO_MANY } });
