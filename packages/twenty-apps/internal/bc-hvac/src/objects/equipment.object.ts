import { defineObject, FieldType } from 'twenty-sdk/define';

export const EQUIPMENT_UNIVERSAL_IDENTIFIER =
  '42cb6fc5-6245-49ad-803e-c65aafd2de4f';
export const EQUIPMENT_NAME_FIELD_UNIVERSAL_IDENTIFIER =
  'b4c885da-aea4-4426-9c4a-9af1fa8dbe8f';
export const EQUIPMENT_PERFEX_EXTERNAL_ID_FIELD_UNIVERSAL_IDENTIFIER =
  'cbcb3b0e-cdb7-430f-a8d2-da5be500f06d';
export const EQUIPMENT_TYPE_FIELD_UNIVERSAL_IDENTIFIER =
  '6d03dc6e-3bc8-4383-9c16-c58aa1e4a51e';
export const EQUIPMENT_BRAND_FIELD_UNIVERSAL_IDENTIFIER =
  '06fed231-c242-4ebf-975f-ba8a5161b746';
export const EQUIPMENT_MODEL_NUMBER_FIELD_UNIVERSAL_IDENTIFIER =
  '17533eee-e5c6-4033-9947-17c8e3b44683';
export const EQUIPMENT_SERIAL_NUMBER_FIELD_UNIVERSAL_IDENTIFIER =
  '504e1a62-031a-4646-a94b-94dc80133aae';
export const EQUIPMENT_FILTER_SIZE_FIELD_UNIVERSAL_IDENTIFIER =
  'ded6fb84-cf01-4b6e-a204-477ccb015539';
export const EQUIPMENT_INSTALL_DATE_FIELD_UNIVERSAL_IDENTIFIER =
  'c3563f7a-1f83-4973-9cc8-3ac4b2a11221';
export const EQUIPMENT_WARRANTY_EXPIRES_FIELD_UNIVERSAL_IDENTIFIER =
  '11a9c993-fd38-45df-b081-5756266817da';
export const EQUIPMENT_LOCATION_FIELD_UNIVERSAL_IDENTIFIER =
  'd9971c23-4111-42f2-b804-56599ee56937';
export const EQUIPMENT_NOTES_FIELD_UNIVERSAL_IDENTIFIER =
  '35178029-1398-44a2-9800-d0a31267da05';
export const EQUIPMENT_SOURCE_TYPE_FIELD_UNIVERSAL_IDENTIFIER =
  '30e75053-93fc-4e79-b10e-5a6783faf26f';
export const EQUIPMENT_SOURCE_REFERENCE_FIELD_UNIVERSAL_IDENTIFIER =
  '42e5ad56-4641-4b8f-92b7-d4d47ea46da7';
export const EQUIPMENT_ACTIVE_FIELD_UNIVERSAL_IDENTIFIER =
  '62524f39-735a-4ebb-9dd0-9e28832cb260';

export default defineObject({
  universalIdentifier: EQUIPMENT_UNIVERSAL_IDENTIFIER,
  nameSingular: 'equipment',
  namePlural: 'equipmentUnits',
  labelSingular: 'Equipment',
  labelPlural: 'Equipment',
  description: 'A customer HVAC system or component',
  icon: 'IconAirConditioning',
  labelIdentifierFieldMetadataUniversalIdentifier:
    EQUIPMENT_NAME_FIELD_UNIVERSAL_IDENTIFIER,
  fields: [
    {
      universalIdentifier: EQUIPMENT_NAME_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'name',
      label: 'Name',
      icon: 'IconAbc',
    },
    {
      universalIdentifier: EQUIPMENT_PERFEX_EXTERNAL_ID_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'perfexExternalId',
      label: 'Perfex external ID',
      description: 'Stable source identifier for repeatable migration runs',
      icon: 'IconDatabase',
    },
    {
      universalIdentifier: EQUIPMENT_TYPE_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'equipmentType',
      label: 'Equipment type',
      icon: 'IconToolsKitchen2',
    },
    {
      universalIdentifier: EQUIPMENT_BRAND_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'brand',
      label: 'Brand',
      icon: 'IconTag',
      isNullable: true,
    },
    {
      universalIdentifier: EQUIPMENT_MODEL_NUMBER_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'modelNumber',
      label: 'Model number',
      icon: 'IconHash',
      isNullable: true,
    },
    {
      universalIdentifier: EQUIPMENT_SERIAL_NUMBER_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'serialNumber',
      label: 'Serial number',
      icon: 'IconBarcode',
      isNullable: true,
    },
    {
      universalIdentifier: EQUIPMENT_FILTER_SIZE_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'filterSize',
      label: 'Filter size',
      icon: 'IconFilter',
      isNullable: true,
    },
    {
      universalIdentifier: EQUIPMENT_INSTALL_DATE_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.DATE,
      name: 'installDate',
      label: 'Install date',
      icon: 'IconCalendarPlus',
      isNullable: true,
    },
    {
      universalIdentifier: EQUIPMENT_WARRANTY_EXPIRES_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.DATE,
      name: 'warrantyExpires',
      label: 'Warranty expires',
      icon: 'IconShieldCheck',
      isNullable: true,
    },
    {
      universalIdentifier: EQUIPMENT_LOCATION_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'location',
      label: 'Location',
      icon: 'IconMapPin',
      isNullable: true,
    },
    {
      universalIdentifier: EQUIPMENT_NOTES_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.RICH_TEXT,
      name: 'notes',
      label: 'Notes',
      icon: 'IconNotes',
      isNullable: true,
    },
    {
      universalIdentifier: EQUIPMENT_SOURCE_TYPE_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'sourceType',
      label: 'Source type',
      icon: 'IconArrowMerge',
      isNullable: true,
    },
    {
      universalIdentifier: EQUIPMENT_SOURCE_REFERENCE_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'sourceReference',
      label: 'Source reference',
      icon: 'IconLink',
      isNullable: true,
    },
    {
      universalIdentifier: EQUIPMENT_ACTIVE_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.BOOLEAN,
      name: 'isActive',
      label: 'Active',
      icon: 'IconCircleCheck',
      defaultValue: true,
    },
  ],
});
