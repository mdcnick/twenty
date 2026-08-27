import type {
  CompanyRecord,
  HvacBookingRepository,
  PersonRecord,
  SendBookingSms,
  SubmitHvacAppointmentInput,
  SubmitHvacAppointmentResult,
} from './hvac-booking.types';
import {
  companyNamesMatch,
  HvacBookingError,
  namesMatch,
  normalizeUrgency,
  parsePersonName,
  validateSubmission,
} from './hvac-booking-validation';

type CustomerResolution =
  | { kind: 'existing'; person: PersonRecord }
  | { kind: 'new-resident' }
  | { kind: 'new-business'; company: CompanyRecord | null };

const resolveCustomer = async (
  input: SubmitHvacAppointmentInput,
  customerPhone: string,
  repository: HvacBookingRepository,
): Promise<CustomerResolution> => {
  const phoneMatches = await repository.findPeopleByPhone(customerPhone);
  const exactPeople = phoneMatches.filter((person) =>
    namesMatch(person.firstName, person.lastName, input.customerName),
  );

  if (phoneMatches.length > 0 && exactPeople.length !== 1) {
    throw new HvacBookingError('HVAC_CUSTOMER_AMBIGUOUS');
  }

  if (exactPeople.length === 1) {
    const person = exactPeople[0];

    if (input.customerType === 'business') {
      if (
        person.companyId === null ||
        person.companyName === null ||
        !companyNamesMatch(person.companyName, input.companyName ?? '')
      ) {
        throw new HvacBookingError('HVAC_CUSTOMER_AMBIGUOUS');
      }
    }

    return { kind: 'existing', person };
  }

  if (input.customerType === 'resident') {
    return { kind: 'new-resident' };
  }

  const companyPhoneMatches = await repository.findCompaniesByPhone(customerPhone);
  const exactCompanies = companyPhoneMatches.filter((company) =>
    companyNamesMatch(company.name, input.companyName ?? ''),
  );

  if (companyPhoneMatches.length > 0 && exactCompanies.length !== 1) {
    throw new HvacBookingError('HVAC_CUSTOMER_AMBIGUOUS');
  }

  return {
    kind: 'new-business',
    company: exactCompanies[0] ?? null,
  };
};
const createCustomer = async (
  input: SubmitHvacAppointmentInput,
  customerPhone: string,
  resolution: Exclude<CustomerResolution, { kind: 'existing' }>,
  repository: HvacBookingRepository,
): Promise<PersonRecord> => {
  const name = parsePersonName(input.customerName);
  let companyId: string | null = null;

  if (resolution.kind === 'new-business') {
    const company =
      resolution.company ??
      (await repository.createCompany({
        name: input.companyName?.trim() ?? '',
        phone: customerPhone,
      }));

    companyId = company.id;
  }

  return repository.createPerson({
    ...name,
    phone: customerPhone,
    companyId,
  });
};

const maybeSendConfirmationSms = async (
  input: SubmitHvacAppointmentInput,
  booking: {
    id: string;
    startAt: string;
    confirmationSmsSentAt: string | null;
  },
  customerPhone: string,
  repository: HvacBookingRepository,
  sendBookingSms: SendBookingSms,
): Promise<boolean> => {
  if (!input.sendSms) {
    return false;
  }

  if (booking.confirmationSmsSentAt !== null) {
    return true;
  }

  const smsSent = await sendBookingSms({
    bookingId: booking.id,
    customerPhone,
    appointmentStart: booking.startAt,
    idempotencyKey: `hvac-booking:${booking.id}:pending-confirmation`,
  });

  if (smsSent) {
    await repository.markBookingSmsSent(booking.id, new Date().toISOString());
  }

  return smsSent;
};

export const submitHvacAppointment = async (
  input: SubmitHvacAppointmentInput,
  dependencies: {
    repository: HvacBookingRepository;
    sendBookingSms: SendBookingSms;
  },
): Promise<SubmitHvacAppointmentResult> => {
  const validated = validateSubmission(input);
  const existingBooking = await dependencies.repository.findBookingBySourceRequest(
    input.source,
    input.sourceRequestId,
  );

  if (existingBooking !== null) {
    const smsSent = await maybeSendConfirmationSms(
      input,
      existingBooking,
      validated.customerPhone,
      dependencies.repository,
      dependencies.sendBookingSms,
    );

    return {
      bookingId: existingBooking.id,
      status: existingBooking.status,
      conflictChecked: true,
      conflictFound: false,
      smsSent,
    };
  }

  const customerResolution = await resolveCustomer(
    input,
    validated.customerPhone,
    dependencies.repository,
  );
  const conflicts = await dependencies.repository.findConflictingBookings({
    startAt: validated.startAt,
    endAt: validated.endAt,
  });

  if (conflicts.length > 0) {
    return {
      status: 'conflict',
      conflictChecked: true,
      conflictFound: true,
      smsSent: false,
    };
  }

  const person =
    customerResolution.kind === 'existing'
      ? customerResolution.person
      : await createCustomer(
          input,
          validated.customerPhone,
          customerResolution,
          dependencies.repository,
        );
  const booking = await dependencies.repository.createBooking({
    name: `${validated.service.label} - ${input.confirmedStartDatetime}`,
    companyId: person.companyId,
    serviceContactId: person.id,
    serviceCode: validated.service.serviceCode,
    systemType: validated.service.systemType,
    workIntent: validated.service.workIntent,
    issueSummary: input.problemSummary.trim(),
    urgency: normalizeUrgency(input.urgency),
    appointmentWindow: input.preferredWindow.trim(),
    serviceAddress: input.serviceAddress.trim(),
    source: input.source.trim(),
    sourceRequestId: input.sourceRequestId.trim(),
    startAt: validated.startAt,
    endAt: validated.endAt,
    status: 'pending',
    bookingTimezone: 'America/Chicago',
    serviceClassification: validated.service.label,
    notes: input.notes?.trim() ?? '',
  });
  const smsSent = await maybeSendConfirmationSms(
    input,
    booking,
    validated.customerPhone,
    dependencies.repository,
    dependencies.sendBookingSms,
  );

  return {
    bookingId: booking.id,
    status: booking.status,
    conflictChecked: true,
    conflictFound: false,
    smsSent,
  };
};
