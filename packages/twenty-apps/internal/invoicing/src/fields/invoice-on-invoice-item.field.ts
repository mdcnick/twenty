import { defineField, FieldType, OnDeleteAction, RelationType } from 'twenty-sdk/define';
import { INVOICE_UNIVERSAL_IDENTIFIER } from '../objects/invoice.object';
import { INVOICE_ITEM_UNIVERSAL_IDENTIFIER } from '../objects/invoice-item.object';

export const INVOICE_ON_INVOICE_ITEM_FIELD_UNIVERSAL_IDENTIFIER = '71efc2d8-2d41-4d8c-b628-e4e5a975405f';
export const INVOICE_ITEMS_ON_INVOICE_FIELD_UNIVERSAL_IDENTIFIER = 'c01ce220-c3bc-4ca5-a30a-abc37cbf4dfb';

export default defineField({ universalIdentifier: INVOICE_ON_INVOICE_ITEM_FIELD_UNIVERSAL_IDENTIFIER, objectUniversalIdentifier: INVOICE_ITEM_UNIVERSAL_IDENTIFIER, type: FieldType.RELATION, name: 'invoice', label: 'Invoice', icon: 'IconFileInvoice', relationTargetObjectMetadataUniversalIdentifier: INVOICE_UNIVERSAL_IDENTIFIER, relationTargetFieldMetadataUniversalIdentifier: INVOICE_ITEMS_ON_INVOICE_FIELD_UNIVERSAL_IDENTIFIER, universalSettings: { relationType: RelationType.MANY_TO_ONE, onDelete: OnDeleteAction.RESTRICT, joinColumnName: 'invoiceId' } });
