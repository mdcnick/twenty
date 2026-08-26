import { defineIndex } from 'twenty-sdk/define';
import { INVOICE_SOURCE_EXTERNAL_ID_FIELD_UNIVERSAL_IDENTIFIER, INVOICE_UNIVERSAL_IDENTIFIER } from '../objects/invoice.object';

export default defineIndex({ universalIdentifier: '08682048-3358-47fa-bbdd-953088791e5d', objectUniversalIdentifier: INVOICE_UNIVERSAL_IDENTIFIER, isUnique: true, fields: [{ universalIdentifier: '36ca9e6f-e140-40bc-9a93-f863033215f1', fieldUniversalIdentifier: INVOICE_SOURCE_EXTERNAL_ID_FIELD_UNIVERSAL_IDENTIFIER }] });
