import { createHash, createHmac } from 'node:crypto';

export type StartCallInput = { fromNumber: string; toNumber: string; message: string; idempotencyKey: string };
export type StartCallResponse = { callId: string };
type FetchLike = (input: string, init: RequestInit) => Promise<Response>;

export class SinchVoiceError extends Error {
  constructor(public readonly kind: 'configuration' | 'timeout' | 'network' | 'http' | 'response', message: string, public readonly status?: number) { super(message); }
}

const E164 = /^\+[1-9]\d{7,14}$/;
const parseToken = (token: string) => {
  const separator = token.indexOf(':');
  if (separator < 1 || separator === token.length - 1) throw new SinchVoiceError('configuration', 'SINCH_VOICE_TOKEN must be applicationKey:applicationSecret');
  return { applicationKey: token.slice(0, separator), applicationSecret: token.slice(separator + 1) };
};

export const startSinchCall = async ({ baseUrl, token, input, fetchImpl = fetch, timeoutMs = 10_000 }: {
  baseUrl: string;
  token: string;
  input: StartCallInput;
  fetchImpl?: FetchLike;
  timeoutMs?: number;
}): Promise<StartCallResponse> => {
  const safeBaseUrl = baseUrl.replace(/\/$/, '');
  if (!safeBaseUrl.startsWith('https://')) throw new SinchVoiceError('configuration', 'SINCH_VOICE_BASE_URL must use HTTPS');
  if (!E164.test(input.fromNumber) || !E164.test(input.toNumber)) throw new SinchVoiceError('configuration', 'Sinch Voice numbers must use E.164 format');
  const body = JSON.stringify({ method: 'ttsCallout', ttsCallout: { cli: input.fromNumber, destination: { type: 'number', endpoint: input.toNumber }, text: input.message, custom: input.idempotencyKey } });
  const requestPath = '/callouts';
  const credentials = parseToken(token);
  const timestamp = new Date().toISOString();
  const contentMd5 = createHash('md5').update(body, 'utf8').digest('base64');
  const stringToSign = `POST\n${contentMd5}\napplication/json\nx-timestamp:${timestamp}\n${new URL(safeBaseUrl).pathname}${requestPath}`;
  const signingKey = Buffer.from(credentials.applicationSecret, 'base64');
  if (signingKey.length === 0) throw new SinchVoiceError('configuration', 'SINCH_VOICE_TOKEN application secret must be base64 encoded');
  const signature = createHmac('sha256', signingKey).update(stringToSign, 'utf8').digest('base64');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    let response: Response;
    try {
      response = await fetchImpl(`${safeBaseUrl}${requestPath}`, { method: 'POST', signal: controller.signal, headers: { authorization: `application ${credentials.applicationKey}:${signature}`, 'content-md5': contentMd5, 'content-type': 'application/json', 'x-timestamp': timestamp }, body });
    } catch (error) {
      if (controller.signal.aborted) throw new SinchVoiceError('timeout', 'Sinch Voice request timed out');
      throw new SinchVoiceError('network', `Sinch Voice network request failed: ${error instanceof Error ? error.message : 'unknown error'}`);
    }
    const responseText = await response.text();
    if (!response.ok) throw new SinchVoiceError('http', `Sinch Voice responded with HTTP ${response.status}`, response.status);
    let parsed: unknown;
    try { parsed = JSON.parse(responseText); } catch { throw new SinchVoiceError('response', 'Sinch Voice returned invalid JSON'); }
    if (!parsed || typeof parsed !== 'object' || typeof (parsed as { callId?: unknown }).callId !== 'string') throw new SinchVoiceError('response', 'Sinch Voice response is missing callId');
    return { callId: (parsed as { callId: string }).callId };
  } finally { clearTimeout(timeout); }
};
