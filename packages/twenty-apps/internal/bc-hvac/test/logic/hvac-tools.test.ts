import { describe, expect, it, vi } from 'vitest';

import {
  lookupExistingAppointment,
} from '../../src/logic-functions/hvac-booking/lookup-existing-appointment.service';
import {
  submitHvacAppointment,
} from '../../src/logic-functions/hvac-booking/submit-hvac-appointment.service';
import type {
  HvacBookingRepository,
  SubmitHvacAppointmentInput,
} from '../../src/logic-functions/hvac-booking/hvac-booking.types';

const RESIDENT_INPUT: SubmitHvacAppointmentInput = {
  customerName: 'Maria Lopez',
  customerPhone: '+1 (773) 555-1212',
  customerType: 'resident',
  serviceAddress: '3704 N Cicero Ave, Chicago',
  serviceType: 'cooling',
  problemSummary: 'AC is blowing warm air',
  urgency: 'soon',
  preferredWindow: 'tomorrow morning',
  confirmedStartDatetime: '2026-08-26 09:00:00',
  existingCustomer: 'yes',
  thermostatBatteriesChecked: 'not relevant',
  safetyIssue: 'none reported',
  source: 'liz_voice_agent',
  sourceRequestId: 'liz-request-1',
  bookingTimezone: 'America/Chicago',
  sendSms: true,
  notes: 'Confirmed by caller.',
};

const createRepository = (
  overrides: Partial<HvacBookingRepository> = {},
): HvacBookingRepository => ({
  findBookingBySourceRequest: vi.fn(async () => null),
  findPeopleByPhone: vi.fn(async () => []),
  findCompaniesByPhone: vi.fn(async () => []),
  createPerson: vi.fn(async () => ({
    id: 'person-new',
    firstName: 'Maria',
    lastName: 'Lopez',
    companyId: null,
    companyName: null,
  })),
  createCompany: vi.fn(async () => ({
    id: 'company-new',
    name: 'Acme Mechanical',
  })),
  findConflictingBookings: vi.fn(async () => []),
  createBooking: vi.fn(async () => ({
    id: 'booking-new',
    status: 'pending',
    startAt: '2026-08-26T14:00:00.000Z',
    confirmationSmsSentAt: null,
  })),
  markBookingSmsSent: vi.fn(async () => undefined),
  findActiveAppointmentsByPhone: vi.fn(async () => []),
  ...overrides,
});

