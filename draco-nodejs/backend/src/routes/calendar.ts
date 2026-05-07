/**
 * Public iCalendar subscription feed — intentionally no auth middleware.
 *
 * Calendar clients cannot carry bearer tokens, so the URL must be self-sufficient.
 * The season's `schedulevisible` flag is the only access-control surface: when false,
 * the endpoint returns 404 (no side-channel information about the team's existence).
 */
import { Router, Request, Response } from 'express';
import { ServiceFactory } from '../services/serviceFactory.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { NotFoundError, ValidationError } from '../utils/customErrors.js';

const router = Router();
const calendarService = ServiceFactory.getCalendarService();

const stripEtagQuotes = (value: string): string => value.replace(/^W\//, '').replace(/^"|"$/g, '');

const firstHeaderValue = (header: string | string[] | undefined): string | undefined => {
  if (header === undefined) return undefined;
  return Array.isArray(header) ? header[0] : header;
};

router.get(
  '/team-season/:teamSeasonId.ics',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const rawId = req.params['teamSeasonId'];
    const rawIdStr = Array.isArray(rawId) ? rawId[0] : rawId;

    let teamSeasonId: bigint;
    try {
      teamSeasonId = BigInt(rawIdStr);
    } catch {
      throw new ValidationError('Invalid teamSeasonId');
    }

    const fingerprint = await calendarService.getTeamSeasonCalendarFingerprint(teamSeasonId);

    if (!fingerprint) {
      throw new NotFoundError('Team season not found');
    }

    const { etag, lastModified } = fingerprint;

    const ifNoneMatch = firstHeaderValue(req.headers['if-none-match']);
    if (ifNoneMatch !== undefined) {
      const candidates = ifNoneMatch.split(',').map((v) => v.trim());
      const matches =
        candidates.includes('*') || candidates.map(stripEtagQuotes).includes(stripEtagQuotes(etag));
      if (matches) {
        res.setHeader('ETag', etag);
        res.setHeader('Last-Modified', lastModified.toUTCString());
        res.setHeader('Cache-Control', 'public, max-age=60, must-revalidate');
        res.status(304).end();
        return;
      }
    }

    const ifModifiedSince = firstHeaderValue(req.headers['if-modified-since']);
    if (ifModifiedSince !== undefined) {
      const since = new Date(ifModifiedSince);
      if (!isNaN(since.getTime()) && lastModified <= since) {
        res.setHeader('ETag', etag);
        res.setHeader('Last-Modified', lastModified.toUTCString());
        res.setHeader('Cache-Control', 'public, max-age=60, must-revalidate');
        res.status(304).end();
        return;
      }
    }

    const result = await calendarService.getTeamSeasonCalendar(teamSeasonId);

    if (!result) {
      throw new NotFoundError('Team season not found');
    }

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', `inline; filename="team-${teamSeasonId}-schedule.ics"`);
    res.setHeader('Cache-Control', 'public, max-age=60, must-revalidate');
    res.setHeader('ETag', result.etag);
    res.setHeader('Last-Modified', result.lastModified.toUTCString());
    res.status(200).send(result.body);
  }),
);

export default router;
