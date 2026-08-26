import { defineObject, FieldType } from 'twenty-sdk/define';

export const PAYMENT_UNIVERSAL_IDENTIFIER = 'e86bd2a0-61aa-4ff1-8a8f-01cb121e62f8';
export const PAYMENT_NAME_FIELD_UNIVERSAL_IDENTIFIER = 'fcd9c551-814c-4daa-824a-b6715d488104';
export const PAYMENT_SOURCE_EXTERNAL_ID_FIELD_UNIVERSAL_IDENTIFIER = 'e43212a4-49fd-468b-8c31-57c7880a2617';

export default defineObject({
  universalIdentifier: PAYMENT_UNIVERSAL_IDENTIFIER,
  nameSingular: 'payment', namePlural: 'payments', labelSingular: 'Payment', labelPlural: 'Payments', description: 'A recorded invoice payment', icon: 'IconCash', labelIdentifierFieldMetadataUniversalIdentifier: PAYMENT_NAME_FIELD_UNIVERSAL_IDENTIFIER,
  fields: [
    { universalIdentifier: PAYMENT_NAME_FIELD_UNIVERSAL_IDENTIFIER, type: FieldType.TEXT, name: 'name', label: 'Name', icon: 'IconCash' },
    { universalIdentifier: PAYMENT_SOURCE_EXTERNAL_ID_FIELD_UNIVERSAL_IDENTIFIER, type: FieldType.TEXT, name: 'sourceExternalId', label: 'Source external ID', icon: 'IconDatabase', isNullable: true },
    { universalIdentifier: '347e182c-5f38-47b8-9318-a1d3997ebc08', type: FieldType.DATE, name: 'paymentDate', label: 'Payment date', icon: 'IconCalendar', isNullable: true },
    { universalIdentifier: 'a7fc77b4-2420-4c14-9556-a487b09d6e97', type: FieldType.CURRENCY, name: 'amount', label: 'Amount', icon: 'IconCurrencyDollar' },
    { universalIdentifier: '640c6e59-c4b8-4783-a772-b5c6cfa48549', type: FieldType.TEXT, name: 'currencyCode', label: 'Currency code', icon: 'IconCurrencyDollar', defaultValue: "'USD'" },
    { universalIdentifier: '4200df74-503a-49b2-aad5-a4961e046655', type: FieldType.TEXT, name: 'method', label: 'Method', icon: 'IconCreditCard', isNullable: true },
    { universalIdentifier: 'e1d8d43d-e524-4b5e-b67b-e29f44a5632f', type: FieldType.TEXT, name: 'transactionId', label: 'Transaction ID', icon: 'IconHash', isNullable: true },
    { universalIdentifier: '37f0df3c-79c1-4647-8d25-65643b336ecc', type: FieldType.RICH_TEXT, name: 'note', label: 'Note', icon: 'IconNotes', isNullable: true },
  ],
});