describe('app_submit_hvac_appointment', () => {
  it('reuses one exact phone and name match, checks conflicts, and creates one booking', async () => {
    const repository = createRepository({
      findPeopleByPhone: vi.fn(async () => [
        {
          id: 'person-existing',
          firstName: 'Maria',
          lastName: 'Lopez',
          companyId: 'company-existing',
          companyName: 'Lopez Household',
        },
      ]),
    });
    const sendBookingSms = vi.fn(async () => true);

    const result = await submitHvacAppointment(RESIDENT_INPUT, {
      repository,
      sendBookingSms,
    });

    expect(result).toEqual({
      bookingId: 'booking-new',
      status: 'pending',
      conflictChecked: true,
      conflictFound: false,
      smsSent: true,
    });
    expect(repository.createPerson).not.toHaveBeenCalled();
    expect(repository.findConflictingBookings).toHaveBeenCalledWith({
      startAt: '2026-08-26T14:00:00.000Z',
      endAt: '2026-08-26T16:00:00.000Z',
    });
    expect(repository.createBooking).toHaveBeenCalledWith(
      expect.objectContaining({
        companyId: 'company-existing',
        serviceContactId: 'person-existing',
        serviceCode: 'ac_repair',
        systemType: 'air_conditioner',
        workIntent: 'repair',
        serviceAddress: '3704 N Cicero Ave, Chicago',
        sourceRequestId: 'liz-request-1',
      }),
    );
    expect(sendBookingSms).toHaveBeenCalledWith({
      bookingId: 'booking-new',
      customerPhone: '+17735551212',
      appointmentStart: '2026-08-26T14:00:00.000Z',
      idempotencyKey: 'hvac-booking:booking-new:pending-confirmation',
    });
    expect(repository.markBookingSmsSent).toHaveBeenCalledWith(
      'booking-new',
      expect.any(String),
    );
  });

  it('returns the original result for an idempotent retry without another write or SMS', async () => {
    const repository = createRepository({
      findBookingBySourceRequest: vi.fn(async () => ({
        id: 'booking-existing',
        status: 'pending',
        startAt: '2026-08-26T14:00:00.000Z',
        confirmationSmsSentAt: '2026-08-25T18:00:00.000Z',
      })),
    });
    const sendBookingSms = vi.fn(async () => true);

    const result = await submitHvacAppointment(RESIDENT_INPUT, {
      repository,
      sendBookingSms,
    });

    expect(result).toMatchObject({
      bookingId: 'booking-existing',
      conflictChecked: true,
      conflictFound: false,
      smsSent: true,
    });
    expect(repository.findPeopleByPhone).not.toHaveBeenCalled();
    expect(repository.createBooking).not.toHaveBeenCalled();
    expect(sendBookingSms).not.toHaveBeenCalled();
  });

  it('refuses ambiguous customer matches before checking or writing a booking', async () => {
    const repository = createRepository({
      findPeopleByPhone: vi.fn(async () => [
        {
          id: 'person-1',
          firstName: 'Maria',
          lastName: 'Lopez',
          companyId: null,
          companyName: null,
        },
        {
          id: 'person-2',
          firstName: 'Maria',
          lastName: 'Lopez',
          companyId: null,
          companyName: null,
        },
      ]),
    });

    await expect(
      submitHvacAppointment(RESIDENT_INPUT, {
        repository,
        sendBookingSms: vi.fn(async () => true),
      }),
    ).rejects.toThrow('HVAC_CUSTOMER_AMBIGUOUS');
    expect(repository.findConflictingBookings).not.toHaveBeenCalled();
    expect(repository.createBooking).not.toHaveBeenCalled();
  });

  it('refuses a phone match with a different confirmed name', async () => {
    const repository = createRepository({
      findPeopleByPhone: vi.fn(async () => [
        {
          id: 'person-1',
          firstName: 'James',
          lastName: 'Smith',
          companyId: null,
          companyName: null,
        },
      ]),
    });

    await expect(
      submitHvacAppointment(RESIDENT_INPUT, {
        repository,
        sendBookingSms: vi.fn(async () => true),
      }),
    ).rejects.toThrow('HVAC_CUSTOMER_AMBIGUOUS');
    expect(repository.createPerson).not.toHaveBeenCalled();
    expect(repository.createBooking).not.toHaveBeenCalled();
  });

  it('returns a structured conflict without creating a customer, booking, or SMS', async () => {
    const repository = createRepository({
      findPeopleByPhone: vi.fn(async () => [
        {
          id: 'person-existing',
          firstName: 'Maria',
          lastName: 'Lopez',
          companyId: null,
          companyName: null,
        },
      ]),
      findConflictingBookings: vi.fn(async () => ['booking-conflict']),
    });
    const sendBookingSms = vi.fn(async () => true);

    const result = await submitHvacAppointment(RESIDENT_INPUT, {
      repository,
      sendBookingSms,
    });

    expect(result).toEqual({
      status: 'conflict',
      conflictChecked: true,
      conflictFound: true,
      smsSent: false,
    });
    expect(repository.createPerson).not.toHaveBeenCalled();
    expect(repository.createBooking).not.toHaveBeenCalled();
    expect(sendBookingSms).not.toHaveBeenCalled();
  });

  it('requires a company name before creating a new business customer', async () => {
    await expect(
      submitHvacAppointment(
        { ...RESIDENT_INPUT, customerType: 'business' },
        {
          repository: createRepository(),
          sendBookingSms: vi.fn(async () => true),
        },
      ),
    ).rejects.toThrow('HVAC_COMPANY_NAME_REQUIRED');
  });

  it('creates a new business and its named primary contact together', async () => {
    const repository = createRepository();

    await submitHvacAppointment(
      {
        ...RESIDENT_INPUT,
        customerType: 'business',
        companyName: 'Acme Mechanical',
      },
      {
        repository,
        sendBookingSms: vi.fn(async () => false),
      },
    );

    expect(repository.createCompany).toHaveBeenCalledWith({
      name: 'Acme Mechanical',
      phone: '+17735551212',
    });
    expect(repository.createPerson).toHaveBeenCalledWith({
      firstName: 'Maria',
      lastName: 'Lopez',
      phone: '+17735551212',
      companyId: 'company-new',
    });
  });

  it('creates a new resident only after the conflict check succeeds', async () => {
    const repository = createRepository();

    await submitHvacAppointment(RESIDENT_INPUT, {
      repository,
      sendBookingSms: vi.fn(async () => false),
    });

    expect(repository.findConflictingBookings).toHaveBeenCalledOnce();
    expect(repository.createPerson).toHaveBeenCalledWith({
      firstName: 'Maria',
      lastName: 'Lopez',
      phone: '+17735551212',
      companyId: null,
    });
  });

  it.each([
    '2026-03-08 02:30:00',
    '2026-11-01 01:30:00',
  ])('rejects invalid or ambiguous Chicago wall time %s', async (startAt) => {
    const repository = createRepository();

    await expect(
      submitHvacAppointment(
        { ...RESIDENT_INPUT, confirmedStartDatetime: startAt },
        {
          repository,
          sendBookingSms: vi.fn(async () => true),
        },
      ),
    ).rejects.toThrow('HVAC_START_DATETIME_INVALID');
    expect(repository.findBookingBySourceRequest).not.toHaveBeenCalled();
  });

  it('keeps the booking successful but reports SMS failure for a safe retry', async () => {
    const repository = createRepository({
      findPeopleByPhone: vi.fn(async () => [
        {
          id: 'person-existing',
          firstName: 'Maria',
          lastName: 'Lopez',
          companyId: null,
          companyName: null,
        },
      ]),
    });

    const result = await submitHvacAppointment(RESIDENT_INPUT, {
      repository,
      sendBookingSms: vi.fn(async () => false),
    });

    expect(result).toMatchObject({
      bookingId: 'booking-new',
      status: 'pending',
      smsSent: false,
    });
    expect(repository.markBookingSmsSent).not.toHaveBeenCalled();
  });

  it('retries only the missing SMS for an idempotent booking', async () => {
    const repository = createRepository({
      findBookingBySourceRequest: vi.fn(async () => ({
        id: 'booking-existing',
        status: 'pending',
        startAt: '2026-08-26T14:00:00.000Z',
        confirmationSmsSentAt: null,
      })),
    });
    const sendBookingSms = vi.fn(async () => true);

    const result = await submitHvacAppointment(RESIDENT_INPUT, {
      repository,
      sendBookingSms,
    });

    expect(result).toMatchObject({
      bookingId: 'booking-existing',
      smsSent: true,
    });
    expect(repository.createBooking).not.toHaveBeenCalled();
    expect(sendBookingSms).toHaveBeenCalledOnce();
    expect(repository.markBookingSmsSent).toHaveBeenCalledOnce();
  });
});

