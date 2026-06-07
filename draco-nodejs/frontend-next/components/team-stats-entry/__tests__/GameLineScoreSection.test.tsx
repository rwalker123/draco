import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { LineScoreType, UpsertLineScoreType } from '@draco/shared-schemas';

import GameLineScoreSection from '../GameLineScoreSection';

const asyncNoop = async () => {};

const makeLineScore = (overrides: {
  home?: Partial<LineScoreType['home']>;
  away?: Partial<LineScoreType['away']>;
}): LineScoreType => ({
  gameId: '1',
  home: {
    teamSeasonId: '100',
    teamName: 'Home Team',
    runsByInning: [1, 0, 0],
    errors: 0,
    hitsOverride: null,
    runs: 4,
    hits: 5,
    authoritative: true,
    enteredByContactId: null,
    enteredAt: null,
    ...overrides.home,
  },
  away: {
    teamSeasonId: '200',
    teamName: 'Away Team',
    runsByInning: [0, 1, 2],
    errors: 1,
    hitsOverride: null,
    runs: 3,
    hits: 6,
    authoritative: false,
    enteredByContactId: null,
    enteredAt: null,
    ...overrides.away,
  },
});

const inningInput = (label: string): HTMLInputElement =>
  screen.getByLabelText(label) as HTMLInputElement;

const renderSection = (
  lineScore: LineScoreType,
  props: {
    editMode?: boolean;
    currentTeamSeasonId?: string;
    canManageAllTeams?: boolean;
    onSave?: (payload: UpsertLineScoreType) => Promise<void>;
  } = {},
) =>
  render(
    <GameLineScoreSection
      lineScore={lineScore}
      loading={false}
      error={null}
      editMode={props.editMode ?? false}
      canEdit
      currentTeamSeasonId={props.currentTeamSeasonId ?? '200'}
      canManageAllTeams={props.canManageAllTeams ?? false}
      onSave={props.onSave ?? asyncNoop}
    />,
  );

const button = (name: RegExp): HTMLButtonElement =>
  screen.getByRole('button', { name }) as HTMLButtonElement;

describe('GameLineScoreSection', () => {
  it('renders "x" for the home half when the home team won without batting in the last inning', () => {
    renderSection(makeLineScore({})); // home 4, away 3 -> home won; last inning unentered

    expect(screen.getByText('x')).toBeTruthy();
    // Unentered away cells render as "-"
    expect(screen.getAllByText('-').length).toBeGreaterThan(0);
  });

  it('locks the opponent side when that team has already entered it', () => {
    // Current user manages the away team; the home side is authoritative (home entered it).
    renderSection(makeLineScore({ home: { authoritative: true } }), {
      editMode: true,
      currentTeamSeasonId: '200',
    });

    expect(inningInput('Home Team inning 1 runs').disabled).toBe(true);
    expect(inningInput('Away Team inning 1 runs').disabled).toBe(false);
  });

  it('lets the opponent fill an unclaimed side', () => {
    // Home side not yet authoritative -> the away manager may provisionally fill it.
    renderSection(makeLineScore({ home: { authoritative: false } }), {
      editMode: true,
      currentTeamSeasonId: '200',
    });

    expect(inningInput('Home Team inning 1 runs').disabled).toBe(false);
  });

  it('lets an admin edit both sides even when the opponent side is authoritative', () => {
    // An account admin (canManageAllTeams) is scoped to the away team's page, but the
    // home side is authoritative. They must still be able to edit it.
    renderSection(makeLineScore({ home: { authoritative: true } }), {
      editMode: true,
      currentTeamSeasonId: '200',
      canManageAllTeams: true,
    });

    expect(inningInput('Home Team inning 1 runs').disabled).toBe(false);
    expect(inningInput('Away Team inning 1 runs').disabled).toBe(false);
  });

  it('warns when the entered innings do not add up to the final score', () => {
    // home.runsByInning sums to 1 but home.runs (final) is 4 -> mismatch.
    renderSection(makeLineScore({}), { editMode: true, currentTeamSeasonId: '100' });

    expect(screen.getByText(/don’t add up to the final score/i)).toBeTruthy();
  });

  it('caps the line score at 18 innings', () => {
    renderSection(makeLineScore({}), { editMode: true, currentTeamSeasonId: '100' });

    const addInning = screen.getByRole('button', { name: /add inning/i });
    // Starts at 7 innings; add until the 18-inning cap is reached.
    for (let i = 0; i < 20; i += 1) {
      if ((addInning as HTMLButtonElement).disabled) {
        break;
      }
      fireEvent.click(addInning);
    }

    expect((addInning as HTMLButtonElement).disabled).toBe(true);
    // 18 inning columns means 18 run inputs for one team.
    expect(screen.getByLabelText('Home Team inning 18 runs')).toBeTruthy();
    expect(screen.queryByLabelText('Home Team inning 19 runs')).toBeNull();
  });

  it('does not warn when innings add up to the final score', () => {
    const lineScore = makeLineScore({
      home: { runsByInning: [1, 0, 0], runs: 1 },
      away: { runsByInning: [0, 1, 2], runs: 3 },
    });

    renderSection(lineScore, { editMode: true, currentTeamSeasonId: '100' });

    expect(screen.queryByText(/don’t add up to the final score/i)).toBeNull();
  });

  it('disables Discard and Save until an editable value changes', () => {
    renderSection(makeLineScore({}), { editMode: true, currentTeamSeasonId: '200' });

    expect(button(/discard/i).disabled).toBe(true);
    expect(button(/save line score/i).disabled).toBe(true);

    fireEvent.change(inningInput('Away Team inning 1 runs'), { target: { value: '5' } });

    expect(button(/discard/i).disabled).toBe(false);
    expect(button(/save line score/i).disabled).toBe(false);
  });

  it('saves only the edited side via onSave', async () => {
    const onSave = vi.fn(async () => {});
    renderSection(makeLineScore({}), { editMode: true, currentTeamSeasonId: '200', onSave });

    fireEvent.change(inningInput('Away Team inning 1 runs'), { target: { value: '7' } });
    fireEvent.click(button(/save line score/i));

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    const payload = onSave.mock.calls[0][0] as UpsertLineScoreType;
    expect(payload.away?.runsByInning[0]).toBe(7);
    expect(payload.home).toBeUndefined();
  });

  it('reverts edits when Discard is clicked', () => {
    renderSection(makeLineScore({}), { editMode: true, currentTeamSeasonId: '200' });

    const input = inningInput('Away Team inning 1 runs');
    expect(input.value).toBe('0');

    fireEvent.change(input, { target: { value: '9' } });
    expect(inningInput('Away Team inning 1 runs').value).toBe('9');

    fireEvent.click(button(/discard/i));
    expect(inningInput('Away Team inning 1 runs').value).toBe('0');
    expect(button(/discard/i).disabled).toBe(true);
  });
});
