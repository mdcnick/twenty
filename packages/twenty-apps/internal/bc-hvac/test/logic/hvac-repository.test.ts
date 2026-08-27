import { describe, expect, it, vi } from 'vitest';

import {
  createTwentyHvacBookingRepository,
  type HvacCoreClient,
} from '../../src/logic-functions/hvac-booking/twenty-hvac-booking.repository';
import {
  sendBookingSmsWithClient,
  type SmsRouteClient,
} from '../../src/logic-functions/hvac-booking/send-booking-sms';

describe('Twenty HVAC booking repository', () => {
  it('finds people by exact normalized primary phone', async () => {
    const client = {
      query: vi.fn(async () => ({
        people: {
          edges: [
            {
              node: {
                id: 'person-1',
                name: { firstName: 'Maria', lastName: 'Lopez' },
                companyId: 'company-1',
                company: { name: 'Lopez Household' },
              },
            },
          ],
        },
      })),
      mutation: vi.fn(),
    } satisfies HvacCoreClient;
    const repository = createTwentyHvacBookingRepository(client);

    await expect(repository.findPeopleByPhone('+17735551212')).resolves.toEqual([
      {
        id: 'person-1',
        firstName: 'Maria',
        lastName: 'Lopez',
        companyId: 'company-1',
        companyName: 'Lopez Household',
      },
    ]);
    expect(client.query).toHaveBeenCalledWith({
      people: {
        __args: {
          filter: {
            phones: { primaryPhoneNumber: { eq: '+17735551212' } },
          },
          first: 10,
        },
        edges: {
          node: {
            id: true,
            name: { firstName: true, lastName: true },
            companyId: true,
            company: { name: true },
          },
        },
      },
    });
  });

  it('creates a deterministic idempotent Service Job write', async () => {
    const client = {
      query: vi.fn(),
      mutation: vi.fn(async () => ({
        createServiceJob: {
          id: 'booking-new',
          status: 'pending',
          startAt: '2026-08-26T14:00:00.000Z',
          confirmationSmsSentAt: null,
        },
      })),
    } satisfies HvacCoreClient;
    const repository = createTwentyHvacBookingRepository(client);

    await repository.createBooking({
      name: 'Air conditioning repair - 2026-08-26 09:00:00',
      companyId: 'company-1',
      serviceContactId: 'person-1',
      serviceCode: 'ac_repair',
      systemType: 'air_conditioner',
      workIntent: 'repair',
      issueSummary: 'AC is blowing warm air',
      urgency: 'urgent',
      appointmentWindow: 'tomorrow morning',
      serviceAddress: '3704 N Cicero Ave, Chicago',
      source: 'liz_voice_agent',
      sourceRequestId: 'liz-request-1',
      startAt: '2026-08-26T14:00:00.000Z',
      endAt: '2026-08-26T16:00:00.000Z',
      status: 'pending',
      bookingTimezone: 'America/Chicago',
      serviceClassification: 'Air conditioning repair',
      notes: 'Confirmed by caller.',
    });

    const mutationCalls = client.mutation.mock.calls as unknown as Array<
      [
        {
          createServiceJob: {
            __args: {
              data: Record<string, unknown>;
              upsert: boolean;
            };
          };
        },
      ]
    >;
    const request = mutationCalls[0]?.[0];

    expect(request).toBeDefined();
    if (request === undefined) {
      throw new Error('Expected a Service job mutation.');
    }
    expect(request.createServiceJob.__args.upsert).toBe(true);
    expect(request.createServiceJob.__args.data.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
    expect(request.createServiceJob.__args.data).toMatchObject({
      source: 'liz_voice_agent',
      sourceRequestId: 'liz-request-1',
      companyId: 'company-1',
      serviceContactId: 'person-1',
      serviceAddress: '3704 N Cicero Ave, Chicago',
      issueSummary: {
        markdown: 'AC is blowing warm air',
        blocknote: '',
      },
      notes: {
        markdown: 'Confirmed by caller.',
        blocknote: '',
      },
    });
  });

  it('looks up active appointments through phone-matched people and companies', async () => {
    const query = vi
      .fn()
      .mockResolvedValueOnce({
        people: { edges: [{ node: { id: 'person-1' } }] },
      })
      .mockResolvedValueOnce({
        companies: { edges: [{ node: { id: 'company-1' } }] },
      })
      .mockResolvedValueOnce({
        serviceJobs: {
          edges: [
            {
              node: {
                id: 'booking-1',
                status: 'confirmed',
                startAt: '2026-08-26T14:00:00.000Z',
                confirmationSmsSentAt: null,
              },
            },
          ],
        },
      });
    const repository = createTwentyHvacBookingRepository({
      query,
      mutation: vi.fn(),
    });

    await expect(
      repository.findActiveAppointmentsByPhone('+17735551212'),
    ).resolves.toHaveLength(1);
    expect(query.mock.calls[2][0]).toMatchObject({
      serviceJobs: {
        __args: {
          filter: {
            and: [
              { status: { in: ['pending', 'confirmed', 'scheduled', 'in_progress'] } },
              {
                or: [
                  { serviceContactId: { in: ['person-1'] } },
                  { companyId: { in: ['company-1'] } },
                ],
              },
            ],
          },
          first: 3,
        },
      },
    });
  });
});

describe('booking confirmation SMS bridge', () => {
  it('calls the authenticated SMS app route with a server-built message and stable key', async () => {
    const client = {
      post: vi.fn(async () => ({ success: true })),
    } satisfies SmsRouteClient;

    await expect(
      sendBookingSmsWithClient(
        {
          bookingId: 'booking-1',
          customerPhone: '+17735551212',
          appointmentStart: '2026-08-26T14:00:00.000Z',
          idempotencyKey: 'hvac-booking:booking-1:pending-confirmation',
        },
        client,
      ),
    ).resolves.toBe(true);

    expect(client.post).toHaveBeenCalledWith('/s/sms/send', {
      toNumber: '+17735551212',
      text: expect.stringContaining('pending confirmation'),
      idempotencyKey: 'hvac-booking:booking-1:pending-confirmation',
    });
    const postCalls = client.post.mock.calls as unknown as Array<
      [string, { text: string }]
    >;
    const message = postCalls[0]?.[1].text;

    expect(message).toBeDefined();
    if (message === undefined) {
      throw new Error('Expected an SMS route request.');
    }
    expect(message).not.toContain('Maria');
    expect(message).not.toContain('Cicero');
  });
});
