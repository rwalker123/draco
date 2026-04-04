import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ThemeProvider, createTheme } from '@mui/material';
import { HoleScoreGrid } from '../HoleScoreGrid';

const theme = createTheme();

const renderWithTheme = (ui: React.ReactElement) =>
  render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);

const makeScores = (count: number, value = 0) => Array(count).fill(value);

const nineHolePar = [4, 4, 3, 5, 4, 4, 3, 5, 4];

describe('HoleScoreGrid', () => {
  const defaultOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('hole rendering', () => {
    it('renders 9 score inputs for a 9-hole grid', () => {
      renderWithTheme(
        <HoleScoreGrid holeScores={makeScores(9)} onChange={defaultOnChange} numberOfHoles={9} />,
      );

      const inputs = screen.getAllByRole('spinbutton');
      expect(inputs).toHaveLength(9);
    });

    it('renders 18 score inputs for an 18-hole grid', () => {
      renderWithTheme(
        <HoleScoreGrid holeScores={makeScores(18)} onChange={defaultOnChange} numberOfHoles={18} />,
      );

      const inputs = screen.getAllByRole('spinbutton');
      expect(inputs).toHaveLength(18);
    });

    it('displays hole numbers 1 through 9 in the header row', () => {
      renderWithTheme(
        <HoleScoreGrid holeScores={makeScores(9)} onChange={defaultOnChange} numberOfHoles={9} />,
      );

      for (let i = 1; i <= 9; i++) {
        expect(screen.getAllByText(i.toString()).length).toBeGreaterThan(0);
      }
    });

    it('displays Out and In column headers for an 18-hole grid', () => {
      renderWithTheme(
        <HoleScoreGrid holeScores={makeScores(18)} onChange={defaultOnChange} numberOfHoles={18} />,
      );

      expect(screen.getByText('Out')).toBeInTheDocument();
      expect(screen.getByText('In')).toBeInTheDocument();
    });

    it('only renders Out column header for a 9-hole grid', () => {
      renderWithTheme(
        <HoleScoreGrid holeScores={makeScores(9)} onChange={defaultOnChange} numberOfHoles={9} />,
      );

      expect(screen.getByText('Out')).toBeInTheDocument();
      expect(screen.queryByText('In')).not.toBeInTheDocument();
    });
  });

  describe('par row', () => {
    it('shows par row when par prop is provided', () => {
      renderWithTheme(
        <HoleScoreGrid
          holeScores={makeScores(9)}
          onChange={defaultOnChange}
          numberOfHoles={9}
          par={nineHolePar}
        />,
      );

      expect(screen.getByText('Par')).toBeInTheDocument();
    });

    it('does not show par row when par prop is omitted', () => {
      renderWithTheme(
        <HoleScoreGrid holeScores={makeScores(9)} onChange={defaultOnChange} numberOfHoles={9} />,
      );

      expect(screen.queryByText('Par')).not.toBeInTheDocument();
    });

    it('displays the correct front-9 par total', () => {
      renderWithTheme(
        <HoleScoreGrid
          holeScores={makeScores(9)}
          onChange={defaultOnChange}
          numberOfHoles={9}
          par={nineHolePar}
        />,
      );

      const front9ParTotal = nineHolePar.reduce((a, b) => a + b, 0);
      expect(screen.getByText(front9ParTotal.toString())).toBeInTheDocument();
    });
  });

  describe('putts row', () => {
    it('hides putts row when showPutts is false (default)', () => {
      renderWithTheme(
        <HoleScoreGrid holeScores={makeScores(9)} onChange={defaultOnChange} numberOfHoles={9} />,
      );

      expect(screen.queryByText('Putts')).not.toBeInTheDocument();
    });

    it('shows putts row when showPutts is true', () => {
      renderWithTheme(
        <HoleScoreGrid
          holeScores={makeScores(9)}
          onChange={defaultOnChange}
          numberOfHoles={9}
          showPutts
        />,
      );

      expect(screen.getByText('Putts')).toBeInTheDocument();
    });

    it('renders 18 putt inputs for an 18-hole grid when showPutts is true', () => {
      renderWithTheme(
        <HoleScoreGrid
          holeScores={makeScores(18)}
          onChange={defaultOnChange}
          numberOfHoles={18}
          showPutts
        />,
      );

      const inputs = screen.getAllByRole('spinbutton');
      expect(inputs).toHaveLength(36);
    });

    it('calls onPuttsChange with updated putts when a putt value is entered', async () => {
      const user = userEvent.setup();
      const onPuttsChange = vi.fn();
      const initialPutts = Array(18).fill(null);

      renderWithTheme(
        <HoleScoreGrid
          holeScores={makeScores(9)}
          onChange={defaultOnChange}
          numberOfHoles={9}
          showPutts
          putts={initialPutts}
          onPuttsChange={onPuttsChange}
        />,
      );

      const puttInputs = screen.getAllByRole('spinbutton');
      const firstPuttInput = puttInputs[9];

      await user.clear(firstPuttInput);
      await user.type(firstPuttInput, '2');

      expect(onPuttsChange).toHaveBeenCalled();
      const lastCall = onPuttsChange.mock.calls[onPuttsChange.mock.calls.length - 1];
      const updatedPutts: (number | null)[] = lastCall[0];
      expect(updatedPutts[0]).toBe(2);
    });

    it('displays total putts summary when showPutts is true and putts exist', () => {
      const putts = Array(18).fill(null);
      putts[0] = 2;
      putts[1] = 3;

      renderWithTheme(
        <HoleScoreGrid
          holeScores={makeScores(9)}
          onChange={defaultOnChange}
          numberOfHoles={9}
          showPutts
          putts={putts}
        />,
      );

      expect(screen.getAllByText('5').length).toBeGreaterThan(0);
    });
  });

  describe('fairways row', () => {
    it('hides fairways row when showFairways is false (default)', () => {
      renderWithTheme(
        <HoleScoreGrid
          holeScores={makeScores(9)}
          onChange={defaultOnChange}
          numberOfHoles={9}
          par={nineHolePar}
        />,
      );

      expect(screen.queryByText('FW')).not.toBeInTheDocument();
    });

    it('shows fairways row when showFairways is true and par is provided', () => {
      renderWithTheme(
        <HoleScoreGrid
          holeScores={makeScores(9)}
          onChange={defaultOnChange}
          numberOfHoles={9}
          par={nineHolePar}
          showFairways
        />,
      );

      expect(screen.getByText('FW')).toBeInTheDocument();
    });

    it('displays "-" for par 3 holes instead of a checkbox', () => {
      renderWithTheme(
        <HoleScoreGrid
          holeScores={makeScores(9)}
          onChange={defaultOnChange}
          numberOfHoles={9}
          par={nineHolePar}
          showFairways
        />,
      );

      const par3Count = nineHolePar.filter((p) => p === 3).length;
      const dashes = screen.getAllByText('-');
      expect(dashes.length).toBeGreaterThanOrEqual(par3Count);
    });

    it('renders checkboxes for non-par-3 holes when showFairways is true', () => {
      renderWithTheme(
        <HoleScoreGrid
          holeScores={makeScores(9)}
          onChange={defaultOnChange}
          numberOfHoles={9}
          par={nineHolePar}
          showFairways
          fairways={Array(18).fill(null)}
        />,
      );

      const nonPar3Count = nineHolePar.filter((p) => p !== 3).length;
      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes.length).toBeGreaterThanOrEqual(nonPar3Count);
    });

    it('calls onFairwaysChange when a fairway checkbox is toggled', async () => {
      const user = userEvent.setup();
      const onFairwaysChange = vi.fn();

      renderWithTheme(
        <HoleScoreGrid
          holeScores={makeScores(9)}
          onChange={defaultOnChange}
          numberOfHoles={9}
          par={nineHolePar}
          showFairways
          fairways={Array(18).fill(null)}
          onFairwaysChange={onFairwaysChange}
        />,
      );

      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[0]);

      expect(onFairwaysChange).toHaveBeenCalledTimes(1);
    });
  });

  describe('score input', () => {
    it('calls onChange with updated scores when a score value is entered', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      renderWithTheme(
        <HoleScoreGrid holeScores={makeScores(9)} onChange={onChange} numberOfHoles={9} />,
      );

      const inputs = screen.getAllByRole('spinbutton');
      await user.clear(inputs[0]);
      await user.type(inputs[0], '4');

      expect(onChange).toHaveBeenCalled();
      const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1];
      const updatedScores: number[] = lastCall[0];
      expect(updatedScores[0]).toBe(4);
    });

    it('does not call onChange when value exceeds 20', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      renderWithTheme(
        <HoleScoreGrid holeScores={makeScores(9)} onChange={onChange} numberOfHoles={9} />,
      );

      const inputs = screen.getAllByRole('spinbutton');
      await user.clear(inputs[0]);
      await user.type(inputs[0], '25');

      const calledValues = onChange.mock.calls.map((c) => c[0][0]);
      expect(calledValues.every((v) => v <= 20)).toBe(true);
    });

    it('disables all score inputs when disabled prop is true', () => {
      renderWithTheme(
        <HoleScoreGrid
          holeScores={makeScores(9)}
          onChange={defaultOnChange}
          numberOfHoles={9}
          disabled
        />,
      );

      const inputs = screen.getAllByRole('spinbutton');
      inputs.forEach((input) => {
        expect(input).toBeDisabled();
      });
    });
  });

  describe('summary totals', () => {
    it('displays Front 9 and Back 9 subtotals for an 18-hole grid with scores', () => {
      const scores = [4, 4, 3, 5, 4, 4, 3, 5, 4, 4, 4, 3, 5, 4, 4, 3, 5, 4];

      renderWithTheme(
        <HoleScoreGrid holeScores={scores} onChange={defaultOnChange} numberOfHoles={18} />,
      );

      expect(screen.getByText('Front 9:')).toBeInTheDocument();
      expect(screen.getByText('Back 9:')).toBeInTheDocument();
    });

    it('displays total score in the summary area', () => {
      const scores = makeScores(9, 4);

      renderWithTheme(
        <HoleScoreGrid holeScores={scores} onChange={defaultOnChange} numberOfHoles={9} />,
      );

      expect(screen.getByText('Total:')).toBeInTheDocument();
    });

    it('displays putts total in summary when showPutts is true and putts exist', () => {
      const putts = Array(18).fill(null);
      putts[0] = 2;
      putts[1] = 2;
      putts[2] = 2;

      renderWithTheme(
        <HoleScoreGrid
          holeScores={makeScores(9)}
          onChange={defaultOnChange}
          numberOfHoles={9}
          showPutts
          putts={putts}
        />,
      );

      expect(screen.getByText('Putts:')).toBeInTheDocument();
    });

    it('displays fairway hit summary in summary area when showFairways is true', () => {
      const fairways = Array(18).fill(null);
      fairways[0] = true;
      fairways[3] = true;

      renderWithTheme(
        <HoleScoreGrid
          holeScores={makeScores(9)}
          onChange={defaultOnChange}
          numberOfHoles={9}
          par={nineHolePar}
          showFairways
          fairways={fairways}
        />,
      );

      expect(screen.getByText('FW:')).toBeInTheDocument();
    });
  });
});
