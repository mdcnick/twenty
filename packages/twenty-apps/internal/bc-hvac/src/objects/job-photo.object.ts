import { defineObject, FieldType } from 'twenty-sdk/define';

export const JOB_PHOTO_UNIVERSAL_IDENTIFIER =
  '366dde32-4943-4dd5-9806-67e62a04027f';
export const JOB_PHOTO_NAME_FIELD_UNIVERSAL_IDENTIFIER =
  '4c2c7f06-6122-47ad-a440-8c82ef723df7';
export const JOB_PHOTO_PERFEX_EXTERNAL_ID_FIELD_UNIVERSAL_IDENTIFIER =
  '416090bf-ba59-47b0-b2f3-125a715b002e';
export const JOB_PHOTO_CONTENT_FIELD_UNIVERSAL_IDENTIFIER =
  '16ae8acd-f35d-4c04-a927-b36daa113040';
export const JOB_PHOTO_FILENAME_FIELD_UNIVERSAL_IDENTIFIER =
  '9ce6de2e-c289-4104-b8b2-3a0d165bdeb9';
export const JOB_PHOTO_ORIGINAL_FILENAME_FIELD_UNIVERSAL_IDENTIFIER =
  'd3abc218-707d-4f10-adcc-a40d208ccb41';
export const JOB_PHOTO_SOURCE_FILE_PATH_FIELD_UNIVERSAL_IDENTIFIER =
  '7579447c-d23f-473d-8b7f-92f909d05864';
export const JOB_PHOTO_MIME_TYPE_FIELD_UNIVERSAL_IDENTIFIER =
  'e20776eb-ed19-41e8-a15d-fbba813a0629';
export const JOB_PHOTO_FILE_SIZE_BYTES_FIELD_UNIVERSAL_IDENTIFIER =
  '884abd7c-4501-4862-ae4f-f247b2a88ad1';
export const JOB_PHOTO_LATITUDE_FIELD_UNIVERSAL_IDENTIFIER =
  '78279cab-df7f-44fe-aac7-b06443070aca';
export const JOB_PHOTO_LONGITUDE_FIELD_UNIVERSAL_IDENTIFIER =
  'f6401859-d05c-4505-96ec-c59be5dd617d';
export const JOB_PHOTO_CAPTION_FIELD_UNIVERSAL_IDENTIFIER =
  '48c41cc1-dc01-44a7-978b-224bb5b9e85c';
export const JOB_PHOTO_CATEGORY_FIELD_UNIVERSAL_IDENTIFIER =
  'dfc59328-05f6-4aa6-b242-e23aefdd1f3f';
export const JOB_PHOTO_TAKEN_AT_FIELD_UNIVERSAL_IDENTIFIER =
  '04cd965e-642c-440f-8f2c-9ed2dc242d00';
export const JOB_PHOTO_IMPORTED_AT_FIELD_UNIVERSAL_IDENTIFIER =
  '292d60d1-28de-4964-bd71-045d51149254';

export default defineObject({
  universalIdentifier: JOB_PHOTO_UNIVERSAL_IDENTIFIER,
  nameSingular: 'jobPhoto',
  namePlural: 'jobPhotos',
  labelSingular: 'Job photo',
  labelPlural: 'Job photos',
  description: 'A migrated technician photo attached to a service job',
  icon: 'IconPhoto',
  labelIdentifierFieldMetadataUniversalIdentifier:
    JOB_PHOTO_NAME_FIELD_UNIVERSAL_IDENTIFIER,
  fields: [
    {
      universalIdentifier: JOB_PHOTO_NAME_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'name',
      label: 'Name',
      icon: 'IconAbc',
    },
    {
      universalIdentifier: JOB_PHOTO_PERFEX_EXTERNAL_ID_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'perfexExternalId',
      label: 'Perfex external ID',
      description: 'Stable source identifier for repeatable migration runs',
      icon: 'IconDatabase',
    },
    {
      universalIdentifier: JOB_PHOTO_CONTENT_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.FILES,
      name: 'content',
      label: 'Photo',
      icon: 'IconPhoto',
      isNullable: true,
      universalSettings: { maxNumberOfValues: 1 },
    },
    {
      universalIdentifier: JOB_PHOTO_FILENAME_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'filename',
      label: 'Filename',
      icon: 'IconFile',
    },
    {
      universalIdentifier: JOB_PHOTO_ORIGINAL_FILENAME_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'originalFilename',
      label: 'Original filename',
      icon: 'IconFileText',
    },
    {
      universalIdentifier: JOB_PHOTO_SOURCE_FILE_PATH_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'sourceFilePath',
      label: 'Source file path',
      description: 'Perfex storage path used by the migration worker to locate the file',
      icon: 'IconFolder',
      isNullable: true,
    },
    {
      universalIdentifier: JOB_PHOTO_MIME_TYPE_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'mimeType',
      label: 'MIME type',
      icon: 'IconFileTypeJpg',
      isNullable: true,
    },
    {
      universalIdentifier: JOB_PHOTO_FILE_SIZE_BYTES_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.NUMBER,
      name: 'fileSizeBytes',
      label: 'File size (bytes)',
      icon: 'IconFileAnalytics',
      isNullable: true,
    },
    {
      universalIdentifier: JOB_PHOTO_LATITUDE_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.NUMBER,
      name: 'latitude',
      label: 'Latitude',
      icon: 'IconMapPin',
      isNullable: true,
    },
    {
      universalIdentifier: JOB_PHOTO_LONGITUDE_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.NUMBER,
      name: 'longitude',
      label: 'Longitude',
      icon: 'IconMapPin',
      isNullable: true,
    },
    {
      universalIdentifier: JOB_PHOTO_CAPTION_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.RICH_TEXT,
      name: 'caption',
      label: 'Caption',
      icon: 'IconMessage',
      isNullable: true,
    },
    {
      universalIdentifier: JOB_PHOTO_CATEGORY_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'category',
      label: 'Category',
      icon: 'IconCategory',
      isNullable: true,
    },
    {
      universalIdentifier: JOB_PHOTO_TAKEN_AT_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.DATE_TIME,
      name: 'takenAt',
      label: 'Taken at',
      icon: 'IconCalendarTime',
      isNullable: true,
    },
    {
      universalIdentifier: JOB_PHOTO_IMPORTED_AT_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.DATE_TIME,
      name: 'importedAt',
      label: 'Imported at',
      icon: 'IconDatabaseImport',
      isNullable: true,
    },
  ],
});
