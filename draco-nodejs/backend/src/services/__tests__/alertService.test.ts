import { describe, it, expect, beforeEach } from 'vitest';
import { AlertService } from '../alertService.js';
import { type IAlertRepository, type dbAlert } from '../../repositories/index.js';
import { NotFoundError } from '../../utils/customErrors.js';
import { DateUtils } from '../../utils/dateUtils.js';

describe('AlertService', () => {
  let alerts: dbAlert[];
  let nextId: bigint;
  let repository: IAlertRepository;
  let service: AlertService;

  beforeEach(() => {
    nextId = 3n;
    alerts = [
      {
        id: 1n,
        message: 'Active alert',
        isactive: true,
        createdat: new Date('2024-01-01T00:00:00Z'),
        updatedat: new Date('2024-01-02T00:00:00Z'),
      },
      {
        id: 2n,
        message: 'Inactive alert',
        isactive: false,
        createdat: new Date('2024-02-01T00:00:00Z'),
        updatedat: new Date('2024-02-02T00:00:00Z'),
      },
    ];

    repository = {
      async listActiveAlerts(): Promise<dbAlert[]> {
        return alerts.filter((alert) => alert.isactive);
      },
      async listAlerts(): Promise<dbAlert[]> {
        return [...alerts];
      },
      async findById(alertId: bigint): Promise<dbAlert | null> {
        return alerts.find((alert) => alert.id === alertId) ?? null;
      },
      async createAlert(data): Promise<dbAlert> {
        const created: dbAlert = {
          id: nextId,
          message: (data.message as string) ?? '',
          isactive: (data.isactive as boolean | undefined) ?? true,
          createdat: new Date(),
          updatedat: new Date(),
        };
        nextId += 1n;
        alerts.push(created);
        return created;
      },
      async updateAlert(alertId: bigint, data): Promise<dbAlert> {
        const index = alerts.findIndex((alert) => alert.id === alertId);
        if (index === -1) {
          throw new NotFoundError('Alert not found');
        }
        const current = alerts[index];
        const updated: dbAlert = {
          id: current.id,
          message: (data.message as string | undefined) ?? current.message,
          isactive: (data.isactive as boolean | undefined) ?? current.isactive,
          createdat: current.createdat,
          updatedat: new Date(),
        };
        alerts[index] = updated;
        return updated;
      },
      async deleteAlert(alertId: bigint): Promise<void> {
        const index = alerts.findIndex((alert) => alert.id === alertId);
        if (index === -1) {
          throw new NotFoundError('Alert not found');
        }
        alerts.splice(index, 1);
      },
    };

    service = new AlertService(repository);
  });

  it('returns active alerts with formatted fields', async () => {
    const result = await service.listActiveAlerts();

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: '1',
      message: 'Active alert',
      isActive: true,
    });
    expect(result[0].createdAt).toBe(DateUtils.formatDateTimeForResponse(alerts[0].createdat));
  });

  it('creates alert with trimmed message and default active flag', async () => {
    const created = await service.createAlert({ message: '  New alert  ', isActive: true });

    expect(created).toMatchObject({
      id: '3',
      message: 'New alert',
      isActive: true,
    });
  });

  it('updates alert message', async () => {
    const updated = await service.updateAlert(1n, { message: 'Updated', isActive: true });

    expect(updated.message).toBe('Updated');
  });

  it('throws NotFoundError when alert missing', async () => {
    await expect(service.getAlert(999n)).rejects.toBeInstanceOf(NotFoundError);
    await expect(
      service.updateAlert(999n, { message: 'x', isActive: true }),
    ).rejects.toBeInstanceOf(NotFoundError);
    await expect(service.deleteAlert(999n)).rejects.toBeInstanceOf(NotFoundError);
  });
});
