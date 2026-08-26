import { defineObject, FieldType } from 'twenty-sdk/define';

export const INVOICE_ITEM_UNIVERSAL_IDENTIFIER = 'a7cefaa6-82b4-4c06-b04f-aa01e06f1e22';
export const INVOICE_ITEM_NAME_FIELD_UNIVERSAL_IDENTIFIER = '5b65702a-cd39-47aa-ae90-60f0d86545c2';
export const INVOICE_ITEM_SOURCE_EXTERNAL_ID_FIELD_UNIVERSAL_IDENTIFIER = 'f41187bc-0f41-4194-b5ec-7a0962e2e2ad';

export default defineObject({
  universalIdentifier: INVOICE_ITEM_UNIVERSAL_IDENTIFIER,
  nameSingular: 'invoiceItem', namePlural: 'invoiceItems', labelSingular: 'Invoice item', labelPlural: 'Invoice items', description: 'A line item on an invoice', icon: 'IconListDetails', labelIdentifierFieldMetadataUniversalIdentifier: INVOICE_ITEM_NAME_FIELD_UNIVERSAL_IDENTIFIER,
  fields: [
    { universalIdentifier: INVOICE_ITEM_NAME_FIELD_UNIVERSAL_IDENTIFIER, type: FieldType.TEXT, name: 'name', label: 'Name', icon: 'IconReceipt' },
    { universalIdentifier: INVOICE_ITEM_SOURCE_EXTERNAL_ID_FIELD_UNIVERSAL_IDENTIFIER, type: FieldType.TEXT, name: 'sourceExternalId', label: 'Source external ID', icon: 'IconDatabase', isNullable: true },
    { universalIdentifier: '9b49acfe-2102-4e09-a540-388a9449aa76', type: FieldType.TEXT, name: 'description', label: 'Description', icon: 'IconAbc' },
    { universalIdentifier: '82b910ea-ccc4-4a61-b292-22a14264b295', type: FieldType.RICH_TEXT, name: 'longDescription', label: 'Long description', icon: 'IconNotes', isNullable: true },
    { universalIdentifier: 'd9b0d8cf-cead-4b4b-90c6-71e822de23fd', type: FieldType.NUMBER, name: 'quantity', label: 'Quantity', icon: 'Icon123' },
    { universalIdentifier: '8b0b5a7a-cd2b-4d29-b6ea-116daaf59555', type: FieldType.TEXT, name: 'unit', label: 'Unit', icon: 'IconRuler', isNullable: true },
    { universalIdentifier: 'a0f7bf7c-fe9f-4140-adb2-e1fca18a3044', type: FieldType.TEXT, name: 'currencyCode', label: 'Currency code', icon: 'IconCurrencyDollar', defaultValue: "'USD'" },
    { universalIdentifier: 'd4430c18-ec7e-4354-91aa-3f3959793365', type: FieldType.CURRENCY, name: 'unitPrice', label: 'Unit price', icon: 'IconCurrencyDollar' },
    { universalIdentifier: '235e4c0f-6049-46b9-b27f-0b613e6283e9', type: FieldType.CURRENCY, name: 'subtotal', label: 'Subtotal', icon: 'IconCurrencyDollar' },
    { universalIdentifier: '164d4092-55db-4d22-857f-723d3c47528a', type: FieldType.CURRENCY, name: 'tax', label: 'Tax', icon: 'IconCurrencyDollar' },
    { universalIdentifier: '1cc02a2d-50c4-4f4c-8498-9637ba4b84a6', type: FieldType.CURRENCY, name: 'total', label: 'Total', icon: 'IconCurrencyDollar' },
  ],
});
