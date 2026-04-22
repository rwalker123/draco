import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ComposeActions } from '../ComposeActions';
import { DEFAULT_COMPOSE_CONFIG } from '../../../../types/emails/compose';
import type {
  EmailComposeConfig,
  EmailComposeState,
  EmailComposeContextValue,
} from '../../../../types/emails/compose';

vi.mock('../EmailComposeProvider', async (importOriginal) => {
  const original = await importOriginal<typeof import('../EmailComposeProvider')>();
  return {
    ...original,
    useEmailCompose: vi.fn(),
  };
});

vi.mock('@mui/material', async (importOriginal) => {
  const original = await importOriginal<Record<string, unknown>>();
  return {
    ...original,
    useMediaQuery: vi.fn(() => false),
    useTheme: vi.fn(() => ({
      breakpoints: { down: vi.fn(() => '(max-width: 900px)') },
      zIndex: { appBar: 1100 },
    })),
  };
});

import { useEmailCompose } from '../EmailComposeProvider';

const buildMockContext = (
  configOverrides: Partial<EmailComposeConfig>,
): EmailComposeContextValue => {
  const config: EmailComposeConfig = { ...DEFAULT_COMPOSE_CONFIG, ...configOverrides };

  const state: EmailComposeState = {
    subject: '',
    content: '',
    isContentHtml: true,
    recipientState: undefined,
    attachments: [],
    selectedTemplate: undefined,
    isScheduled: false,
    scheduledDate: undefined,
    hasUnsavedChanges: false,
    isLoading: false,
    isSending: false,
    sendProgress: undefined,
    errors: [],
    resetCounter: 0,
    config,
  };

  const actions = {
    setSubject: vi.fn(),
    setContent: vi.fn(),
    selectTemplate: vi.fn(),
    clearTemplate: vi.fn(),
    addAttachments: vi.fn(),
    updateAttachments: vi.fn(),
    removeAttachment: vi.fn(),
    clearAttachments: vi.fn(),
    setScheduled: vi.fn(),
    clearSchedule: vi.fn(),
    validateCompose: vi.fn(() => ({ isValid: false, errors: [], warnings: [] })),
    sendEmail: vi.fn(),
    updateRecipientState: vi.fn(),
    updateSelectedGroups: vi.fn(),
    clearAllRecipients: vi.fn(),
    removeSpecificGroup: vi.fn(),
    setRecipientSearchQuery: vi.fn(),
    setRecipientActiveTab: vi.fn(),
    convertGroupToIndividuals: vi.fn(),
    reset: vi.fn(),
    setError: vi.fn(),
    clearErrors: vi.fn(),
  };

  return { state, actions };
};

describe('EmailComposePage team scope config flags', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not render the file upload section when allowAttachments is false', () => {
    (useEmailCompose as ReturnType<typeof vi.fn>).mockReturnValue(
      buildMockContext({ allowAttachments: false }),
    );

    const { container } = render(<ComposeActions />);

    const pageText = container.textContent ?? '';
    expect(pageText).not.toContain('File Attachments');
    expect(pageText).not.toContain('Upload');
  });

  it('does not render the schedule dropdown button or menu when allowScheduling is false', () => {
    (useEmailCompose as ReturnType<typeof vi.fn>).mockReturnValue(
      buildMockContext({ allowScheduling: false }),
    );

    render(<ComposeActions />);

    expect(screen.queryByRole('button', { name: /schedule/i })).toBeNull();
    expect(screen.queryByRole('menuitem', { name: /schedule for later/i })).toBeNull();
  });

  it('renders the schedule dropdown arrow when allowScheduling is true', () => {
    (useEmailCompose as ReturnType<typeof vi.fn>).mockReturnValue(
      buildMockContext({ allowScheduling: true }),
    );

    render(<ComposeActions />);

    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(1);
  });
});
