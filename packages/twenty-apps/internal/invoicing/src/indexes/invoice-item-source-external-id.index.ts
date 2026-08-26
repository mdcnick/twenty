import { defineIndex } from 'twenty-sdk/define';
import { INVOICE_ITEM_SOURCE_EXTERNAL_ID_FIELD_UNIVERSAL_IDENTIFIER, INVOICE_ITEM_UNIVERSAL_IDENTIFIER } from '../objects/invoice-item.object';

export default defineIndex({ universalIdentifier: '3c4c6fcc-3af8-4e96-8fac-41de8e8c7efd', objectUniversalIdentifier: INVOICE_ITEM_UNIVERSAL_IDENTIFIER, isUnique: true, fields: [{ universalIdentifier: '11f049f3-86a6-4adc-8c6f-76dc6577d959', fieldUniversalIdentifier: INVOICE_ITEM_SOURCE_EXTERNAL_ID_FIELD_UNIVERSAL_IDENTIFIER }] });
