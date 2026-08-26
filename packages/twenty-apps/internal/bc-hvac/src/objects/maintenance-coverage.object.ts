import { defineObject, FieldType } from 'twenty-sdk/define';

export const MAINTENANCE_COVERAGE_UNIVERSAL_IDENTIFIER =
  'fde1f16f-0a13-407e-9d42-10f4d214ac8f';
export const MAINTENANCE_COVERAGE_NAME_FIELD_UNIVERSAL_IDENTIFIER =
  'eeb68d7c-04c2-46bd-869e-0b06afa1f0a2';
export const MAINTENANCE_COVERAGE_TYPE_FIELD_UNIVERSAL_IDENTIFIER =
  '37a49a30-f6a6-488d-a593-023a7b882040';

const COVERAGE_TYPE_OPTIONS = [
  ['3e9b294b-9901-46dc-a62b-ab7ec32b754b', 'FULL_SYSTEM', 'Full system'],
  ['8dc5ec0e-06f5-4f4c-b297-89b27c48fd09', 'HEATING', 'Heating'],
  ['58fd4319-8b7e-4d60-a102-305489611790', 'COOLING', 'Cooling'],
  ['7ee8f282-7770-4f51-8126-83ed23c98cee', 'COMPONENT', 'Component'],
  ['575001bf-4b1f-4bc7-9747-706aa2b9b1f9', 'CUSTOM', 'Custom'],
] as const;

export default defineObject({
  universalIdentifier: MAINTENANCE_COVERAGE_UNIVERSAL_IDENTIFIER,
  nameSingular: 'maintenanceCoverage',
  namePlural: 'maintenanceCoverages',
  labelSingular: 'Maintenance coverage',
  labelPlural: 'Maintenance coverage',
  description: 'One equipment record covered by a maintenance agreement',
  icon: 'IconShieldCheck',
  labelIdentifierFieldMetadataUniversalIdentifier:
    MAINTENANCE_COVERAGE_NAME_FIELD_UNIVERSAL_IDENTIFIER,
  fields: [
    {
      universalIdentifier: MAINTENANCE_COVERAGE_NAME_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'name',
      label: 'Name',
      icon: 'IconShieldCheck',
    },
    {
      universalIdentifier: MAINTENANCE_COVERAGE_TYPE_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.SELECT,
      name: 'coverageType',
      label: 'Coverage type',
      icon: 'IconCategory',
      defaultValue: "'FULL_SYSTEM'",
      options: COVERAGE_TYPE_OPTIONS.map(([id, value, label], position) => ({
        id,
        value,
        label,
        color: 'blue',
        position,
      })),
    },
    {
      universalIdentifier: '3eefe3d2-e28a-4ba7-bf90-579aa36c3552',
      type: FieldType.DATE,
      name: 'startsOn',
      label: 'Starts on',
      icon: 'IconCalendarPlus',
      isNullable: true,
    },
    {
      universalIdentifier: '4af347f9-ed35-48ae-aa17-c764a5dd1044',
      type: FieldType.DATE,
      name: 'endsOn',
      label: 'Ends on',
      icon: 'IconCalendarDue',
      isNullable: true,
    },
    {
      universalIdentifier: '95987064-4aaa-4417-b0ac-083f984068ea',
      type: FieldType.RICH_TEXT,
      name: 'notes',
      label: 'Coverage notes',
      icon: 'IconNotes',
      isNullable: true,
    },
  ],
});
