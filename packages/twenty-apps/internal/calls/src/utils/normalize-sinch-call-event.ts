import { createHash } from 'node:crypto';
import { type CallDirection, type CallStatus, type NormalizedCallEvent } from '../domain/call-event';

type SinchCallback = Record<string, unknown>;
const string = (value: unknown) => typeof value === 'string' && value.trim() ? value.trim() : undefined;
const number = (value: unknown) => typeof value === 'number' && Number.isFinite(value) ? value : undefined;

export const mapSinchCallStatus = (eventType: string, providerStatus?: string): CallStatus => {
  const value = `${eventType} ${providerStatus ?? ''}`.toLowerCase();
  if (/(fail|error|reject|busy|noanswer)/.test(value)) return value.includes('noanswer') || value.includes('busy') ? 'MISSED' : 'FAILED';
  if (/(dice|disconnect|complete|end)/.test(value)) return 'COMPLETED';
  if (/(ace|answer|connect)/.test(value)) return 'ANSWERED';
  return 'RINGING';
};

export const parseSinchCallEvent = (rawBody: string): NormalizedCallEvent => {
  const body = JSON.parse(rawBody) as SinchCallback;
  const providerEventType = string(body.event) ?? 'unknown';
  const providerCallId = string(body.callid) ?? string(body.callId);
  if (!providerCallId) throw new Error('Sinch callback is missing callid');
  const direction: CallDirection = providerEventType.toLowerCase() === 'ice' ? 'INBOUND' : 'OUTBOUND';
  const providerStatus = string(body.status) ?? string(body.result);
  const timestamp = string(body.timestamp);
  return {
    providerCallId,
    parentCallId: string(body.parentCallId) ?? string(body.parentCallid),
    fromNumber: string((body.from as SinchCallback | undefined)?.endpoint) ?? string(body.from) ?? string(body.cli),
    toNumber: string((body.to as SinchCallback | undefined)?.endpoint) ?? string(body.to) ?? string(body.destination),
    direction,
    status: mapSinchCallStatus(providerEventType, providerStatus),
    providerStatus,
    durationSeconds: number(body.duration) ?? number(body.durationSeconds),
    answeredBy: string(body.answeredBy),
    startedAt: providerEventType.toLowerCase() === 'ice' ? timestamp : undefined,
    endedAt: providerEventType.toLowerCase() === 'dice' ? timestamp : undefined,
    providerEventType,
    providerError: string(body.error) ?? string(body.reason),
    payloadHash: createHash('sha256').update(rawBody, 'utf8').digest('hex'),
    externalSourceId: string(body.custom) ?? string(body.id) ?? providerCallId,
    occurredAt: timestamp ?? new Date(0).toISOString(),
  };
};
