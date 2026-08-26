import { defineField, FieldType, OnDeleteAction, RelationType } from 'twenty-sdk/define';
import { INVOICE_UNIVERSAL_IDENTIFIER } from '../objects/invoice.object';
import { PAYMENT_UNIVERSAL_IDENTIFIER } from '../objects/payment.object';

export const INVOICE_ON_PAYMENT_FIELD_UNIVERSAL_IDENTIFIER = 'f07f1346-b621-4ee8-bd1e-96b0e9ad4042';
export const PAYMENTS_ON_INVOICE_FIELD_UNIVERSAL_IDENTIFIER = 'ef8c3f56-e914-4e22-bbdb-26c54dfb5f40';

export default defineField({ universalIdentifier: INVOICE_ON_PAYMENT_FIELD_UNIVERSAL_IDENTIFIER, objectUniversalIdentifier: PAYMENT_UNIVERSAL_IDENTIFIER, type: FieldType.RELATION, name: 'invoice', label: 'Invoice', icon: 'IconFileInvoice', relationTargetObjectMetadataUniversalIdentifier: INVOICE_UNIVERSAL_IDENTIFIER, relationTargetFieldMetadataUniversalIdentifier: PAYMENTS_ON_INVOICE_FIELD_UNIVERSAL_IDENTIFIER, universalSettings: { relationType: RelationType.MANY_TO_ONE, onDelete: OnDeleteAction.RESTRICT, joinColumnName: 'invoiceId' } });
