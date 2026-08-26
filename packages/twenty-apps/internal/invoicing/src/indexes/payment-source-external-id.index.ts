import { defineIndex } from 'twenty-sdk/define';
import { PAYMENT_SOURCE_EXTERNAL_ID_FIELD_UNIVERSAL_IDENTIFIER, PAYMENT_UNIVERSAL_IDENTIFIER } from '../objects/payment.object';

export default defineIndex({ universalIdentifier: 'b05b2db5-33a9-4131-b101-c7fbd20d75d4', objectUniversalIdentifier: PAYMENT_UNIVERSAL_IDENTIFIER, isUnique: true, fields: [{ universalIdentifier: '7102c790-3a53-4b67-8e03-7f8b3c06fab1', fieldUniversalIdentifier: PAYMENT_SOURCE_EXTERNAL_ID_FIELD_UNIVERSAL_IDENTIFIER }] });
