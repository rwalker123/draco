import { useState } from 'react';

export interface NotificationState {
  message: string;
  severity: 'success' | 'error' | 'info' | 'warning';
}

export interface UseNotificationsReturn {
  notification: NotificationState | null;
  showNotification: (message: string, severity: NotificationState['severity']) => void;
  hideNotification: () => void;
}

/**
 * Custom hook for managing notification state
 * Provides centralized notification management to reduce code duplication
 */
export const useNotifications = (): UseNotificationsReturn => {
  const [notification, setNotification] = useState<NotificationState | null>(null);

  const showNotification = (message: string, severity: NotificationState['severity']) => {
    setNotification({ message, severity });
  };

  const hideNotification = () => {
    setNotification(null);
  };

  return {
    notification,
    showNotification,
    hideNotification,
  };
};
