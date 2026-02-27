import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFileUpload } from '../useFileUpload';

vi.mock('../../../../../utils/fileValidation', () => ({
  validateFilesSecure: vi.fn().mockResolvedValue({ securityRisks: [] }),
}));

function createMockFile(name: string, size = 1024, type = 'text/plain'): File {
  const content = new Array(size).fill('a').join('');
  return new File([content], name, { type });
}

const PERMISSIVE_CONFIG = {
  maxFileSize: 100 * 1024 * 1024,
  maxFiles: 100,
  allowedTypes: ['text/plain'],
};

describe('useFileUpload', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:mock'),
      revokeObjectURL: vi.fn(),
    });
  });

  it('uploads all files successfully', async () => {
    const onUploadComplete = vi.fn();
    const { result } = renderHook(() =>
      useFileUpload({
        config: PERMISSIVE_CONFIG,
        maxConcurrentUploads: 2,
        onUploadComplete,
      }),
    );

    const files = [createMockFile('a.txt'), createMockFile('b.txt'), createMockFile('c.txt')];

    await act(async () => {
      await result.current.addFiles(files);
    });

    expect(onUploadComplete).toHaveBeenCalledOnce();
    expect(result.current.attachments).toHaveLength(3);
    expect(result.current.attachments.every((a) => a.status === 'uploaded')).toBe(true);
    expect(result.current.isUploading).toBe(false);
  });

  it('respects maxConcurrentUploads limit', async () => {
    let peakConcurrency = 0;
    let activeConcurrency = 0;
    const originalSetTimeout = globalThis.setTimeout;

    vi.stubGlobal('setTimeout', (fn: () => void, ms?: number) => {
      activeConcurrency++;
      peakConcurrency = Math.max(peakConcurrency, activeConcurrency);
      return originalSetTimeout(() => {
        activeConcurrency--;
        fn();
      }, ms);
    });

    const { result } = renderHook(() =>
      useFileUpload({
        config: PERMISSIVE_CONFIG,
        maxConcurrentUploads: 2,
      }),
    );

    const files = Array.from({ length: 6 }, (_, i) => createMockFile(`file${i}.txt`));

    await act(async () => {
      await result.current.addFiles(files);
    });

    expect(peakConcurrency).toBeLessThanOrEqual(2);
    expect(result.current.attachments).toHaveLength(6);
    expect(result.current.attachments.every((a) => a.status === 'uploaded')).toBe(true);

    vi.stubGlobal('setTimeout', originalSetTimeout);
  });

  it('handles fewer files than maxConcurrentUploads', async () => {
    const { result } = renderHook(() =>
      useFileUpload({
        config: PERMISSIVE_CONFIG,
        maxConcurrentUploads: 5,
      }),
    );

    const files = [createMockFile('only.txt')];

    await act(async () => {
      await result.current.addFiles(files);
    });

    expect(result.current.attachments).toHaveLength(1);
    expect(result.current.attachments[0].status).toBe('uploaded');
  });

  it('handles empty file array', async () => {
    const onUploadStart = vi.fn();
    const { result } = renderHook(() =>
      useFileUpload({
        config: PERMISSIVE_CONFIG,
        onUploadStart,
      }),
    );

    await act(async () => {
      await result.current.addFiles([]);
    });

    expect(onUploadStart).not.toHaveBeenCalled();
    expect(result.current.attachments).toHaveLength(0);
  });

  it('sets isUploading during upload and clears after', async () => {
    const { result } = renderHook(() => useFileUpload({ config: PERMISSIVE_CONFIG }));

    expect(result.current.isUploading).toBe(false);

    await act(async () => {
      await result.current.addFiles([createMockFile('test.txt')]);
    });

    expect(result.current.isUploading).toBe(false);
    expect(result.current.attachments[0].status).toBe('uploaded');
  });
});
