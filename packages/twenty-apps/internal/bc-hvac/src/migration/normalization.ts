import type { MigrationEntity, RawRecord } from './types';

export const TABLES = {
  equipment: 'hvac_hub_equipment',
  serviceJob: 'service_booking_bookings',
  serviceEvent: 'hvac_hub_service_events',
  jobPhoto: 'job_photos',
} as const;

export function readText(record: RawRecord, field: string): string | undefined {
  const value = record[field];
  if (typeof value === 'string') {
    const normalized = value.trim();
    return normalized === '' ? undefined : normalized;
  }
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (typeof value === 'boolean') return String(value);
  return undefined;
}

export function readPositiveId(record: RawRecord, field: string): string | undefined {
  const value = readText(record, field);
  return value !== undefined && /^[1-9]\d*$/.test(value) ? value : undefined;
}

export function perfexExternalId(entity: MigrationEntity, sourceId: string): string {
  return `perfex:${TABLES[entity]}:${sourceId}`;
}

export function perfexRelationId(table: 'clients' | 'contacts', sourceId: string): string {
  return `perfex:${table}:${sourceId}`;
}

export type BooleanReadResult =
  | { status: 'absent' }
  | { status: 'valid'; value: boolean }
  | { status: 'invalid'; sourceValue?: string };

export function readBoolean(record: RawRecord, field: string): BooleanReadResult {
  const value = record[field];
  if (value === undefined || value === null || value === '') return { status: 'absent' };
  if (value === true || value === 1 || value === '1') return { status: 'valid', value: true };
  if (value === false || value === 0 || value === '0') return { status: 'valid', value: false };
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') return { status: 'valid', value: true };
    if (normalized === 'false') return { status: 'valid', value: false };
  }
  return { status: 'invalid', sourceValue: readText(record, field) };
}

function isRealDate(year: number, month: number, day: number): boolean {
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return parsed.getUTCFullYear() === year && parsed.getUTCMonth() === month - 1 && parsed.getUTCDate() === day;
}

export function readDate(value: string | undefined): string | undefined {
  if (value === undefined) return undefined;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return undefined;
  const [, year, month, day] = match;
  return isRealDate(Number(year), Number(month), Number(day)) ? value : undefined;
}

interface DateTimeParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  millisecond: number;
}

function parseDateTime(value: string): DateTimeParts | undefined {
  const match = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})$/.exec(value);
  if (!match) return undefined;
  const [, year, month, day, hour, minute, second] = match;
  const parts = {
    year: Number(year),
    month: Number(month),
    day: Number(day),
    hour: Number(hour),
    minute: Number(minute),
    second: Number(second),
    millisecond: 0,
  };
  return isRealDate(parts.year, parts.month, parts.day) && parts.hour < 24 && parts.minute < 60 && parts.second < 60
    ? parts
    : undefined;
}

const timeZoneFormatterCache = new Map<string, Intl.DateTimeFormat>();

function formatterFor(timeZone: string): Intl.DateTimeFormat {
  const cached = timeZoneFormatterCache.get(timeZone);
  if (cached !== undefined) return cached;
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  });
  timeZoneFormatterCache.set(timeZone, formatter);
  return formatter;
}

export function clearTimeZoneFormatterCacheForTests(): void {
  timeZoneFormatterCache.clear();
}

export function getTimeZoneFormatterCacheSizeForTests(): number {
  return timeZoneFormatterCache.size;
}

function timeZoneParts(epochMilliseconds: number, timeZone: string): DateTimeParts {
  const formatter = formatterFor(timeZone);
  const values = Object.fromEntries(
    formatter
      .formatToParts(new Date(epochMilliseconds))
      .filter(({ type }) => type !== 'literal')
      .map(({ type, value }) => [type, value]),
  );
  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    hour: Number(values.hour),
    minute: Number(values.minute),
    second: Number(values.second),
    millisecond: 0,
  };
}

function sameDateTime(left: DateTimeParts, right: DateTimeParts): boolean {
  return left.year === right.year && left.month === right.month && left.day === right.day && left.hour === right.hour && left.minute === right.minute && left.second === right.second;
}

