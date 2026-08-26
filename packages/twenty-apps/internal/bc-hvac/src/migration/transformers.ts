import {
  TABLES,
  perfexExternalId,
  perfexRelationId,
  readAmountMicros,
  readBoolean,
  readDate,
  readDecimal,
  readLocalDateTime,
  readPositiveId,
  readText,
  readUtcDateTime,
} from './normalization';
import { relationCandidate, resolveRelation } from './relations';
import type {
  CurrencyValue,
  MigrationEntity,
  MigrationException,
  MigrationExceptionCode,
  MigrationOptions,
  RawRecord,
  RecommendedAction,
  RelationIndex,
  SourceLocator,
  TransformResult,
  TransformedRecord,
  ValuesByEntity,
} from './types';

const DEFAULT_CURRENCY_CODE = 'USD';

function exception(
  entity: MigrationEntity,
  code: MigrationExceptionCode,
  recordExternalId: string | undefined,
  recommendedAction: RecommendedAction,
  details: Omit<MigrationException, 'entity' | 'code' | 'recordExternalId' | 'recommendedAction' | 'candidateExternalIds' | 'sourceLocator'> = {},
  candidateExternalIds: readonly string[] = [],
): MigrationException {
  return {
    entity,
    code,
    recordExternalId,
    recommendedAction,
    candidateExternalIds,
    ...details,
    sourceLocator: { table: TABLES[entity], ordinal: 0 },
  };
}

function sourceContext<E extends MigrationEntity>(
  entity: E,
  raw: RawRecord,
  sourceLocator?: SourceLocator,
): {
  sourceId?: string;
  sourceExternalId?: string;
  sourceLocator: SourceLocator;
  exceptions: MigrationException[];
} {
  const sourceId = readPositiveId(raw, 'id');
  const sourceExternalId = sourceId === undefined ? undefined : perfexExternalId(entity, sourceId);
  const exceptions = sourceId === undefined
    ? [exception(entity, 'missing_source_id', undefined, 'repair_source_id', { field: 'id', sourceValue: readText(raw, 'id') })]
    : [];
  return {
    sourceId,
    sourceExternalId,
    sourceLocator: sourceLocator ?? { table: TABLES[entity], ordinal: 0 },
    exceptions,
  };
}

function requireText(
  entity: MigrationEntity,
  recordExternalId: string | undefined,
  raw: RawRecord,
  field: string,
  exceptions: MigrationException[],
): string | undefined {
  const value = readText(raw, field);
  if (value === undefined) {
    exceptions.push(exception(entity, 'invalid_required_field', recordExternalId, 'repair_source_value', { field }));
  }
  return value;
}

function richText(value: string | undefined): { markdown: string; blocknote: string } | null {
  return value === undefined ? null : { markdown: value, blocknote: '' };
}

function optionalDate(
  entity: MigrationEntity,
  recordExternalId: string | undefined,
  raw: RawRecord,
  field: string,
  exceptions: MigrationException[],
): string | undefined {
  const sourceValue = readText(raw, field);
  if (sourceValue === undefined) return undefined;
  const value = readDate(sourceValue);
  if (value === undefined) exceptions.push(exception(entity, 'invalid_date', recordExternalId, 'repair_source_value', { field, sourceValue }));
  return value;
}

function requiredDate(
  entity: MigrationEntity,
  recordExternalId: string | undefined,
  raw: RawRecord,
  field: string,
  exceptions: MigrationException[],
): string | undefined {
  const sourceValue = requireText(entity, recordExternalId, raw, field, exceptions);
  if (sourceValue === undefined) return undefined;
  const value = readDate(sourceValue);
  if (value === undefined) exceptions.push(exception(entity, 'invalid_date', recordExternalId, 'repair_source_value', { field, sourceValue }));
  return value;
}

function optionalUtcDateTime(
  entity: MigrationEntity,
  recordExternalId: string | undefined,
  raw: RawRecord,
  field: string,
  exceptions: MigrationException[],
): string | undefined {
  const sourceValue = readText(raw, field);
  if (sourceValue === undefined) return undefined;
  const value = readUtcDateTime(sourceValue);
  if (value === undefined) exceptions.push(exception(entity, 'invalid_date', recordExternalId, 'repair_source_value', { field, sourceValue }));
  return value;
}

