export type CustomerType = 'resident' | 'business';

export type SubmitHvacAppointmentInput = {
  customerName: string;
  customerPhone: string;
  customerType: CustomerType;
  companyName?: string;
  serviceAddress: string;
  serviceType: string;
  problemSummary: string;
  urgency: string;
  preferredWindow: string;
  confirmedStartDatetime: string;
  existingCustomer?: string;
  thermostatBatteriesChecked?: string;
  safetyIssue?: string;
  source: string;
  sourceRequestId: string;
  bookingTimezone: string;
  sendSms: boolean;
  notes?: string;
};
export type LookupExistingAppointmentInput = {
  customerPhone: string;
};

export type PersonRecord = {
  id: string;
  firstName: string;
  lastName: string;
  companyId: string | null;
  companyName: string | null;
};

export type CompanyRecord = {
  id: string;
  name: string;
};

export type BookingRecord = {
  id: string;
  status: string;
  startAt: string;
  confirmationSmsSentAt: string | null;
};

export type CreateBookingInput = {
  name: string;
  companyId: string | null;
  serviceContactId: string;
  serviceCode: string;
  systemType: string;
  workIntent: string;
  issueSummary: string;
  urgency: string;
  appointmentWindow: string;
  serviceAddress: string;
  source: string;
  sourceRequestId: string;
  startAt: string;
  endAt: string;
  status: 'pending';
  bookingTimezone: 'America/Chicago';
  serviceClassification: string;
  notes: string;
};

export type HvacBookingRepository = {
  findBookingBySourceRequest(
    source: string,
    sourceRequestId: string,
  ): Promise<BookingRecord | null>;
  findPeopleByPhone(phone: string): Promise<PersonRecord[]>;
  findCompaniesByPhone(phone: string): Promise<CompanyRecord[]>;
  createPerson(input: {
    firstName: string;
    lastName: string;
    phone: string;
    companyId: string | null;
  }): Promise<PersonRecord>;
  createCompany(input: {
    name: string;
    phone: string;
  }): Promise<CompanyRecord>;
  findConflictingBookings(input: {
    startAt: string;
    endAt: string;
  }): Promise<string[]>;
  createBooking(input: CreateBookingInput): Promise<BookingRecord>;
  markBookingSmsSent(bookingId: string, sentAt: string): Promise<void>;
  findActiveAppointmentsByPhone(phone: string): Promise<BookingRecord[]>;
};

export type SendBookingSms = (input: {
  bookingId: string;
  customerPhone: string;
  appointmentStart: string;
  idempotencyKey: string;
}) => Promise<boolean>;

export type SubmitHvacAppointmentResult =
  | {
      bookingId: string;
      status: string;
      conflictChecked: true;
      conflictFound: false;
      smsSent: boolean;
    }
  | {
      status: 'conflict';
      conflictChecked: true;
      conflictFound: true;
      smsSent: false;
    };
