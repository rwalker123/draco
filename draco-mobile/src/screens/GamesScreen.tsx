import { useEffect, useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { colors } from '../theme/colors';
import { ScreenContainer } from '../components/ScreenContainer';
import { useScheduleStore, selectUpcomingGames } from '../state/scheduleStore';
import { useScorecardStore, selectActiveGame } from '../state/scorecardStore';
import { ScorecardView } from '../components/scorecard/ScorecardView';
import { useAuth } from '../hooks/useAuth';

function formatStartTime(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}

export function GamesScreen() {
  const { session } = useAuth();
  const hydrateSchedule = useScheduleStore((state) => state.hydrate);
  const scheduleStatus = useScheduleStore((state) => state.status);
  const upcomingGames = useScheduleStore(selectUpcomingGames);
  const setActiveGame = useScorecardStore((state) => state.setActiveGame);
  const clearGame = useScorecardStore((state) => state.clearGame);
  const hydrateScorecard = useScorecardStore((state) => state.hydrate);
  const activeGame = useScorecardStore(selectActiveGame);
  const activeGameId = useScorecardStore((state) => state.activeGameId);

  useEffect(() => {
    void hydrateSchedule();
    void hydrateScorecard();
  }, [hydrateSchedule, hydrateScorecard]);

  const greeting = useMemo(() => {
    if (!session?.user?.userName) {
      return 'Scorecard';
    }
    return `Scorecard – ${session.user.userName}`;
  }, [session?.user?.userName]);

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.heading}>{greeting}</Text>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upcoming Assignments</Text>
          {scheduleStatus === 'loading' && <Text style={styles.subtitle}>Loading schedule…</Text>}
          {upcomingGames.length === 0 && scheduleStatus === 'idle' ? (
            <Text style={styles.subtitle}>No upcoming games assigned.</Text>
          ) : (
            upcomingGames.map((game) => {
              const active = game.id === activeGameId;
              return (
                <Pressable
                  key={game.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Start scoring ${game.visitorTeam.name} at ${game.homeTeam.name}`}
                  onPress={() => void setActiveGame(game)}
                  style={[styles.gameCard, active && styles.gameCardActive]}
                >
                  <View style={styles.gameTeams}>
                    <Text style={styles.gameTeam}>{game.visitorTeam.name}</Text>
                    <Text style={styles.vsLabel}>@</Text>
                    <Text style={styles.gameTeam}>{game.homeTeam.name}</Text>
                  </View>
                  <Text style={styles.gameMeta}>{formatStartTime(game.startsAt)}</Text>
                  {game.field?.name ? (
                    <Text style={styles.gameMeta}>{game.field.name}</Text>
                  ) : null}
                  {active && <Text style={styles.activeBadge}>Active</Text>}
                </Pressable>
              );
            })
          )}
        </View>

        {activeGame ? (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Live Scorecard</Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => void clearGame(activeGame.metadata.gameId)}
                style={styles.clearButton}
              >
                <Text style={styles.clearButtonLabel}>Close Game</Text>
              </Pressable>
            </View>
            <ScorecardView game={activeGame} />
          </View>
        ) : (
          <View style={styles.section}>
            <Text style={styles.subtitle}>
              Select an upcoming game to launch the live scorecard interface.
            </Text>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 40,
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 24,
    backgroundColor: colors.background
  },
  heading: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primaryText
  },
  section: {
    gap: 16
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primaryText
  },
  subtitle: {
    fontSize: 15,
    color: colors.mutedText
  },
  gameCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    gap: 8
  },
  gameCardActive: {
    borderColor: colors.primary,
    borderWidth: 1
  },
  gameTeams: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  gameTeam: {
    color: colors.primaryText,
    fontSize: 16,
    fontWeight: '600'
  },
  vsLabel: {
    color: colors.mutedText,
    fontSize: 14
  },
  gameMeta: {
    color: colors.mutedText,
    fontSize: 14
  },
  activeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    color: colors.primaryText,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    fontSize: 12,
    fontWeight: '600'
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.surface
  },
  clearButtonLabel: {
    color: colors.primaryText,
    fontSize: 14,
    fontWeight: '600'
  }
});