function localDateTime(
  entity: MigrationEntity,
  recordExternalId: string | undefined,
  raw: RawRecord,
  field: string,
  timeZone: string | undefined,
  exceptions: MigrationException[],
): string | undefined {
  const sourceValue = readText(raw, field);
  const result = readLocalDateTime(sourceValue, timeZone);
  if (result.status === 'valid') return result.value;
  const action = result.status === 'missing_timezone' || result.status === 'invalid_timezone'
    ? 'provide_iana_timezone'
    : 'repair_source_value';
  exceptions.push(exception(entity, result.status, recordExternalId, action, {
    field: result.status === 'missing_timezone' || result.status === 'invalid_timezone' ? 'booking_timezone' : field,
    sourceValue: result.status === 'missing_timezone' || result.status === 'invalid_timezone' ? timeZone : sourceValue,
  }));
  return undefined;
}

function optionalPhotoDateTime(
  entity: MigrationEntity,
  recordExternalId: string | undefined,
  raw: RawRecord,
  photoTimezone: string | undefined,
  exceptions: MigrationException[],
): string | undefined {
  const sourceValue = readText(raw, 'date_taken');
  if (sourceValue === undefined) return undefined;
  const result = readLocalDateTime(sourceValue, photoTimezone);
  if (result.status === 'valid') return result.value;
  const action = result.status === 'missing_timezone' || result.status === 'invalid_timezone'
    ? 'provide_iana_timezone'
    : 'repair_source_value';
  exceptions.push(exception(entity, result.status, recordExternalId, action, {
    field: result.status === 'missing_timezone' || result.status === 'invalid_timezone' ? 'photoTimezone' : 'date_taken',
    sourceValue: result.status === 'missing_timezone' || result.status === 'invalid_timezone' ? photoTimezone : sourceValue,
  }));
  return undefined;
}

function optionalDecimal(
  entity: MigrationEntity,
  recordExternalId: string | undefined,
  raw: RawRecord,
  field: string,
  exceptions: MigrationException[],
): number | undefined {
  if (raw[field] === undefined || raw[field] === null || raw[field] === '') return undefined;
  const value = readDecimal(raw[field]);
  if (value === undefined) exceptions.push(exception(entity, 'invalid_decimal', recordExternalId, 'repair_source_value', { field, sourceValue: readText(raw, field) }));
  return value;
}

function optionalCurrency(
  entity: MigrationEntity,
  recordExternalId: string | undefined,
  raw: RawRecord,
  field: string,
  currencyCode: string,
  exceptions: MigrationException[],
): CurrencyValue | undefined {
  if (raw[field] === undefined || raw[field] === null || raw[field] === '') return undefined;
  const amountMicros = readAmountMicros(raw[field]);
  if (amountMicros === undefined) {
    exceptions.push(exception(entity, 'invalid_decimal', recordExternalId, 'repair_source_value', { field, sourceValue: readText(raw, field) }));
    return undefined;
  }
  return { amountMicros, currencyCode };
}

function makeResult<E extends MigrationEntity>(
  entity: E,
  sourceExternalId: string | undefined,
  exceptions: MigrationException[],
  sourceLocator: SourceLocator,
  relationCandidates: TransformResult<E>['relationCandidates'],
  relations: TransformResult<E>['relations'],
  record: TransformedRecord<E> | null,
): TransformResult<E> {
  return {
    entity,
    sourceExternalId,
    sourceLocator,
    record,
    relationCandidates,
    relations,
    exceptions: exceptions.map((item) => ({ ...item, sourceLocator })),
  };
}

