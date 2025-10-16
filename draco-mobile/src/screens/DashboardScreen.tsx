import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useMemo, useState } from 'react';
import { colors } from '../theme/colors';
import { useScheduleData } from '../hooks/useScheduleData';

export function DashboardScreen() {
  const { upcomingGames, status, error, isOnline, refresh, hydrated } = useScheduleData();
  const [refreshing, setRefreshing] = useState(false);

  const sortedGames = useMemo(() => upcomingGames, [upcomingGames]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.heading}>Upcoming Assignments</Text>
        <View style={[styles.statusPill, isOnline ? styles.statusOnline : styles.statusOffline]}>
          <View style={[styles.statusDot, isOnline ? styles.dotOnline : styles.dotOffline]} />
          <Text style={styles.statusText}>{isOnline ? 'Online' : 'Offline'}</Text>
        </View>
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      <FlatList
        data={sortedGames}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing || status === 'loading'} onRefresh={handleRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>{hydrated && status !== 'loading' ? 'No upcoming games' : 'Loading schedule...'}</Text>
            <Text style={styles.emptyBody}>
              {hydrated && status !== 'loading'
                ? 'Assignments synced from the league schedule will appear here as soon as they are available.'
                : 'Fetching your assignments and cached schedule data.'}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              {item.homeTeam.name ?? 'Home'} vs {item.visitorTeam.name ?? 'Visitors'}
            </Text>
            <Text style={styles.cardSubtitle}>{new Date(item.startsAt).toLocaleString()}</Text>
            <Text style={styles.cardMeta}>
              {item.field?.name ? `Field: ${item.field.name}` : 'Field TBA'} • {item.league?.name ?? 'League TBA'}
            </Text>
            {item.gameStatusText ? <Text style={styles.cardStatus}>Status: {item.gameStatusText}</Text> : null}
          </View>
        )}
        contentContainerStyle={sortedGames.length === 0 ? styles.listEmptyContainer : styles.listContainer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 24
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  heading: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.primaryText
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999
  },
  statusOnline: {
    backgroundColor: 'rgba(34,197,94,0.15)'
  },
  statusOffline: {
    backgroundColor: 'rgba(248,113,113,0.15)'
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8
  },
  dotOnline: {
    backgroundColor: '#22c55e'
  },
  dotOffline: {
    backgroundColor: '#f87171'
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primaryText
  },
  errorText: {
    color: '#f87171',
    fontSize: 14,
    marginBottom: 8
  },
  listContainer: {
    paddingBottom: 24,
    gap: 16
  },
  listEmptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
    gap: 12
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primaryText
  },
  cardSubtitle: {
    fontSize: 14,
    color: colors.mutedText,
    marginTop: 4
  },
  cardMeta: {
    fontSize: 14,
    color: colors.mutedText,
    marginTop: 8
  },
  cardStatus: {
    fontSize: 12,
    color: colors.mutedText,
    marginTop: 8
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 24
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.primaryText,
    marginBottom: 8
  },
  emptyBody: {
    fontSize: 14,
    color: colors.mutedText,
    textAlign: 'center'
  }
});
