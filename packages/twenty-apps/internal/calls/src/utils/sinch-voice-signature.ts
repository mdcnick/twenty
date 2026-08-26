import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

type HeaderMap = Record<string, string | undefined>;

const header = (headers: HeaderMap, name: string) =>
  Object.entries(headers).find(([key]) => key.toLowerCase() === name)?.[1];

const equalBase64 = (received: string, expected: string) => {
  const receivedBuffer = Buffer.from(received, 'base64');
  const expectedBuffer = Buffer.from(expected, 'base64');
  return receivedBuffer.length > 0 && receivedBuffer.length === expectedBuffer.length && timingSafeEqual(receivedBuffer, expectedBuffer);
};

export const verifySinchVoiceSignature = (input: {
  rawBody: string;
  headers: HeaderMap;
  method: string;
  path: string;
  applicationKey: string;
  applicationSecret: string;
  now?: Date;
  maxAgeMs?: number;
}): { valid: true } | { valid: false; error: string } => {
  const { rawBody, headers, method, path, applicationKey, applicationSecret, now, maxAgeMs } = input;
  const authorization = header(headers, 'authorization');
  const timestamp = header(headers, 'x-timestamp');
  const contentType = header(headers, 'content-type')?.trim();
  if (!authorization?.startsWith('application ')) return { valid: false, error: 'Missing Sinch application authorization header' };
  if (!timestamp) return { valid: false, error: 'Missing x-timestamp header' };
  if (!contentType) return { valid: false, error: 'Missing content-type header' };
  const timestampMs = Date.parse(timestamp);
  const nowMs = (now ?? new Date()).getTime();
  if (!Number.isFinite(timestampMs)) return { valid: false, error: 'Invalid x-timestamp header' };
  if (Math.abs(nowMs - timestampMs) > (maxAgeMs ?? 300_000)) return { valid: false, error: 'Sinch callback timestamp is stale' };
  const credential = authorization.slice('application '.length);
  const separator = credential.indexOf(':');
  if (separator < 1 || credential.slice(0, separator) !== applicationKey) return { valid: false, error: 'Sinch application key mismatch' };
  const contentMd5 = createHash('md5').update(rawBody, 'utf8').digest('base64');
  const stringToSign = `${method.toUpperCase()}\n${contentMd5}\n${contentType}\nx-timestamp:${timestamp}\n${path}`;
  const signingKey = Buffer.from(applicationSecret, 'base64');
  if (signingKey.length === 0) return { valid: false, error: 'Sinch webhook secret is not valid base64' };
  const expected = createHmac('sha256', signingKey).update(stringToSign, 'utf8').digest('base64');
  return equalBase64(credential.slice(separator + 1), expected) ? { valid: true } : { valid: false, error: 'Sinch signature verification failed' };
};