export function transformEquipment(
  raw: RawRecord,
  relationIndex: RelationIndex,
  sourceLocator?: SourceLocator,
): TransformResult<'equipment'> {
  const entity = 'equipment' as const;
  const context = sourceContext(entity, raw, sourceLocator);
  const { sourceExternalId, exceptions } = context;
  const equipmentType = requireText(entity, sourceExternalId, raw, 'equipment_type', exceptions);
  const clientId = readPositiveId(raw, 'client_id');
  const leadId = readPositiveId(raw, 'lead_id');
  const companyReference = clientId === undefined ? undefined : perfexRelationId('clients', clientId);
  const company = resolveRelation(entity, 'company', sourceExternalId, companyReference, relationIndex.company, 'missing_company_reference', 'ambiguous_company_reference');
  if (clientId === undefined && leadId !== undefined) {
    exceptions.push(exception(entity, 'lead_only_equipment', sourceExternalId, 'convert_lead_or_map_company'));
  } else if (company.exception !== undefined) {
    exceptions.push(company.exception);
  }
  const installDate = optionalDate(entity, sourceExternalId, raw, 'install_date', exceptions);
  const warrantyExpires = optionalDate(entity, sourceExternalId, raw, 'warranty_expires', exceptions);
  const active = readBoolean(raw, 'active');
  if (active.status === 'invalid') {
    exceptions.push(exception(entity, 'invalid_boolean', sourceExternalId, 'repair_source_value', { field: 'active', sourceValue: active.sourceValue }));
  }
  const canWrite = context.sourceId !== undefined && equipmentType !== undefined && clientId !== undefined && company.relation !== undefined && active.status !== 'invalid';
  const values: ValuesByEntity['equipment'] = {
    name: [equipmentType, readText(raw, 'brand'), readText(raw, 'model_number')].filter((value): value is string => value !== undefined).join(' '),
    equipmentType: equipmentType ?? '',
    brand: readText(raw, 'brand') ?? null,
    modelNumber: readText(raw, 'model_number') ?? null,
    serialNumber: readText(raw, 'serial_number') ?? null,
    filterSize: readText(raw, 'filter_size') ?? null,
    installDate: installDate ?? null,
    warrantyExpires: warrantyExpires ?? null,
    location: readText(raw, 'location') ?? null,
    notes: richText(readText(raw, 'notes')),
    sourceType: readText(raw, 'source_type') ?? null,
    sourceReference: readText(raw, 'source_ref') ?? null,
    isActive: active.status === 'valid' ? active.value : true,
  };
  return makeResult(entity, sourceExternalId, exceptions, context.sourceLocator, [company.candidate], company.relation === undefined ? [] : [company.relation], canWrite ? { entity, perfexExternalId: sourceExternalId!, values } : null);
}

export function transformServiceJob(
  raw: RawRecord,
  relationIndex: RelationIndex,
  _options: MigrationOptions = {},
  sourceLocator?: SourceLocator,
): TransformResult<'serviceJob'> {
  const entity = 'serviceJob' as const;
  const context = sourceContext(entity, raw, sourceLocator);
  const { sourceExternalId, exceptions } = context;
  const systemType = requireText(entity, sourceExternalId, raw, 'system_type', exceptions);
  const workIntent = requireText(entity, sourceExternalId, raw, 'work_intent', exceptions);
  const urgency = requireText(entity, sourceExternalId, raw, 'urgency', exceptions);
  const source = requireText(entity, sourceExternalId, raw, 'source', exceptions);
  const bookingTimezone = requireText(entity, sourceExternalId, raw, 'booking_timezone', exceptions);
  const startAt = localDateTime(entity, sourceExternalId, raw, 'start_datetime', bookingTimezone, exceptions);
  const endAt = localDateTime(entity, sourceExternalId, raw, 'end_datetime', bookingTimezone, exceptions);
  const status = requireText(entity, sourceExternalId, raw, 'status', exceptions);
  const companyId = readPositiveId(raw, 'client_id');
  const personId = readPositiveId(raw, 'service_contact_id');
  const company = resolveRelation(entity, 'company', sourceExternalId, companyId === undefined ? undefined : perfexRelationId('clients', companyId), relationIndex.company, 'missing_company_reference', 'ambiguous_company_reference');
  const candidates = [company.candidate];
  const relations = company.relation === undefined ? [] : [company.relation];
  if (company.exception !== undefined) exceptions.push(company.exception);
  if (personId !== undefined) {
    const person = resolveRelation(entity, 'person', sourceExternalId, perfexRelationId('contacts', personId), relationIndex.person, 'missing_person_reference', 'ambiguous_person_reference');
    candidates.push(person.candidate);
    if (person.relation !== undefined) relations.push(person.relation);
    if (person.exception !== undefined) exceptions.push(person.exception);
  }
  const equipmentTargets = sourceExternalId === undefined ? [] : relationIndex.serviceJobToEquipment[sourceExternalId] ?? [];
  const equipment = resolveRelation(entity, 'equipment', sourceExternalId, sourceExternalId, relationIndex.serviceJobToEquipment, 'missing_equipment_reference', 'ambiguous_equipment_reference');
  candidates.push(relationCandidate('equipment', sourceExternalId, equipmentTargets));
  if (equipment.relation !== undefined) relations.push(equipment.relation);
  if (equipment.exception !== undefined) exceptions.push(equipment.exception);
  const completedAt = optionalUtcDateTime(entity, sourceExternalId, raw, 'completed_at_utc', exceptions);
  const reopenedAt = optionalUtcDateTime(entity, sourceExternalId, raw, 'reopened_at_utc', exceptions);
  const canWrite = context.sourceId !== undefined && systemType !== undefined && workIntent !== undefined && urgency !== undefined && source !== undefined && bookingTimezone !== undefined && startAt !== undefined && endAt !== undefined && status !== undefined;
  const values: ValuesByEntity['serviceJob'] = {
    name: `Service job ${context.sourceId ?? ''}`,
    serviceCode: readText(raw, 'service_code') ?? null,
    systemType: systemType ?? '',
    workIntent: workIntent ?? '',
    issueSummary: richText(readText(raw, 'issue_summary')),
    urgency: urgency ?? '',
    appointmentWindow: readText(raw, 'appointment_window') ?? null,
    source: source ?? '',
    sourceRequestId: readText(raw, 'source_request_id') ?? null,
    startAt: startAt ?? '',
    endAt: endAt ?? '',
    status: status ?? '',
    completedAt: completedAt ?? null,
    reopenedAt: reopenedAt ?? null,
    bookingTimezone: bookingTimezone ?? '',
    serviceClassification: readText(raw, 'service_classification') ?? null,
    notes: richText(readText(raw, 'notes')),
  };
  return makeResult(entity, sourceExternalId, exceptions, context.sourceLocator, candidates, relations, canWrite ? { entity, perfexExternalId: sourceExternalId!, values } : null);
}

