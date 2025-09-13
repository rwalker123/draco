export interface Timezone {
  value: string;
  label: string;
  offset: string;
}

export const US_TIMEZONES: Timezone[] = [
  {
    value: 'Eastern Standard Time',
    label: 'Eastern Time (ET)',
    offset: 'UTC-5/UTC-4',
  },
  {
    value: 'Central Standard Time',
    label: 'Central Time (CT)',
    offset: 'UTC-6/UTC-5',
  },
  {
    value: 'Mountain Standard Time',
    label: 'Mountain Time (MT)',
    offset: 'UTC-7/UTC-6',
  },
  {
    value: 'US Mountain Standard Time',
    label: 'Mountain Time - Arizona (MT)',
    offset: 'UTC-7',
  },
  {
    value: 'Pacific Standard Time',
    label: 'Pacific Time (PT)',
    offset: 'UTC-8/UTC-7',
  },
  {
    value: 'Alaskan Standard Time',
    label: 'Alaska Time (AKT)',
    offset: 'UTC-9/UTC-8',
  },
  {
    value: 'Hawaiian Standard Time',
    label: 'Hawaii Time (HT)',
    offset: 'UTC-10',
  },
  {
    value: 'US Eastern Standard Time',
    label: 'Eastern Time - Indiana (ET)',
    offset: 'UTC-5/UTC-4',
  },
  {
    value: 'Eastern Standard Time',
    label: 'Eastern Time - Michigan (ET)',
    offset: 'UTC-5/UTC-4',
  },
  {
    value: 'Eastern Standard Time',
    label: 'Eastern Time - Kentucky (ET)',
    offset: 'UTC-5/UTC-4',
  },
  {
    value: 'Central Standard Time',
    label: 'Central Time - Illinois (CT)',
    offset: 'UTC-6/UTC-5',
  },
  {
    value: 'Central Standard Time',
    label: 'Central Time - Indiana (CT)',
    offset: 'UTC-6/UTC-5',
  },
  {
    value: 'Central Standard Time',
    label: 'Central Time - Michigan (CT)',
    offset: 'UTC-6/UTC-5',
  },
  {
    value: 'Central Standard Time',
    label: 'Central Time - North Dakota (CT)',
    offset: 'UTC-6/UTC-5',
  },
  {
    value: 'Mountain Standard Time',
    label: 'Mountain Time - Colorado (MT)',
    offset: 'UTC-7/UTC-6',
  },
  {
    value: 'Mountain Standard Time',
    label: 'Mountain Time - Idaho (MT)',
    offset: 'UTC-7/UTC-6',
  },
  {
    value: 'US Mountain Standard Time',
    label: 'Mountain Time - Arizona (MT)',
    offset: 'UTC-7',
  },
  {
    value: 'Pacific Standard Time',
    label: 'Pacific Time - California (PT)',
    offset: 'UTC-8/UTC-7',
  },
  {
    value: 'Pacific Standard Time',
    label: 'Pacific Time - Washington (PT)',
    offset: 'UTC-8/UTC-7',
  },
  {
    value: 'Pacific Standard Time',
    label: 'Pacific Time - Oregon (PT)',
    offset: 'UTC-8/UTC-7',
  },
  {
    value: 'Alaskan Standard Time',
    label: 'Alaska Time - Alaska (AKT)',
    offset: 'UTC-9/UTC-8',
  },
  {
    value: 'Aleutian Standard Time',
    label: 'Aleutian Time (HAT)',
    offset: 'UTC-10/UTC-9',
  },
  {
    value: 'Hawaiian Standard Time',
    label: 'Hawaii Time - Hawaii (HT)',
    offset: 'UTC-10',
  },
  {
    value: 'Atlantic Standard Time',
    label: 'Atlantic Time - Puerto Rico (AT)',
    offset: 'UTC-4',
  },
  {
    value: 'Atlantic Standard Time',
    label: 'Atlantic Time - U.S. Virgin Islands (AT)',
    offset: 'UTC-4',
  },
  {
    value: 'Chamorro Standard Time',
    label: 'Chamorro Time - Guam (ChST)',
    offset: 'UTC+10',
  },
  {
    value: 'Chamorro Standard Time',
    label: 'Chamorro Time - Northern Mariana Islands (ChST)',
    offset: 'UTC+10',
  },
  {
    value: 'Samoa Standard Time',
    label: 'Samoa Time - American Samoa (SST)',
    offset: 'UTC-11',
  },
];

export const getTimezoneByValue = (value: string): Timezone | undefined => {
  return US_TIMEZONES.find((tz) => tz.value === value);
};

export const getTimezoneLabel = (value: string): string => {
  const timezone = getTimezoneByValue(value);
  return timezone ? timezone.label : value;
};
