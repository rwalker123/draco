import { useEffect, useRef } from 'react';
import { captureMemory } from '../utils/memoryMonitor';
import { usePathname } from 'next/navigation';

export function useMemoryProfile(componentName: string, enabled = true) {
  const pathname = usePathname();
  const mountTimeRef = useRef<number>(0);
  const mountSnapshotRef = useRef<ReturnType<typeof captureMemory>>(null);

  useEffect(() => {
    if (!enabled) return;

    mountTimeRef.current = Date.now();

    const mountSnapshot = captureMemory(pathname, `${componentName}_mount`);
    mountSnapshotRef.current = mountSnapshot;

    if (process.env.NODE_ENV === 'development' && mountSnapshot) {
      console.log(`[Memory Profile] ${componentName} mounted:`, {
        used: `${mountSnapshot.usedHeapMB}MB`,
        percent: `${mountSnapshot.percentUsed}%`,
      });
    }

    return () => {
      const unmountSnapshot = captureMemory(pathname, `${componentName}_unmount`);
      const mountTime = mountTimeRef.current;

      if (process.env.NODE_ENV === 'development' && mountSnapshotRef.current && unmountSnapshot) {
        const delta = unmountSnapshot.usedHeapMB - mountSnapshotRef.current.usedHeapMB;
        console.log(`[Memory Profile] ${componentName} unmounted:`, {
          delta: `${delta > 0 ? '+' : ''}${delta}MB`,
          lifetime: `${Date.now() - mountTime}ms`,
        });
      }
    };
  }, [componentName, enabled, pathname]);
}
