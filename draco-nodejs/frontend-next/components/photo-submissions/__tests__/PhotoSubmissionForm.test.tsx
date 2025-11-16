import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, beforeEach, vi, beforeAll, afterAll } from 'vitest';
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

const readAsDataURLMock = vi.fn();

const originalFileReader = global.FileReader;

class MockFileReader {
  static readonly EMPTY = 0;
  static readonly LOADING = 1;
  static readonly DONE = 2;

  readyState = MockFileReader.EMPTY;
  result: string | ArrayBuffer | null = null;
  onload: ((event: ProgressEvent<FileReader>) => unknown) | null = null;
  onerror: ((event: ProgressEvent<FileReader>) => unknown) | null = null;

  readAsDataURL = readAsDataURLMock.mockImplementation((_file: Blob) => {
    this.readyState = MockFileReader.LOADING;
    this.result = 'data:image/jpeg;base64,preview';
    const onload = this.onload;
    if (onload) {
      const loadEvent = new Event('load') as ProgressEvent<FileReader>;
      onload(loadEvent);
    }
    this.readyState = MockFileReader.DONE;
  });

  abort() {
    this.readyState = MockFileReader.DONE;
  }
}

beforeAll(() => {
  // jsdom's FileReader does not produce data URLs, so provide a deterministic mock.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (global as any).FileReader = MockFileReader as unknown as typeof FileReader;
});

afterAll(() => {
  global.FileReader = originalFileReader;
});

vi.mock('@draco/shared-api-client', () => ({
  createAccountPhotoSubmission: (...args: unknown[]) => createAccountPhotoSubmission(...args),
  createTeamPhotoSubmission: (...args: unknown[]) => createTeamPhotoSubmission(...args),
}));

const albumOptions: PhotoAlbumOption[] = [
  { id: null, title: 'Main Account Album (Default)', teamId: null },
  { id: '10', title: 'Highlights', teamId: null },
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
  originalFilePath: '1/photo-submissions/1/original.jpg',
  primaryImagePath: '1/photo-submissions/1/primary.jpg',
  thumbnailImagePath: '1/photo-submissions/1/thumbnail.jpg',
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
    readAsDataURLMock.mockClear();
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

    expect(await screen.findByAltText('Preview of photo.jpg')).toBeInTheDocument();

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

  it('shows an email warning when the confirmation email fails to send', async () => {
    const submission = createSubmission({ title: 'Summer Game' });
    const headers = {
      get: (key: string) =>
        key.toLowerCase() === 'x-photo-email-warning' ? 'submission-received' : null,
    };

    createAccountPhotoSubmission.mockResolvedValue({
      data: submission,
      response: { headers } as unknown as Response,
    });

    renderForm();

    await userEvent.type(screen.getByLabelText(/title/i), 'Summer Game');
    const file = new File(['dummy'], 'photo.jpg', { type: 'image/jpeg' });
    await userEvent.upload(screen.getByTestId('photo-input') as HTMLInputElement, file);

    await userEvent.click(screen.getByRole('button', { name: /submit photo/i }));

    expect(
      await screen.findByText(
        'Photo submitted, but we could not send the confirmation email. Moderators will still review it.',
      ),
    ).toBeInTheDocument();
  });
});
