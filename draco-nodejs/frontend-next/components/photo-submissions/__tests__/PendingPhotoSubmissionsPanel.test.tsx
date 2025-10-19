import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import PendingPhotoSubmissionsPanel from '../PendingPhotoSubmissionsPanel';
import type { PhotoSubmissionDetailType } from '@draco/shared-schemas';
import { ThemeProvider, createTheme } from '@mui/material/styles';

const renderPanel = (
  props: Partial<React.ComponentProps<typeof PendingPhotoSubmissionsPanel>> = {},
) => {
  const defaultSubmission: PhotoSubmissionDetailType = {
    id: '1',
    accountId: '1',
    teamId: null,
    albumId: null,
    submitterContactId: '100',
    moderatedByContactId: null,
    approvedPhotoId: null,
    title: 'Championship Win',
    caption: 'Celebrating the big win!',
    originalFileName: 'win.jpg',
    originalFilePath: 'Uploads/Accounts/1/PhotoSubmissions/1/original.jpg',
    primaryImagePath: 'Uploads/Accounts/1/PhotoSubmissions/1/primary.jpg',
    thumbnailImagePath: 'Uploads/Accounts/1/PhotoSubmissions/1/thumbnail.jpg',
    status: 'Pending',
    denialReason: null,
    submittedAt: '2024-01-01T12:00:00.000Z',
    updatedAt: '2024-01-01T12:00:00.000Z',
    moderatedAt: null,
    accountName: 'Draco Sports',
    album: { id: '10', title: 'Highlights', teamId: null },
    approvedPhoto: null,
    submitter: { id: '100', firstName: 'Jamie', lastName: 'Rivera', email: 'jamie@example.com' },
    moderator: null,
  };

  const theme = createTheme();

  return render(
    <ThemeProvider theme={theme}>
      <PendingPhotoSubmissionsPanel
        contextLabel="Draco Sports"
        submissions={[defaultSubmission]}
        loading={false}
        error={null}
        successMessage={null}
        processingIds={new Set()}
        onRefresh={vi.fn()}
        onApprove={vi.fn().mockResolvedValue(true)}
        onDeny={vi.fn().mockResolvedValue(true)}
        {...props}
      />
    </ThemeProvider>,
  );
};

describe('PendingPhotoSubmissionsPanel', () => {
  it('renders loading indicator when loading is true', () => {
    renderPanel({ submissions: [], loading: true });

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders empty state when no submissions are available', () => {
    renderPanel({ submissions: [] });

    expect(screen.getByText('No pending photo submissions right now.')).toBeInTheDocument();
  });

  it('calls onApprove when approve button is clicked', async () => {
    const onApprove = vi.fn().mockResolvedValue(true);
    renderPanel({ onApprove });

    const approveButton = screen.getByRole('button', { name: /approve/i });
    await userEvent.click(approveButton);

    expect(onApprove).toHaveBeenCalledWith('1');
  });

  it('opens the denial dialog and submits the denial reason', async () => {
    const onDeny = vi.fn().mockResolvedValue(true);
    renderPanel({ onDeny });

    const denyButton = screen.getByRole('button', { name: /deny/i });
    await userEvent.click(denyButton);

    const dialog = await screen.findByRole('dialog');
    const reasonField = within(dialog).getByLabelText(/denial reason/i);
    await userEvent.clear(reasonField);
    await userEvent.type(reasonField, '  Needs better lighting  ');

    const submitButton = within(dialog).getByRole('button', { name: /deny submission/i });
    await userEvent.click(submitButton);

    expect(onDeny).toHaveBeenCalledWith('1', 'Needs better lighting');
  });

  it('displays success message when provided', () => {
    renderPanel({ successMessage: 'Approved “Championship Win”.' });

    expect(screen.getByText('Approved “Championship Win”.')).toBeInTheDocument();
  });
});
