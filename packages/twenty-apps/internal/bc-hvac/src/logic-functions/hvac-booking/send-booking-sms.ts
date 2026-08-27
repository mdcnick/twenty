import { RestApiClient } from 'twenty-client-sdk/rest';

import type { SendBookingSms } from './hvac-booking.types';

export type SmsRouteClient = {
  post(path: string, body: Record<string, unknown>): Promise<unknown>;
};

const bookingMessage = (appointmentStart: string): string => {
  const startsAt = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Chicago',
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(appointmentStart));

  return `Bernie's Heating received your service request for ${startsAt}. Your appointment is pending confirmation. Reply STOP to opt out.`;
};

export const sendBookingSmsWithClient = async (
  input: Parameters<SendBookingSms>[0],
  client: SmsRouteClient,
): Promise<boolean> => {
  try {
    const result = (await client.post('/s/sms/send', {
      toNumber: input.customerPhone,
      text: bookingMessage(input.appointmentStart),
      idempotencyKey: input.idempotencyKey,
    })) as { success?: unknown };

    return result.success === true;
  } catch {
    return false;
  }
};

export const sendBookingSms: SendBookingSms = (input) =>
  sendBookingSmsWithClient(
    input,
    new RestApiClient({ runAs: 'application' }) as SmsRouteClient,
  );
