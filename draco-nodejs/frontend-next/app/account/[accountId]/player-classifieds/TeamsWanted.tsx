'use client';

import React from 'react';
import { Box, Alert, Fab } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { usePlayerClassifieds } from '../../../../hooks/usePlayerClassifieds';
import { useClassifiedsPagination } from '../../../../hooks/useClassifiedsPagination';
import { useClassifiedsPermissions } from '../../../../hooks/useClassifiedsPermissions';
import { useAuth } from '../../../../context/AuthContext';
import { useAccountMembership } from '../../../../hooks/useAccountMembership';
import { StreamPaginationControl } from '../../../../components/pagination';
import TeamsWantedStateManager from '../../../../components/player-classifieds/TeamsWantedStateManager';
import CreateTeamsWantedDialog, {
  type TeamsWantedDialogSuccessEvent,
  type TeamsWantedFormInitialData,
} from '../../../../components/player-classifieds/CreateTeamsWantedDialog';
import DeleteTeamsWantedDialog, {
  type DeleteTeamsWantedSuccessEvent,
} from '../../../../components/player-classifieds/DeleteTeamsWantedDialog';
import { playerClassifiedService } from '../../../../services/playerClassifiedService';
import {
  TeamsWantedOwnerClassifiedType,
  TeamsWantedPublicClassifiedType,
} from '@draco/shared-schemas';

interface TeamsWantedProps {
  accountId: string;
  autoVerificationData?: {
    accessCode: string;
    classifiedData?: TeamsWantedOwnerClassifiedType | null;
  } | null;
  onVerificationProcessed?: () => void;
}

