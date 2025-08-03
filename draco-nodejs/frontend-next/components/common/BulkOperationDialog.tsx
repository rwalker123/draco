'use client';

// Enhanced Bulk Operation Dialog with real-time progress tracking
// Single Responsibility: Manages bulk operation UI and progress display
// Open/Closed: Extensible through operation-specific parameter forms

import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  LinearProgress,
  Chip,
  Alert,
  Divider,
  IconButton,
  Collapse,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  FormControlLabel,
  Switch,
  TextField,
  MenuItem,
  Paper,
  Stack,
} from '@mui/material';
import {
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import {
  BulkOperation,
  BulkOperationProgress,
  BulkAssignRoleParams,
  BulkExportParams,
  ValidationResult,
} from '../../types/bulkOperations';
import { EnhancedUser } from '../../types/userTable';

interface BulkOperationDialogProps {
  open: boolean;
  onClose: () => void;
  operation: BulkOperation | null;
  users: EnhancedUser[];
  onExecute: (params: Record<string, unknown>) => Promise<void>;
  initialParams?: Record<string, unknown>;
  title?: string;
  progress?: BulkOperationProgress | null;
  isExecuting?: boolean;
}

const BulkOperationDialog: React.FC<BulkOperationDialogProps> = ({
  open,
  onClose,
  operation,
  users,
  onExecute,
  initialParams = {},
  title,
  progress,
  isExecuting = false,
}) => {
  const [params, setParams] = useState<Record<string, unknown>>(initialParams);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [showResults, setShowResults] = useState(false);

  // Validate parameters whenever they change
  useEffect(() => {
    if (operation && users.length > 0) {
      const validationResult = operation.validate(users, params);
      setValidation(validationResult);
    }
  }, [operation, users, params]);

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (open) {
      setParams(initialParams);
      setShowResults(false);
    }
  }, [open, initialParams]);

  // Show results when operation completes
  useEffect(() => {
    if (progress && !progress.isRunning && progress.results.length > 0) {
      setShowResults(true);
    }
  }, [progress]);

  const handleParamChange = useCallback((key: string, value: unknown) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleExecute = useCallback(async () => {
    if (!operation || !validation?.isValid) return;

    try {
      await onExecute(params);
    } catch (error) {
      console.error('Bulk operation execution failed:', error);
    }
  }, [operation, validation, params, onExecute]);

  const handleClose = useCallback(() => {
    if (!isExecuting) {
      onClose();
    }
  }, [isExecuting, onClose]);

  const renderOperationParams = () => {
    if (!operation) return null;

    switch (operation.config.id) {
      case 'assign-role':
        return renderAssignRoleParams();
      case 'export-users':
        return renderExportParams();
      default:
        return null;
    }
  };

  const renderAssignRoleParams = () => {
    const roleParams = params as unknown as BulkAssignRoleParams;

    return (
      <Stack spacing={3}>
        <TextField
          fullWidth
          label="Role ID"
          value={roleParams.roleId || ''}
          onChange={(e) => handleParamChange('roleId', e.target.value)}
          required
          helperText="Select the role to assign to users"
          select
        >
          <MenuItem value="5F00A9E0-F42E-49B4-ABD9-B2DCEDD2BB8A">Account Admin</MenuItem>
          <MenuItem value="a87ea9a3-47e2-49d1-9e1e-c35358d1a677">Account Photo Admin</MenuItem>
          <MenuItem value="672DDF06-21AC-4D7C-B025-9319CC69281A">League Admin</MenuItem>
          <MenuItem value="777D771B-1CBA-4126-B8F3-DD7F3478D40E">Team Admin</MenuItem>
          <MenuItem value="55FD3262-343F-4000-9561-6BB7F658DEB7">Team Photo Admin</MenuItem>
        </TextField>

        <TextField
          fullWidth
          label="Role Data"
          value={roleParams.roleData || ''}
          onChange={(e) => handleParamChange('roleData', e.target.value)}
          required
          helperText="Account ID, League ID, or Team ID depending on role type"
        />

        <TextField
          fullWidth
          label="Season ID"
          value={roleParams.seasonId || ''}
          onChange={(e) => handleParamChange('seasonId', e.target.value)}
          helperText="Required for team and league roles"
        />

        <FormControlLabel
          control={
            <Switch
              checked={roleParams.skipExisting || false}
              onChange={(e) => handleParamChange('skipExisting', e.target.checked)}
            />
          }
          label="Skip users who already have this role"
        />
      </Stack>
    );
  };

  const renderExportParams = () => {
    const exportParams = params as unknown as BulkExportParams;

    return (
      <Stack spacing={3}>
        <TextField
          fullWidth
          label="Export Format"
          value={exportParams.format || 'csv'}
          onChange={(e) => handleParamChange('format', e.target.value)}
          required
          select
        >
          <MenuItem value="csv">CSV (Comma Separated Values)</MenuItem>
          <MenuItem value="json">JSON (JavaScript Object Notation)</MenuItem>
        </TextField>

        <TextField
          fullWidth
          label="Filename"
          value={exportParams.filename || ''}
          onChange={(e) => handleParamChange('filename', e.target.value)}
          helperText="Leave blank for auto-generated filename"
        />

        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Include Fields
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {['name', 'contact', 'address', 'activity'].map((field) => (
              <Chip
                key={field}
                label={field.charAt(0).toUpperCase() + field.slice(1)}
                onClick={() => {
                  const currentFields = exportParams.includeFields || [];
                  const newFields = currentFields.includes(field)
                    ? currentFields.filter((f) => f !== field)
                    : [...currentFields, field];
                  handleParamChange('includeFields', newFields);
                }}
                color={exportParams.includeFields?.includes(field) ? 'primary' : 'default'}
                variant={exportParams.includeFields?.includes(field) ? 'filled' : 'outlined'}
              />
            ))}
          </Stack>
        </Box>

        <FormControlLabel
          control={
            <Switch
              checked={exportParams.includeRoles || false}
              onChange={(e) => handleParamChange('includeRoles', e.target.checked)}
            />
          }
          label="Include role information"
        />

        <FormControlLabel
          control={
            <Switch
              checked={exportParams.includeContactInfo || false}
              onChange={(e) => handleParamChange('includeContactInfo', e.target.checked)}
            />
          }
          label="Include detailed contact information"
        />
      </Stack>
    );
  };

  const renderValidation = () => {
    if (!validation) return null;

    return (
      <Box sx={{ mt: 2 }}>
        {validation.errors.length > 0 && (
          <Alert severity="error" sx={{ mb: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              Please fix the following errors:
            </Typography>
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              {validation.errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </Alert>
        )}

        {validation.warnings.length > 0 && (
          <Alert severity="warning" sx={{ mb: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              Warnings:
            </Typography>
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              {validation.warnings.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
          </Alert>
        )}

        {validation.isValid && (
          <Alert severity="info">
            Ready to process {validation.affectedCount} user
            {validation.affectedCount !== 1 ? 's' : ''}
          </Alert>
        )}
      </Box>
    );
  };

  const renderProgress = () => {
    if (!progress || !isExecuting) return null;

    const progressPercent =
      progress.total > 0 ? ((progress.completed + progress.failed) / progress.total) * 100 : 0;

    return (
      <Box sx={{ mt: 2 }}>
        <Paper sx={{ p: 2 }}>
          <Stack spacing={2}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="h6">
                {progress.isRunning ? 'Processing...' : 'Completed'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {Math.round(progressPercent)}%
              </Typography>
            </Box>

            <LinearProgress
              variant="determinate"
              value={progressPercent}
              color={progress.failed > 0 ? 'warning' : 'primary'}
            />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2">{progress.currentOperation}</Typography>
              {progress.estimatedTimeRemaining && progress.estimatedTimeRemaining > 0 && (
                <Typography variant="caption" color="text.secondary">
                  ~{Math.ceil(progress.estimatedTimeRemaining / 1000)}s remaining
                </Typography>
              )}
            </Box>

            <Stack direction="row" spacing={2}>
              <Chip
                icon={<SuccessIcon />}
                label={`${progress.completed} completed`}
                color="success"
                size="small"
              />
              {progress.failed > 0 && (
                <Chip
                  icon={<ErrorIcon />}
                  label={`${progress.failed} failed`}
                  color="error"
                  size="small"
                />
              )}
              <Chip
                icon={<PersonIcon />}
                label={`${progress.total} total`}
                color="default"
                size="small"
              />
            </Stack>

            {progress.currentUser && (
              <Typography variant="caption" color="text.secondary">
                Processing: {progress.currentUser}
              </Typography>
            )}
          </Stack>
        </Paper>
      </Box>
    );
  };

  const renderResults = () => {
    if (!progress || !showResults || progress.results.length === 0) return null;

    const successResults = progress.results.filter((r) => r.success);
    const failureResults = progress.results.filter((r) => !r.success);

    return (
      <Box sx={{ mt: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Typography variant="h6">Operation Results</Typography>
          <IconButton size="small" onClick={() => setShowResults(!showResults)}>
            {showResults ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>

        <Collapse in={showResults}>
          <Paper sx={{ maxHeight: 300, overflow: 'auto' }}>
            {failureResults.length > 0 && (
              <>
                <Box sx={{ p: 2, bgcolor: 'error.light', color: 'error.contrastText' }}>
                  <Typography variant="subtitle2">
                    Failed Operations ({failureResults.length})
                  </Typography>
                </Box>
                <List dense>
                  {failureResults.map((result, index) => (
                    <ListItem key={`error-${index}`}>
                      <ListItemIcon>
                        <ErrorIcon color="error" />
                      </ListItemIcon>
                      <ListItemText primary={result.user.displayName} secondary={result.error} />
                    </ListItem>
                  ))}
                </List>
                <Divider />
              </>
            )}

            {successResults.length > 0 && (
              <>
                <Box sx={{ p: 2, bgcolor: 'success.light', color: 'success.contrastText' }}>
                  <Typography variant="subtitle2">
                    Successful Operations ({successResults.length})
                  </Typography>
                </Box>
                <List dense>
                  {successResults.slice(0, 10).map((result, index) => (
                    <ListItem key={`success-${index}`}>
                      <ListItemIcon>
                        <SuccessIcon color="success" />
                      </ListItemIcon>
                      <ListItemText
                        primary={result.user.displayName}
                        secondary={
                          result.data ? JSON.stringify(result.data) : 'Completed successfully'
                        }
                      />
                    </ListItem>
                  ))}
                  {successResults.length > 10 && (
                    <ListItem>
                      <ListItemText
                        primary={`... and ${successResults.length - 10} more`}
                        sx={{ fontStyle: 'italic' }}
                      />
                    </ListItem>
                  )}
                </List>
              </>
            )}
          </Paper>
        </Collapse>
      </Box>
    );
  };

  if (!operation) return null;

  const dialogTitle = title || `${operation.config.name} - ${users.length} Users`;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      disableEscapeKeyDown={isExecuting}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ color: `${operation.config.color}.main` }}>
              <operation.config.icon />
            </Box>
            <Typography variant="h6">{dialogTitle}</Typography>
          </Box>
          <IconButton onClick={handleClose} disabled={isExecuting} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={2}>
          {/* Operation Description */}
          <Alert severity="info" icon={<InfoIcon />}>
            {operation.config.description}
          </Alert>

          {/* User Selection Summary */}
          <Paper sx={{ p: 2 }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <PersonIcon color="primary" />
              <Box>
                <Typography variant="subtitle1">
                  {users.length} user{users.length !== 1 ? 's' : ''} selected
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {users
                    .slice(0, 3)
                    .map((u) => u.displayName)
                    .join(', ')}
                  {users.length > 3 && ` and ${users.length - 3} more`}
                </Typography>
              </Box>
            </Stack>
          </Paper>

          {/* Operation Parameters */}
          {!isExecuting && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Configuration
              </Typography>
              {renderOperationParams()}
              {renderValidation()}
            </Box>
          )}

          {/* Progress Display */}
          {renderProgress()}

          {/* Results Display */}
          {renderResults()}
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={isExecuting}>
          {isExecuting ? 'Processing...' : 'Cancel'}
        </Button>

        {!isExecuting && (
          <Button
            onClick={handleExecute}
            variant="contained"
            disabled={!validation?.isValid}
            color={operation.config.color}
            startIcon={<operation.config.icon />}
          >
            {operation.config.name}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default BulkOperationDialog;
