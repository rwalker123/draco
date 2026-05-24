export interface CalendarSubscribeUrls {
  google: string;
  apple: string;
  outlookCom: string;
  office365: string;
}

export function buildCalendarSubscribeUrls(icsUrl: string, name: string): CalendarSubscribeUrls {
  if (!icsUrl.startsWith('http://') && !icsUrl.startsWith('https://')) {
    throw new TypeError(`icsUrl must start with http:// or https://, got: ${icsUrl}`);
  }

  const webcalUrl = icsUrl.replace(/^https?:\/\//, 'webcal://');
  const encodedUrl = encodeURIComponent(icsUrl);
  const encodedWebcalUrl = encodeURIComponent(webcalUrl);
  const encodedName = encodeURIComponent(name);

  return {
    google: `https://calendar.google.com/calendar/r?cid=${encodedWebcalUrl}`,
    apple: webcalUrl,
    outlookCom: `https://outlook.live.com/calendar/0/addfromweb?url=${encodedUrl}&name=${encodedName}`,
    office365: `https://outlook.office.com/calendar/0/addfromweb?url=${encodedUrl}&name=${encodedName}`,
  };
}
