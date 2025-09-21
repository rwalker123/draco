import React from 'react';
import {
  Typography,
  Paper,
  Card,
  CardContent,
  CardActions,
  Button,
  List,
  ListItem,
  ListItemText,
  Stack,
  Alert,
} from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import { useRole } from '../../context/RoleContext';

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const { userRoles, hasRole } = useRole();

  // Check if user has admin role
  if (!hasRole('Administrator')) {
    return (
      <main className="min-h-screen bg-background">
        <Alert severity="error" sx={{ mt: 2 }}>
          You do not have administrator privileges to access this page.
        </Alert>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <Typography variant="h4" gutterBottom>
        Administrator Dashboard
      </Typography>

      <Stack spacing={3}>
        {/* User Info */}
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Current User
          </Typography>
          <List dense>
            <ListItem>
              <ListItemText primary="Username" secondary={user?.username || 'N/A'} />
            </ListItem>
            <ListItem>
              <ListItemText primary="Email" secondary={user?.email || 'N/A'} />
            </ListItem>
            <ListItem>
              <ListItemText primary="User ID" secondary={user?.id || 'N/A'} />
            </ListItem>
          </List>
        </Paper>

        {/* Role Information */}
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            User Roles
          </Typography>
          {userRoles ? (
            <List dense>
              <ListItem>
                <ListItemText
                  primary="Global Roles"
                  secondary={
                    userRoles.globalRoles.length > 0 ? userRoles.globalRoles.join(', ') : 'None'
                  }
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Contact Roles"
                  secondary={`${userRoles.contactRoles.length} role(s)`}
                />
              </ListItem>
              {userRoles.contactRoles.map((role) => (
                <ListItem key={role.id}>
                  <ListItemText
                    primary={`Role: ${role.roleName || role.roleId}`}
                    secondary={`Account: ${userRoles.accountId} | Context: ${role.roleData}`}
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography color="text.secondary">Loading roles...</Typography>
          )}
        </Paper>

        {/* Admin Actions */}
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Administrator Actions
          </Typography>
          <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
            <Card sx={{ minWidth: 200 }}>
              <CardContent>
                <Typography variant="h6" component="div">
                  User Management
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Manage system users and their roles
                </Typography>
              </CardContent>
              <CardActions>
                <Button size="small">Manage Users</Button>
              </CardActions>
            </Card>

            <Card sx={{ minWidth: 200 }}>
              <CardContent>
                <Typography variant="h6" component="div">
                  Account Management
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Manage sports accounts and settings
                </Typography>
              </CardContent>
              <CardActions>
                <Button size="small">Manage Accounts</Button>
              </CardActions>
            </Card>

            <Card sx={{ minWidth: 200 }}>
              <CardContent>
                <Typography variant="h6" component="div">
                  System Settings
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Configure system-wide settings
                </Typography>
              </CardContent>
              <CardActions>
                <Button size="small">Settings</Button>
              </CardActions>
            </Card>

            <Card sx={{ minWidth: 200 }}>
              <CardContent>
                <Typography variant="h6" component="div">
                  Analytics
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  View system analytics and reports
                </Typography>
              </CardContent>
              <CardActions>
                <Button size="small">View Reports</Button>
              </CardActions>
            </Card>
          </Stack>
        </Paper>
      </Stack>
    </main>
  );
};

export default AdminDashboard;
