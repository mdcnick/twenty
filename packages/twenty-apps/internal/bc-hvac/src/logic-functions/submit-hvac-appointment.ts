import { defineLogicFunction } from 'twenty-sdk/define';

import { SUBMIT_HVAC_APPOINTMENT_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/constants/bc-hvac-identifiers';
import { sendBookingSms } from 'src/logic-functions/hvac-booking/send-booking-sms';
import { submitHvacAppointment } from 'src/logic-functions/hvac-booking/submit-hvac-appointment.service';
import { createTwentyHvacBookingRepository } from 'src/logic-functions/hvac-booking/twenty-hvac-booking.repository';
import type { SubmitHvacAppointmentInput } from 'src/logic-functions/hvac-booking/hvac-booking.types';

const handler = (input: SubmitHvacAppointmentInput) =>
  submitHvacAppointment(input, {
    repository: createTwentyHvacBookingRepository(),
    sendBookingSms,
  });

export default defineLogicFunction({
  universalIdentifier:
    SUBMIT_HVAC_APPOINTMENT_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'submit-hvac-appointment',
  description:
    "Create or reuse a Bernie's Heating customer and submit a conflict-checked service appointment. Use only after the caller confirms the appointment time.",
  timeoutSeconds: 30,
  toolTriggerSettings: {
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        customerName: {
          type: 'string',
          description: 'Caller first and last name.',
        },
        customerPhone: {
          type: 'string',
          description: 'Caller phone number in US or E.164 format.',
        },
        customerType: {
          type: 'string',
          enum: ['resident', 'business'],
        },
        companyName: {
          type: 'string',
          description: 'Required when customerType is business.',
        },
        serviceAddress: { type: 'string' },
        serviceType: {
          type: 'string',
          description:
            'Plain-language HVAC service, such as AC repair, furnace repair, maintenance, installation estimate, indoor air quality, ducts, or commercial service.',
        },
        problemSummary: { type: 'string' },
        urgency: { type: 'string' },
        preferredWindow: { type: 'string' },
        confirmedStartDatetime: {
          type: 'string',
          description:
            'Confirmed local Chicago date and time in YYYY-MM-DD HH:mm:ss format.',
        },
        existingCustomer: { type: 'string' },
        thermostatBatteriesChecked: { type: 'string' },
        safetyIssue: { type: 'string' },
        source: {
          type: 'string',
          description: 'Stable integration source, such as liz_voice_agent.',
        },
        sourceRequestId: {
          type: 'string',
          description: 'Stable ID reused for every retry of the same request.',
        },
        bookingTimezone: {
          type: 'string',
          enum: ['America/Chicago'],
        },
        sendSms: { type: 'boolean' },
        notes: { type: 'string' },
      },
      required: [
        'customerName',
        'customerPhone',
        'customerType',
        'serviceAddress',
        'serviceType',
        'problemSummary',
        'urgency',
        'preferredWindow',
        'confirmedStartDatetime',
        'source',
        'sourceRequestId',
        'bookingTimezone',
        'sendSms',
      ],
    },
  },
  handler,
});
