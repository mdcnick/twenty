import { createHash } from 'node:crypto';

import { CoreApiClient } from 'twenty-client-sdk/core';

import type {
  BookingRecord,
  CompanyRecord,
  CreateBookingInput,
  HvacBookingRepository,
  PersonRecord,
} from './hvac-booking.types';

export type HvacCoreClient = {
  query(request: Record<string, unknown>): Promise<unknown>;
  mutation(request: Record<string, unknown>): Promise<unknown>;
};

type EdgeResult<TNode> = {
  edges?: Array<{ node?: TNode | null }>;
};

type PersonNode = {
  id?: string;
  name?: { firstName?: string | null; lastName?: string | null } | null;
  companyId?: string | null;
  company?: { name?: string | null } | null;
};

type CompanyNode = {
  id?: string;
  name?: string | null;
};

type BookingNode = {
  id?: string;
  status?: string;
  startAt?: string;
  confirmationSmsSentAt?: string | null;
};

const ACTIVE_BOOKING_STATUSES = [
  'pending',
  'confirmed',
  'scheduled',
  'in_progress',
] as const;

const stableRecordId = (scope: string, key: string): string => {
  const hex = createHash('sha256')
    .update(`${scope}:${key}`, 'utf8')
    .digest('hex');

  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-${((Number.parseInt(hex[16], 16) & 3) | 8).toString(16)}${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
};

const personRecords = (value: unknown): PersonRecord[] => {
  const result = value as { people?: EdgeResult<PersonNode> };

  return (result.people?.edges ?? []).flatMap(({ node }) =>
    node?.id
      ? [
          {
            id: node.id,
            firstName: node.name?.firstName ?? '',
            lastName: node.name?.lastName ?? '',
            companyId: node.companyId ?? null,
            companyName: node.company?.name ?? null,
          },
        ]
      : [],
  );
};

const companyRecords = (value: unknown): CompanyRecord[] => {
  const result = value as { companies?: EdgeResult<CompanyNode> };

  return (result.companies?.edges ?? []).flatMap(({ node }) =>
    node?.id ? [{ id: node.id, name: node.name ?? '' }] : [],
  );
};

const bookingRecords = (value: unknown): BookingRecord[] => {
  const result = value as { serviceJobs?: EdgeResult<BookingNode> };

  return (result.serviceJobs?.edges ?? []).flatMap(({ node }) =>
    node?.id && node.status && node.startAt
      ? [
          {
            id: node.id,
            status: node.status,
            startAt: node.startAt,
            confirmationSmsSentAt: node.confirmationSmsSentAt ?? null,
          },
        ]
      : [],
  );
};

const createdPerson = (value: unknown): PersonRecord => {
  const node = (value as { createPerson?: PersonNode }).createPerson;

  if (!node?.id) {
    throw new Error('Person write did not return an ID.');
  }

  return {
    id: node.id,
    firstName: node.name?.firstName ?? '',
    lastName: node.name?.lastName ?? '',
    companyId: node.companyId ?? null,
    companyName: node.company?.name ?? null,
  };
};

const createdCompany = (value: unknown): CompanyRecord => {
  const node = (value as { createCompany?: CompanyNode }).createCompany;

  if (!node?.id) {
    throw new Error('Company write did not return an ID.');
  }

  return { id: node.id, name: node.name ?? '' };
};

const createdBooking = (value: unknown): BookingRecord => {
  const node = (value as { createServiceJob?: BookingNode }).createServiceJob;

  if (!node?.id || !node.status || !node.startAt) {
    throw new Error('Service job write did not return a complete booking.');
  }

  return {
    id: node.id,
    status: node.status,
    startAt: node.startAt,
    confirmationSmsSentAt: node.confirmationSmsSentAt ?? null,
  };
};

const findPersonIdsByPhone = async (
  client: HvacCoreClient,
  phone: string,
): Promise<string[]> => {
  const result = (await client.query({
    people: {
      __args: {
        filter: { phones: { primaryPhoneNumber: { eq: phone } } },
        first: 10,
      },
      edges: { node: { id: true } },
    },
  })) as { people?: EdgeResult<PersonNode> };

  return (result.people?.edges ?? []).flatMap(({ node }) =>
    node?.id ? [node.id] : [],
  );
};

const findCompanyIdsByPhone = async (
  client: HvacCoreClient,
  phone: string,
): Promise<string[]> => {
  const result = (await client.query({
    companies: {
      __args: {
        filter: { phones: { primaryPhoneNumber: { eq: phone } } },
        first: 10,
      },
      edges: { node: { id: true } },
    },
  })) as { companies?: EdgeResult<CompanyNode> };

  return (result.companies?.edges ?? []).flatMap(({ node }) =>
    node?.id ? [node.id] : [],
  );
};

const richText = (markdown: string) => ({ markdown, blocknote: '' });

export const createTwentyHvacBookingRepository = (
  client: HvacCoreClient = new CoreApiClient({
    runAs: 'application',
  }) as unknown as HvacCoreClient,
): HvacBookingRepository => ({
  async findBookingBySourceRequest(source, sourceRequestId) {
    const result = await client.query({
      serviceJobs: {
        __args: {
          filter: {
            and: [
              { source: { eq: source } },
              { sourceRequestId: { eq: sourceRequestId } },
            ],
          },
          first: 2,
        },
        edges: {
          node: {
            id: true,
            status: true,
            startAt: true,
            confirmationSmsSentAt: true,
          },
        },
      },
    });
    const bookings = bookingRecords(result);

    if (bookings.length > 1) {
      throw new Error('Source request resolved to multiple service jobs.');
    }

    return bookings[0] ?? null;
  },

  async findPeopleByPhone(phone) {
    return personRecords(
      await client.query({
        people: {
          __args: {
            filter: { phones: { primaryPhoneNumber: { eq: phone } } },
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
      }),
    );
  },

  async findCompaniesByPhone(phone) {
    return companyRecords(
      await client.query({
        companies: {
          __args: {
            filter: { phones: { primaryPhoneNumber: { eq: phone } } },
            first: 10,
          },
          edges: { node: { id: true, name: true } },
        },
      }),
    );
  },

  async createPerson(input) {
    return createdPerson(
      await client.mutation({
        createPerson: {
          __args: {
            data: {
              id: stableRecordId(
                'hvac-person',
                `${input.phone}:${input.firstName}:${input.lastName}`,
              ),
              name: {
                firstName: input.firstName,
                lastName: input.lastName,
              },
              phones: { primaryPhoneNumber: input.phone },
              ...(input.companyId === null
                ? {}
                : { companyId: input.companyId }),
            },
            upsert: true,
          },
          id: true,
          name: { firstName: true, lastName: true },
          companyId: true,
          company: { name: true },
        },
      }),
    );
  },

  async createCompany(input) {
    return createdCompany(
      await client.mutation({
        createCompany: {
          __args: {
            data: {
              id: stableRecordId('hvac-company', `${input.phone}:${input.name}`),
              name: input.name,
              phones: { primaryPhoneNumber: input.phone },
            },
            upsert: true,
          },
          id: true,
          name: true,
        },
      }),
    );
  },

  async findConflictingBookings(input) {
    const result = (await client.query({
      serviceJobs: {
        __args: {
          filter: {
            and: [
              { status: { in: [...ACTIVE_BOOKING_STATUSES] } },
              { startAt: { lt: input.endAt } },
              { endAt: { gt: input.startAt } },
            ],
          },
          first: 10,
        },
        edges: { node: { id: true } },
      },
    })) as { serviceJobs?: EdgeResult<BookingNode> };

    return (result.serviceJobs?.edges ?? []).flatMap(({ node }) =>
      node?.id ? [node.id] : [],
    );
  },

  async createBooking(input: CreateBookingInput) {
    return createdBooking(
      await client.mutation({
        createServiceJob: {
          __args: {
            data: {
              id: stableRecordId(
                'hvac-service-job',
                `${input.source}:${input.sourceRequestId}`,
              ),
              name: input.name,
              ...(input.companyId === null
                ? {}
                : { companyId: input.companyId }),
              serviceContactId: input.serviceContactId,
              serviceCode: input.serviceCode,
              systemType: input.systemType,
              workIntent: input.workIntent,
              issueSummary: richText(input.issueSummary),
              urgency: input.urgency,
              appointmentWindow: input.appointmentWindow,
              serviceAddress: input.serviceAddress,
              source: input.source,
              sourceRequestId: input.sourceRequestId,
              startAt: input.startAt,
              endAt: input.endAt,
              status: input.status,
              bookingTimezone: input.bookingTimezone,
              serviceClassification: input.serviceClassification,
              notes: richText(input.notes),
            },
            upsert: true,
          },
          id: true,
          status: true,
          startAt: true,
          confirmationSmsSentAt: true,
        },
      }),
    );
  },

  async markBookingSmsSent(bookingId, sentAt) {
    await client.mutation({
      updateServiceJob: {
        __args: {
          id: bookingId,
          data: { confirmationSmsSentAt: sentAt },
        },
        id: true,
      },
    });
  },

  async findActiveAppointmentsByPhone(phone) {
    const personIds = await findPersonIdsByPhone(client, phone);
    const companyIds = await findCompanyIdsByPhone(client, phone);

    if (personIds.length === 0 && companyIds.length === 0) {
      return [];
    }

    return bookingRecords(
      await client.query({
        serviceJobs: {
          __args: {
            filter: {
              and: [
                { status: { in: [...ACTIVE_BOOKING_STATUSES] } },
                {
                  or: [
                    { serviceContactId: { in: personIds } },
                    { companyId: { in: companyIds } },
                  ],
                },
              ],
            },
            first: 3,
          },
          edges: {
            node: {
              id: true,
              status: true,
              startAt: true,
              confirmationSmsSentAt: true,
            },
          },
        },
      }),
    );
  },
});
