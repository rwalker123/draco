'use client';

import React from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  IconButton,
  Chip,
  Tooltip,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  ContentCopy as CopyIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Group as GroupIcon,
  FileDownload as FileDownloadIcon,
} from '@mui/icons-material';
import { SeasonSummary } from '../../../../utils/seasonMapper';

export interface SeasonCardProps {
  season: SeasonSummary;
  canSetCurrent: boolean;
  canManageLeagues: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canExport: boolean;
  onSetCurrent: (season: SeasonSummary) => void;
  onLeagueSeasonManagement: (season: SeasonSummary) => void;
  onEdit: (season: SeasonSummary) => void;
  onCopy: (season: SeasonSummary) => void;
  onDelete: (season: SeasonSummary) => void;
  onExport: (season: SeasonSummary, event: React.MouseEvent<HTMLButtonElement>) => void;
}

const SeasonCard: React.FC<SeasonCardProps> = ({
  season,
  canSetCurrent,
  canManageLeagues,
  canEdit,
  canDelete,
  canExport,
  onSetCurrent,
  onLeagueSeasonManagement,
  onEdit,
  onCopy,
  onDelete,
  onExport,
}) => {
  return (
    <Card>
      <CardContent>
        {/* Top line: Season name, Edit/Copy, and Current badge or Set Current */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box display="flex" alignItems="center" gap={0.5}>
            <Typography variant="h6" component="h2">
              {season.name}
            </Typography>
            {canEdit && (
              <Tooltip title="Edit season">
                <IconButton size="small" onClick={() => onEdit(season)}>
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {canEdit && (
              <Tooltip title="Copy season">
                <IconButton
                  size="small"
                  aria-label={`Copy ${season.name}`}
                  onClick={() => onCopy(season)}
                >
                  <CopyIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {canExport && (
              <Tooltip title="Export season data">
                <IconButton
                  size="small"
                  aria-label={`Export ${season.name}`}
                  onClick={(event) => onExport(season, event)}
                >
                  <FileDownloadIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
          {season.isCurrent ? (
            <Chip icon={<StarIcon />} label="Current" color="primary" size="small" />
          ) : (
            canSetCurrent && (
              <Tooltip title="Set as current season">
                <IconButton size="small" onClick={() => onSetCurrent(season)}>
                  <StarBorderIcon />
                </IconButton>
              </Tooltip>
            )
          )}
        </Box>

        <Typography variant="body2" color="textSecondary" mb={2}>
          {season.leagues.length} league{season.leagues.length !== 1 ? 's' : ''}
        </Typography>

        {/* Actions row */}
        <Box display="flex" gap={1} flexWrap="wrap" alignItems="center">
          {canManageLeagues && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<GroupIcon />}
              onClick={() => onLeagueSeasonManagement(season)}
            >
              Manage Leagues and Teams
            </Button>
          )}

          {canDelete && !season.isCurrent && (
            <Tooltip title="Delete season">
              <IconButton size="small" color="error" onClick={() => onDelete(season)}>
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default SeasonCard;
