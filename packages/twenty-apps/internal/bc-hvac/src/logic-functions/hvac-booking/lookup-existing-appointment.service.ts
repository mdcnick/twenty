import type {
  HvacBookingRepository,
  LookupExistingAppointmentInput,
} from './hvac-booking.types';
import {
  HvacBookingError,
  normalizePhone,
} from './hvac-booking-validation';

export const lookupExistingAppointment = async (
  input: LookupExistingAppointmentInput,
  repository: HvacBookingRepository,
): Promise<
  | { found: false }
  | { found: true; status: string; startDatetime: string }
> => {
  const customerPhone = normalizePhone(input.customerPhone);

  if (customerPhone === null) {
    throw new HvacBookingError('HVAC_PHONE_INVALID');
  }

  const appointments = await repository.findActiveAppointmentsByPhone(
    customerPhone,
  );

  if (appointments.length !== 1) {
    return { found: false };
  }

  return {
    found: true,
    status: appointments[0].status,
    startDatetime: appointments[0].startAt,
  };
};
