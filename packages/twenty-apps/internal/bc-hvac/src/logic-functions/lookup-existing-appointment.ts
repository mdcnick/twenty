import { defineLogicFunction } from 'twenty-sdk/define';

import { LOOKUP_EXISTING_APPOINTMENT_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/constants/bc-hvac-identifiers';
import { lookupExistingAppointment } from 'src/logic-functions/hvac-booking/lookup-existing-appointment.service';
import { createTwentyHvacBookingRepository } from 'src/logic-functions/hvac-booking/twenty-hvac-booking.repository';
import type { LookupExistingAppointmentInput } from 'src/logic-functions/hvac-booking/hvac-booking.types';

const handler = (input: LookupExistingAppointmentInput) =>
  lookupExistingAppointment(input, createTwentyHvacBookingRepository());

export default defineLogicFunction({
  universalIdentifier:
    LOOKUP_EXISTING_APPOINTMENT_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'lookup-existing-appointment',
  description:
    'Look up one active HVAC appointment by caller phone number. Returns only whether one unambiguous appointment exists, its status, and its start time.',
  timeoutSeconds: 15,
  toolTriggerSettings: {
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        customerPhone: {
          type: 'string',
          description: 'Caller phone number in US or E.164 format.',
        },
      },
      required: ['customerPhone'],
    },
  },
  handler,
});
