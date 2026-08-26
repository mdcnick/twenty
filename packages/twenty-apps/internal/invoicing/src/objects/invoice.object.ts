import { defineObject, FieldType } from 'twenty-sdk/define';

export const INVOICE_UNIVERSAL_IDENTIFIER = 'ee3fa4ef-b30d-48bb-bca0-ca651d5714ed';
export const INVOICE_NAME_FIELD_UNIVERSAL_IDENTIFIER = '753486b2-8158-443a-8fe6-8ca62c7b041b';
export const INVOICE_NUMBER_FIELD_UNIVERSAL_IDENTIFIER = '02d28840-7a1f-4322-8d15-2b906abe7870';
export const INVOICE_SOURCE_EXTERNAL_ID_FIELD_UNIVERSAL_IDENTIFIER = '0a7339df-4975-4a49-bf69-a9ea70659113';

const FIELD_IDENTIFIERS = {
  sourceSystem: '1d14ac5a-c84e-42c3-aa1d-ebc40ee48c5c', sourceStatus: 'fb492a1c-111a-410e-99a9-e64edcbe1b5a', status: '1487fd2e-4a22-4f31-9e06-8ab6a10e7015', issueDate: 'ceada706-647d-490f-a9c9-36ffd6147fab', dueDate: 'e5ba5b6c-454d-4efe-9938-0d122a7e84ce', currencyCode: 'ac5cc29e-a87c-4d66-a734-f3018b2a794a', subtotal: 'bcd8cf59-b782-418b-b19c-9c3e92462931', tax: 'c1c2fa35-e6d1-4e64-abb9-ea3c67898457', discount: 'b096af30-79f4-442b-b5ac-45e7089bfe9c', adjustment: 'eedfdd0f-cf02-4457-a83e-442b855479ba', total: '273b60e8-6245-432a-b234-294f3be0adac', amountPaid: 'bf3ab937-54d9-420c-b9a6-520f91a904eb', balanceDue: 'a7504727-4725-424d-b3c4-18fdf297c50b', clientNote: '558211e7-d1be-4332-9932-366de0b99ed2', adminNote: '5d5f777d-5f36-4d85-a89c-aaaf8c13c213', discrepancyFlag: '43cee149-e15f-4b0f-95e2-63f9cb675863', discrepancyNotes: '1552efb6-e666-4341-8371-a5d55421a0d5', sourceMetadata: '63d6edef-e8c5-406d-8107-4105d23729e9',
} as const;

const currencyField = (key: keyof typeof FIELD_IDENTIFIERS, name: string, label: string) => ({ universalIdentifier: FIELD_IDENTIFIERS[key], type: FieldType.CURRENCY as const, name, label, icon: 'IconCurrencyDollar' });

export default defineObject({
  universalIdentifier: INVOICE_UNIVERSAL_IDENTIFIER,
  nameSingular: 'invoice', namePlural: 'invoices', labelSingular: 'Invoice', labelPlural: 'Invoices', description: 'Manual or historical customer invoice', icon: 'IconFileInvoice', labelIdentifierFieldMetadataUniversalIdentifier: INVOICE_NAME_FIELD_UNIVERSAL_IDENTIFIER,
  fields: [
    { universalIdentifier: INVOICE_NAME_FIELD_UNIVERSAL_IDENTIFIER, type: FieldType.TEXT, name: 'name', label: 'Name', icon: 'IconReceipt' },
    { universalIdentifier: INVOICE_NUMBER_FIELD_UNIVERSAL_IDENTIFIER, type: FieldType.TEXT, name: 'invoiceNumber', label: 'Invoice number', description: 'Display number; it is not globally unique.', icon: 'IconHash' },
    { universalIdentifier: INVOICE_SOURCE_EXTERNAL_ID_FIELD_UNIVERSAL_IDENTIFIER, type: FieldType.TEXT, name: 'sourceExternalId', label: 'Source external ID', description: 'Unique source identity for idempotent imports.', icon: 'IconDatabase', isNullable: true },
    { universalIdentifier: FIELD_IDENTIFIERS.sourceSystem, type: FieldType.TEXT, name: 'sourceSystem', label: 'Source system', icon: 'IconArrowMerge', isNullable: true },
    { universalIdentifier: FIELD_IDENTIFIERS.sourceStatus, type: FieldType.TEXT, name: 'sourceStatus', label: 'Source status', icon: 'IconHistory', isNullable: true },
    { universalIdentifier: FIELD_IDENTIFIERS.status, type: FieldType.SELECT, name: 'status', label: 'Status', icon: 'IconProgress', defaultValue: "'DRAFT'", options: ['DRAFT', 'UNPAID', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED', 'HISTORICAL'].map((value, position) => ({ id: ['cf8669fc-21e4-4bbb-a55c-4614abacce69', '21494ea4-77e4-44d5-a027-ce8c8d9b5a3b', 'c99d7e0d-d7ff-45ed-9a47-2075e948ddd7', 'd0ad9418-94be-4063-8d01-f5722574557a', '5474df07-82a2-42ef-a5b6-c1f70fa131af', '308259b8-0633-4ea1-bbe2-d8225d885cd1', '6d6e883b-4b3d-4c62-b286-cc062e79e68b'][position], value, label: value.split('_').join(' '), position, color: 'gray' })) },
    { universalIdentifier: FIELD_IDENTIFIERS.issueDate, type: FieldType.DATE, name: 'issueDate', label: 'Issue date', icon: 'IconCalendar', isNullable: true },
    { universalIdentifier: FIELD_IDENTIFIERS.dueDate, type: FieldType.DATE, name: 'dueDate', label: 'Due date', icon: 'IconCalendarDue', isNullable: true },
    { universalIdentifier: FIELD_IDENTIFIERS.currencyCode, type: FieldType.TEXT, name: 'currencyCode', label: 'Currency code', icon: 'IconCurrencyDollar', defaultValue: "'USD'" },
    currencyField('subtotal', 'subtotal', 'Subtotal'), currencyField('tax', 'tax', 'Tax'), currencyField('discount', 'discount', 'Discount'), currencyField('adjustment', 'adjustment', 'Adjustment'), currencyField('total', 'total', 'Total'), currencyField('amountPaid', 'amountPaid', 'Amount paid'), currencyField('balanceDue', 'balanceDue', 'Balance due'),
    { universalIdentifier: FIELD_IDENTIFIERS.clientNote, type: FieldType.RICH_TEXT, name: 'clientNote', label: 'Client note', icon: 'IconNotes', isNullable: true },
    { universalIdentifier: FIELD_IDENTIFIERS.adminNote, type: FieldType.RICH_TEXT, name: 'adminNote', label: 'Admin note', icon: 'IconLock', isNullable: true },
    { universalIdentifier: FIELD_IDENTIFIERS.discrepancyFlag, type: FieldType.BOOLEAN, name: 'hasDiscrepancy', label: 'Has discrepancy', icon: 'IconAlertTriangle', defaultValue: false },
    { universalIdentifier: FIELD_IDENTIFIERS.discrepancyNotes, type: FieldType.RICH_TEXT, name: 'discrepancyNotes', label: 'Discrepancy notes', icon: 'IconReport', isNullable: true },
    { universalIdentifier: FIELD_IDENTIFIERS.sourceMetadata, type: FieldType.TEXT, name: 'sourceMetadata', label: 'Source metadata', icon: 'IconCode', isNullable: true },
  ],
});
