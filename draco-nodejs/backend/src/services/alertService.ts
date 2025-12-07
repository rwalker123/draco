import { AlertType, UpsertAlertType } from '@draco/shared-schemas';
import { IAlertRepository, RepositoryFactory, dbAlert } from '../repositories/index.js';
import { AlertResponseFormatter } from '../responseFormatters/index.js';
import { NotFoundError } from '../utils/customErrors.js';

export class AlertService {
  private readonly alertRepository: IAlertRepository;

  constructor(alertRepository?: IAlertRepository) {
    this.alertRepository = alertRepository ?? RepositoryFactory.getAlertRepository();
  }

  async listActiveAlerts(): Promise<AlertType[]> {
    const alerts = await this.alertRepository.listActiveAlerts();
    return AlertResponseFormatter.formatMany(alerts);
  }

  async listAlerts(): Promise<AlertType[]> {
    const alerts = await this.alertRepository.listAlerts();
    return AlertResponseFormatter.formatMany(alerts);
  }

  async getAlert(alertId: bigint): Promise<AlertType> {
    const alert = await this.requireAlert(alertId);
    return AlertResponseFormatter.format(alert);
  }

  async createAlert(payload: UpsertAlertType): Promise<AlertType> {
    const normalized = this.normalizePayload(payload);

    const created = await this.alertRepository.createAlert({
      message: normalized.message,
      isactive: normalized.isActive,
    });

    const alert = await this.requireAlert(created.id);
    return AlertResponseFormatter.format(alert);
  }

  async updateAlert(alertId: bigint, payload: UpsertAlertType): Promise<AlertType> {
    await this.requireAlert(alertId);
    const normalized = this.normalizePayload(payload);

    await this.alertRepository.updateAlert(alertId, {
      message: normalized.message,
      isactive: normalized.isActive,
    });

    const updated = await this.requireAlert(alertId);
    return AlertResponseFormatter.format(updated);
  }

  async deleteAlert(alertId: bigint): Promise<void> {
    await this.requireAlert(alertId);
    await this.alertRepository.deleteAlert(alertId);
  }

  private normalizePayload(payload: UpsertAlertType) {
    return {
      message: payload.message.trim(),
      isActive: payload.isActive,
    };
  }

  private async requireAlert(alertId: bigint): Promise<dbAlert> {
    const alert = await this.alertRepository.findById(alertId);

    if (!alert) {
      throw new NotFoundError('Alert not found');
    }

    return alert;
  }
}