export function transformServiceEvent(
  raw: RawRecord,
  relationIndex: RelationIndex,
  options: MigrationOptions = {},
  sourceLocator?: SourceLocator,
): TransformResult<'serviceEvent'> {
  const entity = 'serviceEvent' as const;
  const context = sourceContext(entity, raw, sourceLocator);
  const { sourceExternalId, exceptions } = context;
  const serviceDate = requiredDate(entity, sourceExternalId, raw, 'service_date', exceptions);
  const description = requireText(entity, sourceExternalId, raw, 'description', exceptions);
  const companyId = readPositiveId(raw, 'client_id');
  const equipmentId = readPositiveId(raw, 'equipment_id');
  const company = resolveRelation(entity, 'company', sourceExternalId, companyId === undefined ? undefined : perfexRelationId('clients', companyId), relationIndex.company, 'missing_company_reference', 'ambiguous_company_reference');
  const equipment = resolveRelation(entity, 'equipment', sourceExternalId, equipmentId === undefined ? undefined : perfexExternalId('equipment', equipmentId), relationIndex.equipment, 'missing_equipment_reference', 'ambiguous_equipment_reference');
  const bridgeTargets = sourceExternalId === undefined ? [] : relationIndex.serviceEventToServiceJob[sourceExternalId] ?? [];
  const bridgeCandidate = relationCandidate('serviceJob', sourceExternalId, bridgeTargets);
  const relations = [company.relation, equipment.relation].filter((relation): relation is NonNullable<typeof relation> => relation !== undefined);
  if (company.exception !== undefined) exceptions.push(company.exception);
  if (equipment.exception !== undefined) exceptions.push(equipment.exception);
  if (bridgeTargets.length === 1 && sourceExternalId !== undefined) {
    const resolvedBridge = {
      relation: bridgeCandidate.relation,
      targetObject: bridgeCandidate.targetObject,
      fieldName: bridgeCandidate.fieldName,
      writeKey: bridgeCandidate.writeKey,
    };
    relations.push({ ...resolvedBridge, referenceExternalId: sourceExternalId, targetId: bridgeTargets[0] });
  } else {
    exceptions.push(exception(entity, bridgeTargets.length === 0 ? 'unlinked_service_event' : 'ambiguous_service_job_reference', sourceExternalId, bridgeTargets.length === 0 ? 'provide_explicit_mapping' : 'select_authoritative_mapping', { relation: 'serviceJob', referenceExternalId: sourceExternalId }, bridgeTargets));
  }
  const currencyCode = options.currencyCode ?? DEFAULT_CURRENCY_CODE;
  const laborTotal = optionalCurrency(entity, sourceExternalId, raw, 'labor_total', currencyCode, exceptions);
  const materialTotal = optionalCurrency(entity, sourceExternalId, raw, 'material_total', currencyCode, exceptions);
  const canWrite = context.sourceId !== undefined && serviceDate !== undefined && description !== undefined;
  const values: ValuesByEntity['serviceEvent'] = {
    name: `Service event ${context.sourceId ?? ''}`,
    serviceDate: serviceDate ?? '',
    description: { markdown: description ?? '', blocknote: '' },
    laborTotal: laborTotal ?? null,
    materialTotal: materialTotal ?? null,
    perfexInvoiceExternalId: readPositiveId(raw, 'invoice_id') === undefined ? null : `perfex:invoices:${readPositiveId(raw, 'invoice_id')}`,
    sourceType: readText(raw, 'source_type') ?? null,
    sourceReference: readText(raw, 'source_ref') ?? null,
  };
  return makeResult(entity, sourceExternalId, exceptions, context.sourceLocator, [company.candidate, equipment.candidate, bridgeCandidate], relations, canWrite ? { entity, perfexExternalId: sourceExternalId!, values } : null);
}

