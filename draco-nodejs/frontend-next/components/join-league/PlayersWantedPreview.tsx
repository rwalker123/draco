import React, { useState, useEffect } from 'react';
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
  const router = useRouter();

  useEffect(() => {
    const fetchPlayersWanted = async () => {
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
    };

    fetchPlayersWanted();
  }, [accountId, maxDisplay]);

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
            Create or update a Teams Wanted ad to let other players know you&apos;re recruiting.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => router.push(`/account/${accountId}/player-classifieds?tab=teams-wanted`)}
            sx={{ textTransform: 'none' }}
          >
            Manage Teams Wanted Ads
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
    </SectionCard>
  );
};

export default PlayersWantedPreview;
