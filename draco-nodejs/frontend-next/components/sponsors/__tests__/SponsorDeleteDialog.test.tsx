import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { SponsorType } from '@draco/shared-schemas';
import { useSponsorOperations, type SponsorFormValues } from '@/hooks/useSponsorOperations';
import { SponsorDeleteDialog } from '../SponsorDeleteDialog';

vi.mock('@/hooks/useSponsorOperations', () => ({
  useSponsorOperations: vi.fn(),
}));

type MockUseSponsorOperations = {
  listSponsors: () => Promise<SponsorType[]>;
  createSponsor: (input: SponsorFormValues) => Promise<SponsorType>;
  updateSponsor: (sponsorId: string, input: SponsorFormValues) => Promise<SponsorType>;
  deleteSponsor: (sponsorId: string) => Promise<void>;
  loading: boolean;
  error: string | null;
  clearError: () => void;
};

describe('SponsorDeleteDialog', () => {
  const mockSponsor: SponsorType = {
    id: 'sponsor-123',
    accountId: 'account-123',
    name: 'Test Sponsor',
    website: 'https://example.com',
    photoUrl: 'https://example.com/logo.png',
  };

  const defaultProps = {
    accountId: 'account-123',
    open: true,
    sponsor: mockSponsor,
    onClose: vi.fn(),
    onSuccess: vi.fn(),
    onError: vi.fn(),
  };

  const createMockHook = (
    overrides: Partial<MockUseSponsorOperations> = {},
  ): MockUseSponsorOperations => ({
    deleteSponsor: vi.fn(),
    loading: false,
    error: null,
    clearError: vi.fn(),
    listSponsors: vi.fn(),
    createSponsor: vi.fn(),
    updateSponsor: vi.fn(),
    ...overrides,
  });

  let mockHook: MockUseSponsorOperations;

  beforeEach(() => {
    vi.clearAllMocks();
    mockHook = createMockHook();
    vi.mocked(useSponsorOperations).mockReturnValue(mockHook);
  });

  it('renders dialog with sponsor name in message', () => {
    render(<SponsorDeleteDialog {...defaultProps} />);

    expect(screen.getByRole('heading', { name: 'Delete Sponsor' })).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to delete Test Sponsor?')).toBeInTheDocument();
    expect(screen.getByText('This action cannot be undone.')).toBeInTheDocument();
  });

  it('renders fallback message when sponsor is null', () => {
    render(<SponsorDeleteDialog {...defaultProps} sponsor={null} />);

    expect(screen.getByText('Are you sure you want to delete this sponsor?')).toBeInTheDocument();
  });

  describe('delete success flow', () => {
    it('calls deleteSponsor with sponsor id on confirm', async () => {
      const deleteSponsor = vi.fn().mockResolvedValue(undefined);
      mockHook = createMockHook({ deleteSponsor });
      vi.mocked(useSponsorOperations).mockReturnValue(mockHook);

      render(<SponsorDeleteDialog {...defaultProps} />);

      await userEvent.click(screen.getByRole('button', { name: 'Delete Sponsor' }));

      await waitFor(() => {
        expect(deleteSponsor).toHaveBeenCalledWith('sponsor-123');
      });
    });

    it('calls onSuccess with message and sponsor on successful delete', async () => {
      const deleteSponsor = vi.fn().mockResolvedValue(undefined);
      mockHook = createMockHook({ deleteSponsor });
      vi.mocked(useSponsorOperations).mockReturnValue(mockHook);

      render(<SponsorDeleteDialog {...defaultProps} />);

      await userEvent.click(screen.getByRole('button', { name: 'Delete Sponsor' }));

      await waitFor(() => {
        expect(defaultProps.onSuccess).toHaveBeenCalledWith({
          message: 'Sponsor deleted successfully',
          sponsor: mockSponsor,
        });
      });
    });

    it('calls onClose after successful delete', async () => {
      const deleteSponsor = vi.fn().mockResolvedValue(undefined);
      mockHook = createMockHook({ deleteSponsor });
      vi.mocked(useSponsorOperations).mockReturnValue(mockHook);

      render(<SponsorDeleteDialog {...defaultProps} />);

      await userEvent.click(screen.getByRole('button', { name: 'Delete Sponsor' }));

      await waitFor(() => {
        expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
      });
    });

    it('does not call deleteSponsor when sponsor is null', async () => {
      const deleteSponsor = vi.fn();
      mockHook = createMockHook({ deleteSponsor });
      vi.mocked(useSponsorOperations).mockReturnValue(mockHook);

      render(<SponsorDeleteDialog {...defaultProps} sponsor={null} />);

      await userEvent.click(screen.getByRole('button', { name: 'Delete Sponsor' }));

      expect(deleteSponsor).not.toHaveBeenCalled();
    });
  });

  describe('delete error handling', () => {
    it('calls onError with error message when delete fails', async () => {
      const deleteSponsor = vi.fn().mockRejectedValue(new Error('Network error'));
      mockHook = createMockHook({ deleteSponsor });
      vi.mocked(useSponsorOperations).mockReturnValue(mockHook);

      render(<SponsorDeleteDialog {...defaultProps} />);

      await userEvent.click(screen.getByRole('button', { name: 'Delete Sponsor' }));

      await waitFor(() => {
        expect(defaultProps.onError).toHaveBeenCalledWith('Network error');
      });
    });

    it('uses fallback message for non-Error exceptions', async () => {
      const deleteSponsor = vi.fn().mockRejectedValue('Unknown error');
      mockHook = createMockHook({ deleteSponsor });
      vi.mocked(useSponsorOperations).mockReturnValue(mockHook);

      render(<SponsorDeleteDialog {...defaultProps} />);

      await userEvent.click(screen.getByRole('button', { name: 'Delete Sponsor' }));

      await waitFor(() => {
        expect(defaultProps.onError).toHaveBeenCalledWith('Failed to delete sponsor');
      });
    });

    it('does not call onSuccess or onClose when delete fails', async () => {
      const deleteSponsor = vi.fn().mockRejectedValue(new Error('Delete failed'));
      mockHook = createMockHook({ deleteSponsor });
      vi.mocked(useSponsorOperations).mockReturnValue(mockHook);

      render(<SponsorDeleteDialog {...defaultProps} />);

      await userEvent.click(screen.getByRole('button', { name: 'Delete Sponsor' }));

      await waitFor(() => {
        expect(defaultProps.onError).toHaveBeenCalled();
      });

      expect(defaultProps.onSuccess).not.toHaveBeenCalled();
      expect(defaultProps.onClose).not.toHaveBeenCalled();
    });

    it('displays error from hook in alert', () => {
      mockHook = createMockHook({ error: 'Server error occurred' });
      vi.mocked(useSponsorOperations).mockReturnValue(mockHook);

      render(<SponsorDeleteDialog {...defaultProps} />);

      expect(screen.getByRole('alert')).toHaveTextContent('Server error occurred');
    });
  });

  describe('loading state', () => {
    it('displays loading text on confirm button when loading', () => {
      mockHook = createMockHook({ loading: true });
      vi.mocked(useSponsorOperations).mockReturnValue(mockHook);

      render(<SponsorDeleteDialog {...defaultProps} />);

      expect(screen.getByRole('button', { name: 'Deleting…' })).toBeInTheDocument();
    });

    it('disables confirm button when loading', () => {
      mockHook = createMockHook({ loading: true });
      vi.mocked(useSponsorOperations).mockReturnValue(mockHook);

      render(<SponsorDeleteDialog {...defaultProps} />);

      expect(screen.getByRole('button', { name: 'Deleting…' })).toBeDisabled();
    });

    it('disables cancel button when loading', () => {
      mockHook = createMockHook({ loading: true });
      vi.mocked(useSponsorOperations).mockReturnValue(mockHook);

      render(<SponsorDeleteDialog {...defaultProps} />);

      expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    });
  });

  describe('dialog close behavior', () => {
    it('calls onClose when cancel button is clicked', async () => {
      render(<SponsorDeleteDialog {...defaultProps} />);

      await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('prevents close when loading by disabling cancel button', () => {
      mockHook = createMockHook({ loading: true });
      vi.mocked(useSponsorOperations).mockReturnValue(mockHook);

      render(<SponsorDeleteDialog {...defaultProps} />);

      const cancelButton = screen.getByRole('button', { name: 'Cancel' });
      expect(cancelButton).toBeDisabled();
    });

    it('clears error when dialog opens', () => {
      const clearError = vi.fn();
      mockHook = createMockHook({ clearError });
      vi.mocked(useSponsorOperations).mockReturnValue(mockHook);

      const { rerender } = render(<SponsorDeleteDialog {...defaultProps} open={false} />);

      expect(clearError).not.toHaveBeenCalled();

      rerender(<SponsorDeleteDialog {...defaultProps} open={true} />);

      expect(clearError).toHaveBeenCalled();
    });
  });
});