export function transformJobPhoto(
  raw: RawRecord,
  relationIndex: RelationIndex,
  options: MigrationOptions = {},
  sourceLocator?: SourceLocator,
): TransformResult<'jobPhoto'> {
  const entity = 'jobPhoto' as const;
  const context = sourceContext(entity, raw, sourceLocator);
  const { sourceExternalId, exceptions } = context;
  const filename = requireText(entity, sourceExternalId, raw, 'filename', exceptions);
  const originalFilename = requireText(entity, sourceExternalId, raw, 'original_name', exceptions);
  const sourceFilePath = requireText(entity, sourceExternalId, raw, 'file_path', exceptions);
  const bookingId = readPositiveId(raw, 'booking_id');
  const projectId = readPositiveId(raw, 'project_id');
  const serviceJob = resolveRelation(entity, 'serviceJob', sourceExternalId, bookingId === undefined ? undefined : perfexExternalId('serviceJob', bookingId), relationIndex.serviceJob, 'missing_service_job_reference', 'ambiguous_service_job_reference');
  if (bookingId === undefined && projectId !== undefined) {
    exceptions.push(exception(entity, 'project_only_photo', sourceExternalId, 'map_project_to_service_job'));
  } else if (serviceJob.exception !== undefined) {
    exceptions.push(serviceJob.exception);
  }
  const takenAt = optionalPhotoDateTime(entity, sourceExternalId, raw, options.photoTimezone, exceptions);
  const fileSizeBytes = optionalDecimal(entity, sourceExternalId, raw, 'file_size', exceptions);
  const latitude = optionalDecimal(entity, sourceExternalId, raw, 'latitude', exceptions);
  const longitude = optionalDecimal(entity, sourceExternalId, raw, 'longitude', exceptions);
  const canWrite = context.sourceId !== undefined && filename !== undefined && originalFilename !== undefined && sourceFilePath !== undefined;
  const values: ValuesByEntity['jobPhoto'] = {
    name: originalFilename ?? '',
    filename: filename ?? '',
    originalFilename: originalFilename ?? '',
    sourceFilePath: sourceFilePath ?? '',
    mimeType: readText(raw, 'file_type') ?? null,
    fileSizeBytes: fileSizeBytes ?? null,
    latitude: latitude ?? null,
    longitude: longitude ?? null,
    caption: richText(readText(raw, 'caption')),
    category: readText(raw, 'category') ?? null,
    takenAt: takenAt ?? null,
  };
  return makeResult(entity, sourceExternalId, exceptions, context.sourceLocator, [serviceJob.candidate], serviceJob.relation === undefined || bookingId === undefined ? [] : [serviceJob.relation], canWrite ? { entity, perfexExternalId: sourceExternalId!, values } : null);
}
