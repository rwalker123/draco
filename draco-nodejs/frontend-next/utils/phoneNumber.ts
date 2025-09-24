const DIGIT_REGEX = /\D/g;

export const stripPhoneDigits = (value: string): string => value.replace(DIGIT_REGEX, '');

export const isValidPhoneNumber = (value: string | null | undefined): boolean => {
  if (!value) return true;
  const digits = stripPhoneDigits(value);
  return digits.length === 0 || digits.length === 10;
};

export const formatPhoneNumber = (phone: string | null | undefined): string => {
  if (!phone) return '';

  const digits = stripPhoneDigits(phone);

  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  if (digits.length === 11 && digits.startsWith('1')) {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }

  return phone;
};

export const formatPhoneInput = (value: string): string => {
  const digits = stripPhoneDigits(value).slice(0, 10);

  if (digits.length === 0) {
    return '';
  }

  if (digits.length < 4) {
    return digits;
  }

  if (digits.length < 7) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  }

  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
};
