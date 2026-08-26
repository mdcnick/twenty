import { defineObject, FieldType } from 'twenty-sdk/define';

export const SERVICE_EVENT_UNIVERSAL_IDENTIFIER =
  'fabc8c07-0bc0-42ef-a4f9-fa030940bc9c';
export const SERVICE_EVENT_NAME_FIELD_UNIVERSAL_IDENTIFIER =
  'a081e120-757e-412f-ad99-e2899a6acea5';
export const SERVICE_EVENT_PERFEX_EXTERNAL_ID_FIELD_UNIVERSAL_IDENTIFIER =
  '5df08c70-8fcb-4258-b92e-8d029816a89b';
export const SERVICE_EVENT_SERVICE_DATE_FIELD_UNIVERSAL_IDENTIFIER =
  '788bbbea-c373-4e2d-ab01-6dd8abf6a06f';
export const SERVICE_EVENT_DESCRIPTION_FIELD_UNIVERSAL_IDENTIFIER =
  'a667b84d-8514-44d0-b36d-3633f133d54d';
export const SERVICE_EVENT_LABOR_TOTAL_FIELD_UNIVERSAL_IDENTIFIER =
  '42d46aab-407e-4b80-bdbd-882f6ebf716c';
export const SERVICE_EVENT_MATERIAL_TOTAL_FIELD_UNIVERSAL_IDENTIFIER =
  '34226343-51d1-4ce8-81a3-53e7a7871353';
export const SERVICE_EVENT_PERFEX_INVOICE_EXTERNAL_ID_FIELD_UNIVERSAL_IDENTIFIER =
  '62f6cc3b-22fa-4c94-afb0-93c476df2f46';
export const SERVICE_EVENT_SOURCE_TYPE_FIELD_UNIVERSAL_IDENTIFIER =
  'a8ded3be-ed82-4414-8cca-45c382510a17';
export const SERVICE_EVENT_SOURCE_REFERENCE_FIELD_UNIVERSAL_IDENTIFIER =
  'db2c39d8-209c-402a-aa78-52fc2d679cc7';

export default defineObject({
  universalIdentifier: SERVICE_EVENT_UNIVERSAL_IDENTIFIER,
  nameSingular: 'serviceEvent',
  namePlural: 'serviceEvents',
  labelSingular: 'Service event',
  labelPlural: 'Service events',
  description: 'Completed HVAC work and equipment history',
  icon: 'IconHistory',
  labelIdentifierFieldMetadataUniversalIdentifier:
    SERVICE_EVENT_NAME_FIELD_UNIVERSAL_IDENTIFIER,
  fields: [
    {
      universalIdentifier: SERVICE_EVENT_NAME_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'name',
      label: 'Name',
      icon: 'IconAbc',
    },
    {
      universalIdentifier: SERVICE_EVENT_PERFEX_EXTERNAL_ID_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'perfexExternalId',
      label: 'Perfex external ID',
      description: 'Stable source identifier for repeatable migration runs',
      icon: 'IconDatabase',
    },
    {
      universalIdentifier: SERVICE_EVENT_SERVICE_DATE_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.DATE,
      name: 'serviceDate',
      label: 'Service date',
      icon: 'IconCalendarCheck',
    },
    {
      universalIdentifier: SERVICE_EVENT_DESCRIPTION_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.RICH_TEXT,
      name: 'description',
      label: 'Description',
      icon: 'IconFileDescription',
    },
    {
      universalIdentifier: SERVICE_EVENT_LABOR_TOTAL_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.CURRENCY,
      name: 'laborTotal',
      label: 'Labor total',
      icon: 'IconCurrencyDollar',
      isNullable: true,
    },
    {
      universalIdentifier: SERVICE_EVENT_MATERIAL_TOTAL_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.CURRENCY,
      name: 'materialTotal',
      label: 'Material total',
      icon: 'IconCurrencyDollar',
      isNullable: true,
    },
    {
      universalIdentifier:
        SERVICE_EVENT_PERFEX_INVOICE_EXTERNAL_ID_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'perfexInvoiceExternalId',
      label: 'Perfex invoice external ID',
      icon: 'IconReceipt',
      isNullable: true,
    },
    {
      universalIdentifier: SERVICE_EVENT_SOURCE_TYPE_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'sourceType',
      label: 'Source type',
      icon: 'IconArrowMerge',
      isNullable: true,
    },
    {
      universalIdentifier: SERVICE_EVENT_SOURCE_REFERENCE_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'sourceReference',
      label: 'Source reference',
      icon: 'IconLink',
      isNullable: true,
    },
  ],
});
