import React, { useRef, useState, useEffect } from 'react';
import { Box, Typography, IconButton as MuiIconButton } from '@mui/material';
import EventIcon from '@mui/icons-material/Event';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import GameCard, { GameCardData } from './GameCard';
import { DEFAULT_TIMEZONE } from '../utils/timezones';
import WidgetShell, { type WidgetAccent } from './ui/WidgetShell';

export interface GameRecap {
  teamId: string;
  recap: string;
}

export interface Game extends GameCardData {
  hasGameRecap: boolean;
  gameRecaps: GameRecap[];
}

export interface GameListSection {
  title: string;
  games: Game[];
}

export interface GameListDisplayProps {
  sections: GameListSection[];
  emptyMessage?: string;
  canEditGames?: boolean;
  onEnterGameResults?: (game: Game) => void;
  canEditRecap?: (game: Game) => boolean;
  onEditRecap?: (game: Game) => void;
  onViewRecap?: (game: Game) => void;
  layout?: 'vertical' | 'horizontal';
  timeZone?: string;
  accent?: WidgetAccent | 'none';
}

const GameListDisplay: React.FC<GameListDisplayProps> = ({
  sections,
  emptyMessage = 'No games to display.',
  canEditGames = false,
  onEnterGameResults,
  canEditRecap,
  onEditRecap,
  onViewRecap,
  layout = 'vertical',
  timeZone = DEFAULT_TIMEZONE,
  accent = 'warning',
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Check scroll position and update navigation buttons
  const checkScrollPosition = () => {
    if (!scrollContainerRef.current) return;

    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
  };

  // Scroll functions
  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: -300,
        behavior: 'smooth',
      });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: 300,
        behavior: 'smooth',
      });
    }
  };

  // Add scroll event listener
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container && layout === 'horizontal') {
      container.addEventListener('scroll', checkScrollPosition);
      checkScrollPosition(); // Initial check

      return () => {
        container.removeEventListener('scroll', checkScrollPosition);
      };
    }
  }, [layout, sections]);

  return (
    <WidgetShell
      accent={accent}
      disablePadding
      sx={{
        mb: 2,
        minWidth: 0,
      }}
    >
      <Box
        sx={{
          p: 4,
        }}
      >
        {sections.map((section) => (
          <Box key={section.title} mb={1.5}>
            <Typography
              variant="h5"
              gutterBottom
              sx={{
                fontWeight: 'bold',
                color: 'text.primary',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                mb: 3,
              }}
            >
              <EventIcon color="action" />
              {section.title}
            </Typography>
            {section.games.length > 0 ? (
              <Box sx={{ position: 'relative', width: '100%' }}>
                {/* Navigation Buttons - Only show for horizontal layout */}
                {layout === 'horizontal' && (
                  <>
                    {canScrollLeft && (
                      <MuiIconButton
                        onClick={scrollLeft}
                        sx={{
                          position: 'absolute',
                          left: -20,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          zIndex: 2,
                          bgcolor: 'background.paper',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                          '&:hover': {
                            bgcolor: 'background.paper',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
                          },
                        }}
                        size="small"
                      >
                        <ChevronLeftIcon />
                      </MuiIconButton>
                    )}
                    {canScrollRight && (
                      <MuiIconButton
                        onClick={scrollRight}
                        sx={{
                          position: 'absolute',
                          right: -20,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          zIndex: 2,
                          bgcolor: 'background.paper',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                          '&:hover': {
                            bgcolor: 'background.paper',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
                          },
                        }}
                        size="small"
                      >
                        <ChevronRightIcon />
                      </MuiIconButton>
                    )}
                  </>
                )}

                <Box
                  ref={scrollContainerRef}
                  sx={{
                    display: layout === 'horizontal' ? 'flex' : 'block',
                    flexWrap: 'nowrap',
                    gap: layout === 'horizontal' ? 2 : 0,
                    overflowX: layout === 'horizontal' ? 'auto' : 'visible',
                    overflowY: 'hidden',
                    pb: layout === 'horizontal' ? 1 : 0,
                    pt: layout === 'horizontal' ? 0.5 : 0,
                    width: '100%',
                    scrollBehavior: 'smooth',
                    // Hide scrollbars but keep functionality
                    '&::-webkit-scrollbar': {
                      display: 'none',
                    },
                    scrollbarWidth: 'none', // Firefox
                    msOverflowStyle: 'none', // IE/Edge
                    // Touch scrolling improvements
                    WebkitOverflowScrolling: 'touch',
                  }}
                >
                  {layout === 'horizontal'
                    ? section.games.map((game) => (
                        <GameCard
                          key={game.id}
                          game={game}
                          layout={layout}
                          canEditGames={canEditGames}
                          onEnterGameResults={onEnterGameResults}
                          canEditRecap={canEditRecap}
                          onEditRecap={onEditRecap}
                          onViewRecap={onViewRecap}
                          fitContent={true}
                          timeZone={timeZone}
                        />
                      ))
                    : section.games.map((game, index) => (
                        <Box key={game.id} sx={{ mt: index === 0 ? 0.5 : 0 }}>
                          <GameCard
                            game={game}
                            layout={layout}
                            canEditGames={canEditGames}
                            onEnterGameResults={onEnterGameResults}
                            canEditRecap={canEditRecap}
                            onEditRecap={onEditRecap}
                            onViewRecap={onViewRecap}
                            timeZone={timeZone}
                          />
                        </Box>
                      ))}
                </Box>
              </Box>
            ) : (
              <Typography color="text.secondary" textAlign="center" mt={2}>
                {emptyMessage}
              </Typography>
            )}
          </Box>
        ))}
      </Box>
    </WidgetShell>
  );
};

export default GameListDisplay;
