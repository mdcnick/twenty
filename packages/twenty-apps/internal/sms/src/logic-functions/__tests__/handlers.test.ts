import { describe, expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { processInboundSms, processSmsSubmit, sendSms } from 'src/logic-functions/handlers';
import { type SmsRepository } from 'src/logic-functions/sms-repository';
import { mapSinchDeliveryStatus, parseInboundSmsCallback, parseSmsDeliveryCallback, parseSmsSubmitCallback } from 'src/logic-functions/utils/sinch-callback';

const readFixture = async (name: string): Promise<unknown> =>
  JSON.parse(await readFile(path.join(process.cwd(), 'test/fixtures', name), 'utf8'));

const repository = (existingRecordId: string | null): SmsRepository => ({
  findMessageIdByDedupeKey: async () => existingRecordId,
  recordInbound: async () => ({ created: true }),
  recordDelivery: async () => ({ created: true }),
  recordSubmit: async () => ({ created: true }),
  isOutboundSuppressed: async () => false,
  recordOutboundAccepted: async () => ({ created: true }),
});

describe('SMS callback processing', () => {
  it('records a STOP event once and makes a duplicate callback a no-op', async () => {
    const callback = await readFixture('sinch-message-inbound.json');
    expect(parseInboundSmsCallback(callback)).toMatchObject({ providerMessageId: '01E6NKBV63YG6K01ENEW7S1N80', providerConversationId: '01E6K4A8PGZ6MV0GD3C7M901MZ', providerContactId: '01E6K4A8N3NANZ05VM0FS80EHD', phoneE164: '+13125550100', body: 'STOP', occurredAt: '2020-04-24T08:02:50.179021Z' });
    await expect(processInboundSms(callback, repository(null))).resolves.toEqual({ accepted: true, duplicate: false });
    await expect(processInboundSms(callback, repository('existing-message'))).resolves.toEqual({ accepted: true, duplicate: true });
  });

  it('maps documented delivery states and parses official delivery callbacks', async () => {
    expect(mapSinchDeliveryStatus('QUEUED_ON_CHANNEL')).toBe('PENDING');
    expect(mapSinchDeliveryStatus('DELIVERED')).toBe('DELIVERED');
    expect(mapSinchDeliveryStatus('READ')).toBe('READ');
    expect(mapSinchDeliveryStatus('FAILED')).toBe('FAILED');
    expect(mapSinchDeliveryStatus('UNKNOWN')).toBeNull();
    expect(parseSmsDeliveryCallback(await readFixture('sinch-message-delivery.json'))).toMatchObject({ dedupeKey: 'sinch:delivery:01EQBC1A3BEK731GY4YXEN0C2R:QUEUED_ON_CHANNEL', providerContactId: '01EXA07N79THJ20WSN6AS30TMW', status: 'PENDING', providerStatus: 'QUEUED_ON_CHANNEL' });
    const unknownStatus = await readFixture('sinch-message-delivery.json') as { message_delivery_report: { status: string } };
    unknownStatus.message_delivery_report.status = 'FUTURE_STATUS';
    expect(parseSmsDeliveryCallback(unknownStatus)).toMatchObject({ status: null, providerStatus: 'FUTURE_STATUS' });
  });

  it('persists documented SMS submit notifications as outbound messages', async () => {
    const callback = await readFixture('sinch-message-submit.json');

    expect(parseSmsSubmitCallback(callback)).toMatchObject({
      dedupeKey: 'sinch:submit:01EQBC1A3BEK731GY4YXEN0C2R',
      providerMessageId: '01EQBC1A3BEK731GY4YXEN0C2R',
      providerConversationId: '01EPYATA64TMNZ1FV02JKF12JF',
      providerContactId: '01EXA07N79THJ20WSN6AS30TMW',
      phoneE164: '+13125550100',
      body: 'Hello from Conversation API!',
      occurredAt: '2020-11-17T15:09:13.267185Z',
    });
    await expect(processSmsSubmit(callback, repository(null))).resolves.toEqual({
      accepted: true,
      duplicate: false,
    });
  });

  it('blocks suppressed sends and never records a provider failure as sent', async () => {
    let acceptedWrites = 0;
    const controlledRepository: SmsRepository = { ...repository(null), isOutboundSuppressed: async () => false, recordOutboundAccepted: async () => { acceptedWrites += 1; return { created: true }; } };
    const result = await sendSms(
      { toNumber: '3125550100', text: 'Hello', idempotencyKey: 'dedupe-1' },
      controlledRepository,
      { readConfiguration: () => ({ projectId: 'project', appId: 'app', keyId: 'key', keySecret: 'secret', fromNumber: '+13125550199', region: 'us' }), send: async () => ({ ok: false, kind: 'provider', statusCode: 500, error: 'provider failed' }) },
    );
    expect(result.success).toBe(false);
    expect(acceptedWrites).toBe(0);
    await expect(sendSms({ toNumber: '3125550100', text: 'Hello', idempotencyKey: 'dedupe-2' }, { ...controlledRepository, isOutboundSuppressed: async () => true })).resolves.toMatchObject({ success: false, error: expect.stringContaining('suppressed') });
  });
});
