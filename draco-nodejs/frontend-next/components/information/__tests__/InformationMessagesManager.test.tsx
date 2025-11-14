import React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { dracoTheme } from '../../../theme';
import type { InformationMessageTeamOption } from '../InformationMessageFormDialog';
vi.mock('../../../context/AuthContext', () => ({
  AuthContext: {
    Provider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  },
  useAuth: () => ({ token: 'token-123', user: { id: 'user-1' } }),
}));

const listMessagesMock = vi.fn();
const createMessageMock = vi.fn();
const updateMessageMock = vi.fn();
const deleteMessageMock = vi.fn();
const clearErrorMock = vi.fn();

const useWelcomeMessageOperationsMock = vi.fn();

vi.mock('../../../hooks/useWelcomeMessageOperations', () => ({
  useWelcomeMessageOperations: (scope: unknown) => useWelcomeMessageOperationsMock(scope),
}));

type MockInformationMessageFormDialogProps = {
  open: boolean;
  onSubmit: (args: {
    scope: 'account' | 'team';
    teamSeasonId?: string;
    payload: {
      caption: string;
      order: number;
      bodyHtml: string;
    };
  }) => void;
  availableTeams?: InformationMessageTeamOption[];
};

vi.mock('../InformationMessageFormDialog', () => ({
  __esModule: true,
  default: ({ open, onSubmit, availableTeams }: MockInformationMessageFormDialogProps) => {
    if (!open) {
      return null;
    }

    const payload = { caption: 'Dialog Caption', order: 1, bodyHtml: '<p>Dialog Body</p>' };

    return (
      <div data-testid="information-dialog">
        <button type="button" onClick={() => onSubmit({ scope: 'account', payload })}>
          submit-account
        </button>
        <button
          type="button"
          onClick={() =>
            onSubmit({
              scope: 'team',
              teamSeasonId: availableTeams?.[0]?.teamSeasonId ?? 'team-season-default',
              payload,
            })
          }
        >
          submit-team
        </button>
      </div>
    );
  },
}));

vi.mock('../../common/ConfirmationDialog', () => ({
  __esModule: true,
  default: ({ open, onConfirm }: { open: boolean; onConfirm: () => void }) => {
    if (!open) {
      return null;
    }

    return (
      <div data-testid="confirmation-dialog">
        <button type="button" onClick={onConfirm}>
          confirm-delete
        </button>
      </div>
    );
  },
}));

const { default: InformationMessagesManager } = await import('../InformationMessagesManager');
type InformationMessagesManagerProps = React.ComponentProps<typeof InformationMessagesManager>;

const renderManager = (props: InformationMessagesManagerProps) =>
  render(
    <ThemeProvider theme={dracoTheme}>
      <InformationMessagesManager {...props} />
    </ThemeProvider>,
  );

describe('InformationMessagesManager', () => {
  beforeEach(() => {
    listMessagesMock.mockReset();
    createMessageMock.mockReset();
    updateMessageMock.mockReset();
    deleteMessageMock.mockReset();
    clearErrorMock.mockReset();

    useWelcomeMessageOperationsMock.mockReturnValue({
      listMessages: listMessagesMock,
      createMessage: createMessageMock,
      updateMessage: updateMessageMock,
      deleteMessage: deleteMessageMock,
      loading: false,
      error: null,
      clearError: clearErrorMock,
    });
  });

  it('renders loaded messages and sanitizes the body content', async () => {
    listMessagesMock.mockResolvedValueOnce([
      {
        id: '1',
        accountId: '10',
        caption: 'Account Message',
        order: 1,
        bodyHtml: '<p>Hello</p><script>alert(1)</script>',
        isTeamScoped: false,
        scope: 'account',
      },
    ]);

    const { container } = renderManager({
      scope: {
        type: 'account',
        accountId: '10',
        teamOptions: [],
        defaultTeamSeasonId: null,
      },
    });

    await waitFor(() => expect(screen.getByText('Account Message')).toBeInTheDocument());
    expect(container.innerHTML).not.toContain('<script>');
  });

  it('renders team scoped manager and loads team messages', async () => {
    listMessagesMock.mockResolvedValueOnce([
      {
        id: '2',
        accountId: '10',
        teamId: '7',
        caption: 'Team Message',
        order: 1,
        bodyHtml: '<p>Team</p>',
        isTeamScoped: true,
        scope: 'team',
      },
    ]);

    renderManager({
      scope: {
        type: 'team',
        accountId: '10',
        teamSeasonId: 'team-season-1',
        teamId: 'team-2',
        teamLabel: 'Team 2',
      },
    });

    await waitFor(() => expect(screen.getByText('Team Message')).toBeInTheDocument());
    expect(listMessagesMock).toHaveBeenCalledTimes(1);
  });

  it('deletes a team scoped message with the resolved scope', async () => {
    listMessagesMock
      .mockResolvedValueOnce([
        {
          id: '3',
          accountId: '10',
          teamId: 'team-2',
          caption: 'Team scoped',
          order: 2,
          bodyHtml: '<p>Team body</p>',
          isTeamScoped: true,
          scope: 'team',
        },
      ])
      .mockResolvedValueOnce([]);
    deleteMessageMock.mockResolvedValue(undefined);

    renderManager({
      scope: {
        type: 'team',
        accountId: '10',
        teamSeasonId: 'team-season-2',
        teamId: 'team-2',
        teamLabel: 'Team 2',
      },
    });

    await waitFor(() => expect(screen.getByText('Team scoped')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Delete information message' }));
    fireEvent.click(screen.getByText('confirm-delete'));

    await waitFor(() => expect(deleteMessageMock).toHaveBeenCalled());
    expect(deleteMessageMock).toHaveBeenCalledWith('3', {
      type: 'team',
      accountId: '10',
      teamSeasonId: 'team-season-2',
    });
  });

  it('creates a team scoped message when the dialog submits with a team target', async () => {
    listMessagesMock.mockResolvedValue([]);
    createMessageMock.mockResolvedValue({
      id: '11',
      accountId: '10',
      teamId: 'team-2',
      caption: 'Created',
      order: 1,
      bodyHtml: '<p>Created</p>',
      isTeamScoped: true,
      scope: 'team',
    });

    renderManager({
      scope: {
        type: 'team',
        accountId: '10',
        teamSeasonId: 'team-season-2',
        teamId: 'team-2',
        teamLabel: 'Team 2',
      },
    });

    await waitFor(() => expect(listMessagesMock).toHaveBeenCalled());

    fireEvent.click(screen.getByRole('button', { name: 'Add information message' }));
    fireEvent.click(screen.getByText('submit-team'));

    await waitFor(() => expect(createMessageMock).toHaveBeenCalled());
    expect(createMessageMock).toHaveBeenCalledWith(
      {
        caption: 'Dialog Caption',
        order: 1,
        bodyHtml: '<p>Dialog Body</p>',
      },
      {
        type: 'team',
        accountId: '10',
        teamSeasonId: 'team-season-2',
      },
    );
  });
});
