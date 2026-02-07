interface MemorySnapshot {
  timestamp: number;
  route: string;
  action?: string;
  usedHeapMB: number;
  totalHeapMB: number;
  limitMB: number;
  percentUsed: number;
}

interface MemoryMetrics {
  snapshots: MemorySnapshot[];
  leaks: DetectedLeak[];
  peakUsage: number;
  currentUsage: number;
}

interface DetectedLeak {
  route: string;
  growthMB: number;
  snapshotCount: number;
  detected: number;
}

interface WindowWithMemoryData extends Window {
  __memorySnapshots?: MemorySnapshot[];
}

function sortedMedian(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

class MemoryMonitor {
  private maxSnapshots = 100;
  private storageKey = '__draco_memory_snapshots';
  private cachedLeaks: DetectedLeak[] | null = null;
  private lastSnapshotCount = 0;
  private isDirty = false;

  private get snapshots(): MemorySnapshot[] {
    if (typeof window === 'undefined') return [];
    const win = window as WindowWithMemoryData;

    if (!win.__memorySnapshots || !Array.isArray(win.__memorySnapshots)) {
      try {
        const stored = localStorage.getItem(this.storageKey);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            win.__memorySnapshots = parsed;
            return parsed;
          }
        }
      } catch (error) {
        console.warn('[MemoryMonitor] Failed to load from localStorage:', error);
      }
      win.__memorySnapshots = [];
    }
    return win.__memorySnapshots;
  }

  private set snapshots(value: MemorySnapshot[]) {
    if (typeof window === 'undefined') return;
    const win = window as WindowWithMemoryData;
    if (Array.isArray(value)) {
      win.__memorySnapshots = value;
      this.isDirty = true;
    }
  }

  private syncToStorage() {
    if (!this.isDirty || typeof window === 'undefined') return;
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.snapshots));
      this.isDirty = false;
    } catch (error) {
      console.warn('[MemoryMonitor] Failed to save to localStorage:', error);
    }
  }

  capture(route: string, action?: string): MemorySnapshot | null {
    if (typeof window === 'undefined' || !('memory' in performance)) {
      return null;
    }

    const memory = (
      performance as Performance & {
        memory?: {
          usedJSHeapSize: number;
          totalJSHeapSize: number;
          jsHeapSizeLimit: number;
        };
      }
    ).memory;

    if (!memory) {
      return null;
    }
    const snapshot: MemorySnapshot = {
      timestamp: Date.now(),
      route,
      action,
      usedHeapMB: Math.round(memory.usedJSHeapSize / 1048576),
      totalHeapMB: Math.round(memory.totalJSHeapSize / 1048576),
      limitMB: Math.round(memory.jsHeapSizeLimit / 1048576),
      percentUsed: Math.round((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100),
    };

    const currentSnapshots = this.snapshots;
    currentSnapshots.push(snapshot);

    if (currentSnapshots.length > this.maxSnapshots) {
      currentSnapshots.shift();
    }

    this.snapshots = currentSnapshots;
    this.cachedLeaks = null;
    this.syncToStorage();

    return snapshot;
  }

  detectLeaks(): DetectedLeak[] {
    if (this.cachedLeaks && this.snapshots.length === this.lastSnapshotCount) {
      return this.cachedLeaks;
    }

    const leaks: DetectedLeak[] = [];
    const routeSnapshots = new Map<string, MemorySnapshot[]>();

    this.snapshots.forEach((snap) => {
      if (!routeSnapshots.has(snap.route)) {
        routeSnapshots.set(snap.route, []);
      }
      routeSnapshots.get(snap.route)!.push(snap);
    });

    routeSnapshots.forEach((snaps, route) => {
      if (snaps.length < 4) return;

      let consecutiveGrowth = 0;
      let maxConsecutive = 0;
      for (let i = 1; i < snaps.length; i++) {
        if (snaps[i].usedHeapMB > snaps[i - 1].usedHeapMB) {
          consecutiveGrowth++;
          maxConsecutive = Math.max(maxConsecutive, consecutiveGrowth);
        } else {
          consecutiveGrowth = 0;
        }
      }

      const mid = Math.floor(snaps.length / 2);
      const firstHalf = snaps.slice(0, mid).map((s) => s.usedHeapMB);
      const secondHalf = snaps.slice(mid).map((s) => s.usedHeapMB);
      const firstMedian = sortedMedian(firstHalf);
      const secondMedian = sortedMedian(secondHalf);
      const medianGrowth = secondMedian - firstMedian;

      if (maxConsecutive >= 3 && medianGrowth > 30) {
        leaks.push({
          route,
          growthMB: medianGrowth,
          snapshotCount: snaps.length,
          detected: Date.now(),
        });
      }
    });

    this.cachedLeaks = leaks;
    this.lastSnapshotCount = this.snapshots.length;
    return leaks;
  }

  getMetrics(): MemoryMetrics {
    const usages = this.snapshots.map((s) => s.usedHeapMB);
    return {
      snapshots: this.snapshots,
      leaks: this.detectLeaks(),
      peakUsage: Math.max(...usages, 0),
      currentUsage: usages[usages.length - 1] || 0,
    };
  }

  exportData(): string {
    return JSON.stringify(this.getMetrics(), null, 2);
  }

  reset() {
    if (typeof window !== 'undefined') {
      (window as WindowWithMemoryData).__memorySnapshots = [];
      try {
        localStorage.removeItem(this.storageKey);
      } catch (error) {
        console.warn('[MemoryMonitor] Failed to clear localStorage:', error);
      }
    }
    this.cachedLeaks = null;
    this.lastSnapshotCount = 0;
  }
}

export const memoryMonitor = new MemoryMonitor();

export function captureMemory(route: string, action?: string) {
  return memoryMonitor.capture(route, action);
}

export function getMemoryMetrics() {
  return memoryMonitor.getMetrics();
}

export function exportMemoryData() {
  return memoryMonitor.exportData();
}
