import {
  createAlert as apiCreateAlert,
  deleteAlert as apiDeleteAlert,
  getAlert as apiGetAlert,
  listActiveAlerts,
  listAllAlerts,
  updateAlert as apiUpdateAlert,
} from '@draco/shared-api-client';
import type { Client } from '@draco/shared-api-client/generated/client';
import type { AlertType, UpsertAlertType, AlertListType } from '@draco/shared-schemas';
import { unwrapApiResult } from '../utils/apiResult';

const mapAlert = (alert: AlertType): AlertType => ({
  id: alert.id,
  message: alert.message,
  isActive: alert.isActive ?? true,
  createdAt: alert.createdAt,
  updatedAt: alert.updatedAt,
});

const mapList = (list: AlertListType): AlertType[] => list.alerts.map(mapAlert);

export const fetchActiveAlerts = async (
  client: Client,
  signal?: AbortSignal,
): Promise<AlertType[]> => {
  const result = await listActiveAlerts({ client, throwOnError: false, signal });
  const data = unwrapApiResult(result, 'Unable to fetch alerts');
  return mapList(data as AlertListType);
};

export const fetchAllAlerts = async (client: Client): Promise<AlertType[]> => {
  const result = await listAllAlerts({ client, throwOnError: false });
  const data = unwrapApiResult(result, 'Unable to fetch alerts');
  return mapList(data as AlertListType);
};

export const fetchAlertById = async (alertId: string, client: Client): Promise<AlertType> => {
  const result = await apiGetAlert({
    client,
    throwOnError: false,
    path: { alertId },
  });
  const data = unwrapApiResult(result, 'Unable to fetch alert');
  return mapAlert(data as AlertType);
};

export const createAlert = async (payload: UpsertAlertType, client: Client): Promise<AlertType> => {
  const result = await apiCreateAlert({
    client,
    throwOnError: false,
    body: payload,
  });
  const data = unwrapApiResult(result, 'Unable to create alert');
  return mapAlert(data as AlertType);
};

export const updateAlert = async (
  alertId: string,
  payload: UpsertAlertType,
  client: Client,
): Promise<AlertType> => {
  const result = await apiUpdateAlert({
    client,
    throwOnError: false,
    path: { alertId },
    body: payload,
  });
  const data = unwrapApiResult(result, 'Unable to update alert');
  return mapAlert(data as AlertType);
};

export const deleteAlert = async (alertId: string, client: Client): Promise<void> => {
  const result = await apiDeleteAlert({
    client,
    throwOnError: false,
    path: { alertId },
  });
  unwrapApiResult(result, 'Unable to delete alert');
};
