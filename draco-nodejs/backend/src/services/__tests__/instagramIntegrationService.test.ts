import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { InstagramIntegrationService } from '../instagramIntegrationService.js';
import * as fetchJsonModule from '../../utils/fetchJson.js';
import { ValidationError } from '../../utils/customErrors.js';

describe('InstagramIntegrationService.waitForMediaContainerReady', () => {
  const accessToken = 'test-token';
  const creationId = '123';
  let service: InstagramIntegrationService;
  let fetchJsonSpy: ReturnType<typeof vi.spyOn>;
  let delaySpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    service = new InstagramIntegrationService();
    fetchJsonSpy = vi.spyOn(fetchJsonModule, 'fetchJson');
    delaySpy = vi
      .spyOn(service as unknown as { delay: (ms: number) => Promise<void> }, 'delay')
      .mockResolvedValue();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns when status is FINISHED immediately', async () => {
    fetchJsonSpy.mockResolvedValue({ status_code: 'FINISHED' });

    await service['waitForMediaContainerReady'](creationId, accessToken);

    expect(fetchJsonSpy).toHaveBeenCalledTimes(1);
  });

  it('throws when status is ERROR and includes message', async () => {
    fetchJsonSpy.mockResolvedValue({
      status_code: 'ERROR',
      error_message: 'bad thing',
    });

    await expect(service['waitForMediaContainerReady'](creationId, accessToken)).rejects.toThrow(
      new ValidationError('bad thing'),
    );
  });

  it('retries until FINISHED with backoff', async () => {
    fetchJsonSpy
      .mockResolvedValueOnce({ status_code: 'IN_PROGRESS' })
      .mockResolvedValueOnce({ status_code: 'FINISHED' });

    await service['waitForMediaContainerReady'](creationId, accessToken);

    expect(fetchJsonSpy).toHaveBeenCalledTimes(2);
    expect(delaySpy).toHaveBeenCalledWith(700);
  });

  it('fails after max attempts without FINISHED', async () => {
    fetchJsonSpy.mockResolvedValue({ status_code: 'PROCESSING' });

    await expect(service['waitForMediaContainerReady'](creationId, accessToken)).rejects.toThrow(
      ValidationError,
    );
    expect(fetchJsonSpy).toHaveBeenCalledTimes(6);
  });

  it('throws when status code is missing', async () => {
    fetchJsonSpy.mockResolvedValue({});

    await expect(service['waitForMediaContainerReady'](creationId, accessToken)).rejects.toThrow(
      ValidationError,
    );
  });
});
