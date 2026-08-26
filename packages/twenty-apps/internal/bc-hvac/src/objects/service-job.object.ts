import { defineObject, FieldType } from 'twenty-sdk/define';

export const SERVICE_JOB_UNIVERSAL_IDENTIFIER =
  '519acd70-4148-4635-a2b2-7e2f5ad0ff19';
export const SERVICE_JOB_NAME_FIELD_UNIVERSAL_IDENTIFIER =
  '8787151d-4c59-46fb-b5ea-a8a0ff8177a6';
export const SERVICE_JOB_PERFEX_EXTERNAL_ID_FIELD_UNIVERSAL_IDENTIFIER =
  '7e967bcf-a331-43a1-b05e-c399c92421f9';
export const SERVICE_JOB_SERVICE_CODE_FIELD_UNIVERSAL_IDENTIFIER =
  '1967d622-aa0b-4686-bedb-47160a749905';
export const SERVICE_JOB_SYSTEM_TYPE_FIELD_UNIVERSAL_IDENTIFIER =
  'c9d5bef7-b4d5-42ce-9b34-6ee251d4bfcd';
export const SERVICE_JOB_WORK_INTENT_FIELD_UNIVERSAL_IDENTIFIER =
  '820fbd97-0165-4a9f-a918-4c084963fd27';
export const SERVICE_JOB_ISSUE_SUMMARY_FIELD_UNIVERSAL_IDENTIFIER =
  'b58af574-636a-4a3a-855f-08a0ab7f59bb';
export const SERVICE_JOB_URGENCY_FIELD_UNIVERSAL_IDENTIFIER =
  '1e507115-975e-496f-bfdf-890a57cbf44e';
export const SERVICE_JOB_APPOINTMENT_WINDOW_FIELD_UNIVERSAL_IDENTIFIER =
  'ef0a4019-aaa5-4fcc-8a4c-38749ae7d03b';
export const SERVICE_JOB_SOURCE_FIELD_UNIVERSAL_IDENTIFIER =
  '651fe7fd-1983-4480-8d78-f2dbeaddf093';
export const SERVICE_JOB_SOURCE_REQUEST_ID_FIELD_UNIVERSAL_IDENTIFIER =
  '4341541a-ac90-4c57-bd16-0066aa0c3693';
export const SERVICE_JOB_START_DATETIME_FIELD_UNIVERSAL_IDENTIFIER =
  'becfb2ad-b0a6-4d55-806c-05acdcda2219';
export const SERVICE_JOB_END_DATETIME_FIELD_UNIVERSAL_IDENTIFIER =
  'bb334f43-83f2-44d2-999d-a4157a236d3c';
export const SERVICE_JOB_STATUS_FIELD_UNIVERSAL_IDENTIFIER =
  '60070efc-416b-42ca-a643-082aaaf25b0d';
export const SERVICE_JOB_COMPLETED_AT_FIELD_UNIVERSAL_IDENTIFIER =
  '1ae7d2a4-4dfd-48ca-8cab-a8bee5358ef3';
export const SERVICE_JOB_REOPENED_AT_FIELD_UNIVERSAL_IDENTIFIER =
  '827e2cfb-1706-4e70-bced-d69388646fbf';
export const SERVICE_JOB_TIMEZONE_FIELD_UNIVERSAL_IDENTIFIER =
  '3b57bcd7-18dd-4a5c-a6b0-0686e3d251ee';
export const SERVICE_JOB_CLASSIFICATION_FIELD_UNIVERSAL_IDENTIFIER =
  '65983150-939c-4deb-bdc5-c5132cdab6c7';
export const SERVICE_JOB_NOTES_FIELD_UNIVERSAL_IDENTIFIER =
  '0ceaaa01-c6bc-4096-9162-c8843a18de63';

