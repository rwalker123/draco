import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useForm, FormProvider } from 'react-hook-form';
import { ScoringConfigurationSection } from '../ScoringConfigurationSection';

interface TestFormValues {
  scoringType: 'individual' | 'team';
  useHandicapScoring: boolean;
  handicapStrokeMethod: 'full' | 'matchPlay';
  useBestBall: boolean;
  teamSize: number;
  holesPerMatch: number;
  absentPlayerMode: string;
  absentPlayerPenalty: number;
  fullTeamAbsentMode: string;
  enablePuttContest: boolean;
  winPoints: number;
  lossPoints: number;
  tiePoints: number;
  perNinePoints: number;
  birdie: number;
  eagle: number;
  par: number;
  ace: number;
}

const defaultValues: TestFormValues = {
  scoringType: 'team',
  useHandicapScoring: true,
  handicapStrokeMethod: 'full',
  useBestBall: false,
  teamSize: 2,
  holesPerMatch: 18,
  absentPlayerMode: 'opponentWins',
  absentPlayerPenalty: 0,
  fullTeamAbsentMode: 'forfeit',
  enablePuttContest: false,
  winPoints: 2,
  lossPoints: 0,
  tiePoints: 1,
  perNinePoints: 0,
  birdie: 0,
  eagle: 0,
  par: 0,
  ace: 0,
};

function TestWrapper({
  values = defaultValues,
  expanded = true,
}: {
  values?: Partial<TestFormValues>;
  expanded?: boolean;
}) {
  const methods = useForm<TestFormValues>({
    defaultValues: { ...defaultValues, ...values },
  });

  return (
    <FormProvider {...methods}>
      <ScoringConfigurationSection control={methods.control} expanded={expanded} />
    </FormProvider>
  );
}

describe('ScoringConfigurationSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('accordion rendering', () => {
    it('renders the Scoring Configuration accordion heading', () => {
      render(<TestWrapper />);

      expect(screen.getByText('Scoring Configuration')).toBeInTheDocument();
    });

    it('shows accordion content when expanded is true', () => {
      render(<TestWrapper expanded />);

      expect(screen.getByText('Scoring Type')).toBeInTheDocument();
    });
  });

  describe('scoring type', () => {
    it('renders Individual Scoring radio option', () => {
      render(<TestWrapper />);

      expect(screen.getByRole('radio', { name: 'Individual Scoring' })).toBeInTheDocument();
    });

    it('renders Team Scoring radio option', () => {
      render(<TestWrapper />);

      expect(screen.getByRole('radio', { name: 'Team Scoring' })).toBeInTheDocument();
    });

    it('disables Team Scoring radio when teamSize is 1', () => {
      render(<TestWrapper values={{ teamSize: 1, scoringType: 'individual' }} />);

      expect(screen.getByRole('radio', { name: 'Team Scoring' })).toBeDisabled();
    });

    it('enables Team Scoring radio when teamSize is greater than 1', () => {
      render(<TestWrapper values={{ teamSize: 2 }} />);

      expect(screen.getByRole('radio', { name: 'Team Scoring' })).not.toBeDisabled();
    });
  });

  describe('handicap mode', () => {
    it('renders Net Scoring radio option', () => {
      render(<TestWrapper />);

      expect(
        screen.getByRole('radio', { name: 'Net Scoring (Handicap Adjusted)' }),
      ).toBeInTheDocument();
    });

    it('renders Actual Scoring radio option', () => {
      render(<TestWrapper />);

      expect(screen.getByRole('radio', { name: 'Actual Scoring (Gross)' })).toBeInTheDocument();
    });

    it('shows stroke distribution method options when useHandicapScoring is true', () => {
      render(<TestWrapper values={{ useHandicapScoring: true }} />);

      expect(screen.getByText('Stroke Distribution Method')).toBeInTheDocument();
      expect(screen.getByRole('radio', { name: 'Full Handicap (Net)' })).toBeInTheDocument();
      expect(screen.getByRole('radio', { name: 'Match Play (Difference)' })).toBeInTheDocument();
    });

    it('hides stroke distribution method options when useHandicapScoring is false', () => {
      render(<TestWrapper values={{ useHandicapScoring: false }} />);

      expect(screen.queryByText('Stroke Distribution Method')).not.toBeInTheDocument();
    });
  });

  describe('putt contest toggle', () => {
    it('renders the Enable 3+ Putt Contest switch', () => {
      render(<TestWrapper />);

      expect(screen.getByRole('switch', { name: 'Enable 3+ Putt Contest' })).toBeInTheDocument();
    });

    it('renders the switch unchecked when enablePuttContest is false', () => {
      render(<TestWrapper values={{ enablePuttContest: false }} />);

      expect(screen.getByRole('switch', { name: 'Enable 3+ Putt Contest' })).not.toBeChecked();
    });

    it('renders the switch checked when enablePuttContest is true', () => {
      render(<TestWrapper values={{ enablePuttContest: true }} />);

      expect(screen.getByRole('switch', { name: 'Enable 3+ Putt Contest' })).toBeChecked();
    });

    it('toggles the switch to checked when clicked while unchecked', async () => {
      const user = userEvent.setup();

      render(<TestWrapper values={{ enablePuttContest: false }} />);

      const toggle = screen.getByRole('switch', { name: 'Enable 3+ Putt Contest' });
      await user.click(toggle);

      await waitFor(() => {
        expect(screen.getByRole('switch', { name: 'Enable 3+ Putt Contest' })).toBeChecked();
      });
    });

    it('toggles the switch to unchecked when clicked while checked', async () => {
      const user = userEvent.setup();

      render(<TestWrapper values={{ enablePuttContest: true }} />);

      const toggle = screen.getByRole('switch', { name: 'Enable 3+ Putt Contest' });
      await user.click(toggle);

      await waitFor(() => {
        expect(screen.getByRole('switch', { name: 'Enable 3+ Putt Contest' })).not.toBeChecked();
      });
    });
  });

  describe('absent player handling', () => {
    it('renders the Partial Absence Mode label', () => {
      render(<TestWrapper />);

      expect(screen.getByText('Absent Player Handling')).toBeInTheDocument();
    });

    it('renders the Full Team Absence Mode label', () => {
      render(<TestWrapper />);

      expect(screen.getAllByText(/absence mode/i).length).toBeGreaterThan(0);
    });

    it('disables Penalty Strokes field when absentPlayerMode is not handicapPenalty', () => {
      render(<TestWrapper values={{ absentPlayerMode: 'opponentWins' }} />);

      expect(screen.getByLabelText('Penalty Strokes')).toBeDisabled();
    });

    it('enables Penalty Strokes field when absentPlayerMode is handicapPenalty', () => {
      render(<TestWrapper values={{ absentPlayerMode: 'handicapPenalty' }} />);

      expect(screen.getByLabelText('Penalty Strokes')).not.toBeDisabled();
    });
  });

  describe('points configuration', () => {
    it('renders the Points Configuration section heading', () => {
      render(<TestWrapper />);

      expect(screen.getByText('Points Configuration')).toBeInTheDocument();
    });

    it('disables Per Nine points field when holesPerMatch is 9', () => {
      render(<TestWrapper values={{ holesPerMatch: 9 }} />);

      expect(screen.getByLabelText('Per Nine')).toBeDisabled();
    });

    it('enables Per Nine points field when holesPerMatch is 18', () => {
      render(<TestWrapper values={{ holesPerMatch: 18 }} />);

      expect(screen.getByLabelText('Per Nine')).not.toBeDisabled();
    });
  });
});