describe('app_lookup_existing_appointment', () => {
  it('returns only safe status and start fields for one active appointment', async () => {
    const repository = createRepository({
      findActiveAppointmentsByPhone: vi.fn(async () => [
        {
          id: 'booking-1',
          status: 'confirmed',
          startAt: '2026-08-26T14:00:00.000Z',
          confirmationSmsSentAt: null,
        },
      ]),
    });

    await expect(
      lookupExistingAppointment(
        { customerPhone: '(773) 555-1212' },
        repository,
      ),
    ).resolves.toEqual({
      found: true,
      status: 'confirmed',
      startDatetime: '2026-08-26T14:00:00.000Z',
    });
  });

  it('returns not found when the appointment result is ambiguous', async () => {
    const repository = createRepository({
      findActiveAppointmentsByPhone: vi.fn(async () => [
        {
          id: 'booking-1',
          status: 'pending',
          startAt: '2026-08-26T14:00:00.000Z',
          confirmationSmsSentAt: null,
        },
        {
          id: 'booking-2',
          status: 'confirmed',
          startAt: '2026-08-27T14:00:00.000Z',
          confirmationSmsSentAt: null,
        },
      ]),
    });

    await expect(
      lookupExistingAppointment(
        { customerPhone: '+17735551212' },
        repository,
      ),
    ).resolves.toEqual({ found: false });
  });
});
