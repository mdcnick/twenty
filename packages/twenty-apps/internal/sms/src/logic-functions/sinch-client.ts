export type SinchConfiguration = {
  projectId: string;
  appId: string;
  keyId: string;
  keySecret: string;
  fromNumber: string;
  region: 'us' | 'eu' | 'br';
};

export type SinchSendInput = { toE164: string; text: string; idempotencyKey: string };

export type SinchSendResult =
  | { ok: true; providerMessageId: string; providerConversationId: string | null }
  | { ok: false; kind: 'configuration' | 'auth' | 'timeout' | 'network' | 'provider'; statusCode?: number; error: string };

type FetchImplementation = typeof fetch;
type CachedAccessToken = { value: string; expiresAtMilliseconds: number };

const SEND_TIMEOUT_MS = 10_000;
const ACCESS_TOKEN_SAFETY_MARGIN_MS = 60_000;
const accessTokenCache = new Map<string, CachedAccessToken>();

class SinchTimeoutError extends Error {
  constructor() { super('Sinch request timed out.'); this.name = 'SinchTimeoutError'; }
}

const getString = (value: string | undefined): string | null => value?.trim() ? value.trim() : null;
const cacheKeyFor = (configuration: SinchConfiguration) => `${configuration.projectId}:${configuration.keyId}`;

export const clearSinchAccessTokenCache = (): void => accessTokenCache.clear();

export const readSinchConfiguration = (
  environment: Record<string, string | undefined> = process.env,
): SinchConfiguration | null => {
  const projectId = getString(environment.SINCH_PROJECT_ID);
  const appId = getString(environment.SINCH_CONVERSATION_APP_ID);
  const keyId = getString(environment.SINCH_KEY_ID);
  const keySecret = getString(environment.SINCH_KEY_SECRET);
  const fromNumber = getString(environment.SINCH_SMS_FROM_NUMBER);
  const region = getString(environment.SINCH_CONVERSATION_REGION);

  if (!projectId || !appId || !keyId || !keySecret || !fromNumber || !['us', 'eu', 'br'].includes(region ?? '')) return null;
  return { projectId, appId, keyId, keySecret, fromNumber, region: region as SinchConfiguration['region'] };
};

const withTimeout = async <TValue>(
  operation: (signal: AbortSignal) => Promise<TValue>,
  timeoutMs: number,
): Promise<TValue> => {
  const abortController = new AbortController();
  const timeout = setTimeout(() => abortController.abort(), timeoutMs);
  try { return await operation(abortController.signal); } catch (error) { if (abortController.signal.aborted) throw new SinchTimeoutError(); throw error; } finally { clearTimeout(timeout); }
};

const getAccessToken = async (
  configuration: SinchConfiguration,
  fetchImplementation: FetchImplementation,
  timeoutMs: number,
  nowInMilliseconds = Date.now(),
): Promise<{ ok: true; token: string } | Exclude<SinchSendResult, { ok: true }>> => {
  const cached = accessTokenCache.get(cacheKeyFor(configuration));
  if (cached && cached.expiresAtMilliseconds > nowInMilliseconds + ACCESS_TOKEN_SAFETY_MARGIN_MS) return { ok: true, token: cached.value };
  const encodedCredentials = Buffer.from(`${configuration.keyId}:${configuration.keySecret}`, 'utf8').toString('base64');
  try {
    const response = await withTimeout(
      (signal) => fetchImplementation('https://auth.sinch.com/oauth2/token', { method: 'POST', headers: { Authorization: `Basic ${encodedCredentials}`, 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'grant_type=client_credentials', signal }),
      timeoutMs,
    );
    const responseText = await response.text();
    if (!response.ok) return { ok: false, kind: 'auth', statusCode: response.status, error: responseText || `Sinch token endpoint returned ${response.status}` };
    const payload = responseText ? JSON.parse(responseText) as unknown : null;
    const record = typeof payload === 'object' && payload !== null ? payload as Record<string, unknown> : {};
    const accessToken = typeof record.access_token === 'string' ? record.access_token : null;
    const expiresInSeconds = typeof record.expires_in === 'number' ? record.expires_in : null;
    if (!accessToken || !expiresInSeconds || expiresInSeconds <= 0) return { ok: false, kind: 'auth', error: 'Sinch token response is missing access_token or expires_in.' };
    accessTokenCache.set(cacheKeyFor(configuration), { value: accessToken, expiresAtMilliseconds: nowInMilliseconds + expiresInSeconds * 1000 });
    return { ok: true, token: accessToken };
  } catch (error) {
    return { ok: false, kind: error instanceof SinchTimeoutError ? 'timeout' : 'network', error: error instanceof Error ? error.message : 'Sinch token request failed.' };
  }
};

export const sendSinchSms = async (
  configuration: SinchConfiguration,
  input: SinchSendInput,
  fetchImplementation: FetchImplementation = fetch,
  timeoutMs = SEND_TIMEOUT_MS,
): Promise<SinchSendResult> => {
  const tokenResult = await getAccessToken(configuration, fetchImplementation, timeoutMs);
  if (!tokenResult.ok) return tokenResult;
  const url = `https://${configuration.region}.conversation.api.sinch.com/v1/projects/${encodeURIComponent(configuration.projectId)}/messages:send`;
  const body = { app_id: configuration.appId, recipient: { identified_by: { channel_identities: [{ channel: 'SMS', identity: input.toE164.slice(1) }] } }, message: { text_message: { text: input.text } }, channel_priority_order: ['SMS'], channel_properties: { SMS_SENDER: configuration.fromNumber } };
  try {
    const response = await withTimeout(
      (signal) => fetchImplementation(url, { method: 'POST', headers: { Authorization: `Bearer ${tokenResult.token}`, 'Content-Type': 'application/json', 'Idempotency-Key': input.idempotencyKey }, body: JSON.stringify(body), signal }),
      timeoutMs,
    );
    const text = await response.text();
    if (!response.ok) return { ok: false, kind: 'provider', statusCode: response.status, error: text || `Sinch returned ${response.status}` };
    const parsed = text ? JSON.parse(text) as unknown : {};
    const record = typeof parsed === 'object' && parsed !== null ? parsed as Record<string, unknown> : {};
    const providerMessageId = typeof record.message_id === 'string' ? record.message_id : null;
    if (!providerMessageId) return { ok: false, kind: 'provider', statusCode: response.status, error: 'Sinch response has no message_id.' };
    return { ok: true, providerMessageId, providerConversationId: typeof record.conversation_id === 'string' ? record.conversation_id : null };
  } catch (error) {
    return { ok: false, kind: error instanceof SinchTimeoutError ? 'timeout' : 'network', error: error instanceof Error ? error.message : 'Sinch request failed.' };
  }
};
