export interface Timezone {
  value: string;
  label: string;
  offset: string;
}

export const DEFAULT_TIMEZONE = 'UTC';

export const US_TIMEZONES: Timezone[] = [
  {
    value: 'UTC',
    label: 'Coordinated Universal Time (UTC)',
    offset: 'UTC±00:00',
  },
  {
    value: 'America/New_York',
    label: 'Eastern Time (ET)',
    offset: 'UTC-05:00/UTC-04:00',
  },
  {
    value: 'America/Chicago',
    label: 'Central Time (CT)',
    offset: 'UTC-06:00/UTC-05:00',
  },
  {
    value: 'America/Denver',
    label: 'Mountain Time (MT)',
    offset: 'UTC-07:00/UTC-06:00',
  },
  {
    value: 'America/Phoenix',
    label: 'Mountain Time - Arizona (MT)',
    offset: 'UTC-07:00',
  },
  {
    value: 'America/Los_Angeles',
    label: 'Pacific Time (PT)',
    offset: 'UTC-08:00/UTC-07:00',
  },
  {
    value: 'America/Anchorage',
    label: 'Alaska Time (AKT)',
    offset: 'UTC-09:00/UTC-08:00',
  },
  {
    value: 'America/Adak',
    label: 'Aleutian Time (HAT)',
    offset: 'UTC-10:00/UTC-09:00',
  },
  {
    value: 'Pacific/Honolulu',
    label: 'Hawaii Time (HT)',
    offset: 'UTC-10:00',
  },
  {
    value: 'America/Puerto_Rico',
    label: 'Atlantic Time (AT)',
    offset: 'UTC-04:00',
  },
  {
    value: 'Pacific/Guam',
    label: 'Chamorro Time (ChST)',
    offset: 'UTC+10:00',
  },
  {
    value: 'Pacific/Pago_Pago',
    label: 'Samoa Time (SST)',
    offset: 'UTC-11:00',
  },
];

export const getTimezoneByValue = (value: string): Timezone | undefined => {
  return US_TIMEZONES.find((tz) => tz.value === value);
};

const CANONICAL_TIMEZONE_VALUES = new Set(US_TIMEZONES.map((tz) => tz.value));

const TIMEZONE_ALIASES: Record<string, string> = {
  'America/Detroit': 'America/New_York',
  'America/Indiana/Indianapolis': 'America/New_York',
  'America/Indiana/Marengo': 'America/New_York',
  'America/Indiana/Petersburg': 'America/New_York',
  'America/Indiana/Vevay': 'America/New_York',
  'America/Indiana/Vincennes': 'America/New_York',
  'America/Indiana/Winamac': 'America/New_York',
  'America/Kentucky/Louisville': 'America/New_York',
  'America/Kentucky/Monticello': 'America/New_York',
  'America/Nipigon': 'America/New_York',
  'America/Pangnirtung': 'America/New_York',
  'America/Resolute': 'America/Chicago',
  'America/Matamoros': 'America/Chicago',
  'America/Menominee': 'America/Chicago',
  'America/North_Dakota/Beulah': 'America/Chicago',
  'America/North_Dakota/Center': 'America/Chicago',
  'America/North_Dakota/New_Salem': 'America/Chicago',
  'America/Boise': 'America/Denver',
  'America/Shiprock': 'America/Denver',
  'America/Ensenada': 'America/Los_Angeles',
  'America/Santa_Isabel': 'America/Los_Angeles',
  'America/Tijuana': 'America/Los_Angeles',
};

export const normalizeTimezone = (value: string): string | undefined => {
  if (CANONICAL_TIMEZONE_VALUES.has(value)) {
    return value;
  }

  const alias = TIMEZONE_ALIASES[value];
  if (alias && CANONICAL_TIMEZONE_VALUES.has(alias)) {
    return alias;
  }

  return undefined;
};

export const getTimezoneLabel = (value: string): string => {
  const canonicalValue = normalizeTimezone(value) ?? value;
  const timezone = getTimezoneByValue(canonicalValue);
  return timezone ? timezone.label : value;
};

export const detectUserTimezone = (): string => {
  try {
    const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (detected) {
      const normalized = normalizeTimezone(detected);
      if (normalized) {
        return normalized;
      }
    }
  } catch {
    // Ignore detection errors and fall back to default
  }

  return DEFAULT_TIMEZONE;
};
