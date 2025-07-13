import React, { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Avatar,
  LinearProgress,
  IconButton,
} from '@mui/material';
import NewspaperRecapIcon from './icons/NewspaperRecapIcon';
import SkipPreviousIcon from '@mui/icons-material/SkipPrevious';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import PauseIcon from '@mui/icons-material/Pause';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { AnimatePresence, motion } from 'framer-motion';
import './GameRecapsWidget.css';

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
    setLoading(true);
    setError(null);
    // Calculate two-week date range
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 14);
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + 1); // inclusive of today
    // Format as YYYY-MM-DD
    const startStr = startDate.toISOString().slice(0, 10);
    const endStr = endDate.toISOString().slice(0, 10);
    let url = `/api/accounts/${accountId}/seasons/${seasonId}/games?hasRecap=true&startDate=${startStr}&endDate=${endStr}`;
    if (teamSeasonId) {
      url += `&teamId=${teamSeasonId}`;
    }
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (!data.success) throw new Error(data.message || 'Failed to load game recaps');
        // Flatten all recaps for all games into a single array
        let flatRecaps: GameRecapFlat[] = [];
        for (const game of data.data.games) {
          if (game.recaps && Array.isArray(game.recaps)) {
            for (const recap of game.recaps) {
              // Find the team name for this recap
              let teamName = '';
              if (recap.teamId === game.homeTeamId) teamName = game.homeTeamName;
              else if (recap.teamId === game.visitorTeamId) teamName = game.visitorTeamName;
              else teamName = 'Unknown Team';
              flatRecaps.push({
                id: game.id,
                gameDate: game.gameDate,
                league: game.league,
                homeTeamName: game.homeTeamName,
                visitorTeamName: game.visitorTeamName,
                homeScore: game.homeScore,
                visitorScore: game.visitorScore,
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
      })
      .catch((err) => setError(err.message || 'Error loading game recaps'))
      .finally(() => setLoading(false));
  }, [accountId, seasonId, teamSeasonId, maxRecaps]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 180 }}>
        <CircularProgress />
      </Box>
    );
  }
  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }
  if (!recapList.length) {
    return null;
  }

  // Show the current recap
  const recapItem = recapList[currentIndex];

  // Animation variants for slide and fade
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

  // Handler for manual next click, resets the timer
  const handleNext = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    setProgress(0);
    setCurrentIndex((prev) => (prev + 1) % recapList.length);
  };

  // Handler for manual previous click, resets the timer
  const handlePrev = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    setProgress(0);
    setCurrentIndex((prev) => (prev - 1 + recapList.length) % recapList.length);
  };

  // Handler for pause/play toggle
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
        <Card
          sx={{
            mb: 4,
            borderRadius: 2,
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            position: 'relative',
          }}
        >
          <CardContent sx={{ pb: 7 }}>
            <Box
              sx={{ display: 'flex', alignItems: 'center', mb: 2, justifyContent: 'space-between' }}
            >
              <Avatar sx={{ bgcolor: '#1e3a8a', mr: 2, width: 40, height: 40 }}>
                <NewspaperRecapIcon size={28} color="#1e3a8a" />
              </Avatar>
              <Box>
                <Typography
                  variant="h6"
                  component="div"
                  sx={{ fontWeight: 'bold', color: '#1e3a8a' }}
                >
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
              sx={{ fontWeight: 'bold', color: '#1e3a8a', mb: 1, display: 'block' }}
            >
              {recapItem.teamName}
            </Typography>
            <Typography variant="body2" sx={{ whiteSpace: 'pre-line', mb: 2 }}>
              {recapItem.recap}
            </Typography>
          </CardContent>
          {recapList.length > 1 && (
            <Box
              sx={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 0,
                px: 2,
                pb: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: 0.5,
                zIndex: 1,
              }}
            >
              <Box
                sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 0.5 }}
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
              <LinearProgress
                variant="determinate"
                value={progress}
                sx={{ height: 4, borderRadius: 2 }}
              />
            </Box>
          )}
        </Card>
      </motion.div>
    </AnimatePresence>
  );
};

export default GameRecapsWidget;
