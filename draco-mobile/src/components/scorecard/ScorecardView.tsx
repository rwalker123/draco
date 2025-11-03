import { useCallback, useMemo, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import { colors } from '../../theme/colors';
import { useScorecardStore } from '../../state/scorecardStore';
import { useAuth } from '../../hooks/useAuth';
import { useScoreSync } from '../../hooks/useScoreSync';
import {
  type AtBatResult,
  type BaseName,
  type RunnerAdvance,
  type RunnerEventInput,
  type RunnerState,
  type ScoreEvent,
  type ScoreEventInput,
  type ScorecardGame,
  type SubstitutionRole
} from '../../types/scoring';
import { generateId } from '../../utils/id';
import {
  buildRunnerInput,
  getRunnerFromGame,
  initialRunnerState,
  runnerBaseOrder,
  type RunnerFormState
} from './runnerUtils';

const AT_BAT_OPTIONS: { label: string; value: AtBatResult }[] = [
  { label: '1B', value: 'single' },
  { label: '2B', value: 'double' },
  { label: '3B', value: 'triple' },
  { label: 'HR', value: 'home_run' },
  { label: 'BB', value: 'walk' },
  { label: 'HBP', value: 'hit_by_pitch' },
  { label: 'K', value: 'strikeout_swinging' },
  { label: 'Kc', value: 'strikeout_looking' },
  { label: 'Ground Out', value: 'ground_out' },
  { label: 'Fly Out', value: 'fly_out' },
  { label: 'Sac Fly', value: 'sacrifice_fly' },
  { label: 'Error', value: 'reach_on_error' },
  { label: 'Fielder’s Choice', value: 'fielders_choice' }
];

type RunnerDecision = 'hold' | 'advance1' | 'advance2' | 'score' | 'out';

type RunnerDecisionConfig = {
  key: RunnerDecision;
  label: string;
};

const RUNNER_DECISIONS: Record<BaseName, RunnerDecisionConfig[]> = {
  first: [
    { key: 'hold', label: 'Hold' },
    { key: 'advance1', label: '+1' },
    { key: 'advance2', label: '+2' },
    { key: 'score', label: 'Score' },
    { key: 'out', label: 'Out' }
  ],
  second: [
    { key: 'hold', label: 'Hold' },
    { key: 'advance1', label: '+1' },
    { key: 'score', label: 'Score' },
    { key: 'out', label: 'Out' }
  ],
  third: [
    { key: 'hold', label: 'Hold' },
    { key: 'score', label: 'Score' },
    { key: 'out', label: 'Out' }
  ]
};

type AtBatFormState = {
  batterId: string | null;
  batterName: string;
  result: AtBatResult;
  pitches: string;
  notes: string;
  runnerDecisions: Partial<Record<BaseName, RunnerDecision>>;
};

type SubstitutionFormState = {
  role: SubstitutionRole;
  incomingName: string;
  outgoingSelection: string | null;
  outgoingName: string;
  position: string;
  notes: string;
};

type ActiveFormType = 'at_bat' | 'runner' | 'substitution';

type ScorecardViewProps = {
  game: ScorecardGame;
};

const initialAtBatState = (): AtBatFormState => ({
  batterId: null,
  batterName: '',
  result: 'single',
  pitches: '1',
  notes: '',
  runnerDecisions: {}
});

const initialSubstitutionState = (): SubstitutionFormState => ({
  role: 'batter',
  incomingName: '',
  outgoingSelection: null,
  outgoingName: '',
  position: '',
  notes: ''
});

function decisionToDestination(base: BaseName, decision: RunnerDecision): RunnerEventInput['to'] | BaseName | null {
  switch (decision) {
    case 'hold':
      return null;
    case 'advance1':
      if (base === 'first') return 'second';
      if (base === 'second') return 'third';
      return 'home';
    case 'advance2':
      if (base === 'first') return 'third';
      if (base === 'second') return 'home';
      return null;
    case 'score':
      return 'home';
    case 'out':
      return 'out';
    default:
      return null;
  }
}

function baseLabel(base: BaseName): string {
  switch (base) {
    case 'first':
      return '1B';
    case 'second':
      return '2B';
    case 'third':
      return '3B';
    default:
      return base;
  }
}

function formatHalfLabel(game: ScorecardGame): string {
  const inning = game.state.inning;
  const half = game.state.half === 'top' ? 'Top' : 'Bottom';
  return `${half} ${inning}`;
}

function baseOccupancySummary(game: ScorecardGame): string {
  return runnerBaseOrder
    .map((base) => {
      const runner = game.state.bases[base];
      return runner ? `${baseLabel(base)}: ${runner.name}` : `${baseLabel(base)}: —`;
    })
    .join('  ');
}

function buildBatterAdvance(result: AtBatResult): RunnerEventInput['to'] | BaseName | 'home' | 'out' | null {
  switch (result) {
    case 'single':
      return 'first';
    case 'double':
      return 'second';
    case 'triple':
      return 'third';
    case 'home_run':
      return 'home';
    case 'walk':
    case 'hit_by_pitch':
    case 'reach_on_error':
    case 'fielders_choice':
      return 'first';
    default:
      return null;
  }
}

function RunnerDecisionRow({
  base,
  runner,
  value,
  onChange
}: {
  base: BaseName;
  runner: RunnerState;
  value: RunnerDecision | undefined;
  onChange: (decision: RunnerDecision) => void;
}) {
  const options = RUNNER_DECISIONS[base];
  return (
    <View style={styles.runnerRow}>
      <Text style={styles.runnerName}>{`${runner.name} (${baseLabel(base)})`}</Text>
      <View style={styles.runnerOptions}>
        {options.map((option) => {
          const active = value === option.key;
          return (
            <Pressable
              key={option.key}
              accessibilityRole="button"
              accessibilityLabel={`${runner.name} ${option.label}`}
              onPress={() => onChange(option.key)}
              style={[styles.optionChip, active && styles.optionChipActive]}
            >
              <Text style={[styles.optionChipLabel, active && styles.optionChipLabelActive]}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function SectionHeader({ title }: { title: string }) {
  return <Text style={styles.sectionHeader}>{title}</Text>;
}

function SummaryCard({ game }: { game: ScorecardGame }) {
  return (
    <View style={styles.summaryCard}>
      <View style={styles.summaryTeams}>
        <View style={styles.summaryTeamColumn}>
          <Text style={styles.teamLabel}>{game.metadata.awayTeam}</Text>
          <Text style={styles.teamScore}>{game.state.score.away}</Text>
        </View>
        <View style={styles.summaryTeamColumn}>
          <Text style={styles.teamLabel}>{game.metadata.homeTeam}</Text>
          <Text style={styles.teamScore}>{game.state.score.home}</Text>
        </View>
      </View>
      <View style={styles.summaryMeta}>
        <Text style={styles.summaryText}>{formatHalfLabel(game)}</Text>
        <Text style={styles.summaryText}>{`Outs: ${game.state.outs}`}</Text>
        <Text style={styles.summaryText}>{baseOccupancySummary(game)}</Text>
      </View>
      <View style={styles.summaryMeta}>
        <Text style={styles.summaryText}>{`Pitch Count: ${game.derived.pitching.totalPitches}`}</Text>
        <Text style={styles.summaryText}>{`AB: ${game.derived.batting.atBats}`}</Text>
        <Text style={styles.summaryText}>{`Hits: ${game.derived.batting.hits}  RBI: ${game.derived.batting.rbi}`}</Text>
      </View>
    </View>
  );
}

export function ScorecardView({ game }: ScorecardViewProps) {
  const { session } = useAuth();
  const recordEvent = useScorecardStore((state) => state.recordEvent);
  const editEvent = useScorecardStore((state) => state.editEvent);
  const deleteEvent = useScorecardStore((state) => state.deleteEvent);
  const undo = useScorecardStore((state) => state.undo);
  const redo = useScorecardStore((state) => state.redo);
  const deviceId = useRef(`device-${Platform.OS}`).current;
  const { enqueueEvent, removeEventMutations, failedMutations, retry, status } = useScoreSync();

  const [formType, setFormType] = useState<ActiveFormType>('at_bat');
  const [atBatState, setAtBatState] = useState<AtBatFormState>(initialAtBatState);
  const [runnerState, setRunnerState] = useState<RunnerFormState>(initialRunnerState);
  const [substitutionState, setSubstitutionState] = useState<SubstitutionFormState>(initialSubstitutionState);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const buildAudit = useCallback(
    () => ({
      userName: session?.user.userName ?? 'Scorekeeper',
      deviceId,
      timestamp: new Date().toISOString(),
    }),
    [deviceId, session?.user.userName],
  );

  const availableRunners = useMemo(() => {
    return runnerBaseOrder
      .map((base) => {
        const runner = game.state.bases[base];
        return runner ? { base, runner } : null;
      })
      .filter((value): value is { base: BaseName; runner: RunnerState } => Boolean(value));
  }, [game.state.bases]);

  const resetForm = () => {
    setAtBatState(initialAtBatState());
    setRunnerState(initialRunnerState());
    setSubstitutionState(initialSubstitutionState());
    setEditingEventId(null);
    setError(null);
  };

  const applyEventInput = async (input: ScoreEventInput) => {
    if (editingEventId) {
      await editEvent(game.metadata.gameId, editingEventId, input);
      const latest = useScorecardStore
        .getState()
        .games[game.metadata.gameId]?.events.find((event) => event.id === editingEventId);

      if (latest) {
        await removeEventMutations(latest.id);
        const audit = buildAudit();
        const mutationType = latest.serverId ? 'update' : 'create';
        await enqueueEvent(latest, audit, mutationType);
      }
    } else {
      const created = await recordEvent(game.metadata.gameId, input, {
        userName: session?.user.userName ?? 'Scorekeeper',
        deviceId,
        accountId: session?.accountId ?? 'offline'
      });
      const audit = buildAudit();
      await enqueueEvent(created, audit);
    }
  };

  const handleSubmit = async () => {
    try {
      let input: ScoreEventInput | null = null;
      if (formType === 'at_bat') {
        input = buildAtBatInput(game, atBatState);
      } else if (formType === 'runner') {
        input = buildRunnerInput(game, runnerState);
      } else {
        input = buildSubstitutionInput(game, substitutionState);
      }

      if (!input) {
        setError('Unable to build event. Please complete required fields.');
        return;
      }

      await applyEventInput(input);
      resetForm();
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Unable to record play';
      setError(message);
    }
  };

  const startEditing = (event: ScoreEvent) => {
    setEditingEventId(event.id);
    setFormType(event.input.type);
    if (event.input.type === 'at_bat') {
      setAtBatState({
        batterId: event.input.batter.id,
        batterName: event.input.batter.name,
        result: event.input.result,
        pitches: event.input.pitches ? String(event.input.pitches) : '1',
        notes: event.input.notes ?? '',
        runnerDecisions: deriveRunnerDecisions(event.input.advances)
      });
    } else if (event.input.type === 'runner') {
      setRunnerState({
        runnerId: event.input.runner.id,
        runner: event.input.runner,
        base: event.input.from,
        action: event.input.action,
        destination: event.input.to,
        notes: event.input.notes ?? ''
      });
    } else {
      setSubstitutionState({
        role: event.input.role,
        incomingName: event.input.incoming.name,
        outgoingSelection: event.input.outgoing?.id ?? null,
        outgoingName: event.input.outgoing?.name ?? '',
        position: event.input.position ?? '',
        notes: event.input.notes ?? ''
      });
    }
  };

  const handleDelete = (eventId: string) => {
    Alert.alert('Delete event', 'Are you sure you want to delete this play?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            const currentGame = useScorecardStore.getState().games[game.metadata.gameId];
            const target = currentGame?.events.find((event) => event.id === eventId);

            await removeEventMutations(eventId);

            if (target?.serverId) {
              const audit = buildAudit();
              await enqueueEvent(target, audit, 'delete');
            }

            await deleteEvent(game.metadata.gameId, eventId);
            if (editingEventId === eventId) {
              resetForm();
            }
          })();
        }
      }
    ]);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <SummaryCard game={game} />

      {(status.pending > 0 || status.failed > 0) && (
        <View style={[styles.syncBanner, status.failed > 0 && styles.syncBannerError]}>
          <Text style={styles.syncBannerText}>
            {status.failed > 0
              ? `${status.failed} play${status.failed === 1 ? '' : 's'} need attention`
              : `${status.pending} play${status.pending === 1 ? '' : 's'} syncing…`}
          </Text>
          {status.failed > 0 && failedMutations.length > 0 ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => void retry(failedMutations[0].id)}
              style={styles.syncBannerButton}
            >
              <Text style={styles.syncBannerButtonText}>Retry</Text>
            </Pressable>
          ) : null}
        </View>
      )}

      <View style={styles.toolbar}>
        <Pressable
          accessibilityRole="button"
          style={[styles.toolbarButton, game.events.length === 0 && styles.toolbarButtonDisabled]}
          onPress={() => void undo(game.metadata.gameId)}
          disabled={game.events.length === 0}
        >
          <Text style={styles.toolbarButtonLabel}>Undo</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          style={[styles.toolbarButton, game.redoStack.length === 0 && styles.toolbarButtonDisabled]}
          onPress={() => void redo(game.metadata.gameId)}
          disabled={game.redoStack.length === 0}
        >
          <Text style={styles.toolbarButtonLabel}>Redo</Text>
        </Pressable>
        <Pressable accessibilityRole="button" style={styles.toolbarButton} onPress={resetForm}>
          <Text style={styles.toolbarButtonLabel}>{editingEventId ? 'Cancel Edit' : 'Reset'}</Text>
        </Pressable>
      </View>

      <View style={styles.formSwitcher}>
        {(['at_bat', 'runner', 'substitution'] as ActiveFormType[]).map((type) => {
          const active = formType === type;
          return (
            <Pressable
              key={type}
              accessibilityRole="button"
              onPress={() => {
                setFormType(type);
                setError(null);
              }}
              style={[styles.switchButton, active && styles.switchButtonActive]}
            >
              <Text style={[styles.switchButtonLabel, active && styles.switchButtonLabelActive]}>
                {type === 'at_bat' ? 'At-Bat' : type === 'runner' ? 'Runner' : 'Substitution'}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {formType === 'at_bat' && (
        <AtBatForm
          state={atBatState}
          onChange={setAtBatState}
          runners={availableRunners}
        />
      )}

      {formType === 'runner' && (
        <RunnerForm
          state={runnerState}
          onChange={setRunnerState}
          runners={availableRunners}
        />
      )}

      {formType === 'substitution' && (
        <SubstitutionForm
          state={substitutionState}
          onChange={setSubstitutionState}
          runners={availableRunners}
        />
      )}

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <Pressable accessibilityRole="button" style={styles.submitButton} onPress={() => void handleSubmit()}>
        <Text style={styles.submitButtonLabel}>{editingEventId ? 'Update Play' : 'Record Play'}</Text>
      </Pressable>

      <SectionHeader title="Event Log" />
      <FlatList
        data={[...game.events].reverse()}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <EventRow event={item} onEdit={startEditing} onDelete={handleDelete} />
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>No plays recorded yet.</Text>}
        scrollEnabled={false}
        contentContainerStyle={styles.eventList}
      />
    </ScrollView>
  );
}

function deriveRunnerDecisions(advances: RunnerAdvance[]): Partial<Record<BaseName, RunnerDecision>> {
  const decisions: Partial<Record<BaseName, RunnerDecision>> = {};
  advances.forEach((advance) => {
    if (advance.start === 'batter') {
      return;
    }
    const base = advance.start;
    const end = advance.end;
    if (end === 'out') {
      decisions[base] = 'out';
    } else if (end === 'home') {
      decisions[base] = 'score';
    } else if (end === 'second' || end === 'first') {
      decisions[base] = 'advance1';
    } else if (end === 'third') {
      decisions[base] = advance.start === 'first' ? 'advance2' : 'advance1';
    }
  });
  return decisions;
}

function buildAtBatInput(game: ScorecardGame, state: AtBatFormState): ScoreEventInput | null {
  const batter: RunnerState = {
    id: state.batterId ?? generateId('runner'),
    name: state.batterName.trim() || 'Batter'
  };

  const advances: RunnerAdvance[] = [];
  const batterAdvance = buildBatterAdvance(state.result);
  if (batterAdvance && batterAdvance !== 'out') {
    advances.push({ runner: batter, start: 'batter', end: batterAdvance });
  } else if (state.result === 'home_run') {
    advances.push({ runner: batter, start: 'batter', end: 'home', rbis: 1 });
  }

  runnerBaseOrder.forEach((base) => {
    const runner = game.state.bases[base];
    if (!runner) {
      return;
    }

    const decision = state.runnerDecisions[base];
    const destination = decision
      ? decisionToDestination(base, decision)
      : state.result === 'home_run'
        ? 'home'
        : null;

    if (!destination) {
      return;
    }

    advances.push({
      runner,
      start: base,
      end: destination,
      rbis: destination === 'home' ? 1 : 0
    });
  });

  return {
    type: 'at_bat',
    batter,
    result: state.result,
    pitches: Number.parseInt(state.pitches, 10) || 1,
    notes: state.notes || undefined,
    advances
  };
}

function buildSubstitutionInput(
  game: ScorecardGame,
  state: SubstitutionFormState
): ScoreEventInput | null {
  const incoming: RunnerState = {
    id: generateId('runner'),
    name: state.incomingName.trim() || 'Player'
  };

  let outgoing: RunnerState | null = null;
  if (state.role === 'runner') {
    const selection = getRunnerFromGame(game, state.outgoingSelection);
    if (selection) {
      outgoing = selection.runner;
    } else if (state.outgoingName.trim()) {
      outgoing = { id: generateId('runner'), name: state.outgoingName.trim() };
    }
  } else if (state.outgoingName.trim()) {
    outgoing = { id: generateId('runner'), name: state.outgoingName.trim() };
  }

  return {
    type: 'substitution',
    role: state.role,
    incoming,
    outgoing: outgoing ?? undefined,
    position: state.position || undefined,
    notes: state.notes || undefined
  };
}

function AtBatForm({
  state,
  onChange,
  runners
}: {
  state: AtBatFormState;
  onChange: (next: AtBatFormState) => void;
  runners: { base: BaseName; runner: RunnerState }[];
}) {
  return (
    <View style={styles.formSection}>
      <SectionHeader title="At-Bat Result" />
      <TextInput
        accessibilityLabel="Batter name"
        placeholder="Batter name"
        placeholderTextColor={colors.mutedText}
        style={styles.textInput}
        value={state.batterName}
        onChangeText={(value) => onChange({ ...state, batterName: value })}
      />
      <View style={styles.optionGrid}>
        {AT_BAT_OPTIONS.map((option) => {
          const active = state.result === option.value;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="button"
              style={[styles.optionChip, active && styles.optionChipActive]}
              onPress={() => onChange({ ...state, result: option.value })}
            >
              <Text style={[styles.optionChipLabel, active && styles.optionChipLabelActive]}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>
      <TextInput
        accessibilityLabel="Pitch count"
        placeholder="Pitches"
        placeholderTextColor={colors.mutedText}
        style={styles.textInput}
        keyboardType={Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'numeric'}
        value={state.pitches}
        onChangeText={(value) => onChange({ ...state, pitches: value })}
      />
      <TextInput
        accessibilityLabel="Notes"
        placeholder="Notes"
        placeholderTextColor={colors.mutedText}
        style={[styles.textInput, styles.multilineInput]}
        multiline
        numberOfLines={2}
        value={state.notes}
        onChangeText={(value) => onChange({ ...state, notes: value })}
      />

      {runners.length > 0 && (
        <View style={styles.runnerContainer}>
          <SectionHeader title="Runner Decisions" />
          {runners.map(({ base, runner }) => (
            <RunnerDecisionRow
              key={runner.id}
              base={base}
              runner={runner}
              value={state.runnerDecisions[base]}
              onChange={(decision) =>
                onChange({
                  ...state,
                  runnerDecisions: {
                    ...state.runnerDecisions,
                    [base]: decision
                  }
                })
              }
            />
          ))}
        </View>
      )}
    </View>
  );
}

function RunnerForm({
  state,
  onChange,
  runners
}: {
  state: RunnerFormState;
  onChange: (next: RunnerFormState) => void;
  runners: { base: BaseName; runner: RunnerState }[];
}) {
  return (
    <View style={styles.formSection}>
      <SectionHeader title="Runner Event" />
      <View style={styles.runnerPicker}>
        {runners.map(({ runner, base }) => {
          const active = state.runnerId === runner.id;
          return (
            <Pressable
              key={runner.id}
              accessibilityRole="button"
              style={[styles.optionChip, active && styles.optionChipActive]}
              onPress={() =>
                onChange({
                  ...state,
                  runnerId: runner.id,
                  runner,
                  base,
                  destination: base === 'third' ? 'home' : base === 'second' ? 'third' : 'second'
                })
              }
            >
              <Text style={[styles.optionChipLabel, active && styles.optionChipLabelActive]}>
                {`${runner.name} (${baseLabel(base)})`}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.runnerOptions}>
        {(['stolen_base', 'caught_stealing', 'pickoff', 'advance'] as RunnerEventInput['action'][]).map((action) => {
          const active = state.action === action;
          return (
            <Pressable
              key={action}
              accessibilityRole="button"
              style={[styles.optionChip, active && styles.optionChipActive]}
              onPress={() =>
                onChange({
                  ...state,
                  action,
                  destination:
                    action === 'caught_stealing' || action === 'pickoff'
                      ? 'out'
                      : state.destination
                })
              }
            >
              <Text style={[styles.optionChipLabel, active && styles.optionChipLabelActive]}>
                {action === 'stolen_base'
                  ? 'Stolen Base'
                  : action === 'caught_stealing'
                  ? 'Caught Stealing'
                  : action === 'pickoff'
                  ? 'Pickoff'
                  : 'Advance'}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {state.action !== 'caught_stealing' && state.action !== 'pickoff' ? (
        <View style={styles.runnerOptions}>
          {(['second', 'third', 'home'] as RunnerEventInput['to'][]).map((destination) => {
            const active = state.destination === destination;
            return (
              <Pressable
                key={destination}
                accessibilityRole="button"
                style={[styles.optionChip, active && styles.optionChipActive]}
                onPress={() => onChange({ ...state, destination })}
              >
                <Text style={[styles.optionChipLabel, active && styles.optionChipLabelActive]}>
                  {destination === 'home' ? 'Home' : destination === 'second' ? '2B' : '3B'}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      <TextInput
        accessibilityLabel="Notes"
        placeholder="Notes"
        placeholderTextColor={colors.mutedText}
        style={[styles.textInput, styles.multilineInput]}
        multiline
        numberOfLines={2}
        value={state.notes}
        onChangeText={(value) => onChange({ ...state, notes: value })}
      />
    </View>
  );
}

function SubstitutionForm({
  state,
  onChange,
  runners
}: {
  state: SubstitutionFormState;
  onChange: (next: SubstitutionFormState) => void;
  runners: { base: BaseName; runner: RunnerState }[];
}) {
  return (
    <View style={styles.formSection}>
      <SectionHeader title="Substitution" />
      <View style={styles.runnerOptions}>
        {(['batter', 'runner', 'pitcher', 'fielder'] as SubstitutionRole[]).map((role) => {
          const active = state.role === role;
          return (
            <Pressable
              key={role}
              accessibilityRole="button"
              style={[styles.optionChip, active && styles.optionChipActive]}
              onPress={() => onChange({ ...state, role })}
            >
              <Text style={[styles.optionChipLabel, active && styles.optionChipLabelActive]}>
                {role === 'batter'
                  ? 'Batter'
                  : role === 'runner'
                  ? 'Runner'
                  : role === 'pitcher'
                  ? 'Pitcher'
                  : 'Fielder'}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <TextInput
        accessibilityLabel="Incoming player"
        placeholder="Incoming player"
        placeholderTextColor={colors.mutedText}
        style={styles.textInput}
        value={state.incomingName}
        onChangeText={(value) => onChange({ ...state, incomingName: value })}
      />

      {state.role === 'runner' && runners.length > 0 ? (
        <View style={styles.runnerOptions}>
          {runners.map(({ runner }) => {
            const active = state.outgoingSelection === runner.id;
            return (
              <Pressable
                key={runner.id}
                accessibilityRole="button"
                style={[styles.optionChip, active && styles.optionChipActive]}
                onPress={() => onChange({ ...state, outgoingSelection: runner.id, outgoingName: '' })}
              >
                <Text style={[styles.optionChipLabel, active && styles.optionChipLabelActive]}>
                  {runner.name}
                </Text>
              </Pressable>
            );
          })}
          <Pressable
            accessibilityRole="button"
            style={[styles.optionChip, state.outgoingSelection === 'custom' && styles.optionChipActive]}
            onPress={() => onChange({ ...state, outgoingSelection: 'custom' })}
          >
            <Text
              style={[
                styles.optionChipLabel,
                state.outgoingSelection === 'custom' && styles.optionChipLabelActive
              ]}
            >
              Other
            </Text>
          </Pressable>
        </View>
      ) : null}

      {(state.role !== 'runner' || state.outgoingSelection === 'custom') && (
        <TextInput
          accessibilityLabel="Outgoing player"
          placeholder="Outgoing player (optional)"
          placeholderTextColor={colors.mutedText}
          style={styles.textInput}
          value={state.outgoingName}
          onChangeText={(value) => onChange({ ...state, outgoingName: value })}
        />
      )}

      <TextInput
        accessibilityLabel="Position"
        placeholder="Position or role"
        placeholderTextColor={colors.mutedText}
        style={styles.textInput}
        value={state.position}
        onChangeText={(value) => onChange({ ...state, position: value })}
      />

      <TextInput
        accessibilityLabel="Notes"
        placeholder="Notes"
        placeholderTextColor={colors.mutedText}
        style={[styles.textInput, styles.multilineInput]}
        multiline
        numberOfLines={2}
        value={state.notes}
        onChangeText={(value) => onChange({ ...state, notes: value })}
      />
    </View>
  );
}

function EventRow({
  event,
  onEdit,
  onDelete
}: {
  event: ScoreEvent;
  onEdit: (event: ScoreEvent) => void;
  onDelete: (eventId: string) => void;
}) {
  return (
    <View style={styles.eventRow}>
      <View style={styles.eventMeta}>
        <Text style={styles.eventNotation}>{event.notation}</Text>
        <Text style={styles.eventSummary}>{event.summary}</Text>
        <Text style={styles.eventDetail}>{`${event.half === 'top' ? 'Top' : 'Bottom'} ${event.inning}`}</Text>
      </View>
      <View style={styles.eventActions}>
        <Pressable accessibilityRole="button" style={styles.eventActionButton} onPress={() => onEdit(event)}>
          <Text style={styles.eventActionLabel}>Edit</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          style={[styles.eventActionButton, styles.eventDeleteButton]}
          onPress={() => onDelete(event.id)}
        >
          <Text style={styles.eventActionLabel}>Delete</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 48,
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 16
  },
  summaryCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    gap: 12
  },
  summaryTeams: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  summaryTeamColumn: {
    alignItems: 'center',
    flex: 1
  },
  teamLabel: {
    color: colors.mutedText,
    fontSize: 14,
    marginBottom: 4
  },
  teamScore: {
    color: colors.primaryText,
    fontSize: 28,
    fontWeight: '700'
  },
  summaryMeta: {
    gap: 4
  },
  summaryText: {
    color: colors.primaryText,
    fontSize: 14
  },
  syncBanner: {
    marginTop: 12,
    marginBottom: 4,
    padding: 12,
    borderRadius: 8,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12
  },
  syncBannerError: {
    backgroundColor: '#7f1d1d'
  },
  syncBannerText: {
    flex: 1,
    color: colors.primaryText,
    fontSize: 14,
    fontWeight: '600'
  },
  syncBannerButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: colors.primary
  },
  syncBannerButtonText: {
    color: colors.primaryText,
    fontSize: 14,
    fontWeight: '700'
  },
  toolbar: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between'
  },
  toolbarButton: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center'
  },
  toolbarButtonDisabled: {
    opacity: 0.5
  },
  toolbarButtonLabel: {
    color: colors.primaryText,
    fontSize: 15,
    fontWeight: '600'
  },
  formSwitcher: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 4,
    gap: 4
  },
  switchButton: {
    flex: 1,
    borderRadius: 6,
    paddingVertical: 10,
    alignItems: 'center'
  },
  switchButtonActive: {
    backgroundColor: colors.primary
  },
  switchButtonLabel: {
    color: colors.mutedText,
    fontSize: 14,
    fontWeight: '600'
  },
  switchButtonLabelActive: {
    color: colors.primaryText
  },
  formSection: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    gap: 12
  },
  sectionHeader: {
    color: colors.primaryText,
    fontSize: 16,
    fontWeight: '700'
  },
  textInput: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: colors.primaryText,
    fontSize: 15
  },
  multilineInput: {
    minHeight: 72,
    textAlignVertical: 'top'
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  optionChip: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: colors.surface
  },
  optionChipActive: {
    backgroundColor: colors.primary
  },
  optionChipLabel: {
    color: colors.mutedText,
    fontSize: 14,
    fontWeight: '600'
  },
  optionChipLabelActive: {
    color: colors.primaryText
  },
  runnerContainer: {
    gap: 8
  },
  runnerRow: {
    gap: 6
  },
  runnerName: {
    color: colors.primaryText,
    fontSize: 15,
    fontWeight: '600'
  },
  runnerOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  runnerPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center'
  },
  submitButtonLabel: {
    color: colors.primaryText,
    fontSize: 16,
    fontWeight: '700'
  },
  errorText: {
    color: colors.danger,
    fontSize: 14
  },
  eventList: {
    gap: 12,
    paddingBottom: 32
  },
  emptyText: {
    color: colors.mutedText,
    fontSize: 14,
    textAlign: 'center'
  },
  eventRow: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    gap: 12
  },
  eventMeta: {
    gap: 4
  },
  eventNotation: {
    color: colors.primaryText,
    fontSize: 16,
    fontWeight: '700'
  },
  eventSummary: {
    color: colors.primaryText,
    fontSize: 15
  },
  eventDetail: {
    color: colors.mutedText,
    fontSize: 13
  },
  eventActions: {
    flexDirection: 'row',
    gap: 12
  },
  eventActionButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: colors.surface
  },
  eventDeleteButton: {
    backgroundColor: '#dc2626'
  },
  eventActionLabel: {
    color: colors.primaryText,
    fontSize: 14,
    fontWeight: '600'
  }
});
