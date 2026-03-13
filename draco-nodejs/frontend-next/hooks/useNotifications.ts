'use client';

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

export const useNotifications = (): UseNotificationsReturn => {
  const [notification, setNotification] = useState<NotificationState | null>(null);

  const [callbacks] = useState(() => ({
    showNotification: (message: string, severity: NotificationState['severity']) => {
      setNotification({ message, severity });
    },
    hideNotification: () => {
      setNotification(null);
    },
  }));

  return {
    notification,
    showNotification: callbacks.showNotification,
    hideNotification: callbacks.hideNotification,
  };
};
