import { defineObject, FieldType } from 'twenty-sdk/define';

export const MAINTENANCE_AGREEMENT_UNIVERSAL_IDENTIFIER =
  'c30ea6b1-0acf-41f1-b8d3-0b334367b1fa';
export const MAINTENANCE_AGREEMENT_NAME_FIELD_UNIVERSAL_IDENTIFIER =
  '11b8d26d-bada-4bfd-867a-6429dd9e22a7';
export const MAINTENANCE_AGREEMENT_NUMBER_FIELD_UNIVERSAL_IDENTIFIER =
  '7a1d9aed-4ae4-4790-96bd-edae5fc9451e';
export const MAINTENANCE_AGREEMENT_STATUS_FIELD_UNIVERSAL_IDENTIFIER =
  '81495c0d-d11d-44e8-9de8-4b03476ebfeb';
export const MAINTENANCE_AGREEMENT_PLAN_TYPE_FIELD_UNIVERSAL_IDENTIFIER =
  'b60b0042-6f99-4dae-9056-30cab89ecc9e';
export const MAINTENANCE_AGREEMENT_START_DATE_FIELD_UNIVERSAL_IDENTIFIER =
  'ab052812-908d-4e9c-a9bc-dc469d112dda';
export const MAINTENANCE_AGREEMENT_END_DATE_FIELD_UNIVERSAL_IDENTIFIER =
  '7d46e0f6-dbf7-4fed-abfb-235d68808865';
export const MAINTENANCE_AGREEMENT_RENEWAL_DATE_FIELD_UNIVERSAL_IDENTIFIER =
  '7dc03aaf-3da2-432c-96c1-b9388c27b46d';
export const MAINTENANCE_AGREEMENT_VISITS_PER_YEAR_FIELD_UNIVERSAL_IDENTIFIER =
  'a33c1fe5-e058-4d0b-9cc7-0be56520ee5c';
export const MAINTENANCE_AGREEMENT_ANNUAL_VALUE_FIELD_UNIVERSAL_IDENTIFIER =
  '701e0878-f69a-4355-aa06-f491599ec731';
export const MAINTENANCE_AGREEMENT_BILLING_FREQUENCY_FIELD_UNIVERSAL_IDENTIFIER =
  'fc0248e3-aa08-425f-96de-49054e3792d8';
export const MAINTENANCE_AGREEMENT_AUTO_RENEW_FIELD_UNIVERSAL_IDENTIFIER =
  '7a07242b-d87b-4fa4-8089-f40baac34a91';

const STATUS_OPTIONS = [
  ['a6fc19af-0c31-492a-bd09-6afe0fd8caf4', 'DRAFT', 'Draft', 'gray'],
  ['8d7519cc-03e1-46ed-a4c5-b3bc930eb2d3', 'ACTIVE', 'Active', 'green'],
  ['407bf9b2-6f3e-4850-b44c-a8db3bcbafd1', 'PAUSED', 'Paused', 'yellow'],
  ['f5be1cb3-fc91-4992-8076-6ece0fc0fda9', 'EXPIRED', 'Expired', 'orange'],
  ['c90974f0-b065-4cb4-87eb-95b55046da7c', 'CANCELLED', 'Cancelled', 'red'],
] as const;

const PLAN_TYPE_OPTIONS = [
  ['1070d16b-9acb-46f7-ad9d-3cfe07af52ad', 'BASIC', 'Basic'],
  ['f52c427a-689c-439b-8ca6-ee9db3d53339', 'STANDARD', 'Standard'],
  ['12b9e68e-4b57-4d7d-a35c-43d09a08e48f', 'PREMIUM', 'Premium'],
  ['d1193b96-9280-4f6e-9d05-f441748a7270', 'CUSTOM', 'Custom'],
] as const;

const BILLING_FREQUENCY_OPTIONS = [
  ['67f94a2d-4452-4a57-ab70-180ae216c2c3', 'ANNUAL', 'Annual'],
  ['1626976c-ccc0-495c-aa2d-3d7dc7dabe8f', 'SEMIANNUAL', 'Semiannual'],
  ['5a24953d-1a88-443e-9fd9-7379abe1addc', 'QUARTERLY', 'Quarterly'],
  ['f4aba851-38b5-4eea-a243-65333bcfcbc7', 'MONTHLY', 'Monthly'],
  ['3a730f1c-7432-4bed-ad1e-22fd0d0c3b67', 'ONE_TIME', 'One time'],
] as const;