export default defineObject({
  universalIdentifier: SERVICE_JOB_UNIVERSAL_IDENTIFIER,
  nameSingular: 'serviceJob',
  namePlural: 'serviceJobs',
  labelSingular: 'Service job',
  labelPlural: 'Service jobs',
  description: 'A scheduled or completed HVAC service booking',
  icon: 'IconCalendarEvent',
  labelIdentifierFieldMetadataUniversalIdentifier:
    SERVICE_JOB_NAME_FIELD_UNIVERSAL_IDENTIFIER,
  fields: [
    {
      universalIdentifier: SERVICE_JOB_NAME_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'name',
      label: 'Name',
      icon: 'IconAbc',
    },
    {
      universalIdentifier: SERVICE_JOB_PERFEX_EXTERNAL_ID_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'perfexExternalId',
      label: 'Perfex external ID',
      description: 'Stable source identifier for repeatable migration runs',
      icon: 'IconDatabase',
    },
    {
      universalIdentifier: SERVICE_JOB_SERVICE_CODE_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'serviceCode',
      label: 'Service code',
      icon: 'IconTag',
      isNullable: true,
    },
    {
      universalIdentifier: SERVICE_JOB_SYSTEM_TYPE_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'systemType',
      label: 'System type',
      icon: 'IconAirConditioning',
    },
    {
      universalIdentifier: SERVICE_JOB_WORK_INTENT_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'workIntent',
      label: 'Work intent',
      icon: 'IconTarget',
    },
    {
      universalIdentifier: SERVICE_JOB_ISSUE_SUMMARY_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.RICH_TEXT,
      name: 'issueSummary',
      label: 'Issue summary',
      icon: 'IconFileDescription',
      isNullable: true,
    },
    {
      universalIdentifier: SERVICE_JOB_URGENCY_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'urgency',
      label: 'Urgency',
      icon: 'IconAlertTriangle',
    },
    {
      universalIdentifier: SERVICE_JOB_APPOINTMENT_WINDOW_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'appointmentWindow',
      label: 'Appointment window',
      icon: 'IconClock',
      isNullable: true,
    },
    {
      universalIdentifier: SERVICE_JOB_SOURCE_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'source',
      label: 'Source',
      icon: 'IconArrowMerge',
    },
    {
      universalIdentifier: SERVICE_JOB_SOURCE_REQUEST_ID_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'sourceRequestId',
      label: 'Source request ID',
      icon: 'IconHash',
      isNullable: true,
    },
    {
      universalIdentifier: SERVICE_JOB_START_DATETIME_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.DATE_TIME,
      name: 'startAt',
      label: 'Starts at',
      icon: 'IconCalendarTime',
    },
    {
      universalIdentifier: SERVICE_JOB_END_DATETIME_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.DATE_TIME,
      name: 'endAt',
      label: 'Ends at',
      icon: 'IconCalendarTime',
    },
    {
      universalIdentifier: SERVICE_JOB_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'status',
      label: 'Status',
      icon: 'IconProgress',
    },
    {
      universalIdentifier: SERVICE_JOB_COMPLETED_AT_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.DATE_TIME,
      name: 'completedAt',
      label: 'Completed at',
      icon: 'IconCircleCheck',
      isNullable: true,
    },
    {
      universalIdentifier: SERVICE_JOB_REOPENED_AT_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.DATE_TIME,
      name: 'reopenedAt',
      label: 'Reopened at',
      icon: 'IconRefresh',
      isNullable: true,
    },
    {
      universalIdentifier: SERVICE_JOB_TIMEZONE_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'bookingTimezone',
      label: 'Booking timezone',
      icon: 'IconWorld',
      isNullable: true,
    },
    {
      universalIdentifier: SERVICE_JOB_CLASSIFICATION_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'serviceClassification',
      label: 'Service classification',
      icon: 'IconCategory',
      isNullable: true,
    },
    {
      universalIdentifier: SERVICE_JOB_NOTES_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.RICH_TEXT,
      name: 'notes',
      label: 'Notes',
      icon: 'IconNotes',
      isNullable: true,
    },
  ],
});
