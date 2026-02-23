import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@mui/material/styles';
import CreateAccountDialog from '../CreateAccountDialog';
import { dracoTheme } from '../../../../theme';

const mockFetchAccountTypes = vi.fn();
const mockFetchAccountAffiliations = vi.fn();
const mockFetchManagedAccounts = vi.fn();
const mockCreateAccount = vi.fn();

vi.mock('../../../../context/AuthContext', () => ({
  useAuth: () => ({
    user: { userId: 'u1', userName: 'admin' },
    token: 'tok',
    fetchUser: vi.fn(),
    loading: false,
    initialized: true,
    error: null,
    login: vi.fn(),
    logout: vi.fn(),
    setAuthToken: vi.fn(),
    clearAllContexts: vi.fn(),
    accountIdFromPath: null,
  }),
}));

vi.mock('../../../../hooks/useAccountManagementService', () => ({
  useAccountManagementService: () => ({
    fetchAccountTypes: mockFetchAccountTypes,
    fetchAccountAffiliations: mockFetchAccountAffiliations,
    fetchManagedAccounts: mockFetchManagedAccounts,
    createAccount: mockCreateAccount,
    updateAccount: vi.fn(),
    deleteAccount: vi.fn(),
    searchAccounts: vi.fn(),
  }),
}));

vi.mock('../../../../utils/timezones', () => ({
  detectUserTimezone: () => 'America/New_York',
  US_TIMEZONES: [{ value: 'America/New_York', label: 'Eastern Time' }],
}));

vi.mock('../../security/TurnstileChallenge', () => ({
  default: () => null,
}));

const ACCOUNT_TYPES = [{ id: 'at-1', name: 'Baseball' }];
const AFFILIATIONS = [{ id: '1', name: 'Independent', url: null }];

const buildSuccessfulOptionFetches = () => {
  mockFetchAccountTypes.mockResolvedValue({ success: true, data: ACCOUNT_TYPES });
  mockFetchAccountAffiliations.mockResolvedValue({ success: true, data: AFFILIATIONS });
  mockFetchManagedAccounts.mockResolvedValue({ success: true, data: [] });
};

const renderDialog = (props: Partial<React.ComponentProps<typeof CreateAccountDialog>> = {}) =>
  render(
    <ThemeProvider theme={dracoTheme}>
      <CreateAccountDialog open={true} onClose={vi.fn()} {...props} />
    </ThemeProvider>,
  );

describe('CreateAccountDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('closed state', () => {
    it('does not render dialog content when open is false', () => {
      buildSuccessfulOptionFetches();

      renderDialog({ open: false });

      expect(screen.queryByText('Create Account')).not.toBeInTheDocument();
    });
  });

  describe('open state', () => {
    it('renders the dialog title when open', () => {
      buildSuccessfulOptionFetches();

      renderDialog();

      expect(screen.getByText('Create Account')).toBeInTheDocument();
    });

    it('shows a loading spinner while options are being fetched', async () => {
      mockFetchAccountTypes.mockReturnValue(new Promise(() => {}));
      mockFetchAccountAffiliations.mockReturnValue(new Promise(() => {}));
      mockFetchManagedAccounts.mockReturnValue(new Promise(() => {}));

      renderDialog();

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('renders form fields once options are loaded', async () => {
      buildSuccessfulOptionFetches();

      renderDialog();

      await waitFor(() => {
        expect(screen.getByLabelText(/Account Name/i)).toBeInTheDocument();
      });

      expect(screen.getByLabelText(/Season Name/i)).toBeInTheDocument();
    });

    it('renders cancel and create action buttons', async () => {
      buildSuccessfulOptionFetches();

      renderDialog();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
      });

      expect(screen.getByRole('button', { name: 'Create' })).toBeInTheDocument();
    });
  });

  describe('options loading error', () => {
    it('shows an error alert with retry button when options fetch fails', async () => {
      mockFetchAccountTypes.mockResolvedValue({ success: false, error: 'Server error' });
      mockFetchAccountAffiliations.mockResolvedValue({ success: true, data: AFFILIATIONS });
      mockFetchManagedAccounts.mockResolvedValue({ success: true, data: [] });

      renderDialog();

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Server error');
      });

      expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
    });
  });

  describe('dialog dismissal', () => {
    it('calls onClose when the Cancel button is clicked', async () => {
      buildSuccessfulOptionFetches();

      const user = userEvent.setup();
      const onClose = vi.fn();

      renderDialog({ onClose });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('form submission', () => {
    it('calls createAccount and invokes onSuccess when all fields are filled and form is submitted', async () => {
      buildSuccessfulOptionFetches();

      const mockAccount = { id: 'new-acc', name: 'My League' };
      mockCreateAccount.mockResolvedValue({
        success: true,
        data: mockAccount,
        message: 'Account created successfully',
      });

      const user = userEvent.setup();
      const onSuccess = vi.fn();
      const onClose = vi.fn();

      renderDialog({ onSuccess, onClose });

      await waitFor(() => {
        expect(screen.getByRole('textbox', { name: /Account Name/i })).toBeInTheDocument();
      });

      await user.type(screen.getByRole('textbox', { name: /Account Name/i }), 'My League');
      await user.type(screen.getByRole('textbox', { name: /Season Name/i }), '2025 Season');
      await user.type(screen.getByRole('textbox', { name: /Owner First Name/i }), 'Jane');
      await user.type(screen.getByRole('textbox', { name: /Owner Last Name/i }), 'Doe');

      const accountTypeCombobox = screen.getAllByRole('combobox')[0];
      await user.click(accountTypeCombobox);
      await waitFor(() => screen.getByText('Baseball'));
      await user.click(screen.getByText('Baseball'));

      await user.click(screen.getByRole('button', { name: 'Create' }));

      await waitFor(() => {
        expect(mockCreateAccount).toHaveBeenCalled();
      });

      expect(onSuccess).toHaveBeenCalledWith({
        account: mockAccount,
        message: 'Account created successfully',
      });
      expect(onClose).toHaveBeenCalled();
    });

    it('shows an error alert when account creation fails', async () => {
      buildSuccessfulOptionFetches();

      mockCreateAccount.mockResolvedValue({
        success: false,
        error: 'Name already taken',
      });

      const user = userEvent.setup();

      renderDialog();

      await waitFor(() => {
        expect(screen.getByRole('textbox', { name: /Account Name/i })).toBeInTheDocument();
      });

      await user.type(screen.getByRole('textbox', { name: /Account Name/i }), 'Duplicate');
      await user.type(screen.getByRole('textbox', { name: /Season Name/i }), '2025');
      await user.type(screen.getByRole('textbox', { name: /Owner First Name/i }), 'John');
      await user.type(screen.getByRole('textbox', { name: /Owner Last Name/i }), 'Doe');

      const accountTypeCombobox = screen.getAllByRole('combobox')[0];
      await user.click(accountTypeCombobox);
      await waitFor(() => screen.getByText('Baseball'));
      await user.click(screen.getByText('Baseball'));

      await user.click(screen.getByRole('button', { name: 'Create' }));

      await waitFor(() => {
        expect(screen.getByText('Name already taken')).toBeInTheDocument();
      });
    });
  });
});
