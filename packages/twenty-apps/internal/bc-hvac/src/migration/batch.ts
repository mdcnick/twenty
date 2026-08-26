import {
  transformEquipment,
  transformJobPhoto,
  transformServiceEvent,
  transformServiceJob,
} from './transformers';
import type {
  BatchInput,
  BatchTransformResult,
  MigrationException,
  MigrationOptions,
  RelationIndex,
  TransformResult,
} from './types';

const emptyRecords: readonly never[] = [];

export function transformBatch(
  input: BatchInput,
  relationIndex: RelationIndex,
  options: MigrationOptions = {},
): BatchTransformResult {
  const results = [
    ...(input.equipment ?? emptyRecords).map((raw, ordinal) => transformEquipment(raw, relationIndex, { table: 'hvac_hub_equipment', ordinal })),
    ...(input.serviceJobs ?? emptyRecords).map((raw, ordinal) => transformServiceJob(raw, relationIndex, options, { table: 'service_booking_bookings', ordinal })),
    ...(input.serviceEvents ?? emptyRecords).map((raw, ordinal) => transformServiceEvent(raw, relationIndex, options, { table: 'hvac_hub_service_events', ordinal })),
    ...(input.jobPhotos ?? emptyRecords).map((raw, ordinal) => transformJobPhoto(raw, relationIndex, options, { table: 'job_photos', ordinal })),
  ];
  const duplicateIds = new Set<string>();
  const seenIds = new Set<string>();

  for (const result of results) {
    if (result.sourceExternalId === undefined) continue;
    if (seenIds.has(result.sourceExternalId)) duplicateIds.add(result.sourceExternalId);
    seenIds.add(result.sourceExternalId);
  }

  const resultsWithDuplicates = results.map((result): TransformResult => {
    if (result.sourceExternalId === undefined || !duplicateIds.has(result.sourceExternalId)) {
      return result;
    }
    const exception: MigrationException = {
      code: 'duplicate_source_id',
      entity: result.entity,
      recordExternalId: result.sourceExternalId,
      candidateExternalIds: [],
      recommendedAction: 'deduplicate_source_id',
      sourceLocator: result.sourceLocator,
    };
    return { ...result, record: null, exceptions: [...result.exceptions, exception] };
  });
  const exceptions = resultsWithDuplicates.flatMap((result) => result.exceptions);
  const byCode = exceptions.reduce<BatchTransformResult['summary']['byCode']>(
    (summary, exception) => ({
      ...summary,
      [exception.code]: (summary[exception.code] ?? 0) + 1,
    }),
    {},
  );

  return {
    results: resultsWithDuplicates,
    records: resultsWithDuplicates.flatMap((result) =>
      result.record === null ? [] : [result.record],
    ),
    exceptions,
    summary: { total: exceptions.length, byCode },
  };
}
