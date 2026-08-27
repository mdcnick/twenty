import { readLocalDateTime } from '../../migration/normalization';

import type {
  SubmitHvacAppointmentInput,
} from './hvac-booking.types';

export class HvacBookingError extends Error {
  constructor(code: string) {
    super(code);
    this.name = 'HvacBookingError';
  }
}

export const normalizePhone = (value: string): string | null => {
  const digits = value.replace(/\D/g, '');

  if (digits.length === 10) {
    return `+1${digits}`;
  }

  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`;
  }

  if (value.trim().startsWith('+') && digits.length >= 8 && digits.length <= 15) {
    return `+${digits}`;
  }

  return null;
};
const normalizedText = (value: string): string =>
  value.trim().replace(/\s+/g, ' ').toLowerCase();

export const namesMatch = (
  firstName: string,
  lastName: string,
  fullName: string,
): boolean =>
  normalizedText(`${firstName} ${lastName}`) === normalizedText(fullName);

export const companyNamesMatch = (left: string, right: string): boolean =>
  normalizedText(left) === normalizedText(right);

export const parsePersonName = (
  fullName: string,
): { firstName: string; lastName: string } => {
  const parts = fullName.trim().replace(/\s+/g, ' ').split(' ');

  if (parts.length < 2) {
    throw new HvacBookingError('HVAC_CUSTOMER_NAME_INVALID');
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' '),
  };
};

type ServiceClassification = {
  serviceCode: string;
  systemType: string;
  workIntent: string;
  label: string;
};

const SERVICE_CLASSIFICATIONS: Array<{
  keywords: string[];
  value: ServiceClassification;
}> = [
  {
    keywords: ['cooling', 'ac', 'a/c', 'air conditioning', 'no cooling'],
    value: {
      serviceCode: 'ac_repair',
      systemType: 'air_conditioner',
      workIntent: 'repair',
      label: 'Air conditioning repair',
    },
  },
  {
    keywords: ['heating', 'heat', 'furnace', 'no heat'],
    value: {
      serviceCode: 'furnace_repair',
      systemType: 'furnace',
      workIntent: 'repair',
      label: 'Furnace repair',
    },
  },
  {
    keywords: ['boiler'],
    value: {
      serviceCode: 'boiler_repair',
      systemType: 'boiler',
      workIntent: 'repair',
      label: 'Boiler repair',
    },
  },
  {
    keywords: ['maintenance', 'tune-up', 'tune up', 'checkup'],
    value: {
      serviceCode: 'hvac_maintenance',
      systemType: 'hvac',
      workIntent: 'maintenance',
      label: 'HVAC maintenance',
    },
  },
  {
    keywords: ['install', 'installation', 'replacement', 'estimate'],
    value: {
      serviceCode: 'hvac_install_estimate',
      systemType: 'hvac',
      workIntent: 'estimate',
      label: 'HVAC installation estimate',
    },
  },
  {
    keywords: ['indoor air', 'air quality', 'iaq', 'duct'],
    value: {
      serviceCode: 'indoor_air_quality',
      systemType: 'indoor_air_quality',
      workIntent: 'assessment',
      label: 'Indoor air quality',
    },
  },
  {
    keywords: ['commercial'],
    value: {
      serviceCode: 'commercial_hvac',
      systemType: 'commercial_hvac',
      workIntent: 'diagnostic',
      label: 'Commercial HVAC',
    },
  },
];

export const classifyService = (
  serviceType: string,
  problemSummary: string,
): ServiceClassification => {
  const normalizedServiceType = normalizedText(serviceType);
  const exactMatches = SERVICE_CLASSIFICATIONS.filter(({ keywords }) =>
    keywords.some((keyword) => normalizedServiceType === keyword),
  );

  if (exactMatches.length === 1) {
    return exactMatches[0].value;
  }

  const searchText = normalizedText(`${serviceType} ${problemSummary}`);
  const inferredMatches = SERVICE_CLASSIFICATIONS.filter(({ keywords }) =>
    keywords.some((keyword) => searchText.includes(keyword)),
  );

  if (inferredMatches.length !== 1) {
    throw new HvacBookingError('HVAC_SERVICE_AMBIGUOUS');
  }

  return inferredMatches[0].value;
};

export const normalizeUrgency = (value: string): string => {
  const urgency = normalizedText(value);

  if (urgency.includes('emergency')) {
    return 'emergency';
  }

  if (['same day', 'urgent', 'soon'].some((term) => urgency.includes(term))) {
    return 'urgent';
  }

  return 'routine';
};

export const validateSubmission = (
  input: SubmitHvacAppointmentInput,
): {
  customerPhone: string;
  startAt: string;
  endAt: string;
  service: ServiceClassification;
} => {
  const requiredTextValues = [
    input.customerName,
    input.serviceAddress,
    input.serviceType,
    input.problemSummary,
    input.urgency,
    input.preferredWindow,
    input.source,
    input.sourceRequestId,
  ];

  if (requiredTextValues.some((value) => !value.trim())) {
    throw new HvacBookingError('HVAC_INPUT_INVALID');
  }

  if (!['resident', 'business'].includes(input.customerType)) {
    throw new HvacBookingError('HVAC_CUSTOMER_TYPE_INVALID');
  }

  if (input.customerType === 'business' && !input.companyName?.trim()) {
    throw new HvacBookingError('HVAC_COMPANY_NAME_REQUIRED');
  }

  if (input.bookingTimezone !== 'America/Chicago') {
    throw new HvacBookingError('HVAC_TIMEZONE_INVALID');
  }

  const customerPhone = normalizePhone(input.customerPhone);

  if (customerPhone === null) {
    throw new HvacBookingError('HVAC_PHONE_INVALID');
  }

  parsePersonName(input.customerName);

  const startResult = readLocalDateTime(
    input.confirmedStartDatetime,
    input.bookingTimezone,
  );

  if (startResult.status !== 'valid') {
    throw new HvacBookingError('HVAC_START_DATETIME_INVALID');
  }

  const startAt = startResult.value;
  const endAt = new Date(Date.parse(startAt) + 2 * 60 * 60 * 1_000).toISOString();

  return {
    customerPhone,
    startAt,
    endAt,
    service: classifyService(input.serviceType, input.problemSummary),
  };
};
