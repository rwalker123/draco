import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import PhotoSubmissionForm from '../PhotoSubmissionForm';
import type { PhotoAlbumOption } from '../PhotoSubmissionForm';
import type { PhotoSubmissionRecordType } from '@draco/shared-schemas';
import type { CreatePhotoSubmissionForm } from '@draco/shared-api-client';
import { ApiClientError } from '../../../utils/apiResult';

vi.mock('../../../hooks/useApiClient', () => ({
  useApiClient: () => ({}),
}));

const createAccountPhotoSubmission = vi.fn();
const createTeamPhotoSubmission = vi.fn();

vi.mock('@draco/shared-api-client', () => ({
  createAccountPhotoSubmission: (...args: unknown[]) => createAccountPhotoSubmission(...args),
  createTeamPhotoSubmission: (...args: unknown[]) => createTeamPhotoSubmission(...args),
}));

const albumOptions: PhotoAlbumOption[] = [
  { id: null, title: 'Main Account Album (Default)' },
  { id: '10', title: 'Highlights' },
];

const createSubmission = (
  overrides: Partial<PhotoSubmissionRecordType> = {},
): PhotoSubmissionRecordType => ({
  id: '1',
  accountId: '1',
  teamId: null,
  albumId: overrides.albumId ?? null,
  submitterContactId: '100',
  moderatedByContactId: null,
  approvedPhotoId: null,
  title: 'Summer Game',
  caption: overrides.caption ?? null,
  status: 'Pending',
  denialReason: null,
  submittedAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  moderatedAt: null,
  originalFileName: 'summer-game.jpg',
  originalFilePath: 'Uploads/Accounts/1/PhotoSubmissions/1/original.jpg',
  primaryImagePath: 'Uploads/Accounts/1/PhotoSubmissions/1/primary.jpg',
  thumbnailImagePath: 'Uploads/Accounts/1/PhotoSubmissions/1/thumbnail.jpg',
  ...overrides,
});

interface RenderAccountFormProps {
  onSubmitted?: (submission: PhotoSubmissionRecordType) => void;
  albumOptions?: PhotoAlbumOption[];
}

const renderForm = (props: RenderAccountFormProps = {}) => {
  const theme = createTheme();
  return render(
    <ThemeProvider theme={theme}>
      <PhotoSubmissionForm
        variant="account"
        accountId="1"
        contextName="Draco Sports"
        albumOptions={props.albumOptions ?? albumOptions}
        onSubmitted={props.onSubmitted}
      />
    </ThemeProvider>,
  );
};

describe('PhotoSubmissionForm', () => {
  beforeEach(() => {
    createAccountPhotoSubmission.mockReset();
    createTeamPhotoSubmission.mockReset();
  });

  it('submits an account photo and shows a success message', async () => {
    const submission = createSubmission({ title: 'Summer Game', albumId: '10' });
    createAccountPhotoSubmission.mockResolvedValue({ data: submission });
    const onSubmitted = vi.fn();

    renderForm({ onSubmitted });

    await userEvent.type(screen.getByLabelText(/title/i), 'Summer Game');
    await userEvent.type(screen.getByLabelText(/caption/i), 'Great win!');

    const file = new File(['dummy'], 'photo.jpg', { type: 'image/jpeg' });
    const fileInput = screen.getByTestId('photo-input') as HTMLInputElement;
    await userEvent.upload(fileInput, file);

    await userEvent.click(screen.getByRole('button', { name: /submit photo/i }));

    await waitFor(() => {
      expect(createAccountPhotoSubmission).toHaveBeenCalledTimes(1);
    });

    const call = createAccountPhotoSubmission.mock.calls[0][0] as {
      body: CreatePhotoSubmissionForm;
    };
    const body = call.body;
    expect(body.title).toBe('Summer Game');
    expect(body.caption).toBe('Great win!');
    expect(body.photo).toBeInstanceOf(File);

    await waitFor(() => {
      expect(
        screen.getByText('Photo “Summer Game” submitted for review in Draco Sports.'),
      ).toBeInTheDocument();
    });

    expect(onSubmitted).toHaveBeenCalledWith(submission);
  });

  it('validates that a photo is required', async () => {
    renderForm();

    await userEvent.type(screen.getByLabelText(/title/i), 'Championship');
    await userEvent.click(screen.getByRole('button', { name: /submit photo/i }));

    expect(await screen.findByText('Please choose a photo to upload.')).toBeInTheDocument();
    expect(createAccountPhotoSubmission).not.toHaveBeenCalled();
  });

  it('shows an error message when the API call fails', async () => {
    createAccountPhotoSubmission.mockRejectedValue(new ApiClientError('Upload failed'));

    renderForm();

    await userEvent.type(screen.getByLabelText(/title/i), 'Summer Game');

    const file = new File(['dummy'], 'photo.jpg', { type: 'image/jpeg' });
    await userEvent.upload(screen.getByTestId('photo-input') as HTMLInputElement, file);

    await userEvent.click(screen.getByRole('button', { name: /submit photo/i }));

    expect(await screen.findByText('Upload failed')).toBeInTheDocument();
  });

  it('submits a team photo when rendering team variant', async () => {
    const submission = createSubmission({ teamId: '2', title: 'Team Celebration' });
    createTeamPhotoSubmission.mockResolvedValue({ data: submission });

    const theme = createTheme();
    render(
      <ThemeProvider theme={theme}>
        <PhotoSubmissionForm variant="team" accountId="1" teamId="2" contextName="Varsity" />
      </ThemeProvider>,
    );

    await userEvent.type(screen.getByLabelText(/title/i), 'Team Celebration');

    const file = new File(['dummy'], 'photo.png', { type: 'image/png' });
    await userEvent.upload(screen.getByTestId('photo-input') as HTMLInputElement, file);

    await userEvent.click(screen.getByRole('button', { name: /submit photo/i }));

    await waitFor(() => {
      expect(createTeamPhotoSubmission).toHaveBeenCalledTimes(1);
    });

    const call = createTeamPhotoSubmission.mock.calls[0][0] as {
      body: CreatePhotoSubmissionForm;
    };
    expect(call.body.title).toBe('Team Celebration');
    expect(call.body.photo).toBeInstanceOf(File);
  });
});
