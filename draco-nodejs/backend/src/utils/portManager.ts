import fs from 'node:fs';
import path from 'node:path';
import { promisify } from 'node:util';
import { exec } from 'child_process';

const execAsync = promisify(exec);

export interface PortAllocation {
  worktreePath: string;
  worktreeName: string;
  backendPort: number;
  frontendPort: number;
  lastActive: string;
  status: 'active' | 'inactive';
  envFiles: {
    backend: string;
    frontend: string;
  };
}

export interface PortRegistry {
  lastUpdated: string;
  registryVersion: string;
  worktrees: Record<string, PortAllocation>;
  portRanges: {
    backend: { min: number; max: number };
    frontend: { min: number; max: number };
  };
}

export class PortManager {
  private registryPath: string;
  private readonly BACKEND_PORT_RANGE = { min: 3001, max: 3099 };
  private readonly FRONTEND_PORT_RANGE = { min: 4001, max: 4099 };

  constructor(registryPath: string) {
    this.registryPath = registryPath;
  }

  /**
   * Generate a hash from worktree path for deterministic port calculation
   */
  private generateWorktreeHash(worktreePath: string): number {
    let hash = 0;
    for (let i = 0; i < worktreePath.length; i++) {
      const char = worktreePath.charCodeAt(i);
      hash = ((hash << 5) - hash + char) & 0xffffffff;
    }
    return Math.abs(hash);
  }

  /**
   * Calculate target ports for a worktree
   */
  private calculateTargetPorts(worktreePath: string): { backend: number; frontend: number } {
    const hash = this.generateWorktreeHash(worktreePath);
    const backendPort =
      this.BACKEND_PORT_RANGE.min +
      (hash % (this.BACKEND_PORT_RANGE.max - this.BACKEND_PORT_RANGE.min + 1));
    const frontendPort =
      this.FRONTEND_PORT_RANGE.min +
      (hash % (this.FRONTEND_PORT_RANGE.max - this.FRONTEND_PORT_RANGE.min + 1));

    return { backend: backendPort, frontend: frontendPort };
  }

  /**
   * Check if a port is available
   */
  async isPortAvailable(port: number): Promise<boolean> {
    try {
      // Use netstat to check if port is in use
      const { stdout } = await execAsync(`netstat -an | grep LISTEN | grep ":${port} "`);
      return stdout.trim() === '';
    } catch (_error) {
      // If netstat fails or port is not in use, consider it available
      return true;
    }
  }

  /**
   * Find next available port in a range
   */
  async findAvailablePort(basePort: number, maxPort: number): Promise<number> {
    for (let port = basePort; port <= maxPort; port++) {
      if (await this.isPortAvailable(port)) {
        return port;
      }
    }
    throw new Error(`No available ports in range ${basePort}-${maxPort}`);
  }

  /**
   * Load port registry from file
   */
  async loadRegistry(): Promise<PortRegistry> {
    try {
      if (!fs.existsSync(this.registryPath)) {
        return this.createDefaultRegistry();
      }

      const data = fs.readFileSync(this.registryPath, 'utf8');
      return JSON.parse(data) as PortRegistry;
    } catch (error) {
      console.warn('Failed to load port registry, creating new one:', error);
      return this.createDefaultRegistry();
    }
  }

  /**
   * Create default port registry
   */
  private createDefaultRegistry(): PortRegistry {
    return {
      lastUpdated: new Date().toISOString(),
      registryVersion: '1.0',
      worktrees: {},
      portRanges: {
        backend: this.BACKEND_PORT_RANGE,
        frontend: this.FRONTEND_PORT_RANGE,
      },
    };
  }

