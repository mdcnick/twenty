import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';

import { normalizeE164Phone } from 'src/logic-functions/utils/normalize-e164-phone';
import { isSuppressionKeyword } from 'src/logic-functions/utils/is-suppression-keyword';
import { verifySinchWebhookSignature } from 'src/logic-functions/utils/verify-sinch-webhook-signature';

const SECRET = 'unit-test-secret';
const RAW_BODY = '{"app_id":"app","message":{"id":"message-1"}}';
const NONCE = 'nonce-1';
const TIMESTAMP = '1760000000';

const signatureFor = (rawBody = RAW_BODY) =>
  createHmac('sha256', SECRET)
    .update(`${rawBody}.${NONCE}.${TIMESTAMP}`, 'utf8')
    .digest('base64');

describe('SMS provider boundaries', () => {
  it('normalizes valid US phone numbers and rejects malformed input', () => {
    expect(normalizeE164Phone('(312) 555-0100', 'US')).toBe('+13125550100');
    expect(normalizeE164Phone('+1 312 555 0100')).toBe('+13125550100');
    expect(normalizeE164Phone('not-a-phone')).toBeNull();
    expect(normalizeE164Phone('+1234567890123456')).toBeNull();
  });

  it('detects STOP-style suppression keywords without suppressing ordinary text', () => {
    expect(isSuppressionKeyword(' STOP ')).toBe(true);
    expect(isSuppressionKeyword('unsubscribe')).toBe(true);
    expect(isSuppressionKeyword('CANCEL')).toBe(true);
    expect(isSuppressionKeyword('Can you stop by tomorrow?')).toBe(false);
  });

  it('accepts only a fresh, complete, untampered Sinch HMAC signature', () => {
    const base = {
      rawBody: RAW_BODY,
      secret: SECRET,
      signature: signatureFor(),
      nonce: NONCE,
      timestamp: TIMESTAMP,
      algorithm: 'HmacSHA256',
      nowInSeconds: Number(TIMESTAMP) + 30,
    };

    expect(verifySinchWebhookSignature(base)).toBe(true);
    expect(verifySinchWebhookSignature({ ...base, signature: undefined })).toBe(false);
    expect(verifySinchWebhookSignature({ ...base, rawBody: `${RAW_BODY} ` })).toBe(false);
    expect(verifySinchWebhookSignature({ ...base, timestamp: `${TIMESTAMP}.0` })).toBe(false);
    expect(verifySinchWebhookSignature({ ...base, nowInSeconds: Number(TIMESTAMP) + 301 })).toBe(false);
  });
});
