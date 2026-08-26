import type {
  MigrationEntity,
  MigrationException,
  MigrationExceptionCode,
  RecommendedAction,
  RelationCandidate,
  RelationName,
  ResolvedRelation,
} from './types';
import { TABLES } from './normalization';

const relationDefinitions = {
  company: { targetObject: 'company', fieldName: 'company', writeKey: 'companyId' },
  person: { targetObject: 'person', fieldName: 'serviceContact', writeKey: 'serviceContactId' },
  equipment: { targetObject: 'equipment', fieldName: 'equipment', writeKey: 'equipmentId' },
  serviceJob: { targetObject: 'serviceJob', fieldName: 'serviceJob', writeKey: 'serviceJobId' },
} as const satisfies Record<RelationName, Omit<RelationCandidate, 'relation' | 'referenceExternalId' | 'candidateExternalIds'>>;

export interface RelationResolution {
  candidate: RelationCandidate;
  relation?: ResolvedRelation;
  exception?: MigrationException;
}

function actionFor(code: MigrationExceptionCode): RecommendedAction {
  return code.startsWith('ambiguous_') ? 'select_authoritative_mapping' : 'provide_explicit_mapping';
}

export function resolveRelation(
  entity: MigrationEntity,
  relation: RelationName,
  recordExternalId: string | undefined,
  referenceExternalId: string | undefined,
  index: Readonly<Record<string, readonly string[]>>,
  missingCode: MigrationExceptionCode,
  ambiguousCode: MigrationExceptionCode,
): RelationResolution {
  const candidateExternalIds = referenceExternalId === undefined ? [] : index[referenceExternalId] ?? [];
  const definition = relationDefinitions[relation];
  const candidate = { relation, ...definition, referenceExternalId, candidateExternalIds };
  if (referenceExternalId === undefined || candidateExternalIds.length === 0) {
    return {
      candidate,
      exception: {
        code: missingCode,
        entity,
        recordExternalId,
        referenceExternalId,
        relation,
        candidateExternalIds,
        recommendedAction: actionFor(missingCode),
        sourceLocator: { table: TABLES[entity], ordinal: 0 },
      },
    };
  }
  if (candidateExternalIds.length !== 1) {
    return {
      candidate,
      exception: {
        code: ambiguousCode,
        entity,
        recordExternalId,
        referenceExternalId,
        relation,
        candidateExternalIds,
        recommendedAction: actionFor(ambiguousCode),
        sourceLocator: { table: TABLES[entity], ordinal: 0 },
      },
    };
  }
  const resolvedCandidate = {
    relation: candidate.relation,
    targetObject: candidate.targetObject,
    fieldName: candidate.fieldName,
    writeKey: candidate.writeKey,
  };
  return {
    candidate,
    relation: { ...resolvedCandidate, referenceExternalId, targetId: candidateExternalIds[0] },
  };
}

export function relationCandidate(
  relation: RelationName,
  referenceExternalId: string | undefined,
  candidateExternalIds: readonly string[],
): RelationCandidate {
  return { relation, ...relationDefinitions[relation], referenceExternalId, candidateExternalIds };
}
