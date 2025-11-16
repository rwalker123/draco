import React, { useEffect, useMemo, useState } from 'react';
import {
  Typography,
  Box,
  CircularProgress,
  Alert,
  LinearProgress,
  IconButton,
  useTheme,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import NewspaperRecapIcon from './icons/NewspaperRecapIcon';
import SkipPreviousIcon from '@mui/icons-material/SkipPrevious';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import PauseIcon from '@mui/icons-material/Pause';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { AnimatePresence, motion } from 'framer-motion';
import './GameRecapsWidget.css';
import { listSeasonGames } from '@draco/shared-api-client';
import { useApiClient } from '../hooks/useApiClient';
import { unwrapApiResult } from '../utils/apiResult';
import { sanitizeRichContent } from '../utils/sanitization';
import WidgetShell from './ui/WidgetShell';
import RichTextContent from './common/RichTextContent';

interface GameRecapFlat {
  id: string; // game id
  gameDate: string | null;
  league: { id: string; name: string };
  homeTeamName: string;
  visitorTeamName: string;
  homeScore: number;
  visitorScore: number;
  teamName: string;
  recap: string;
}

interface GameRecapsWidgetProps {
  accountId: string;
  seasonId: string;
  teamSeasonId?: string;
  maxRecaps?: number;
}

const ANIMATION_TYPE = 'slide'; // Change to 'fade' for fade effect

const GameRecapsWidget: React.FC<GameRecapsWidgetProps> = ({
  accountId,
  seasonId,
  teamSeasonId,
  maxRecaps = 0,
}) => {
  const [recapList, setRecapList] = useState<GameRecapFlat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const carouselInterval = 30000; // 30 seconds
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);
  const [progress, setProgress] = useState(0);
  const progressRef = React.useRef<number>(0);
  const progressTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const theme = useTheme();
  const apiClient = useApiClient();

  // Reset index when recaps change
  useEffect(() => {
    setCurrentIndex(0);
    setProgress(0);
    setIsPaused(false);
  }, [recapList]);

  // Carousel auto-advance effect
  useEffect(() => {
    if (recapList.length <= 1 || isPaused) return; // No need to auto-advance if only one recap or paused
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % recapList.length);
    }, carouselInterval);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [currentIndex, recapList, isPaused]);

  // Progress bar effect
  useEffect(() => {
    if (recapList.length <= 1 || isPaused) return;
    setProgress(0);
    progressRef.current = 0;
    if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    const interval = 50; // ms
    const step = (interval / carouselInterval) * 100;
    progressTimerRef.current = setInterval(() => {
      progressRef.current += step;
      setProgress(Math.min(progressRef.current, 100));
    }, interval);
    return () => {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };
  }, [currentIndex, recapList, isPaused]);

  useEffect(() => {
    if (!accountId || !seasonId) return;

    const fetchRecaps = async () => {
      setLoading(true);
      setError(null);

      try {
        const today = new Date();
        const startDate = new Date(today);
        startDate.setDate(today.getDate() - 14);
        const endDate = new Date(today);
        endDate.setDate(today.getDate() + 1);

        const result = await listSeasonGames({
          client: apiClient,
          path: { accountId, seasonId },
          query: {
            hasRecap: true,
            startDate: startDate.toISOString().slice(0, 10),
            endDate: endDate.toISOString().slice(0, 10),
            teamId: teamSeasonId,
            sortOrder: 'desc',
          },
          throwOnError: false,
        });

        const data = unwrapApiResult(result, 'Failed to load game recaps');

        let flatRecaps: GameRecapFlat[] = [];

        for (const game of data.games) {
          const homeTeamId = String(game.homeTeam?.id ?? '');
          const visitorTeamId = String(game.visitorTeam?.id ?? '');
          const homeTeamName = game.homeTeam?.name ?? 'Home Team';
          const visitorTeamName = game.visitorTeam?.name ?? 'Visitor Team';

          if (Array.isArray(game.recaps)) {
            for (const recap of game.recaps) {
              const recapTeamId = String(recap.team?.id ?? '');
              let teamName = recap.team?.name ?? '';

              if (!teamName) {
                if (recapTeamId === homeTeamId) {
                  teamName = homeTeamName;
                } else if (recapTeamId === visitorTeamId) {
                  teamName = visitorTeamName;
                } else {
                  teamName = 'Unknown Team';
                }
              }

              flatRecaps.push({
                id: String(game.id),
                gameDate: game.gameDate ?? null,
                league: {
                  id: String(game.league?.id ?? ''),
                  name: game.league?.name ?? 'League',
                },
                homeTeamName,
                visitorTeamName,
                homeScore: Number(game.homeScore ?? 0),
                visitorScore: Number(game.visitorScore ?? 0),
                teamName,
                recap: recap.recap,
              });
            }
          }
        }

        if (maxRecaps > 0) {
          flatRecaps = flatRecaps.slice(0, maxRecaps);
        }

        setRecapList(flatRecaps);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading game recaps');
      } finally {
        setLoading(false);
      }
    };

    void fetchRecaps();
  }, [accountId, apiClient, seasonId, teamSeasonId, maxRecaps]);

  const sanitizedRecapHtml = useMemo(() => {
    if (!recapList.length) {
      return '<span style="color:#888;">(No recap provided)</span>';
    }

    const clampedIndex = Math.min(currentIndex, recapList.length - 1);
    const recap = recapList[clampedIndex]?.recap ?? '';
    const sanitized = sanitizeRichContent(recap);
    const plainText = sanitized
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (!plainText.length) {
      return '<span style="color:#888;">(No recap provided)</span>';
    }
    return sanitized;
  }, [currentIndex, recapList]);

  const tileStyles = useMemo(() => {
    const baseColor = theme.palette.primary.main;
    const surface = theme.palette.widget.surface;
    const highlightStart = alpha(baseColor, theme.palette.mode === 'dark' ? 0.22 : 0.12);
    const highlightMid = alpha(surface, theme.palette.mode === 'dark' ? 0.92 : 0.98);
    const highlightEnd = alpha(surface, theme.palette.mode === 'dark' ? 0.85 : 0.94);
    const overlay = `radial-gradient(circle at 18% 22%, ${alpha(baseColor, theme.palette.mode === 'dark' ? 0.28 : 0.16)} 0%, ${alpha(baseColor, 0)} 55%),
      radial-gradient(circle at 78% 28%, ${alpha(baseColor, theme.palette.mode === 'dark' ? 0.22 : 0.12)} 0%, ${alpha(baseColor, 0)} 58%),
      radial-gradient(circle at 48% 82%, ${alpha(baseColor, theme.palette.mode === 'dark' ? 0.18 : 0.1)} 0%, ${alpha(baseColor, 0)} 70%)`;

    return {
      background: `linear-gradient(135deg, ${highlightStart} 0%, ${highlightMid} 42%, ${highlightEnd} 100%)`,
      overlay,
      border: theme.palette.widget.border,
      shadow: theme.shadows[theme.palette.mode === 'dark' ? 10 : 3],
    };
  }, [theme]);

  const renderRecapContent = () => {
    if (!recapList.length) {
      return null;
    }

    const clampedIndex = Math.min(currentIndex, recapList.length - 1);
    const recapItem = recapList[clampedIndex];

    const variants = {
      slide: {
        initial: { x: 40, opacity: 0 },
        animate: { x: 0, opacity: 1 },
        exit: { x: -40, opacity: 0 },
        transition: { duration: 0.4 },
      },
      fade: {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.4 },
      },
    };

    const handleNext = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      setProgress(0);
      setCurrentIndex((prev) => (prev + 1) % recapList.length);
    };

    const handlePrev = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      setProgress(0);
      setCurrentIndex((prev) => (prev - 1 + recapList.length) % recapList.length);
    };

    const handlePausePlay = () => {
      setIsPaused((prev) => !prev);
    };

    return (
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={recapItem.id + '-' + recapItem.teamName}
          initial={variants[ANIMATION_TYPE].initial}
          animate={variants[ANIMATION_TYPE].animate}
          exit={variants[ANIMATION_TYPE].exit}
          transition={variants[ANIMATION_TYPE].transition}
          style={{ width: '100%' }}
        >
          <Box
            sx={{
              position: 'relative',
              borderRadius: 2,
              border: `1px solid ${tileStyles.border}`,
              boxShadow: tileStyles.shadow,
              background: tileStyles.background,
              overflow: 'hidden',
              p: { xs: 2.5, sm: 3 },
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                pointerEvents: 'none',
                backgroundImage: tileStyles.overlay,
                opacity: theme.palette.mode === 'dark' ? 0.65 : 0.45,
              }}
            />
            <Box sx={{ position: 'relative', zIndex: 1 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  mb: 2,
                  justifyContent: 'space-between',
                }}
              >
                <Box
                  sx={{
                    mr: 2,
                    width: 40,
                    height: 40,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <NewspaperRecapIcon size={28} color={theme.palette.warning.main} />
                </Box>
                <Box>
                  <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
                    Game Recap
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {recapItem.gameDate ? new Date(recapItem.gameDate).toLocaleDateString() : ''}{' '}
                    &bull; {recapItem.league.name}
                  </Typography>
                </Box>
                {recapList.length > 1 && (
                  <Typography variant="caption" sx={{ ml: 2, minWidth: 60, textAlign: 'right' }}>
                    {currentIndex + 1} of {recapList.length}
                  </Typography>
                )}
              </Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                {recapItem.visitorTeamName} {recapItem.visitorScore} @ {recapItem.homeTeamName}{' '}
                {recapItem.homeScore}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 'bold',
                  color: theme.palette.primary.main,
                  mb: 1,
                  display: 'block',
                }}
              >
                {recapItem.teamName}
              </Typography>
              <RichTextContent html={sanitizedRecapHtml} sanitize={false} sx={{ mb: 2 }} />
              {recapList.length > 1 && (
                <Box
                  sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}
                >
                  <IconButton aria-label="Previous Recap" size="small" onClick={handlePrev}>
                    <SkipPreviousIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    aria-label={isPaused ? 'Play' : 'Pause'}
                    size="small"
                    onClick={handlePausePlay}
                    sx={{ mx: 1 }}
                  >
                    {isPaused ? <PlayArrowIcon fontSize="small" /> : <PauseIcon fontSize="small" />}
                  </IconButton>
                  <IconButton aria-label="Next Recap" size="small" onClick={handleNext}>
                    <SkipNextIcon fontSize="small" />
                  </IconButton>
                </Box>
              )}
              {recapList.length > 1 && (
                <LinearProgress
                  variant="determinate"
                  value={progress}
                  sx={{
                    height: 4,
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.common.white, 0.15),
                  }}
                />
              )}
            </Box>
          </Box>
        </motion.div>
      </AnimatePresence>
    );
  };

  if (!loading && !error && recapList.length === 0) {
    return null;
  }

  const content = (() => {
    if (loading) {
      return (
        <Box
          sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 180 }}
        >
          <CircularProgress />
        </Box>
      );
    }
    if (error) {
      return <Alert severity="error">{error}</Alert>;
    }
    return renderRecapContent();
  })();

  return (
    <WidgetShell
      title={
        <Typography variant="h6" fontWeight={700} color="text.primary">
          Game Recaps
        </Typography>
      }
      subtitle={
        <Typography variant="body2" color="text.secondary">
          Highlights from the last two weeks
        </Typography>
      }
      accent="secondary"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
      }}
    >
      {content}
    </WidgetShell>
  );
};

export default GameRecapsWidget;
