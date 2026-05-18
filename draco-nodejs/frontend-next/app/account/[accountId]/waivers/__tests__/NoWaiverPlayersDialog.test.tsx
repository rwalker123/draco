import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NoWaiverPlayersDialog, { type NoWaiverPlayer } from '../NoWaiverPlayersDialog';

const makePlayers = (count: number): NoWaiverPlayer[] =>
  Array.from({ length: count }, (_, i) => ({
    contactId: `contact-${i}`,
    fullName: `Player ${i + 1}`,
    teams: [{ leagueName: 'League A', teamName: `Team ${i + 1}` }],
  }));

const defaultProps = {
  open: true,
  onClose: vi.fn(),
  title: 'Players With No Waiver — League A',
  players: makePlayers(3),
  onExport: vi.fn(),
  exporting: false,
  exportError: null,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('NoWaiverPlayersDialog', () => {
  it('renders the dialog title', () => {
    render(<NoWaiverPlayersDialog {...defaultProps} />);
    expect(screen.getByText('Players With No Waiver — League A')).toBeInTheDocument();
  });

  it('shows player list when players are present', () => {
    render(<NoWaiverPlayersDialog {...defaultProps} />);
    expect(screen.getByText('Player 1')).toBeInTheDocument();
    expect(screen.getByText('Player 2')).toBeInTheDocument();
    expect(screen.getByText('Player 3')).toBeInTheDocument();
  });

  it('shows player count text', () => {
    render(<NoWaiverPlayersDialog {...defaultProps} />);
    expect(screen.getByText('3 players with no waiver:')).toBeInTheDocument();
  });

  it('uses singular "player" for count of 1', () => {
    render(<NoWaiverPlayersDialog {...defaultProps} players={makePlayers(1)} />);
    expect(screen.getByText('1 player with no waiver:')).toBeInTheDocument();
  });

  it('renders team chips for each player', () => {
    render(<NoWaiverPlayersDialog {...defaultProps} players={makePlayers(1)} />);
    expect(screen.getByText('League A / Team 1')).toBeInTheDocument();
  });

  it('shows empty state when no players', () => {
    render(<NoWaiverPlayersDialog {...defaultProps} players={[]} />);
    expect(screen.getByText('No players are missing a waiver.')).toBeInTheDocument();
  });

  it('calls onExport when Export CSV button is clicked', async () => {
    const onExport = vi.fn();
    render(<NoWaiverPlayersDialog {...defaultProps} onExport={onExport} />);
    await userEvent.click(screen.getByRole('button', { name: /export csv/i }));
    expect(onExport).toHaveBeenCalledTimes(1);
  });

  it('disables Export CSV button when players list is empty', () => {
    render(<NoWaiverPlayersDialog {...defaultProps} players={[]} />);
    expect(screen.getByRole('button', { name: /export csv/i })).toBeDisabled();
  });

  it('disables Export CSV button while exporting', () => {
    render(<NoWaiverPlayersDialog {...defaultProps} exporting={true} />);
    expect(screen.getByRole('button', { name: /export csv/i })).toBeDisabled();
  });

  it('shows CircularProgress spinner while exporting', () => {
    render(<NoWaiverPlayersDialog {...defaultProps} exporting={true} />);
    expect(document.querySelector('.MuiCircularProgress-root')).toBeInTheDocument();
  });

  it('shows export error alert when exportError is set', () => {
    render(
      <NoWaiverPlayersDialog {...defaultProps} exportError="Failed to export missing waivers" />,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Failed to export missing waivers');
  });

  it('calls onClose when close icon button is clicked', async () => {
    const onClose = vi.fn();
    render(<NoWaiverPlayersDialog {...defaultProps} onClose={onClose} />);
    await userEvent.click(screen.getByRole('button', { name: 'close' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not render dialog content when closed', () => {
    render(<NoWaiverPlayersDialog {...defaultProps} open={false} />);
    expect(screen.queryByText('Players With No Waiver — League A')).not.toBeInTheDocument();
  });
});
