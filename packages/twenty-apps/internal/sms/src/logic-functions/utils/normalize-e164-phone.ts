const E164_MAX_DIGITS = 15;

export const normalizeE164Phone = (
  value: string,
  defaultCountry?: 'US',
): string | null => {
  const trimmedValue = value.trim();
  const digits = trimmedValue.replace(/[^0-9]/g, '');

  if (digits.length === 0 || digits.length > E164_MAX_DIGITS) {
    return null;
  }

  if (trimmedValue.startsWith('+')) {
    return digits.startsWith('0') ? null : `+${digits}`;
  }

  if (defaultCountry === 'US') {
    if (digits.length === 10) {
      return `+1${digits}`;
    }

    if (digits.length === 11 && digits.startsWith('1')) {
      return `+${digits}`;
    }
  }

  return null;
};
