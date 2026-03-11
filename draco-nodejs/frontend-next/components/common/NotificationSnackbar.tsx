import { Alert, Snackbar } from '@mui/material';
import type { NotificationState } from '../../hooks/useNotifications';

interface NotificationSnackbarProps {
  notification: NotificationState | null;
  onClose: () => void;
}

const NotificationSnackbar: React.FC<NotificationSnackbarProps> = ({ notification, onClose }) => (
  <Snackbar
    open={!!notification}
    autoHideDuration={6000}
    onClose={onClose}
    anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
  >
    {notification ? (
      <Alert
        onClose={onClose}
        severity={notification.severity}
        variant="filled"
        sx={{ width: '100%' }}
      >
        {notification.message}
      </Alert>
    ) : undefined}
  </Snackbar>
);

export default NotificationSnackbar;
