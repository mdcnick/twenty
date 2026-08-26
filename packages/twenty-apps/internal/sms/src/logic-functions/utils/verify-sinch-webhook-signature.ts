import { createHmac, timingSafeEqual } from 'node:crypto';

const MAX_SIGNATURE_AGE_SECONDS = 60 * 5;

type VerifySinchWebhookSignatureInput = {
  rawBody: string;
  secret: string;
  signature: string | undefined;
  nonce: string | undefined;
  timestamp: string | undefined;
  algorithm: string | undefined;
  nowInSeconds?: number;
};

export const isStaleSinchWebhookTimestamp = (
  timestamp: string | undefined,
  nowInSeconds = Math.floor(Date.now() / 1000),
): boolean => {
  if (!timestamp || !/^\d+$/.test(timestamp)) return false;
  const parsedTimestamp = Number(timestamp);
  return Number.isSafeInteger(parsedTimestamp) && Math.abs(nowInSeconds - parsedTimestamp) > MAX_SIGNATURE_AGE_SECONDS;
};

export const verifySinchWebhookSignature = ({
  rawBody,
  secret,
  signature,
  nonce,
  timestamp,
  algorithm,
  nowInSeconds = Math.floor(Date.now() / 1000),
}: VerifySinchWebhookSignatureInput): boolean => {
  if (
    !signature?.trim() ||
    !nonce?.trim() ||
    !timestamp?.trim() ||
    !/^\d+$/.test(timestamp) ||
    algorithm !== 'HmacSHA256' ||
    !secret
  ) {
    return false;
  }

  const parsedTimestamp = Number(timestamp);

  if (!Number.isSafeInteger(parsedTimestamp) || isStaleSinchWebhookTimestamp(timestamp, nowInSeconds)) {
    return false;
  }

  const expectedSignature = createHmac('sha256', secret)
    .update(`${rawBody}.${nonce}.${timestamp}`, 'utf8')
    .digest('base64');
  const providedBuffer = Buffer.from(signature.trim(), 'utf8');
  const expectedBuffer = Buffer.from(expectedSignature, 'utf8');

  return (
    providedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(providedBuffer, expectedBuffer)
  );
};
