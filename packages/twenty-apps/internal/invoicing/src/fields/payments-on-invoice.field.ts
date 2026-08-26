import { defineField, FieldType, RelationType } from 'twenty-sdk/define';
import { INVOICE_UNIVERSAL_IDENTIFIER } from '../objects/invoice.object';
import { PAYMENT_UNIVERSAL_IDENTIFIER } from '../objects/payment.object';
import { INVOICE_ON_PAYMENT_FIELD_UNIVERSAL_IDENTIFIER } from './invoice-on-payment.field';

export default defineField({ universalIdentifier: 'ef8c3f56-e914-4e22-bbdb-26c54dfb5f40', objectUniversalIdentifier: INVOICE_UNIVERSAL_IDENTIFIER, type: FieldType.RELATION, name: 'payments', label: 'Payments', icon: 'IconCash', relationTargetObjectMetadataUniversalIdentifier: PAYMENT_UNIVERSAL_IDENTIFIER, relationTargetFieldMetadataUniversalIdentifier: INVOICE_ON_PAYMENT_FIELD_UNIVERSAL_IDENTIFIER, universalSettings: { relationType: RelationType.ONE_TO_MANY } });
