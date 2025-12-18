import { FieldType } from '@draco/shared-schemas';

type AvailableFieldInput = {
  id: bigint | number | string;
  name: string;
  shortname?: string | null;
  haslights?: boolean | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zipcode?: string | null;
  comment?: string | null;
  directions?: string | null;
  rainoutnumber?: string | null;
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

  if (
    typeof value === 'object' &&
    typeof (value as { toString?: unknown }).toString === 'function'
  ) {
    const stringValue = (value as { toString(): string }).toString().trim();
    return stringValue.length > 0 ? stringValue : null;
  }

  return null;
};

const normalizeShortName = (value?: string | null): string => {
  if (value === undefined || value === null) {
    return '';
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : '';
};

const normalizeId = (value: AvailableFieldInput['id']): string => {
  if (typeof value === 'string') {
    return value;
  }

  return value.toString();
};

export const formatFieldFromAvailableField = (
  field?: AvailableFieldInput | null,
): FieldType | undefined => {
  if (!field) {
    return undefined;
  }

  return {
    id: normalizeId(field.id),
    name: field.name,
    shortName: normalizeShortName(field.shortname),
    hasLights: field.haslights === true,
    address: normalizeOptionalString(field.address ?? null),
    city: normalizeOptionalString(field.city ?? null),
    state: normalizeOptionalString(field.state ?? null),
    zip: normalizeOptionalString(field.zipcode ?? null),
    comment: normalizeOptionalString(field.comment ?? null),
    directions: normalizeOptionalString(field.directions ?? null),
    rainoutNumber: normalizeOptionalString(field.rainoutnumber ?? null),
    latitude: normalizeCoordinate(field.latitude),
    longitude: normalizeCoordinate(field.longitude),
  };
};
