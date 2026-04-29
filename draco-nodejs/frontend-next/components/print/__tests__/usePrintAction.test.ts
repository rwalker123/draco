import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockPrint = vi.fn();
const afterprintListeners: Array<() => void> = [];

const mockWindow = {
  print: mockPrint,
  addEventListener: vi.fn((event: string, listener: () => void) => {
    if (event === 'afterprint') afterprintListeners.push(listener);
  }),
  removeEventListener: vi.fn((event: string, listener: () => void) => {
    if (event === 'afterprint') {
      const idx = afterprintListeners.indexOf(listener);
      if (idx !== -1) afterprintListeners.splice(idx, 1);
    }
  }),
};

function fireAfterprint() {
  const listeners = [...afterprintListeners];
  listeners.forEach((fn) => fn());
}

describe('usePrintAction / triggerPrint', () => {
  let originalWindow: typeof globalThis.window;
  let originalDocument: typeof globalThis.document;

  beforeEach(async () => {
    vi.resetModules();
    mockPrint.mockReset();
    (mockWindow.addEventListener as ReturnType<typeof vi.fn>).mockClear();
    (mockWindow.removeEventListener as ReturnType<typeof vi.fn>).mockClear();
    afterprintListeners.length = 0;

    originalWindow = globalThis.window;
    originalDocument = globalThis.document;

    Object.defineProperty(globalThis, 'window', {
      value: mockWindow,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(globalThis, 'document', {
      value: { title: 'Page Title | My Site' },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(globalThis, 'window', {
      value: originalWindow,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(globalThis, 'document', {
      value: originalDocument,
      writable: true,
      configurable: true,
    });
  });

  it('strips the " | " suffix from document.title before printing', async () => {
    const { default: usePrintAction } = await import('../usePrintAction.js');
    const { triggerPrint } = usePrintAction();

    triggerPrint();

    expect(document.title).toBe('Page Title');
    expect(mockPrint).toHaveBeenCalledOnce();
  });

  it('restores the original title after afterprint fires', async () => {
    const { default: usePrintAction } = await import('../usePrintAction.js');
    const { triggerPrint } = usePrintAction();

    triggerPrint();
    expect(document.title).toBe('Page Title');

    fireAfterprint();

    expect(document.title).toBe('Page Title | My Site');
  });

  it('does not corrupt savedTitle on rapid double-click (idempotent)', async () => {
    const { default: usePrintAction } = await import('../usePrintAction.js');
    const { triggerPrint } = usePrintAction();

    triggerPrint();
    triggerPrint();

    expect(mockPrint).toHaveBeenCalledTimes(2);
    expect(mockWindow.addEventListener).toHaveBeenCalledTimes(1);

    fireAfterprint();

    expect(document.title).toBe('Page Title | My Site');
  });

  it('does not strip title when there is no " | " separator', async () => {
    document.title = 'Plain Title';

    const { default: usePrintAction } = await import('../usePrintAction.js');
    const { triggerPrint } = usePrintAction();

    triggerPrint();

    expect(document.title).toBe('Plain Title');
    expect(mockPrint).toHaveBeenCalledOnce();

    fireAfterprint();

    expect(document.title).toBe('Plain Title');
  });

  it('is SSR-safe: does not throw when window is undefined', async () => {
    Object.defineProperty(globalThis, 'window', {
      value: undefined,
      writable: true,
      configurable: true,
    });

    const { default: usePrintAction } = await import('../usePrintAction.js');
    const { triggerPrint } = usePrintAction();

    expect(() => triggerPrint()).not.toThrow();
    expect(mockPrint).not.toHaveBeenCalled();
  });
});