const TeamsWanted: React.FC<TeamsWantedProps> = ({
  accountId,
  autoVerificationData,
  onVerificationProcessed,
}) => {
  const { canEditTeamsWantedById, canDeleteTeamsWantedById } = useClassifiedsPermissions({
    accountId,
  });

  const { user, token } = useAuth();
  const { isMember } = useAccountMembership(accountId);
  const isAuthenticated = !!user;
  const isAccountMember = !!isMember;

  const [success, setSuccess] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);

  const [selectedClassified, setSelectedClassified] =
    React.useState<TeamsWantedPublicClassifiedType | null>(null);

  const [editingClassified, setEditingClassified] =
    React.useState<TeamsWantedFormInitialData | null>(null);
  const [editingClassifiedId, setEditingClassifiedId] = React.useState<string | null>(null);

  const [editContactError, setEditContactError] = React.useState<string | null>(null);

  const { pagination, setPage, setLimit } = useClassifiedsPagination({
    initialPage: 1,
    initialLimit: 25,
  });

  const {
    teamsWanted,
    paginationLoading,
    error: hookError,
    paginationInfo,
    reloadTeamsWantedPage,
  } = usePlayerClassifieds(accountId, token || undefined, pagination.page, pagination.limit);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
  };

  const handleNextPage = () => {
    setPage(pagination.page + 1);
  };

  const handlePrevPage = () => {
    setPage(pagination.page - 1);
  };

  const canOperateWithoutAccessCode = (classified: TeamsWantedPublicClassifiedType) => {
    return (
      isAccountMember &&
      (canEditTeamsWantedById(classified) || canDeleteTeamsWantedById(classified))
    );
  };

  const handleEdit = async (id: string, _accessCodeRequired: string) => {
    const classified = teamsWanted.find((c) => c.id.toString() === id);
    if (!classified) return;

    if (canOperateWithoutAccessCode(classified)) {
      setEditContactError(null);

      try {
        const contact = await playerClassifiedService.getTeamsWantedContactForEdit(
          accountId,
          classified.id.toString(),
          '',
          token || undefined,
        );

        const classifiedWithContact = {
          ...classified,
          email: contact.email,
          phone: contact.phone,
          birthDate: contact.birthDate ?? '',
          notifyOptOut: contact.notifyOptOut,
        };

        setEditingClassified(classifiedWithContact);
        setEditingClassifiedId(classified.id.toString());
        setEditDialogOpen(true);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to fetch contact information';
        setEditContactError(errorMessage);
      }
    }
  };

  const closeEditDialog = () => {
    setEditDialogOpen(false);
    setEditingClassified(null);
    setEditingClassifiedId(null);
    setEditContactError(null);
  };

  const handleCreateDialogSuccess = (event: TeamsWantedDialogSuccessEvent) => {
    setCreateDialogOpen(false);
    setSuccess(event.message);
    setError(null);
    reloadTeamsWantedPage();
    setTimeout(() => setSuccess(null), 8000);
  };

  const handleEditDialogSuccess = (event: TeamsWantedDialogSuccessEvent) => {
    setSuccess(event.message);
    setError(null);
    closeEditDialog();
    reloadTeamsWantedPage();
    setTimeout(() => setSuccess(null), 5000);
  };

  const handleDialogError = (message: string) => {
    setError(message);
  };

  const handleDelete = async (id: string, _accessCodeRequired: string) => {
    const classified = teamsWanted.find((c) => c.id.toString() === id);
    if (!classified) {
      return;
    }

    if (canOperateWithoutAccessCode(classified)) {
      setSelectedClassified(classified);
      setDeleteDialogOpen(true);
    }
  };

  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setSelectedClassified(null);
  };

  const handleDeleteDialogSuccess = (event: DeleteTeamsWantedSuccessEvent) => {
    setSuccess(event.message);
    setError(null);
    reloadTeamsWantedPage();
    setTimeout(() => setSuccess(null), 3000);
  };

  return (
    <Box>
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      {editContactError && (
        <Alert severity="error" onClose={() => setEditContactError(null)} sx={{ mb: 3 }}>
          Contact Info Error: {editContactError}
        </Alert>
      )}

      <TeamsWantedStateManager
        accountId={accountId}
        teamsWanted={teamsWanted}
        onEdit={handleEdit}
        onDelete={handleDelete}
        canEdit={canEditTeamsWantedById}
        canDelete={canDeleteTeamsWantedById}
        loading={false}
        error={hookError || undefined}
        autoVerificationData={autoVerificationData}
        onVerificationProcessed={onVerificationProcessed}
        onCreate={() => setCreateDialogOpen(true)}
      />

      <Fab
        color="primary"
        aria-label="Create Teams Wanted classified"
        onClick={() => setCreateDialogOpen(true)}
        sx={{
          position: 'fixed',
          bottom: { xs: 24, sm: 32 },
          right: { xs: 24, sm: 32 },
          zIndex: (theme) => theme.zIndex.snackbar + 1,
        }}
      >
        <AddIcon />
      </Fab>

      {isAuthenticated && isAccountMember && teamsWanted.length > 0 && (
        <Box display="flex" justifyContent="center" mt={4}>
          <StreamPaginationControl
            page={pagination.page}
            rowsPerPage={pagination.limit}
            hasNext={paginationInfo.hasNext}
            hasPrev={paginationInfo.hasPrev}
            onNextPage={handleNextPage}
            onPrevPage={handlePrevPage}
            onRowsPerPageChange={handleLimitChange}
            onJumpToPage={handlePageChange}
            currentItems={teamsWanted.length}
            itemLabel="Ads"
            loading={paginationLoading}
            showPageSize={true}
            showJumpControls={false}
          />
        </Box>
      )}

      <CreateTeamsWantedDialog
        accountId={accountId}
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSuccess={handleCreateDialogSuccess}
        onError={handleDialogError}
      />

      <DeleteTeamsWantedDialog
        accountId={accountId}
        open={deleteDialogOpen}
        classified={selectedClassified}
        onClose={closeDeleteDialog}
        onSuccess={handleDeleteDialogSuccess}
        onError={handleDialogError}
      />

      {editingClassified && (
        <CreateTeamsWantedDialog
          accountId={accountId}
          open={editDialogOpen}
          onClose={closeEditDialog}
          initialData={editingClassified}
          classifiedId={editingClassifiedId ?? undefined}
          editMode={true}
          onSuccess={handleEditDialogSuccess}
          onError={handleDialogError}
        />
      )}
    </Box>
  );
};

export default TeamsWanted;