function resolveGeographicTimeZone(timeZone: string): string | undefined {
  if (!timeZone.includes('/') || timeZone === 'UTC' || timeZone.startsWith('Etc/')) {
    return undefined;
  }
  try {
    const resolved = new Intl.DateTimeFormat('en-US', { timeZone }).resolvedOptions().timeZone;
    return resolved.includes('/') && !resolved.startsWith('Etc/') ? resolved : undefined;
  } catch {
    return undefined;
  }
}

function offsetMinutes(epochMilliseconds: number, timeZone: string): number {
  const local = timeZoneParts(epochMilliseconds, timeZone);
  return (Date.UTC(local.year, local.month - 1, local.day, local.hour, local.minute, local.second) - epochMilliseconds) / 60_000;
}

export type LocalDateTimeResult =
  | { status: 'valid'; value: string }
  | { status: 'invalid_date' | 'missing_timezone' | 'invalid_timezone' | 'nonexistent_local_datetime' | 'ambiguous_local_datetime' };

export function readLocalDateTime(value: string | undefined, timeZone: string | undefined): LocalDateTimeResult {
  if (value === undefined || parseDateTime(value) === undefined) return { status: 'invalid_date' };
  if (timeZone === undefined) return { status: 'missing_timezone' };
  const resolvedTimeZone = resolveGeographicTimeZone(timeZone);
  if (resolvedTimeZone === undefined) return { status: 'invalid_timezone' };

  const local = parseDateTime(value)!;
  const localEpoch = Date.UTC(local.year, local.month - 1, local.day, local.hour, local.minute, local.second, local.millisecond);
  const offsets = new Set<number>();
  for (let hour = -36; hour <= 36; hour += 1) {
    offsets.add(offsetMinutes(localEpoch + hour * 3_600_000, resolvedTimeZone));
  }
  const candidates = [...offsets]
    .map((offset) => localEpoch - offset * 60_000)
    .filter((epoch) => sameDateTime(timeZoneParts(epoch, resolvedTimeZone), local));
  if (candidates.length === 0) return { status: 'nonexistent_local_datetime' };
  if (candidates.length !== 1) return { status: 'ambiguous_local_datetime' };
  return { status: 'valid', value: new Date(candidates[0]).toISOString() };
}

export function readUtcDateTime(value: string | undefined): string | undefined {
  if (value === undefined) return undefined;
  const match = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})(Z)?$/.exec(value);
  if (!match) return undefined;
  const [, year, month, day, hour, minute, second] = match;
  if (!isRealDate(Number(year), Number(month), Number(day)) || Number(hour) > 23 || Number(minute) > 59 || Number(second) > 59) return undefined;
  const epoch = Date.UTC(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second),
  );
  return new Date(epoch).toISOString();
}

export function readDecimal(value: unknown): number | undefined {
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
  if (typeof value !== 'string') return undefined;
  const normalized = value.trim();
  if (!/^[+-]?(?:\d+|\d+\.\d+|\.\d+)$/.test(normalized)) return undefined;
  const decimal = Number(normalized);
  return Number.isFinite(decimal) ? decimal : undefined;
}

export function readAmountMicros(value: unknown): number | undefined {
  const source = typeof value === 'number' ? String(value) : typeof value === 'string' ? value.trim() : undefined;
  if (source === undefined) return undefined;
  const match = /^([+-]?)(?:(\d+)(?:\.(\d+))?|\.(\d+))$/.exec(source);
  if (!match) return undefined;
  const [, sign, whole = '0', fractionalFromWhole, fractionalOnly] = match;
  const fractional = fractionalFromWhole ?? fractionalOnly ?? '';
  if (fractional.length > 6 && /[1-9]/.test(fractional.slice(6))) return undefined;
  const micros = BigInt(`${whole}${fractional.slice(0, 6).padEnd(6, '0')}`) * (sign === '-' ? -1n : 1n);
  return micros <= BigInt(Number.MAX_SAFE_INTEGER) && micros >= BigInt(Number.MIN_SAFE_INTEGER)
    ? Number(micros)
    : undefined;
}
