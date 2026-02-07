'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { captureMemory, getMemoryMetrics } from '../utils/memoryMonitor';

export function MemoryTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (
      process.env.NODE_ENV === 'development' ||
      process.env.NEXT_PUBLIC_ENABLE_MEMORY_TRACKING === 'true'
    ) {
      captureMemory(pathname, 'route_change');

      if (process.env.NODE_ENV === 'development') {
        const metrics = getMemoryMetrics();
        console.log(`[Memory] ${pathname}:`, {
          current: `${metrics.currentUsage}MB`,
          peak: `${metrics.peakUsage}MB`,
          leaks: metrics.leaks.length,
        });
      }
    }
  }, [pathname]);

  return null;
}
