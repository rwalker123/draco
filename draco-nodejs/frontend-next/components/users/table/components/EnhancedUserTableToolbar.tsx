'use client';

// Enhanced User Table Toolbar with integrated bulk operations
// Single Responsibility: Manages toolbar UI and bulk operation integration
// Open/Closed: Extensible through bulk operation registration

import React, { useState, useEffect, useCallback, memo } from 'react';
import {
  Toolbar,
  Box,
  Typography,
  TextField,
  InputAdornment,
  IconButton,
  Button,
  Chip,
  Menu,
  MenuItem,
  Alert,
  Collapse,
  Badge,
  Stack,
  Divider,
  ListItemIcon,
  ListItemText,
  CircularProgress,
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  FilterList as FilterListIcon,
  MoreVert as MoreVertIcon,
  PlayArrow as ExecuteIcon,
  History as HistoryIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { UserTableToolbarProps } from '../../../../types/userTable';
import {
  BulkOperation,
  BulkOperationProgress,
  BulkOperationContext,
} from '../../../../types/bulkOperations';
import { useAuth } from '../../../../context/AuthContext';
import { useCurrentSeason } from '../../../../hooks/useCurrentSeason';
import { bulkOperationsManager } from '../../../../services/bulkOperationsManager';
import { BulkAssignRoleOperation } from '../../../../services/bulkOperations/BulkAssignRoleOperation';
import { BulkExportOperation } from '../../../../services/bulkOperations/BulkExportOperation';
import BulkOperationDialog from '../../../common/BulkOperationDialog';

interface EnhancedUserTableToolbarProps extends UserTableToolbarProps {
  accountId: string;
  onBulkOperationComplete?: (result: BulkOperationProgress) => void;
}

const EnhancedUserTableToolbar: React.FC<EnhancedUserTableToolbarProps> = ({
  userCount: _userCount,
  selectedUsers,
  searchTerm,
  onSearchChange,
  onSearchSubmit,
  onSearchClear,
  filters,
  onFiltersChange: _onFiltersChange,
  customActions,
  onBulkAction: _onBulkAction,
  canManageUsers,
  enableAdvancedFilters,
  loading = false,
  accountId,
  onBulkOperationComplete,
}) => {
  const { token } = useAuth();
  const { currentSeasonId } = useCurrentSeason(accountId);

  // State management
  const [showFilters, setShowFilters] = useState(false);
  const [bulkMenuAnchor, setBulkMenuAnchor] = useState<null | HTMLElement>(null);
  const [availableOperations, setAvailableOperations] = useState<BulkOperation[]>([]);
  const [selectedOperation, setSelectedOperation] = useState<BulkOperation | null>(null);
  const [operationDialogOpen, setOperationDialogOpen] = useState(false);
  const [operationProgress, setOperationProgress] = useState<BulkOperationProgress | null>(null);
  const [isExecutingOperation, setIsExecutingOperation] = useState(false);

  // Register bulk operations on component mount
  useEffect(() => {
    if (token && canManageUsers) {
      // Register default operations
      bulkOperationsManager.registerOperation(BulkAssignRoleOperation.create(token));
      bulkOperationsManager.registerOperation(BulkExportOperation.create());

      // Register custom operations if any
      customActions.forEach((_action) => {
        // Convert UserTableAction to BulkOperation if needed
        // This would be implementation-specific
      });
    }
  }, [token, canManageUsers, customActions]);

  // Update available operations when selection changes
  useEffect(() => {
    if (selectedUsers.length > 0) {
      const operations = bulkOperationsManager.getAvailableOperations(selectedUsers);
      setAvailableOperations(operations);
    } else {
      setAvailableOperations([]);
    }
  }, [selectedUsers]);

  // Check for active filters
  const hasActiveFilters = Object.values(filters).some((value) => {
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'boolean') return value !== undefined;
    return value !== undefined && value !== null;
  });

  // Event handlers
  const handleSearchSubmit = useCallback(
    (event: React.FormEvent) => {
      event.preventDefault();
      onSearchSubmit();
    },
    [onSearchSubmit],
  );

  const handleBulkMenuOpen = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setBulkMenuAnchor(event.currentTarget);
  }, []);

  const handleBulkMenuClose = useCallback(() => {
    setBulkMenuAnchor(null);
  }, []);

  const handleOperationSelect = useCallback(
    (operation: BulkOperation) => {
      setSelectedOperation(operation);
      setOperationDialogOpen(true);
      handleBulkMenuClose();
    },
    [handleBulkMenuClose],
  );

  const handleExecuteOperation = useCallback(
    async (params: Record<string, unknown>) => {
      if (!selectedOperation || !token || selectedUsers.length === 0) return;

      setIsExecutingOperation(true);
      setOperationProgress(null);

      const context: BulkOperationContext = {
        accountId,
        currentSeasonId: currentSeasonId || undefined,
        userToken: token,
        permissions: ['manage_users', 'assign_roles', 'export_data'], // This should come from auth context
        onProgress: (progress) => {
          setOperationProgress(progress);
        },
      };

      try {
        const finalProgress = await bulkOperationsManager.executeOperation(
          selectedOperation.config.id,
          selectedUsers,
          params,
          context,
        );

        // Notify parent component
        onBulkOperationComplete?.(finalProgress);

        // Close dialog after a delay to show final results
        setTimeout(() => {
          setOperationDialogOpen(false);
          setSelectedOperation(null);
          setOperationProgress(null);
          setIsExecutingOperation(false);
        }, 3000);
      } catch (error) {
        console.error('Bulk operation failed:', error);
        setIsExecutingOperation(false);
        // Error handling would be shown in the dialog
      }
    },
    [selectedOperation, token, selectedUsers, accountId, currentSeasonId, onBulkOperationComplete],
  );

  const handleCloseOperationDialog = useCallback(() => {
    if (!isExecutingOperation) {
      setOperationDialogOpen(false);
      setSelectedOperation(null);
      setOperationProgress(null);
    }
  }, [isExecutingOperation]);

  // Render bulk operations menu
  const renderBulkOperationsMenu = () => (
    <Menu
      anchorEl={bulkMenuAnchor}
      open={Boolean(bulkMenuAnchor)}
      onClose={handleBulkMenuClose}
      PaperProps={{
        sx: { minWidth: 280, maxWidth: 400 },
      }}
    >
      {/* Header */}
      <Box sx={{ px: 2, py: 1, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="subtitle2" color="text.secondary">
          Bulk Operations ({selectedUsers.length} users)
        </Typography>
      </Box>

      {/* Available Operations */}
      {availableOperations.map((operation) => (
        <MenuItem
          key={operation.config.id}
          onClick={() => handleOperationSelect(operation)}
          sx={{ py: 1.5 }}
        >
          <ListItemIcon sx={{ color: `${operation.config.color}.main` }}>
            <operation.config.icon />
          </ListItemIcon>
          <ListItemText
            primary={operation.config.name}
            secondary={operation.config.description}
            secondaryTypographyProps={{ variant: 'caption' }}
          />
        </MenuItem>
      ))}

      {availableOperations.length === 0 && (
        <MenuItem disabled>
          <ListItemText
            primary="No operations available"
            secondary="Select users to see available bulk operations"
          />
        </MenuItem>
      )}

      <Divider />

      {/* History and Settings */}
      <MenuItem onClick={handleBulkMenuClose}>
        <ListItemIcon>
          <HistoryIcon />
        </ListItemIcon>
        <ListItemText primary="Operation History" />
      </MenuItem>

      <MenuItem onClick={handleBulkMenuClose}>
        <ListItemIcon>
          <SettingsIcon />
        </ListItemIcon>
        <ListItemText primary="Bulk Settings" />
      </MenuItem>
    </Menu>
  );

  return (
    <>
      <Toolbar
        sx={{
          pl: 2,
          pr: 1,
          minHeight: '64px !important',
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 2 }}>
          {/* Search Section */}
          <Box sx={{ flex: 1, maxWidth: 400 }}>
            <form onSubmit={handleSearchSubmit}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                disabled={loading}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                  endAdornment: searchTerm && (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={onSearchClear} disabled={loading}>
                        <ClearIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </form>
          </Box>

          {/* Selection Summary */}
          {selectedUsers.length > 0 && (
            <Chip
              label={`${selectedUsers.length} selected`}
              color="primary"
              size="small"
              sx={{ fontWeight: 600 }}
            />
          )}

          {/* Filter Section */}
          {enableAdvancedFilters && (
            <Box>
              <IconButton
                onClick={() => setShowFilters(!showFilters)}
                disabled={loading}
                color={hasActiveFilters ? 'primary' : 'default'}
              >
                <Badge badgeContent={hasActiveFilters ? '•' : 0} color="primary" variant="dot">
                  <FilterListIcon />
                </Badge>
              </IconButton>
            </Box>
          )}

          {/* Bulk Actions */}
          {canManageUsers && selectedUsers.length > 0 && (
            <Button
              variant="contained"
              size="small"
              startIcon={
                isExecutingOperation ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  <ExecuteIcon />
                )
              }
              onClick={handleBulkMenuOpen}
              disabled={loading || isExecutingOperation || availableOperations.length === 0}
            >
              {isExecutingOperation ? 'Processing...' : 'Bulk Actions'}
            </Button>
          )}

          {/* More Options */}
          <IconButton onClick={handleBulkMenuOpen} disabled={loading} size="small">
            <MoreVertIcon />
          </IconButton>
        </Box>
      </Toolbar>

      {/* Filter Collapse */}
      {enableAdvancedFilters && (
        <Collapse in={showFilters}>
          <Alert severity="info" sx={{ m: 2 }}>
            Advanced filters would be implemented here based on the onFiltersChange prop.
          </Alert>
        </Collapse>
      )}

      {/* Status Messages */}
      {isExecutingOperation && operationProgress && (
        <Alert severity="info" sx={{ m: 2 }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <CircularProgress size={20} />
            <Typography variant="body2">
              {operationProgress.currentOperation} (
              {operationProgress.completed + operationProgress.failed}/{operationProgress.total})
            </Typography>
          </Stack>
        </Alert>
      )}

      {/* Bulk Operations Menu */}
      {renderBulkOperationsMenu()}

      {/* Bulk Operation Dialog */}
      <BulkOperationDialog
        open={operationDialogOpen}
        onClose={handleCloseOperationDialog}
        operation={selectedOperation}
        users={selectedUsers}
        onExecute={handleExecuteOperation}
        progress={operationProgress}
        isExecuting={isExecutingOperation}
      />
    </>
  );
};

// Custom comparison function for EnhancedUserTableToolbar
const areEnhancedToolbarPropsEqual = (
  prevProps: EnhancedUserTableToolbarProps,
  nextProps: EnhancedUserTableToolbarProps,
) => {
  // Re-render only if these specific props change
  return (
    prevProps.searchTerm === nextProps.searchTerm &&
    prevProps.loading === nextProps.loading &&
    prevProps.canManageUsers === nextProps.canManageUsers &&
    prevProps.enableAdvancedFilters === nextProps.enableAdvancedFilters &&
    prevProps.selectedUsers.length === nextProps.selectedUsers.length && // Compare selection count
    prevProps.userCount === nextProps.userCount && // Compare user count directly
    prevProps.accountId === nextProps.accountId &&
    prevProps.onSearchChange === nextProps.onSearchChange &&
    prevProps.onSearchSubmit === nextProps.onSearchSubmit &&
    prevProps.onSearchClear === nextProps.onSearchClear &&
    prevProps.onBulkOperationComplete === nextProps.onBulkOperationComplete
  );
};

export default memo(EnhancedUserTableToolbar, areEnhancedToolbarPropsEqual);
