import { AlertType } from '@draco/shared-schemas';
import { dbAlert } from '../repositories/types/index.js';
import { DateUtils } from '../utils/dateUtils.js';

export class AlertResponseFormatter {
  static format(alert: dbAlert): AlertType {
    return {
      id: alert.id.toString(),
      message: alert.message,
      isActive: alert.isactive,
      createdAt: this.formatDate(alert.createdat),
      updatedAt: this.formatDate(alert.updatedat),
    };
  }

  static formatMany(alerts: dbAlert[]): AlertType[] {
    return alerts.map((alert) => this.format(alert));
  }

  private static formatDate(date: Date): string {
    return DateUtils.formatDateTimeForResponse(date) ?? date.toISOString();
  }
}
