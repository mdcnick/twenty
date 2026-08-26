import { defineObject, FieldType } from 'twenty-sdk/define';

export const MAINTENANCE_VISIT_UNIVERSAL_IDENTIFIER =
  'eb6b193b-57e2-4ec3-822f-e4f76259fc4d';
export const MAINTENANCE_VISIT_NAME_FIELD_UNIVERSAL_IDENTIFIER =
  '27c17548-f5fc-481a-b1ba-f53e2311a6c1';
export const MAINTENANCE_VISIT_STATUS_FIELD_UNIVERSAL_IDENTIFIER =
  '7d380213-561d-4a02-968b-5b3c17e9cd43';
export const MAINTENANCE_VISIT_DUE_DATE_FIELD_UNIVERSAL_IDENTIFIER =
  'ed6cb0e7-1d64-4eea-b7e6-0566722cc125';
export const MAINTENANCE_VISIT_SCHEDULED_AT_FIELD_UNIVERSAL_IDENTIFIER =
  '864bf5b7-4f01-4ee6-8a70-453e7b0b7317';
export const MAINTENANCE_VISIT_COMPLETED_AT_FIELD_UNIVERSAL_IDENTIFIER =
  '284ae431-3676-4792-9825-3be5728a365f';
export const MAINTENANCE_VISIT_SEASON_FIELD_UNIVERSAL_IDENTIFIER =
  '854634ea-4ceb-40b6-b112-350a440d0bce';
export const MAINTENANCE_VISIT_SERVICE_TYPE_FIELD_UNIVERSAL_IDENTIFIER =
  '15f226f6-c235-483b-aa6d-efa6e98518ba';

const VISIT_STATUS_OPTIONS = [
  ['0137afb1-3063-40d4-b206-095b819239f1', 'DUE', 'Due', 'orange'],
  ['8b277814-5e49-4e23-a5bd-b733da23edb9', 'SCHEDULED', 'Scheduled', 'blue'],
  ['9eb97089-6af6-4d39-afbc-3fad0e2f59de', 'COMPLETED', 'Completed', 'green'],
  ['da83caa9-6feb-4220-bc2e-96b057546c5e', 'MISSED', 'Missed', 'red'],
  ['227124f1-f19e-4f7e-8a1d-81f5226b1629', 'CANCELLED', 'Cancelled', 'gray'],
] as const;

const SEASON_OPTIONS = [
  ['9d51344f-21af-4653-870f-331f5eada8d0', 'SPRING', 'Spring'],
  ['c515bb28-5850-45c3-8407-4c811f4da7ca', 'SUMMER', 'Summer'],
  ['cfe42e2b-59ab-4502-9ad2-954695205ceb', 'FALL', 'Fall'],
  ['e6207f65-f0c9-4bf4-8ac4-d3fa4a81ae5f', 'WINTER', 'Winter'],
  ['2d37648e-84ca-40eb-b790-f4a8c34f4cb1', 'ANY', 'Any season'],
] as const;

const SERVICE_TYPE_OPTIONS = [
  ['1c258f2e-950d-4187-8815-efc958275579', 'HEATING_TUNE_UP', 'Heating tune-up'],
  ['eca0ead1-d82f-4dc7-9abf-68cf102550f3', 'COOLING_TUNE_UP', 'Cooling tune-up'],
  ['cad552d4-a294-466e-9f98-20b78cf8a950', 'INSPECTION', 'Inspection'],
  ['8a6b77b7-7949-4f3f-b210-e364676f754a', 'FILTER_SERVICE', 'Filter service'],
  ['020bd097-7d8b-4b22-91ab-8e9255e40dcb', 'CUSTOM', 'Custom'],
] as const;

export default defineObject({
  universalIdentifier: MAINTENANCE_VISIT_UNIVERSAL_IDENTIFIER,
  nameSingular: 'maintenanceVisit',
  namePlural: 'maintenanceVisits',
  labelSingular: 'Maintenance visit',
  labelPlural: 'Maintenance visits',
  description: 'A promised or completed visit under a maintenance agreement',
  icon: 'IconCalendarCheck',
  labelIdentifierFieldMetadataUniversalIdentifier:
    MAINTENANCE_VISIT_NAME_FIELD_UNIVERSAL_IDENTIFIER,
  fields: [
    {
      universalIdentifier: MAINTENANCE_VISIT_NAME_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'name',
      label: 'Name',
      icon: 'IconCalendarCheck',
    },
    {
      universalIdentifier: MAINTENANCE_VISIT_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.SELECT,
      name: 'status',
      label: 'Status',
      icon: 'IconProgress',
      defaultValue: "'DUE'",
      options: VISIT_STATUS_OPTIONS.map(([id, value, label, color], position) => ({
        id,
        value,
        label,
        color,
        position,
      })),
    },
    {
      universalIdentifier: MAINTENANCE_VISIT_DUE_DATE_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.DATE,
      name: 'dueDate',
      label: 'Due date',
      icon: 'IconCalendarDue',
    },
    {
      universalIdentifier:
        MAINTENANCE_VISIT_SCHEDULED_AT_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.DATE_TIME,
      name: 'scheduledAt',
      label: 'Scheduled at',
      icon: 'IconCalendarTime',
      isNullable: true,
    },
    {
      universalIdentifier:
        MAINTENANCE_VISIT_COMPLETED_AT_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.DATE_TIME,
      name: 'completedAt',
      label: 'Completed at',
      icon: 'IconCircleCheck',
      isNullable: true,
    },
    {
      universalIdentifier: MAINTENANCE_VISIT_SEASON_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.SELECT,
      name: 'season',
      label: 'Season',
      icon: 'IconSun',
      defaultValue: "'ANY'",
      options: SEASON_OPTIONS.map(([id, value, label], position) => ({
        id,
        value,
        label,
        color: 'gray',
        position,
      })),
    },
    {
      universalIdentifier:
        MAINTENANCE_VISIT_SERVICE_TYPE_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.SELECT,
      name: 'serviceType',
      label: 'Service type',
      icon: 'IconTool',
      defaultValue: "'INSPECTION'",
      options: SERVICE_TYPE_OPTIONS.map(([id, value, label], position) => ({
        id,
        value,
        label,
        color: 'blue',
        position,
      })),
    },
    {
      universalIdentifier: '294e4598-4e74-4d71-9bed-76f8252b6c84',
      type: FieldType.RICH_TEXT,
      name: 'notes',
      label: 'Notes',
      icon: 'IconNotes',
      isNullable: true,
    },
  ],
});