  /**
   * Save port registry to file
   */
  async saveRegistry(registry: PortRegistry): Promise<void> {
    try {
      const dir = path.dirname(this.registryPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      registry.lastUpdated = new Date().toISOString();
      fs.writeFileSync(this.registryPath, JSON.stringify(registry, null, 2));
    } catch (error) {
      throw new Error(`Failed to save port registry: ${error}`);
    }
  }

  /**
   * Allocate ports for a worktree
   */
  async allocatePorts(worktreePath: string): Promise<PortAllocation> {
    const registry = await this.loadRegistry();

    // Check if worktree already has ports allocated
    const existing = registry.worktrees[worktreePath];
    if (existing) {
      // Verify ports are still available
      if (
        (await this.isPortAvailable(existing.backendPort)) &&
        (await this.isPortAvailable(existing.frontendPort))
      ) {
        existing.lastActive = new Date().toISOString();
        existing.status = 'active';
        await this.saveRegistry(registry);
        return existing;
      }
    }

    // Calculate target ports
    const targetPorts = this.calculateTargetPorts(worktreePath);

    // Find available ports, starting with target ports
    const backendPort = (await this.isPortAvailable(targetPorts.backend))
      ? targetPorts.backend
      : await this.findAvailablePort(this.BACKEND_PORT_RANGE.min, this.BACKEND_PORT_RANGE.max);

    const frontendPort = (await this.isPortAvailable(targetPorts.frontend))
      ? targetPorts.frontend
      : await this.findAvailablePort(this.FRONTEND_PORT_RANGE.min, this.FRONTEND_PORT_RANGE.max);

    // Extract worktree name from path
    const worktreeName = path.basename(worktreePath);

    const allocation: PortAllocation = {
      worktreePath,
      worktreeName,
      backendPort,
      frontendPort,
      lastActive: new Date().toISOString(),
      status: 'active',
      envFiles: {
        backend: path.join(worktreePath, 'draco-nodejs/backend/.env'),
        frontend: path.join(worktreePath, 'draco-nodejs/frontend-next/.env.local'),
      },
    };

    // Update registry
    registry.worktrees[worktreePath] = allocation;
    await this.saveRegistry(registry);

    return allocation;
  }

  /**
   * Get port allocation for a worktree
   */
  async getPortAllocation(worktreePath: string): Promise<PortAllocation | null> {
    const registry = await this.loadRegistry();
    return registry.worktrees[worktreePath] || null;
  }

  /**
   * Release ports for a worktree
   */
  async releasePorts(worktreePath: string): Promise<void> {
    const registry = await this.loadRegistry();
    if (registry.worktrees[worktreePath]) {
      delete registry.worktrees[worktreePath];
      await this.saveRegistry(registry);
    }
  }

  /**
   * Clean up inactive worktrees
   */
  async cleanupInactiveWorktrees(): Promise<string[]> {
    const registry = await this.loadRegistry();
    const removed: string[] = [];
    const now = new Date();
    const inactiveThreshold = 24 * 60 * 60 * 1000; // 24 hours

    for (const [worktreePath, allocation] of Object.entries(registry.worktrees)) {
      const lastActive = new Date(allocation.lastActive);
      if (now.getTime() - lastActive.getTime() > inactiveThreshold) {
        removed.push(worktreePath);
        delete registry.worktrees[worktreePath];
      }
    }

    if (removed.length > 0) {
      await this.saveRegistry(registry);
    }

    return removed;
  }

  /**
   * Get all port allocations
   */
  async getAllPortAllocations(): Promise<PortAllocation[]> {
    const registry = await this.loadRegistry();
    return Object.values(registry.worktrees);
  }

  /**
   * Check for port conflicts
   */
  async checkPortConflicts(): Promise<Array<{ worktree: string; port: number; conflict: string }>> {
    const registry = await this.loadRegistry();
    const conflicts: Array<{ worktree: string; port: number; conflict: string }> = [];

    for (const [worktreePath, allocation] of Object.entries(registry.worktrees)) {
      // Check if ports are actually available
      if (!(await this.isPortAvailable(allocation.backendPort))) {
        conflicts.push({
          worktree: worktreePath,
          port: allocation.backendPort,
          conflict: 'Backend port not available',
        });
      }

      if (!(await this.isPortAvailable(allocation.frontendPort))) {
        conflicts.push({
          worktree: worktreePath,
          port: allocation.frontendPort,
          conflict: 'Frontend port not available',
        });
      }
    }

    return conflicts;
  }
}

// Export singleton instance
export const portManager = new PortManager(
  path.join(process.cwd(), 'draco-nodejs', '.worktree-ports.json'),
);
