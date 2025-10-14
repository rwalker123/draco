import type { FieldType } from '@draco/shared-schemas';

type ApiFieldInput = {
  id: string | number;
  name: string;
  shortName: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  comment?: string | null;
  directions?: string | null;
  rainoutNumber?: string | null;
  latitude?: unknown;
  longitude?: unknown;
};

const normalizeOptionalString = (value?: string | null): string | null => {
  if (value === undefined || value === null) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const normalizeCoordinate = (value?: unknown): string | null => {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  if (typeof value === 'number' || typeof value === 'bigint') {
    return value.toString();
  }

  if (typeof value === 'object' && value !== null) {
    const maybeToString = (value as { toString?: () => string }).toString;
    if (typeof maybeToString === 'function') {
      const stringValue = maybeToString.call(value).trim();
      return stringValue.length > 0 ? stringValue : null;
    }
  }

  return null;
};

const normalizeIdentifier = (value: ApiFieldInput['id']): string => {
  return typeof value === 'string' ? value : value.toString();
};

export const mapApiFieldToFieldType = (
  field: ApiFieldInput | null | undefined,
): FieldType | null | undefined => {
  if (field === undefined) {
    return undefined;
  }

  if (field === null) {
    return null;
  }

  return {
    id: normalizeIdentifier(field.id),
    name: field.name,
    shortName: field.shortName,
    address: normalizeOptionalString(field.address),
    city: normalizeOptionalString(field.city),
    state: normalizeOptionalString(field.state),
    zip: normalizeOptionalString(field.zip),
    comment: normalizeOptionalString(field.comment),
    directions: normalizeOptionalString(field.directions),
    rainoutNumber: normalizeOptionalString(field.rainoutNumber),
    latitude: normalizeCoordinate(field.latitude),
    longitude: normalizeCoordinate(field.longitude),
  };
};
