import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Skeleton,
  Alert,
  Divider,
} from '@mui/material';
import { Search } from '@mui/icons-material';
import SectionHeader from './SectionHeader';
import SectionCard from '../common/SectionCard';
import { useRouter } from 'next/navigation';
import { playerClassifiedService } from '../../services/playerClassifiedService';
import { PlayersWantedDetailDialog } from '../player-classifieds';
import { PlayersWantedClassifiedType } from '@draco/shared-schemas';
import CreatePlayersWantedDialog from '../player-classifieds/CreatePlayersWantedDialog';
import { useAuth } from '../../context/AuthContext';

interface PlayersWantedPreviewProps {
  accountId: string;
  maxDisplay?: number;
  isAccountMember?: boolean;
}

const PlayersWantedPreview: React.FC<PlayersWantedPreviewProps> = ({
  accountId,
  maxDisplay = 3,
  isAccountMember = false,
}) => {
  const [playersWanted, setPlayersWanted] = useState<PlayersWantedClassifiedType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedClassified, setSelectedClassified] = useState<PlayersWantedClassifiedType | null>(
    null,
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const router = useRouter();
  const { token } = useAuth();

  const loadPlayersWanted = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await playerClassifiedService.getPlayersWanted(accountId);
      setPlayersWanted(response.data.slice(0, maxDisplay));
    } catch (err) {
      console.error('Failed to fetch players wanted:', err);
      setError('Failed to load player opportunities');
    } finally {
      setLoading(false);
    }
  }, [accountId, maxDisplay]);

  useEffect(() => {
    loadPlayersWanted();
  }, [loadPlayersWanted]);

  const handleViewAll = () => {
    router.push(`/account/${accountId}/player-classifieds`);
  };

  const handleViewDetails = (playersWantedId: string) => {
    const classified = playersWanted.find((pw) => pw.id.toString() === playersWantedId);
    if (classified) {
      setSelectedClassified(classified);
      setDialogOpen(true);
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedClassified(null);
  };

  const handleCreateClick = () => {
    if (!token) {
      setCreateError('You must be signed in to create a Players Wanted ad.');
      return;
    }

    setCreateError(null);
    setCreateDialogOpen(true);
  };

  const handleCreateSuccess = useCallback(
    async (_classified: PlayersWantedClassifiedType) => {
      setCreateDialogOpen(false);
      setCreateError(null);
      setSuccessMessage('Players Wanted ad created successfully!');
      await loadPlayersWanted();
    },
    [loadPlayersWanted],
  );

  const handleCreateError = useCallback((message: string) => {
    setCreateError(message);
  }, []);

  const handleCreateDialogClose = () => {
    setCreateDialogOpen(false);
  };

  if (loading) {
    return (
      <SectionCard hover={false}>
        <SectionHeader
          icon={<Search />}
          title="Teams Looking for Players"
          description="Browse open positions on teams"
        />
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
          {Array.from({ length: maxDisplay }).map((_, index) => (
            <Skeleton key={index} variant="rectangular" height={120} sx={{ borderRadius: 2 }} />
          ))}
        </Box>
      </SectionCard>
    );
  }

  if (error) {
    return (
      <SectionCard hover={false}>
        <SectionHeader
          icon={<Search />}
          title="Teams Looking for Players"
          description="Browse open positions on teams"
        />
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      </SectionCard>
    );
  }

  return (
    <SectionCard>
      <SectionHeader
        icon={<Search />}
        title="Teams Looking for Players"
        description="Connect with teams looking for players"
        actionButton={{
          label: 'View All',
          onClick: handleViewAll,
        }}
      />
      {successMessage && (
        <Alert severity="success" onClose={() => setSuccessMessage(null)} sx={{ mb: 2 }}>
          {successMessage}
        </Alert>
      )}
      {createError && (
        <Alert severity="error" onClose={() => setCreateError(null)} sx={{ mb: 2 }}>
          {createError}
        </Alert>
      )}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
        {playersWanted.length > 0 ? (
          playersWanted.map((team) => (
            <Card
              key={team.id}
              sx={{
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
                '&:hover': {
                  borderColor: 'primary.main',
                  bgcolor: 'action.hover',
                },
              }}
            >
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                  {team.teamEventName}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Positions: {team.positionsNeeded}
                </Typography>
                <Button
                  size="small"
                  variant="contained"
                  fullWidth
                  onClick={() => handleViewDetails(team.id)}
                  sx={{
                    textTransform: 'none',
                    borderRadius: 1,
                  }}
                >
                  View Details
                </Button>
              </CardContent>
            </Card>
          ))
        ) : (
          <Typography variant="body2" color="text.secondary">
            No teams are currently recruiting new players.
          </Typography>
        )}
      </Box>

      {isAccountMember && (
        <Box sx={{ mt: playersWanted.length > 0 ? 3 : 2 }}>
          <Divider sx={{ mb: 2 }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
            Looking for players?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Post a Players Wanted ad so local athletes can reach out and join your roster.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={handleCreateClick}
            sx={{ textTransform: 'none' }}
          >
            Create Players Wanted Ad
          </Button>
        </Box>
      )}

      {/* Detail Dialog */}
      <PlayersWantedDetailDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        classified={selectedClassified}
        canEdit={() => false}
        canDelete={() => false}
      />

      <CreatePlayersWantedDialog
        accountId={accountId}
        open={createDialogOpen}
        onClose={handleCreateDialogClose}
        onSuccess={handleCreateSuccess}
        onError={handleCreateError}
      />
    </SectionCard>
  );
};

export default PlayersWantedPreview;
