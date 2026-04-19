import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FrontendRestartService } from '../frontendRestartService.js';

describe('FrontendRestartService', () => {
  const originalEnv = { ...process.env };
  let fetchMock: ReturnType<typeof vi.fn>;
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    process.env.RAILWAY_API_TOKEN = 'test-token'; // pragma: allowlist secret
    process.env.FRONTEND_SERVICE_ID = 'service-123';
    process.env.RAILWAY_ENVIRONMENT_ID = 'env-456';

    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe('restartFrontend', () => {
    it('sends a GraphQL mutation with Project-Access-Token header', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({ data: { serviceInstanceRestart: true } }),
      });

      const service = new FrontendRestartService();
      await service.restartFrontend();

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toBe('https://backboard.railway.com/graphql/v2');
      expect(init.method).toBe('POST');
      expect(init.headers['Project-Access-Token']).toBe('test-token');
      expect(init.headers['Content-Type']).toBe('application/json');

      const body = JSON.parse(init.body);
      expect(body.query).toContain('serviceInstanceRestart');
      expect(body.variables).toEqual({
        serviceId: 'service-123',
        environmentId: 'env-456',
      });
    });

    it('throws when required env vars are missing', async () => {
      delete process.env.RAILWAY_API_TOKEN;
      const service = new FrontendRestartService();

      await expect(service.restartFrontend()).rejects.toThrow(
        /RAILWAY_API_TOKEN.*FRONTEND_SERVICE_ID.*RAILWAY_ENVIRONMENT_ID/,
      );
    });

    it('throws when the API returns a non-OK response', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        text: async () => 'bad token',
      });

      const service = new FrontendRestartService();
      await expect(service.restartFrontend()).rejects.toThrow(/401.*Unauthorized.*bad token/);
    });

    it('throws when the API returns GraphQL errors', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({ errors: [{ message: 'Service not found' }] }),
      });

      const service = new FrontendRestartService();
      await expect(service.restartFrontend()).rejects.toThrow(/Service not found/);
    });
  });

  describe('start / stop', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('stays dormant when required env vars are missing', () => {
      delete process.env.FRONTEND_SERVICE_ID;
      const service = new FrontendRestartService();

      service.start();

      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('disabled'));
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('schedules a timer when config is present', () => {
      const service = new FrontendRestartService();
      service.start();

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Frontend restart scheduled'),
      );

      service.stop();
    });

    it('stop() clears the scheduled timer', () => {
      const service = new FrontendRestartService();
      service.start();
      service.stop();

      vi.runOnlyPendingTimers();
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('re-schedules after a successful restart', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({ data: { serviceInstanceRestart: true } }),
      });

      const service = new FrontendRestartService();
      service.start();

      await vi.advanceTimersByTimeAsync(25 * 60 * 60 * 1000);
      await vi.waitFor(() => expect(fetchMock).toHaveBeenCalled());

      const scheduledLogs = consoleLogSpy.mock.calls.filter((call: unknown[]) =>
        String(call[0]).includes('Frontend restart scheduled'),
      );
      expect(scheduledLogs.length).toBeGreaterThanOrEqual(2);

      service.stop();
    });

    it('schedules restart for today 03:30 when starting between 03:00 and 03:30 local time', () => {
      process.env.FRONTEND_RESTART_TIMEZONE = 'UTC';
      vi.setSystemTime(new Date('2026-04-18T03:15:00Z'));

      const service = new FrontendRestartService();
      service.start();

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Frontend restart scheduled for 2026-04-18T03:30:00.000Z'),
      );

      service.stop();
    });

    it('re-schedules even when the restart API call fails', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: async () => 'boom',
      });

      const service = new FrontendRestartService();
      service.start();

      await vi.advanceTimersByTimeAsync(25 * 60 * 60 * 1000);
      await vi.waitFor(() => expect(consoleErrorSpy).toHaveBeenCalled());

      const scheduledLogs = consoleLogSpy.mock.calls.filter((call: unknown[]) =>
        String(call[0]).includes('Frontend restart scheduled'),
      );
      expect(scheduledLogs.length).toBeGreaterThanOrEqual(2);

      service.stop();
    });
  });
});
