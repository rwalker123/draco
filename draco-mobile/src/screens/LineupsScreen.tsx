import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { colors } from '../theme/colors';
import { ScreenContainer } from '../components/ScreenContainer';
import { useLineupManager } from '../hooks/useLineupManager';
import { useScheduleData } from '../hooks/useScheduleData';
import { useAuth } from '../hooks/useAuth';
import type {
  GameLineupAssignment,
  LineupSlot,
  LineupTemplate,
  LineupTemplatePayload,
  TeamRosterPlayer
} from '../types/lineups';
import type { ScorekeeperAssignment, TeamSummary, UpcomingGame } from '../types/schedule';
import { generateId } from '../utils/id';
import { fetchTeamRoster } from '../services/lineups/teamRosterService';

type FormMode = 'create' | 'edit';

export function LineupsScreen() {
  const {
    templates,
    status,
    error,
    isOnline,
    syncEnabled,
    pendingCount,
    refresh,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    assignToGame,
    assignments: assignmentsByGameId
  } = useLineupManager();
  const { session } = useAuth();
  const accountId = session?.accountId ?? null;
  const sessionToken = session?.token ?? null;
  const { teams, assignments: scorekeeperAssignments, upcomingGames, seasonId } = useScheduleData();

  const permittedTeams = useMemo(
    () => filterTeamsByPermission(teams, scorekeeperAssignments),
    [teams, scorekeeperAssignments],
  );

  const assignmentsByTemplate = useMemo(() => {
    return Object.values(assignmentsByGameId).reduce<Record<string, GameLineupAssignment>>((acc, assignment) => {
      acc[assignment.templateId] = assignment;
      return acc;
    }, {});
  }, [assignmentsByGameId]);

  const upcomingGameLookup = useMemo(() => {
    return upcomingGames.reduce<Record<string, UpcomingGame>>((acc, game) => {
      acc[game.id] = game;
      return acc;
    }, {});
  }, [upcomingGames]);

  const [formVisible, setFormVisible] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>('create');
  const [activeTemplate, setActiveTemplate] = useState<LineupTemplate | undefined>();
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [assignmentTemplate, setAssignmentTemplate] = useState<LineupTemplate | null>(null);
  const [assignmentError, setAssignmentError] = useState<string | null>(null);

  const openCreateForm = () => {
    setFormMode('create');
    setActiveTemplate(undefined);
    setFormVisible(true);
    setFormError(null);
  };

  const openEditForm = (template: LineupTemplate) => {
    setFormMode('edit');
    setActiveTemplate(template);
    setFormVisible(true);
    setFormError(null);
  };

  const handleFormSubmit = async (payload: LineupTemplatePayload) => {
    setSubmitting(true);
    setFormError(null);
    try {
      if (formMode === 'create') {
        await createTemplate(payload);
      } else {
        await updateTemplate(payload);
      }
      setFormVisible(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save lineup');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (template: LineupTemplate) => {
    Alert.alert(
      'Delete lineup?',
      `This will remove ${template.name} from your device. The deletion will sync once the lineup API is available.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void deleteTemplate(template.id).catch((err) => {
              Alert.alert('Unable to delete lineup', err instanceof Error ? err.message : 'Unknown error');
            });
          }
        }
      ]
    );
  };

  const handleAssign = async (game: UpcomingGame) => {
    if (!assignmentTemplate) {
      return;
    }

    setAssignmentError(null);
    try {
      await assignToGame({
        gameId: game.id,
        templateId: assignmentTemplate.id,
        updatedAt: new Date().toISOString()
      });
      setAssignmentTemplate(null);
    } catch (err) {
      setAssignmentError(err instanceof Error ? err.message : 'Failed to assign lineup');
    }
  };

  const pendingBanner = pendingCount > 0
    ? syncEnabled
      ? `Pending sync: ${pendingCount} change${pendingCount === 1 ? '' : 's'}`
      : `Saved locally: ${pendingCount} change${pendingCount === 1 ? '' : 's'}`
    : null;

  return (
    <ScreenContainer>
      <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.heading}>Lineup Templates</Text>
        <Pressable
          style={[styles.refreshButton, !syncEnabled ? styles.refreshButtonDisabled : null]}
          onPress={() => void refresh()}
          disabled={!syncEnabled}
        >
          <Text style={[styles.refreshText, !syncEnabled ? styles.refreshTextDisabled : null]}>Refresh</Text>
        </Pressable>
      </View>
      <View style={styles.statusRow}>
        <View style={[styles.statusPill, isOnline ? styles.statusOnline : styles.statusOffline]}>
          <View style={[styles.statusDot, isOnline ? styles.dotOnline : styles.dotOffline]} />
          <Text style={styles.statusText}>{isOnline ? 'Online' : 'Offline'}</Text>
        </View>
        {pendingBanner ? <Text style={styles.pendingText}>{pendingBanner}</Text> : null}
      </View>
      {!syncEnabled ? (
        <Text style={styles.helperText}>
          Lineup sync is coming soon. Templates you create are stored on this device and will sync once the backend
          API launches.
        </Text>
      ) : null}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      <Pressable style={styles.primaryButton} onPress={openCreateForm}>
        <Text style={styles.primaryButtonText}>New lineup template</Text>
      </Pressable>
      {permittedTeams.length === 0 ? (
        <Text style={styles.helperText}>
          You do not currently have lineup permissions for any teams. Ask a league administrator to grant access.
        </Text>
      ) : null}
      <ScrollView contentContainerStyle={styles.listContainer}>
        {templates.map((template) => (
          <View key={template.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{template.name}</Text>
                <Text style={styles.cardSubtitle}>{lookupTeamName(template.teamId, teams) ?? 'Team unavailable'}</Text>
              </View>
            <StatusBadge template={template} syncEnabled={syncEnabled} />
            </View>
            <Text style={styles.cardMeta}>{template.slots.length} players</Text>
            {assignmentsByTemplate[template.id] ? (
              <Text style={styles.cardAssignment}>
                Assigned game:{' '}
                {renderGameSummary(assignmentsByTemplate[template.id], upcomingGameLookup)}
              </Text>
            ) : null}
            <View style={styles.cardActions}>
              <Pressable style={styles.secondaryButton} onPress={() => openEditForm(template)}>
                <Text style={styles.secondaryButtonText}>Edit</Text>
              </Pressable>
              <Pressable style={styles.secondaryButton} onPress={() => setAssignmentTemplate(template)}>
                <Text style={styles.secondaryButtonText}>Assign</Text>
              </Pressable>
              <Pressable style={styles.destructiveButton} onPress={() => handleDelete(template)}>
                <Text style={styles.destructiveButtonText}>Delete</Text>
              </Pressable>
            </View>
          </View>
        ))}
        {templates.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>{status === 'loading' ? 'Loading templates...' : 'No saved lineups'}</Text>
            <Text style={styles.emptyBody}>
              {status === 'loading'
                ? 'Loading lineup templates stored on this device.'
                : 'Create a lineup template for each team you score to speed up pre-game setup.'}
            </Text>
          </View>
        ) : null}
      </ScrollView>

      <Modal visible={formVisible} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <LineupForm
              mode={formMode}
              template={activeTemplate}
              teams={permittedTeams}
              accountId={accountId}
              seasonId={seasonId ?? null}
              token={sessionToken}
              isOnline={isOnline}
              onCancel={() => setFormVisible(false)}
              onSubmit={handleFormSubmit}
              submitting={submitting}
              error={formError}
              assignments={scorekeeperAssignments}
            />
          </View>
        </View>
      </Modal>

      <Modal visible={Boolean(assignmentTemplate)} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Assign to game</Text>
            {assignmentError ? <Text style={styles.errorText}>{assignmentError}</Text> : null}
            <ScrollView style={{ maxHeight: 320 }}>
              {upcomingGames.map((game) => (
                <Pressable key={game.id} style={styles.assignmentRow} onPress={() => void handleAssign(game)}>
                  <Text style={styles.assignmentTitle}>
                    {game.homeTeam.name ?? 'Home'} vs {game.visitorTeam.name ?? 'Visitors'}
                  </Text>
                  <Text style={styles.assignmentSubtitle}>{new Date(game.startsAt).toLocaleString()}</Text>
                </Pressable>
              ))}
              {upcomingGames.length === 0 ? (
                <Text style={styles.emptyBody}>No upcoming games available for assignment.</Text>
              ) : null}
            </ScrollView>
            <Pressable style={styles.secondaryButton} onPress={() => setAssignmentTemplate(null)}>
              <Text style={styles.secondaryButtonText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
      </View>
    </ScreenContainer>
  );
}

function filterTeamsByPermission(teams: TeamSummary[], assignments: ScorekeeperAssignment[]): TeamSummary[] {
  if (assignments.some((assignment) => assignment.scope === 'account')) {
    return teams;
  }

  const allowedTeamIds = new Set<string>();
  const allowedLeagueIds = new Set<string>();

  assignments.forEach((assignment) => {
    if (assignment.scope === 'team') {
      if (assignment.teamSeasonId) {
        allowedTeamIds.add(assignment.teamSeasonId);
      }
      if (assignment.teamId) {
        allowedTeamIds.add(assignment.teamId);
      }
    }

    if (assignment.scope === 'league' && assignment.leagueId) {
      allowedLeagueIds.add(assignment.leagueId);
    }
  });

  if (allowedTeamIds.size === 0 && allowedLeagueIds.size === 0) {
    return teams;
  }

  return teams.filter((team) => {
    if (allowedTeamIds.has(team.id)) {
      return true;
    }

    const leagueId = team.league?.id ?? null;
    if (leagueId && allowedLeagueIds.has(leagueId)) {
      return true;
    }

    return false;
  });
}

function lookupTeamName(teamId: string, teams: TeamSummary[]): string | null {
  const team = teams.find((item) => item.id === teamId);
  return team?.name ?? null;
}

function renderGameSummary(assignment: GameLineupAssignment, lookup: Record<string, UpcomingGame>): string {
  const game = lookup[assignment.gameId];
  if (!game) {
    return assignment.gameId;
  }

  const matchup = `${game.homeTeam.name ?? 'Home'} vs ${game.visitorTeam.name ?? 'Visitors'}`;
  const date = new Date(game.startsAt).toLocaleDateString();
  return `${matchup} (${date})`;
}

type LineupFormProps = {
  mode: FormMode;
  template?: LineupTemplate;
  teams: TeamSummary[];
  assignments: ScorekeeperAssignment[];
  accountId: string | null;
  seasonId: string | null;
  token: string | null;
  isOnline: boolean;
  onSubmit: (payload: LineupTemplatePayload) => Promise<void>;
  onCancel: () => void;
  submitting: boolean;
  error: string | null;
};

function LineupForm({
  mode,
  template,
  teams,
  assignments,
  accountId,
  seasonId,
  token,
  isOnline,
  onSubmit,
  onCancel,
  submitting,
  error
}: LineupFormProps) {
  const [name, setName] = useState(template?.name ?? '');
  const [teamId, setTeamId] = useState(template?.teamId ?? (teams[0]?.id ?? ''));
  const [slots, setSlots] = useState<LineupSlot[]>(() =>
    template?.slots.map((slot) => ({ ...slot })) ?? [createEmptySlot(1)],
  );
  const [teamPickerOpen, setTeamPickerOpen] = useState(false);
  const [rosterPickerOpen, setRosterPickerOpen] = useState(false);
  const [activeRosterSlot, setActiveRosterSlot] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [roster, setRoster] = useState<TeamRosterPlayer[]>([]);
  const [rosterStatus, setRosterStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [rosterError, setRosterError] = useState<string | null>(null);

  const selectedTeam = teams.find((team) => team.id === teamId) ?? null;

  const scope = useMemo(() => inferScope(teamId, assignments), [teamId, assignments]);

  const previousTeamIdRef = useRef<string>(teamId);

  useEffect(() => {
    if (previousTeamIdRef.current === teamId) {
      return;
    }
    previousTeamIdRef.current = teamId;
    setSlots((current) =>
      current.map((slot) => ({
        ...slot,
        rosterMemberId: null,
        playerId: null,
        contactId: null
      })),
    );
  }, [teamId]);

  useEffect(() => {
    if (!teams.some((team) => team.id === teamId)) {
      setTeamId(teams[0]?.id ?? '');
    }
  }, [teamId, teams]);

  useEffect(() => {
    if (!teamId) {
      setRoster([]);
      setRosterStatus('idle');
      setRosterError(null);
      return;
    }

    if (!isOnline || !accountId || !seasonId || !token) {
      setRoster([]);
      setRosterStatus('idle');
      setRosterError(null);
      return;
    }

    let isCancelled = false;

    const loadRoster = async () => {
      setRosterStatus('loading');
      setRosterError(null);
      try {
        const players = await fetchTeamRoster({
          token,
          accountId,
          seasonId,
          teamSeasonId: teamId
        });
        if (isCancelled) {
          return;
        }
        setRoster(players);
        setRosterStatus('idle');
      } catch (err) {
        if (isCancelled) {
          return;
        }
        setRosterStatus('error');
        setRosterError(err instanceof Error ? err.message : 'Unable to load roster for this team.');
      }
    };

    void loadRoster();

    return () => {
      isCancelled = true;
    };
  }, [accountId, isOnline, seasonId, teamId, token]);

  const rosterMessage = useMemo(() => {
    if (!teamId) {
      return null;
    }
    if (!isOnline) {
      return 'Connect to load the latest roster for this team.';
    }
    if (!accountId || !seasonId || !token) {
      return 'Roster data is unavailable. Enter player names manually for now.';
    }
    return null;
  }, [accountId, isOnline, seasonId, teamId, token]);

  const updateSlotName = useCallback((slotId: string, value: string) => {
    setSlots((current) =>
      current.map((slot) =>
        slot.id === slotId
          ? {
              ...slot,
              playerName: value,
              rosterMemberId: null,
              playerId: null,
              contactId: null
            }
          : slot,
      ),
    );
  }, []);

  const updateSlotPosition = useCallback((slotId: string, value: string) => {
    setSlots((current) =>
      current.map((slot) => (slot.id === slotId ? { ...slot, position: value } : slot)),
    );
  }, []);

  const removeSlot = useCallback((slotId: string) => {
    setSlots((current) => current.filter((slot) => slot.id !== slotId));
  }, []);

  const moveSlot = useCallback((slotId: string, direction: -1 | 1) => {
    setSlots((current) => {
      const index = current.findIndex((slot) => slot.id === slotId);
      if (index === -1) {
        return current;
      }

      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= current.length) {
        return current;
      }

      const next = [...current];
      const [removed] = next.splice(index, 1);
      next.splice(targetIndex, 0, removed);
      return next.map((slot, idx) => ({ ...slot, order: idx + 1 }));
    });
  }, []);

  const addSlot = useCallback(() => {
    setSlots((current) => [...current, createEmptySlot(current.length + 1)]);
  }, []);

  const openRosterPicker = useCallback(
    (slotId: string) => {
      if (roster.length === 0) {
        return;
      }
      setActiveRosterSlot(slotId);
      setRosterPickerOpen(true);
    },
    [roster.length],
  );

  const closeRosterPicker = useCallback(() => {
    setRosterPickerOpen(false);
    setActiveRosterSlot(null);
  }, []);

  const applyRosterSelection = useCallback(
    (player: TeamRosterPlayer) => {
      if (!activeRosterSlot) {
        return;
      }
      setSlots((current) =>
        current.map((slot) =>
          slot.id === activeRosterSlot
            ? {
                ...slot,
                playerName: player.displayName,
                rosterMemberId: player.rosterMemberId,
                playerId: player.playerId,
                contactId: player.contactId
              }
            : slot,
        ),
      );
      closeRosterPicker();
    },
    [activeRosterSlot, closeRosterPicker],
  );

  const rosterOptions = useMemo(() => {
    if (!activeRosterSlot) {
      return [];
    }
    const selectedIds = new Set(
      slots
        .filter((slot) => slot.rosterMemberId && slot.id !== activeRosterSlot)
        .map((slot) => slot.rosterMemberId as string),
    );
    return [...roster]
      .filter((player) => !selectedIds.has(player.rosterMemberId))
      .sort((a, b) => {
        if (a.playerNumber && b.playerNumber && a.playerNumber !== b.playerNumber) {
          return a.playerNumber - b.playerNumber;
        }
        return a.displayName.localeCompare(b.displayName);
      });
  }, [activeRosterSlot, roster, slots]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setLocalError('Enter a template name.');
      return;
    }

    if (!teamId) {
      setLocalError('Select a team for this template.');
      return;
    }

    const normalizedSlots = slots
      .filter((slot) => slot.playerName.trim().length > 0)
      .map((slot, index) => ({
        ...slot,
        order: index + 1,
        playerName: slot.playerName.trim(),
        position: slot.position.trim()
      }));

    if (normalizedSlots.length === 0) {
      setLocalError('Add at least one player to the lineup.');
      return;
    }

    const payload: LineupTemplatePayload = {
      id: template?.id ?? generateId('lineup'),
      name: name.trim(),
      teamId,
      leagueId: selectedTeam?.league?.id ?? null,
      scope: template?.scope ?? scope,
      slots: normalizedSlots.map((slot) => ({
        id: slot.id,
        order: slot.order,
        playerName: slot.playerName,
        position: slot.position,
        rosterMemberId: slot.rosterMemberId ?? undefined,
        playerId: slot.playerId ?? undefined,
        contactId: slot.contactId ?? undefined
      }))
    };

    setLocalError(null);
    await onSubmit(payload);
  };

  const rosterStatusMessage = useMemo(() => {
    if (!teamId) {
      return null;
    }
    if (rosterStatus === 'loading') {
      return 'Loading roster…';
    }
    if (rosterStatus === 'error') {
      return rosterError ?? 'Unable to load roster for this team.';
    }
    return rosterMessage;
  }, [rosterError, rosterMessage, rosterStatus, teamId]);

  return (
    <View style={styles.formContainer}>
      <Text style={styles.modalTitle}>{mode === 'create' ? 'Create lineup template' : 'Edit lineup template'}</Text>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {localError ? <Text style={styles.errorText}>{localError}</Text> : null}
      <TextInput
        style={styles.textInput}
        placeholder="Template name"
        placeholderTextColor={colors.mutedText}
        value={name}
        onChangeText={setName}
      />
      <Pressable style={styles.selector} onPress={() => setTeamPickerOpen(true)}>
        <Text style={styles.selectorLabel}>Team</Text>
        <Text style={styles.selectorValue}>{selectedTeam?.name ?? 'Select team'}</Text>
      </Pressable>
      {rosterStatusMessage ? <Text style={styles.helperText}>{rosterStatusMessage}</Text> : null}
      <ScrollView style={styles.slotList}>
        {slots.map((slot) => (
          <View key={slot.id} style={styles.slotRow}>
            <TextInput
              style={styles.textInput}
              placeholder="Player name"
              placeholderTextColor={colors.mutedText}
              value={slot.playerName}
              onChangeText={(value) => updateSlotName(slot.id, value)}
            />
            {slot.rosterMemberId ? <Text style={styles.rosterTag}>Roster: {slot.playerName}</Text> : null}
            <TextInput
              style={styles.textInput}
              placeholder="Position"
              placeholderTextColor={colors.mutedText}
              value={slot.position}
              onChangeText={(value) => updateSlotPosition(slot.id, value)}
            />
            <View style={styles.slotActions}>
              {roster.length > 0 && rosterStatus === 'idle' ? (
                <Pressable style={styles.slotButton} onPress={() => openRosterPicker(slot.id)}>
                  <Text style={styles.slotButtonText}>Pick</Text>
                </Pressable>
              ) : null}
              <Pressable style={styles.slotButton} onPress={() => moveSlot(slot.id, -1)}>
                <Text style={styles.slotButtonText}>↑</Text>
              </Pressable>
              <Pressable style={styles.slotButton} onPress={() => moveSlot(slot.id, 1)}>
                <Text style={styles.slotButtonText}>↓</Text>
              </Pressable>
              <Pressable style={styles.slotButton} onPress={() => removeSlot(slot.id)}>
                <Text style={styles.slotButtonText}>✕</Text>
              </Pressable>
            </View>
          </View>
        ))}
      </ScrollView>
      <Pressable style={styles.secondaryButton} onPress={addSlot}>
        <Text style={styles.secondaryButtonText}>Add player</Text>
      </Pressable>
      <View style={styles.formActions}>
        <Pressable style={styles.secondaryButton} onPress={onCancel} disabled={submitting}>
          <Text style={styles.secondaryButtonText}>Cancel</Text>
        </Pressable>
        <Pressable
          style={[styles.primaryButton, submitting ? styles.primaryButtonDisabled : null]}
          onPress={() => void handleSubmit()}
          disabled={submitting}
        >
          <Text style={styles.primaryButtonText}>{submitting ? 'Saving…' : 'Save template'}</Text>
        </Pressable>
      </View>

      <Modal visible={teamPickerOpen} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select team</Text>
            <ScrollView style={{ maxHeight: 320 }}>
              {teams.map((teamOption) => (
                <Pressable
                  key={teamOption.id}
                  style={styles.assignmentRow}
                  onPress={() => {
                    setTeamId(teamOption.id);
                    setTeamPickerOpen(false);
                  }}
                >
                  <Text style={styles.assignmentTitle}>{teamOption.name ?? teamOption.id}</Text>
                  <Text style={styles.assignmentSubtitle}>{teamOption.league?.name ?? 'League not set'}</Text>
                </Pressable>
              ))}
              {teams.length === 0 ? (
                <Text style={styles.emptyBody}>No teams available for your scorekeeper role.</Text>
              ) : null}
            </ScrollView>
            <Pressable style={styles.secondaryButton} onPress={() => setTeamPickerOpen(false)}>
              <Text style={styles.secondaryButtonText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal visible={rosterPickerOpen} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select roster player</Text>
            {rosterStatus === 'loading' ? <Text style={styles.helperText}>Loading roster…</Text> : null}
            {rosterStatus === 'error' && rosterError ? <Text style={styles.errorText}>{rosterError}</Text> : null}
            <ScrollView style={{ maxHeight: 320 }}>
              {rosterOptions.length > 0 ? (
                rosterOptions.map((player) => (
                  <Pressable
                    key={player.rosterMemberId}
                    style={styles.assignmentRow}
                    onPress={() => applyRosterSelection(player)}
                  >
                    <Text style={styles.assignmentTitle}>{player.displayName}</Text>
                    <Text style={styles.assignmentSubtitle}>Tap to add to lineup</Text>
                  </Pressable>
                ))
              ) : (
                <Text style={styles.emptyBody}>All roster players are already in this lineup.</Text>
              )}
            </ScrollView>
            <Pressable style={styles.secondaryButton} onPress={closeRosterPicker}>
              <Text style={styles.secondaryButtonText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function inferScope(teamId: string, assignments: ScorekeeperAssignment[]): ScorekeeperAssignment['scope'] {
  if (assignments.some((assignment) => assignment.scope === 'account')) {
    return 'account';
  }

  const teamAssignment = assignments.find((assignment) => assignment.scope === 'team' && (assignment.teamSeasonId === teamId || assignment.teamId === teamId));
  if (teamAssignment) {
    return 'team';
  }

  const teamLeagueAssignments = assignments.find((assignment) => assignment.scope === 'league');
  return teamLeagueAssignments ? 'league' : 'team';
}

function createEmptySlot(order: number): LineupSlot {
  return {
    id: generateId('slot'),
    order,
    playerName: '',
    position: '',
    rosterMemberId: null,
    playerId: null,
    contactId: null
  };
}

type StatusBadgeProps = {
  template: LineupTemplate;
  syncEnabled: boolean;
};

function StatusBadge({ template, syncEnabled }: StatusBadgeProps) {
  if (template.status === 'synced' && !template.pendingAction) {
    return <Text style={styles.statusSynced}>Synced</Text>;
  }

  if (template.status === 'pending') {
    return <Text style={styles.statusPending}>{syncEnabled ? 'Syncing…' : 'Saved locally'}</Text>;
  }

  return <Text style={styles.statusFailed}>Needs attention</Text>;
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
    alignItems: 'center'
  },
  heading: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.primaryText
  },
  refreshButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.card
  },
  refreshButtonDisabled: {
    opacity: 0.6
  },
  refreshText: {
    color: colors.primaryText,
    fontWeight: '600',
    fontSize: 12
  },
  refreshTextDisabled: {
    color: colors.mutedText
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 12
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
  pendingText: {
    color: colors.mutedText,
    fontSize: 12
  },
  errorText: {
    color: colors.danger,
    marginBottom: 8
  },
  helperText: {
    color: colors.mutedText,
    fontSize: 12,
    marginBottom: 12
  },
  primaryButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16
  },
  primaryButtonDisabled: {
    opacity: 0.7
  },
  primaryButtonText: {
    color: colors.primaryText,
    fontWeight: '600'
  },
  secondaryButton: {
    backgroundColor: colors.card,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12
  },
  secondaryButtonText: {
    color: colors.primaryText,
    fontWeight: '600'
  },
  destructiveButton: {
    backgroundColor: 'rgba(220,38,38,0.2)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center'
  },
  destructiveButtonText: {
    color: colors.danger,
    fontWeight: '600'
  },
  listContainer: {
    paddingBottom: 120
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
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
    color: colors.mutedText
  },
  cardAssignment: {
    fontSize: 12,
    color: colors.mutedText,
    marginTop: 4
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12
  },
  emptyState: {
    paddingVertical: 48,
    alignItems: 'center'
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
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 24
  },
  modalContent: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.primaryText,
    marginBottom: 12
  },
  formContainer: {
    gap: 12
  },
  textInput: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.primaryText,
    marginBottom: 8
  },
  selector: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 12
  },
  selectorLabel: {
    fontSize: 12,
    color: colors.mutedText,
    marginBottom: 4
  },
  selectorValue: {
    color: colors.primaryText,
    fontWeight: '600'
  },
  slotList: {
    maxHeight: 240
  },
  slotRow: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12
  },
  rosterTag: {
    fontSize: 12,
    color: colors.mutedText,
    marginBottom: 8
  },
  slotActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8
  },
  slotButton: {
    backgroundColor: colors.card,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6
  },
  slotButtonText: {
    color: colors.primaryText,
    fontWeight: '600'
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 12
  },
  assignmentRow: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12
  },
  assignmentTitle: {
    color: colors.primaryText,
    fontWeight: '600'
  },
  assignmentSubtitle: {
    color: colors.mutedText,
    marginTop: 4
  },
  statusSynced: {
    color: '#22c55e',
    fontWeight: '600'
  },
  statusPending: {
    color: '#facc15',
    fontWeight: '600'
  },
  statusFailed: {
    color: colors.danger,
    fontWeight: '600'
  }
});
