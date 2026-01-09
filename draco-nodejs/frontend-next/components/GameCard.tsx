'use client';

import React, { useMemo, useRef, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  Chip,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import FmdGoodOutlinedIcon from '@mui/icons-material/FmdGoodOutlined';
import { getGameStatusShortText } from '../utils/gameUtils';
import { formatDateInTimezone, formatGameTime } from '../utils/dateUtils';
import { DEFAULT_TIMEZONE } from '../utils/timezones';
import RecapButton from './RecapButton';
import { GameStatus, GameType } from '../types/schedule';
import FieldDetailsCard, { FieldDetails } from './fields/FieldDetailsCard';

// Sport-specific extension types
export interface GolfGameExtras {
  homeNetScore?: number;
  visitorNetScore?: number;
  homePoints?: number;
  visitorPoints?: number;
  homeCourseHandicap?: number;
  visitorCourseHandicap?: number;
}

export interface BaseballGameExtras {
  umpire1?: string;
  umpire2?: string;
  umpire3?: string;
  umpire4?: string;
}

// Unified Game interface that works for both ScheduleManagement and GameListDisplay
export interface GameCardData {
  id: string;
  date: string;
  homeTeamId: string;
  visitorTeamId: string;
  homeTeamName: string;
  visitorTeamName: string;
  homeScore: number;
  visitorScore: number;
  gameStatus: number;
  gameStatusText: string;
  gameStatusShortText?: string;
  leagueName: string;
  fieldId: string | null;
  fieldName: string | null;
  fieldShortName: string | null;
  fieldDetails?: FieldDetails | null;
  hasGameRecap: boolean;
  gameRecaps: Array<{ teamId: string; recap: string }>;
  comment?: string;
  gameType?: number;
  // Sport-specific extensions
  golfExtras?: GolfGameExtras;
  baseballExtras?: BaseballGameExtras;
}

export interface GameCardProps {
  game: GameCardData;
  layout?: 'vertical' | 'horizontal';
  canEditGames?: boolean;
  onEnterGameResults?: (game: GameCardData) => void;
  canEditRecap?: (game: GameCardData) => boolean;
  onEditRecap?: (game: GameCardData) => void;
  onViewRecap?: (game: GameCardData) => void;
  onClick?: (game: GameCardData) => void;
  showActions?: boolean;
  compact?: boolean;
  calendar?: boolean;
  showDate?: boolean;
  /**
   * Controls width behavior for horizontal layout.
   * - `false` (default): Card fills container width (min: 240px, max: 100%)
   * - `true`: Card fits content width (min: 280px, max: 500px)
   */
  fitContent?: boolean;
  timeZone?: string;
}

const GameCard: React.FC<GameCardProps> = ({
  game,
  layout = 'vertical',
  canEditGames = false,
  onEnterGameResults,
  canEditRecap,
  onEditRecap,
  onViewRecap,
  onClick,
  showActions = true,
  compact = false,
  calendar = false,
  showDate = false,
  fitContent = false,
  timeZone = DEFAULT_TIMEZONE,
}) => {
  const leagueLabel = useMemo(() => {
    const original = game.leagueName?.trim() ?? '';
    if (original.length === 0) {
      return '';
    }

    if (original.length <= 3) {
      return original;
    }

    const wordParts = original.split(/\s+/).filter((part) => part.length > 0);
    if (wordParts.length > 1) {
      let acronym = '';
      for (const part of wordParts) {
        acronym += part[0]!.toUpperCase();
        if (acronym.length >= 3) {
          break;
        }
      }
      return acronym;
    }

    return original.slice(0, 3).toUpperCase();
  }, [game.leagueName]);

  const [fieldDialogOpen, setFieldDialogOpen] = useState(false);
  const suppressClicksUntilRef = useRef(0);
  const localTime = formatGameTime(game.date, timeZone);
  const formattedDateLabel = formatDateInTimezone(game.date, timeZone, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  const fieldDisplayName = game.fieldShortName || game.fieldName;
  const canEditRecapForCurrentGame = canEditRecap && onEditRecap ? canEditRecap(game) : false;
  const recapButtonProps =
    canEditRecap && onEditRecap && canEditRecapForCurrentGame
      ? ({
          recapMode: 'edit' as const,
          canEditRecap,
          onEditRecap,
        } as const)
      : onViewRecap
        ? ({ recapMode: 'view' as const, onViewRecap } as const)
        : ({ recapMode: 'none' as const } as const);

  const mergedFieldDetails = useMemo<FieldDetails | null>(() => {
    const baseDetails = game.fieldDetails ?? null;
    const name = baseDetails?.name ?? game.fieldName ?? game.fieldShortName ?? null;
    const shortName = baseDetails?.shortName ?? game.fieldShortName ?? game.fieldName ?? null;
    const id = baseDetails?.id ?? game.fieldId ?? null;

    if (!name && !shortName) {
      return id ? { id, name: null, shortName: null } : null;
    }

    return {
      id,
      name,
      shortName,
      address: baseDetails?.address ?? null,
      city: baseDetails?.city ?? null,
      state: baseDetails?.state ?? null,
      zip: baseDetails?.zip ?? null,
      zipCode: baseDetails?.zipCode ?? null,
      rainoutNumber: baseDetails?.rainoutNumber ?? null,
      comment: baseDetails?.comment ?? null,
      directions: baseDetails?.directions ?? null,
      latitude: baseDetails?.latitude ?? null,
      longitude: baseDetails?.longitude ?? null,
    };
  }, [game.fieldDetails, game.fieldId, game.fieldName, game.fieldShortName]);

  const handleCardClick = (event: React.MouseEvent) => {
    const now = performance.now();
    if (now < suppressClicksUntilRef.current) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    if (fieldDialogOpen) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    if (onClick) {
      onClick(game);
    }
  };

  const handleGameResultsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEnterGameResults) {
      onEnterGameResults(game);
    }
  };

  const handleRecapClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (canEditRecapForCurrentGame && onEditRecap) {
      onEditRecap(game);
      return;
    }

    if (onViewRecap) {
      onViewRecap(game);
    }
  };

  const handleFieldLinkClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    setFieldDialogOpen(true);
  };

  const handleFieldDialogClose = () => {
    setFieldDialogOpen(false);
    suppressClicksUntilRef.current = performance.now() + 500;
  };

  const renderFieldLink = () => {
    if (!fieldDisplayName) {
      if (hasGolfExtras) {
        return <Chip label="No Course" size="small" color="error" variant="outlined" />;
      }
      return null;
    }

    return (
      <Button
        variant="outlined"
        color="primary"
        size="small"
        startIcon={<FmdGoodOutlinedIcon fontSize="small" />}
        onClick={handleFieldLinkClick}
        sx={{
          minWidth: 0,
          px: 1.25,
          py: 0.25,
          textTransform: 'none',
          fontSize: '0.8125rem',
          fontWeight: 600,
          '&:hover': {
            backgroundColor: (theme) => theme.palette.action.hover,
          },
        }}
      >
        {fieldDisplayName}
      </Button>
    );
  };

  const hasGolfExtras = game.golfExtras !== undefined;

  const renderHandicapBadge = (handicap: number | undefined) => {
    if (handicap === undefined) return null;
    return (
      <Box
        component="span"
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          ml: 1,
          px: 0.75,
          py: 0.125,
          borderRadius: 1,
          backgroundColor: 'action.selected',
          color: 'text.secondary',
          fontSize: '0.75rem',
          fontWeight: 600,
          minWidth: 24,
          lineHeight: 1.4,
        }}
      >
        {handicap}
      </Box>
    );
  };

  const renderScoreValue = (
    score: number,
    netScore: number | undefined,
    points: number | undefined,
    isWinner: boolean,
    position: 'visitor' | 'home',
  ) => {
    if (hasGolfExtras && points !== undefined) {
      const displayNetScore = netScore ?? score;
      return (
        <Box sx={{ textAlign: 'center' }}>
          <Typography
            variant="body1"
            fontWeight={700}
            color={isWinner ? 'success.main' : 'text.primary'}
            sx={{ mb: position === 'visitor' ? 0.5 : 0 }}
          >
            {points}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
            {score} ({displayNetScore})
          </Typography>
        </Box>
      );
    }
    return (
      <Typography
        variant="body1"
        fontWeight={700}
        color={isWinner ? 'success.main' : 'text.primary'}
        sx={{ mb: position === 'visitor' ? 0.5 : 0 }}
      >
        {score}
      </Typography>
    );
  };

  return (
    <Card
      variant="outlined"
      sx={{
        mb: layout === 'vertical' ? 2 : 0,
        mr: layout === 'horizontal' ? 2 : 0,
        borderRadius: calendar ? 1 : 2,
        border: '1px solid',
        borderColor: 'divider',
        transition: 'all 0.2s ease',
        minWidth: calendar ? '100%' : layout === 'horizontal' ? (fitContent ? 280 : 240) : 'auto',
        maxWidth: calendar
          ? '100%'
          : layout === 'horizontal'
            ? fitContent
              ? 500
              : '100%'
            : 'auto',
        width: calendar
          ? '100%'
          : layout === 'horizontal'
            ? fitContent
              ? 'auto'
              : '100%'
            : 'auto',
        flexShrink: calendar ? 1 : layout === 'horizontal' ? 0 : 1,
        cursor: onClick && !fieldDialogOpen ? 'pointer' : 'default',
        pointerEvents: fieldDialogOpen ? 'none' : 'auto',
        '&:hover': {
          transform: onClick && !fieldDialogOpen ? 'translateY(-2px)' : 'none',
          boxShadow: onClick && !fieldDialogOpen ? '0 8px 25px rgba(0,0,0,0.12)' : 'none',
          borderColor: onClick && !fieldDialogOpen ? 'primary.main' : 'divider',
        },
      }}
      onClick={fieldDialogOpen ? undefined : handleCardClick}
    >
      <CardContent
        sx={{
          p: layout === 'vertical' && showDate ? 0.5 : calendar ? 0.5 : compact ? 1 : 2,
          position: 'relative',
        }}
      >
        {layout === 'vertical' && showDate && game.date && (
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, mb: 1 }}>
            {formattedDateLabel}
          </Typography>
        )}
        {layout === 'horizontal' ? (
          // Horizontal layout with time/field below teams
          <Box>
            {/* Top row: League and actions */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                mb: 1,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography variant="subtitle2" color="text.secondary" fontWeight={500}>
                  {game.leagueName}
                </Typography>
                {game.gameType === GameType.Playoff && (
                  <Tooltip title="Playoff Game">
                    <EmojiEventsIcon
                      sx={{
                        color: 'warning.main',
                        fontSize: 16,
                      }}
                    />
                  </Tooltip>
                )}
              </Box>
              {showActions && (
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  {canEditGames && onEnterGameResults && (
                    <Tooltip title="Enter Game Results">
                      <IconButton
                        size="small"
                        onClick={handleGameResultsClick}
                        color="primary"
                        sx={{
                          p: 0.5,
                          '&:hover': {
                            bgcolor: 'action.hover',
                          },
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                  <RecapButton game={game} onRecapClick={handleRecapClick} {...recapButtonProps} />
                </Box>
              )}
            </Box>

            {/* Teams and scores row */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                  <Typography
                    variant="body1"
                    fontWeight={700}
                    sx={{ color: 'text.primary' }}
                    noWrap
                  >
                    {game.visitorTeamName}
                  </Typography>
                  {game.gameStatus !== GameStatus.Completed &&
                    renderHandicapBadge(game.golfExtras?.visitorCourseHandicap)}
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography
                    variant="body1"
                    fontWeight={700}
                    sx={{ color: 'text.primary' }}
                    noWrap
                  >
                    {game.homeTeamName}
                  </Typography>
                  {game.gameStatus !== GameStatus.Completed &&
                    renderHandicapBadge(game.golfExtras?.homeCourseHandicap)}
                </Box>
              </Box>

              {/* Scores column */}
              {game.gameStatus !== GameStatus.Scheduled &&
              game.gameStatus !== GameStatus.Rainout &&
              game.gameStatus !== GameStatus.DidNotReport ? (
                <Box textAlign="center" sx={{ minWidth: 'auto' }}>
                  {renderScoreValue(
                    game.visitorScore,
                    game.golfExtras?.visitorNetScore,
                    game.golfExtras?.visitorPoints,
                    hasGolfExtras
                      ? (game.golfExtras?.visitorPoints ?? 0) > (game.golfExtras?.homePoints ?? 0)
                      : game.visitorScore > game.homeScore,
                    'visitor',
                  )}
                  {renderScoreValue(
                    game.homeScore,
                    game.golfExtras?.homeNetScore,
                    game.golfExtras?.homePoints,
                    hasGolfExtras
                      ? (game.golfExtras?.homePoints ?? 0) > (game.golfExtras?.visitorPoints ?? 0)
                      : game.homeScore > game.visitorScore,
                    'home',
                  )}
                </Box>
              ) : game.gameStatus !== GameStatus.Scheduled ? (
                <Box textAlign="center" sx={{ minWidth: 'auto' }}>
                  <Typography variant="body2" color="text.secondary">
                    {game.gameStatusText}
                  </Typography>
                </Box>
              ) : (
                <Box textAlign="center" sx={{ minWidth: 'auto' }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    {formattedDateLabel} {localTime}
                  </Typography>
                  {renderFieldLink()}
                </Box>
              )}

              {/* Game status badge */}
              {game.gameStatus !== GameStatus.Scheduled && (
                <Box
                  aria-label={`Game status: ${game.gameStatusText}`}
                  sx={{
                    display: 'inline-block',
                    background: 'primary.main',
                    color: 'text.secondary',
                    borderRadius: 1,
                    fontSize: 14,
                    fontWeight: 700,
                    padding: '4px 12px',
                    margin: 0,
                  }}
                >
                  {game.gameStatusShortText || getGameStatusShortText(game.gameStatus)}
                </Box>
              )}
            </Box>
          </Box>
        ) : (
          // Original vertical layout
          <Box>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'auto 1fr auto auto',
                gap: 1.5,
                alignItems: 'start',
                mb: 1,
              }}
            >
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, pt: 0.5 }}>
                  <Typography variant="subtitle2" color="text.secondary" fontWeight={500}>
                    {leagueLabel}
                  </Typography>
                  {game.gameType === GameType.Playoff && (
                    <Tooltip title="Playoff Game">
                      <EmojiEventsIcon
                        sx={{
                          color: 'warning.main',
                          fontSize: 16,
                        }}
                      />
                    </Tooltip>
                  )}
                </Box>
                {showActions && canEditGames && onEnterGameResults && (
                  <Tooltip title="Enter Game Results">
                    <IconButton
                      size="small"
                      onClick={handleGameResultsClick}
                      color="primary"
                      sx={{
                        mt: 1,
                        p: 0.5,
                        '&:hover': {
                          bgcolor: 'action.hover',
                        },
                      }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                  <Typography
                    variant="body1"
                    fontWeight={700}
                    sx={{ color: 'text.primary' }}
                    noWrap
                  >
                    {game.visitorTeamName}
                  </Typography>
                  {game.gameStatus !== GameStatus.Completed &&
                    renderHandicapBadge(game.golfExtras?.visitorCourseHandicap)}
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography
                    variant="body1"
                    fontWeight={700}
                    sx={{ color: 'text.primary' }}
                    noWrap
                  >
                    {game.homeTeamName}
                  </Typography>
                  {game.gameStatus !== GameStatus.Completed &&
                    renderHandicapBadge(game.golfExtras?.homeCourseHandicap)}
                </Box>
              </Box>
              {/* Scores column */}
              {game.gameStatus !== GameStatus.Scheduled &&
              game.gameStatus !== GameStatus.Rainout &&
              game.gameStatus !== GameStatus.DidNotReport ? (
                <Box textAlign="center" sx={{ minWidth: 'auto', width: 'auto' }}>
                  {renderScoreValue(
                    game.visitorScore,
                    game.golfExtras?.visitorNetScore,
                    game.golfExtras?.visitorPoints,
                    hasGolfExtras
                      ? (game.golfExtras?.visitorPoints ?? 0) > (game.golfExtras?.homePoints ?? 0)
                      : game.visitorScore > game.homeScore,
                    'visitor',
                  )}
                  {renderScoreValue(
                    game.homeScore,
                    game.golfExtras?.homeNetScore,
                    game.golfExtras?.homePoints,
                    hasGolfExtras
                      ? (game.golfExtras?.homePoints ?? 0) > (game.golfExtras?.visitorPoints ?? 0)
                      : game.homeScore > game.visitorScore,
                    'home',
                  )}
                </Box>
              ) : (
                <Box />
              )}
              {/* Game status badge column (far right) */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  minWidth: 'auto',
                }}
              >
                {/* Game status moved to bottom row for vertical layout */}
              </Box>
            </Box>

            {/* Bottom row for time, field, and game status (vertical layout only) */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                pt: 1,
                borderTop: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {game.gameStatus === GameStatus.Scheduled && (
                  <>
                    <Typography variant="body2" color="text.secondary">
                      {formattedDateLabel} {localTime}
                    </Typography>
                    {renderFieldLink()}
                  </>
                )}
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {game.gameStatus !== GameStatus.Scheduled &&
                  game.gameStatus !== GameStatus.Completed && (
                    <Box
                      aria-label={`Game status: ${game.gameStatusText}`}
                      sx={{
                        display: 'inline-block',
                        background: 'primary.main',
                        color: 'text.secondary',
                        borderRadius: 1,
                        fontSize: 14,
                        fontWeight: 700,
                        padding: '4px 12px',
                        margin: 0,
                      }}
                    >
                      {game.gameStatusShortText || getGameStatusShortText(game.gameStatus)}
                    </Box>
                  )}
                {showActions && (
                  <RecapButton game={game} onRecapClick={handleRecapClick} {...recapButtonProps} />
                )}
              </Box>
            </Box>
          </Box>
        )}
      </CardContent>
      <Dialog
        open={fieldDialogOpen}
        onClose={handleFieldDialogClose}
        fullWidth
        maxWidth="sm"
        aria-label="Field details"
      >
        <DialogContent sx={{ p: 0 }}>
          <FieldDetailsCard
            field={mergedFieldDetails}
            placeholderTitle={fieldDisplayName ?? 'Field details unavailable'}
            placeholderDescription="Field details are not available for this game."
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={(event) => {
              event.stopPropagation();
              handleFieldDialogClose();
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default GameCard;
