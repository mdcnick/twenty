export type MigrationEntity =
  | 'equipment'
  | 'serviceJob'
  | 'serviceEvent'
  | 'jobPhoto';

export type MigrationExceptionCode =
  | 'missing_source_id'
  | 'duplicate_source_id'
  | 'lead_only_equipment'
  | 'missing_company_reference'
  | 'ambiguous_company_reference'
  | 'missing_person_reference'
  | 'ambiguous_person_reference'
  | 'missing_equipment_reference'
  | 'ambiguous_equipment_reference'
  | 'missing_service_job_reference'
  | 'ambiguous_service_job_reference'
  | 'project_only_photo'
  | 'unlinked_service_event'
  | 'invalid_required_field'
  | 'invalid_date'
  | 'invalid_decimal'
  | 'invalid_boolean'
  | 'missing_timezone'
  | 'invalid_timezone'
  | 'nonexistent_local_datetime'
  | 'ambiguous_local_datetime';

export type RecommendedAction =
  | 'repair_source_id'
  | 'deduplicate_source_id'
  | 'convert_lead_or_map_company'
  | 'provide_explicit_mapping'
  | 'select_authoritative_mapping'
  | 'map_project_to_service_job'
  | 'repair_source_value'
  | 'provide_iana_timezone';

export interface MigrationException {
  code: MigrationExceptionCode;
  entity: MigrationEntity;
  recordExternalId?: string;
  referenceExternalId?: string;
  relation?: RelationName;
  field?: string;
  candidateExternalIds: readonly string[];
  recommendedAction: RecommendedAction;
  sourceValue?: string;
  sourceLocator: SourceLocator;
}

export interface SourceLocator {
  table: string;
  ordinal: number;
}

export type RelationName = 'company' | 'person' | 'equipment' | 'serviceJob';

export interface RelationCandidate {
  relation: RelationName;
  targetObject: RelationName;
  fieldName: string;
  writeKey: string;
  referenceExternalId?: string;
  candidateExternalIds: readonly string[];
}

export interface ResolvedRelation
  extends Omit<RelationCandidate, 'candidateExternalIds'> {
  referenceExternalId: string;
  targetId: string;
}

export interface RichTextValue {
  markdown: string;
  blocknote: string;
}

export interface CurrencyValue {
  amountMicros: number;
  currencyCode: string;
}

type NullableText = string | null;

export interface EquipmentValues {
  name: string;
  equipmentType: string;
  brand: NullableText;
  modelNumber: NullableText;
  serialNumber: NullableText;
  filterSize: NullableText;
  installDate: NullableText;
  warrantyExpires: NullableText;
  location: NullableText;
  notes: RichTextValue | null;
  sourceType: NullableText;
  sourceReference: NullableText;
  isActive: boolean;
}

export interface ServiceJobValues {
  name: string;
  serviceCode: NullableText;
  systemType: string;
  workIntent: string;
  issueSummary: RichTextValue | null;
  urgency: string;
  appointmentWindow: NullableText;
  source: string;
  sourceRequestId: NullableText;
  startAt: string;
  endAt: string;
  status: string;
  completedAt: NullableText;
  reopenedAt: NullableText;
  bookingTimezone: string;
  serviceClassification: NullableText;
  notes: RichTextValue | null;
}

export interface ServiceEventValues {
  name: string;
  serviceDate: string;
  description: RichTextValue;
  laborTotal: CurrencyValue | null;
  materialTotal: CurrencyValue | null;
  perfexInvoiceExternalId: NullableText;
  sourceType: NullableText;
  sourceReference: NullableText;
}

export interface JobPhotoValues {
  name: string;
  filename: string;
  originalFilename: string;
  sourceFilePath: string;
  mimeType: NullableText;
  fileSizeBytes: number | null;
  latitude: number | null;
  longitude: number | null;
  caption: RichTextValue | null;
  category: NullableText;
  takenAt: NullableText;
}

export interface ValuesByEntity {
  equipment: EquipmentValues;
  serviceJob: ServiceJobValues;
  serviceEvent: ServiceEventValues;
  jobPhoto: JobPhotoValues;
}

export type MigrationValue =
  | string
  | number
  | boolean
  | null
  | RichTextValue
  | CurrencyValue;

export interface TransformedRecord<E extends MigrationEntity = MigrationEntity> {
  entity: E;
  perfexExternalId: string;
  values: ValuesByEntity[E];
}

export interface TransformResult<E extends MigrationEntity = MigrationEntity> {
  entity: E;
  sourceExternalId?: string;
  sourceLocator: SourceLocator;
  record: TransformedRecord<E> | null;
  relationCandidates: readonly RelationCandidate[];
  relations: readonly ResolvedRelation[];
  exceptions: readonly MigrationException[];
}

export type RawRecord = Record<string, unknown>;

export interface RelationIndex {
  company: Readonly<Record<string, readonly string[]>>;
  person: Readonly<Record<string, readonly string[]>>;
  equipment: Readonly<Record<string, readonly string[]>>;
  serviceJob: Readonly<Record<string, readonly string[]>>;
  serviceEventToServiceJob: Readonly<Record<string, readonly string[]>>;
  serviceJobToEquipment: Readonly<Record<string, readonly string[]>>;
}

export interface MigrationOptions {
  /** BC HVAC operates in USD; override only for a deliberately different source currency. */
  currencyCode?: string;
  /** Explicit export-wide IANA timezone for Perfex job_photos.date_taken values. */
  photoTimezone?: string;
}

export interface BatchInput {
  equipment?: readonly RawRecord[];
  serviceJobs?: readonly RawRecord[];
  serviceEvents?: readonly RawRecord[];
  jobPhotos?: readonly RawRecord[];
}

export interface ExceptionSummary {
  total: number;
  byCode: Partial<Record<MigrationExceptionCode, number>>;
}

export interface BatchTransformResult {
  results: readonly TransformResult[];
  records: readonly TransformedRecord[];
  exceptions: readonly MigrationException[];
  summary: ExceptionSummary;
}

/** A later, separately approved writer may consume the offline preflight output. */
export interface FutureMigrationWriter {
  write(batch: BatchTransformResult): Promise<void>;
}
