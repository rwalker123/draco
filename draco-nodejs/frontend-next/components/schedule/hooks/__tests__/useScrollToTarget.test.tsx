import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import { useScrollToTarget } from '../useScrollToTarget';

interface HarnessProps {
  targetKey: string | null | undefined;
  ready?: boolean;
  trigger?: number;
}

function Harness({ targetKey, ready, trigger }: HarnessProps) {
  const ref = useScrollToTarget<HTMLDivElement>(targetKey, {
    ready,
    trigger,
    behavior: 'auto',
  });
  return <div ref={ref} data-testid="target" />;
}

describe('useScrollToTarget', () => {
  let scrollSpy: ReturnType<typeof vi.fn<(arg?: boolean | ScrollIntoViewOptions) => void>>;
  const originalScrollIntoView = Element.prototype.scrollIntoView;

  beforeEach(() => {
    scrollSpy = vi.fn<(arg?: boolean | ScrollIntoViewOptions) => void>();
    Element.prototype.scrollIntoView = function scrollIntoView(
      arg?: boolean | ScrollIntoViewOptions,
    ) {
      scrollSpy(arg);
    };
  });

  afterEach(() => {
    Element.prototype.scrollIntoView = originalScrollIntoView;
    vi.restoreAllMocks();
  });

  it('does not scroll while not ready, then scrolls once ready becomes true', () => {
    const { rerender } = render(<Harness targetKey="2026-06-13" ready={false} trigger={0} />);
    expect(scrollSpy).not.toHaveBeenCalled();

    rerender(<Harness targetKey="2026-06-13" ready={true} trigger={0} />);
    expect(scrollSpy).toHaveBeenCalledTimes(1);
  });

  it('does not scroll when there is no target key', () => {
    const { rerender } = render(<Harness targetKey={null} ready={true} trigger={0} />);
    expect(scrollSpy).not.toHaveBeenCalled();

    rerender(<Harness targetKey={undefined} ready={true} trigger={0} />);
    expect(scrollSpy).not.toHaveBeenCalled();
  });

  it('scrolls only once for an unchanged key and trigger across re-renders', () => {
    const { rerender } = render(<Harness targetKey="2026-06-13" ready={true} trigger={0} />);
    expect(scrollSpy).toHaveBeenCalledTimes(1);

    rerender(<Harness targetKey="2026-06-13" ready={true} trigger={0} />);
    rerender(<Harness targetKey="2026-06-13" ready={true} trigger={0} />);
    expect(scrollSpy).toHaveBeenCalledTimes(1);
  });

  it('re-scrolls when the trigger changes (e.g. Today button) even with the same key', () => {
    const { rerender } = render(<Harness targetKey="2026-06-13" ready={true} trigger={0} />);
    expect(scrollSpy).toHaveBeenCalledTimes(1);

    rerender(<Harness targetKey="2026-06-13" ready={true} trigger={1} />);
    expect(scrollSpy).toHaveBeenCalledTimes(2);
  });

  it('re-scrolls when the target key changes', () => {
    const { rerender } = render(<Harness targetKey="2026-06-13" ready={true} trigger={0} />);
    expect(scrollSpy).toHaveBeenCalledTimes(1);

    rerender(<Harness targetKey="2026-06-20" ready={true} trigger={0} />);
    expect(scrollSpy).toHaveBeenCalledTimes(2);
  });

  it('does not scroll when target transitions to null and back to a previously scrolled key', () => {
    const { rerender } = render(<Harness targetKey="2026-06-13" ready={true} trigger={0} />);
    expect(scrollSpy).toHaveBeenCalledTimes(1);

    rerender(<Harness targetKey={null} ready={true} trigger={0} />);
    rerender(<Harness targetKey="2026-06-13" ready={true} trigger={0} />);
    expect(scrollSpy).toHaveBeenCalledTimes(1);
  });
});