export default defineObject({
  universalIdentifier: MAINTENANCE_AGREEMENT_UNIVERSAL_IDENTIFIER,
  nameSingular: 'maintenanceAgreement',
  namePlural: 'maintenanceAgreements',
  labelSingular: 'Maintenance agreement',
  labelPlural: 'Maintenance agreements',
  description: 'An HVAC service agreement with recurring visit entitlements',
  icon: 'IconContract',
  labelIdentifierFieldMetadataUniversalIdentifier:
    MAINTENANCE_AGREEMENT_NAME_FIELD_UNIVERSAL_IDENTIFIER,
  fields: [
    {
      universalIdentifier:
        MAINTENANCE_AGREEMENT_NAME_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'name',
      label: 'Name',
      icon: 'IconContract',
    },
    {
      universalIdentifier:
        MAINTENANCE_AGREEMENT_NUMBER_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'agreementNumber',
      label: 'Agreement number',
      icon: 'IconHash',
    },
    {
      universalIdentifier:
        MAINTENANCE_AGREEMENT_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.SELECT,
      name: 'status',
      label: 'Status',
      icon: 'IconProgress',
      defaultValue: "'DRAFT'",
      options: STATUS_OPTIONS.map(([id, value, label, color], position) => ({
        id,
        value,
        label,
        color,
        position,
      })),
    },
    {
      universalIdentifier:
        MAINTENANCE_AGREEMENT_PLAN_TYPE_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.SELECT,
      name: 'planType',
      label: 'Plan type',
      icon: 'IconPackages',
      defaultValue: "'STANDARD'",
      options: PLAN_TYPE_OPTIONS.map(([id, value, label], position) => ({
        id,
        value,
        label,
        color: 'blue',
        position,
      })),
    },
    {
      universalIdentifier:
        MAINTENANCE_AGREEMENT_START_DATE_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.DATE,
      name: 'startDate',
      label: 'Start date',
      icon: 'IconCalendarPlus',
    },
    {
      universalIdentifier:
        MAINTENANCE_AGREEMENT_END_DATE_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.DATE,
      name: 'endDate',
      label: 'End date',
      icon: 'IconCalendarDue',
      isNullable: true,
    },
    {
      universalIdentifier:
        MAINTENANCE_AGREEMENT_RENEWAL_DATE_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.DATE,
      name: 'renewalDate',
      label: 'Renewal date',
      icon: 'IconCalendarRepeat',
      isNullable: true,
    },
    {
      universalIdentifier:
        MAINTENANCE_AGREEMENT_VISITS_PER_YEAR_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.NUMBER,
      name: 'visitsPerYear',
      label: 'Visits per year',
      icon: 'IconCalendarStats',
      defaultValue: 2,
    },
    {
      universalIdentifier:
        MAINTENANCE_AGREEMENT_ANNUAL_VALUE_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.CURRENCY,
      name: 'annualValue',
      label: 'Annual value',
      icon: 'IconCurrencyDollar',
      isNullable: true,
    },
    {
      universalIdentifier:
        MAINTENANCE_AGREEMENT_BILLING_FREQUENCY_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.SELECT,
      name: 'billingFrequency',
      label: 'Billing frequency',
      icon: 'IconReceiptRecurring',
      defaultValue: "'ANNUAL'",
      options: BILLING_FREQUENCY_OPTIONS.map(
        ([id, value, label], position) => ({
          id,
          value,
          label,
          color: 'gray',
          position,
        }),
      ),
    },
    {
      universalIdentifier:
        MAINTENANCE_AGREEMENT_AUTO_RENEW_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.BOOLEAN,
      name: 'autoRenew',
      label: 'Auto-renew',
      icon: 'IconRefresh',
      defaultValue: false,
    },
    {
      universalIdentifier: '59b8e9cd-deda-4557-8ca6-4a2eb74eaf6c',
      type: FieldType.TEXT,
      name: 'sourceExternalId',
      label: 'Source external ID',
      description: 'Stable source identity for repeatable imports',
      icon: 'IconDatabase',
      isNullable: true,
    },
    {
      universalIdentifier: '3fd2ec30-c618-4e43-8855-698257dfb838',
      type: FieldType.RICH_TEXT,
      name: 'notes',
      label: 'Notes',
      icon: 'IconNotes',
      isNullable: true,
    },
  ],
});
