import { defineField, FieldType, RelationType } from 'twenty-sdk/define';
import { INVOICE_UNIVERSAL_IDENTIFIER } from '../objects/invoice.object';
import { INVOICE_ITEM_UNIVERSAL_IDENTIFIER } from '../objects/invoice-item.object';
import { INVOICE_ON_INVOICE_ITEM_FIELD_UNIVERSAL_IDENTIFIER } from './invoice-on-invoice-item.field';

export default defineField({ universalIdentifier: 'c01ce220-c3bc-4ca5-a30a-abc37cbf4dfb', objectUniversalIdentifier: INVOICE_UNIVERSAL_IDENTIFIER, type: FieldType.RELATION, name: 'invoiceItems', label: 'Invoice items', icon: 'IconListDetails', relationTargetObjectMetadataUniversalIdentifier: INVOICE_ITEM_UNIVERSAL_IDENTIFIER, relationTargetFieldMetadataUniversalIdentifier: INVOICE_ON_INVOICE_ITEM_FIELD_UNIVERSAL_IDENTIFIER, universalSettings: { relationType: RelationType.ONE_TO_MANY } });
