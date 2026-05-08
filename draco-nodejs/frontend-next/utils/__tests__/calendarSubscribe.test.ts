import { describe, expect, it } from 'vitest';
import { buildCalendarSubscribeUrls } from '../calendarSubscribe';

const BASE_URL = 'https://api.example.com/api/calendar/team-season/abc123.ics';
const TEAM_NAME = 'Hawks';

describe('buildCalendarSubscribeUrls', () => {
  describe('google', () => {
    it('percent-encodes the icsUrl in the cid parameter', () => {
      const urls = buildCalendarSubscribeUrls(BASE_URL, TEAM_NAME);
      expect(urls.google).toContain('cid=');
      const cid = new URL(urls.google).searchParams.get('cid');
      expect(cid).toBe(BASE_URL);
    });

    it('round-trips decodeURIComponent back to original icsUrl', () => {
      const urls = buildCalendarSubscribeUrls(BASE_URL, TEAM_NAME);
      const rawCid = urls.google.split('cid=')[1];
      expect(decodeURIComponent(rawCid)).toBe(BASE_URL);
    });
  });

  describe('apple', () => {
    it('replaces https:// scheme with webcal://', () => {
      const urls = buildCalendarSubscribeUrls(BASE_URL, TEAM_NAME);
      expect(urls.apple).toMatch(/^webcal:\/\//);
      expect(urls.apple.replace('webcal://', '')).toBe(BASE_URL.replace('https://', ''));
    });

    it('replaces http:// scheme with webcal://', () => {
      const httpUrl = 'http://api.example.com/api/calendar/team-season/abc123.ics';
      const urls = buildCalendarSubscribeUrls(httpUrl, TEAM_NAME);
      expect(urls.apple).toMatch(/^webcal:\/\//);
      expect(urls.apple.replace('webcal://', '')).toBe(httpUrl.replace('http://', ''));
    });

    it('rest of URL after scheme is unchanged from input', () => {
      const urls = buildCalendarSubscribeUrls(BASE_URL, TEAM_NAME);
      const afterScheme = BASE_URL.replace(/^https?:\/\//, '');
      expect(urls.apple).toBe(`webcal://${afterScheme}`);
    });
  });

  describe('outlookCom', () => {
    it('url searchParam equals original icsUrl', () => {
      const urls = buildCalendarSubscribeUrls(BASE_URL, TEAM_NAME);
      const parsed = new URL(urls.outlookCom);
      expect(parsed.searchParams.get('url')).toBe(BASE_URL);
    });

    it('name searchParam equals original name', () => {
      const urls = buildCalendarSubscribeUrls(BASE_URL, TEAM_NAME);
      const parsed = new URL(urls.outlookCom);
      expect(parsed.searchParams.get('name')).toBe(TEAM_NAME);
    });
  });

  describe('office365', () => {
    it('url searchParam equals original icsUrl', () => {
      const urls = buildCalendarSubscribeUrls(BASE_URL, TEAM_NAME);
      const parsed = new URL(urls.office365);
      expect(parsed.searchParams.get('url')).toBe(BASE_URL);
    });

    it('name searchParam equals original name', () => {
      const urls = buildCalendarSubscribeUrls(BASE_URL, TEAM_NAME);
      const parsed = new URL(urls.office365);
      expect(parsed.searchParams.get('name')).toBe(TEAM_NAME);
    });
  });

  describe('special characters', () => {
    it('special characters in name round-trip correctly', () => {
      const specialName = 'Hawks & Eagles / División';
      const urls = buildCalendarSubscribeUrls(BASE_URL, specialName);

      const outlookParsed = new URL(urls.outlookCom);
      expect(outlookParsed.searchParams.get('name')).toBe(specialName);

      const officeParsed = new URL(urls.office365);
      expect(officeParsed.searchParams.get('name')).toBe(specialName);
    });

    it('special characters in icsUrl path do not double-encode', () => {
      const urlWithQuery =
        'https://api.example.com/api/calendar/team-season/abc%20123.ics?foo=bar&baz=qux';
      const urls = buildCalendarSubscribeUrls(urlWithQuery, TEAM_NAME);

      const outlookParsed = new URL(urls.outlookCom);
      expect(outlookParsed.searchParams.get('url')).toBe(urlWithQuery);

      const googleCid = new URL(urls.google).searchParams.get('cid');
      expect(googleCid).toBe(urlWithQuery);
    });

    it('spaces in name round-trip correctly', () => {
      const nameWithSpaces = 'Springfield Hawks 2024';
      const urls = buildCalendarSubscribeUrls(BASE_URL, nameWithSpaces);
      const parsed = new URL(urls.office365);
      expect(parsed.searchParams.get('name')).toBe(nameWithSpaces);
    });
  });

  describe('error cases', () => {
    it('throws TypeError for ftp:// URLs', () => {
      expect(() => buildCalendarSubscribeUrls('ftp://example.com/feed.ics', TEAM_NAME)).toThrow(
        TypeError,
      );
    });

    it('throws TypeError for relative paths', () => {
      expect(() =>
        buildCalendarSubscribeUrls('/api/calendar/team-season/abc.ics', TEAM_NAME),
      ).toThrow(TypeError);
    });

    it('throws TypeError for empty string', () => {
      expect(() => buildCalendarSubscribeUrls('', TEAM_NAME)).toThrow(TypeError);
    });
  });
});
