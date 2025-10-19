'use client';

import React, { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import {
  PhotoCamera as PhotoCameraIcon,
  CloudUpload as CloudUploadIcon,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { validatePhotoSubmissionFile } from '../../config/photoSubmissions';
import { usePhotoSubmission } from '../../hooks/usePhotoSubmission';
import type { PhotoSubmissionRecordType } from '@draco/shared-schemas';

export interface PhotoAlbumOption {
  id: string | null;
  title: string;
}

interface AccountPhotoSubmissionProps {
  variant: 'account';
  accountId: string;
  contextName: string;
  albumOptions?: PhotoAlbumOption[];
  onSubmitted?: (submission: PhotoSubmissionRecordType) => void;
}

interface TeamPhotoSubmissionProps {
  variant: 'team';
  accountId: string;
  teamId: string;
  contextName: string;
  onSubmitted?: (submission: PhotoSubmissionRecordType) => void;
}

type PhotoSubmissionFormProps = AccountPhotoSubmissionProps | TeamPhotoSubmissionProps;

const PhotoSubmissionSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Title is required')
    .max(50, 'Title must be 50 characters or fewer'),
  caption: z.string().trim().max(255, 'Caption must be 255 characters or fewer').default(''),
  albumId: z.string().trim().optional().nullable(),
  photo: z.custom<File | null>().superRefine((value, ctx) => {
    if (!value) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Please choose a photo to upload.' });
      return;
    }

    const error = validatePhotoSubmissionFile(value);
    if (error) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: error });
    }
  }),
});

type PhotoSubmissionFormValues = z.input<typeof PhotoSubmissionSchema>;
type PhotoSubmissionFormSubmitValues = z.output<typeof PhotoSubmissionSchema>;

const buildDefaultAlbumOptions = (options?: PhotoAlbumOption[]): PhotoAlbumOption[] => {
  if (options && options.length > 0) {
    return options;
  }

  return [
    {
      id: null,
      title: 'Main Account Album (Default)',
    },
  ];
};

const getDefaultAlbumId = (
  options: PhotoAlbumOption[],
  variant: PhotoSubmissionFormProps['variant'],
) => {
  if (variant === 'team') {
    return null;
  }

  return options[0]?.id ?? null;
};

const formatSuccessMessage = (
  submission: PhotoSubmissionRecordType,
  contextName: string,
): string => {
  const normalizedContext = contextName.trim().length > 0 ? contextName : 'this gallery';
  return `Photo “${submission.title}” submitted for review in ${normalizedContext}.`;
};

const PhotoSubmissionForm: React.FC<PhotoSubmissionFormProps> = (props) => {
  const { accountId, contextName, onSubmitted } = props;
  const teamId = props.variant === 'team' ? props.teamId : null;
  const accountAlbumOptions = props.variant === 'account' ? props.albumOptions : undefined;
  const albumOptions = useMemo(
    () => buildDefaultAlbumOptions(accountAlbumOptions),
    [accountAlbumOptions],
  );

  const { submitPhoto, submitting, error, clearError } = usePhotoSubmission({
    accountId,
    teamId,
  });

  const defaultAlbumId = useMemo(
    () => getDefaultAlbumId(albumOptions, props.variant),
    [albumOptions, props.variant],
  );

  const {
    handleSubmit,
    control,
    register,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PhotoSubmissionFormValues, unknown, PhotoSubmissionFormSubmitValues>({
    resolver: zodResolver(PhotoSubmissionSchema),
    defaultValues: {
      title: '',
      caption: '',
      albumId: defaultAlbumId,
      photo: null,
    },
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const isProcessing = submitting || isSubmitting;
  const showAlbumSelection = props.variant === 'account';

  const resetForm = () => {
    reset({
      title: '',
      caption: '',
      albumId: defaultAlbumId,
      photo: null,
    });
    setSelectedFile(null);
  };

  const clearStatus = () => {
    clearError();
    setSuccessMessage(null);
  };

  const onSubmit = handleSubmit(async ({ title, caption, albumId, photo }) => {
    if (!(photo instanceof File)) {
      return;
    }

    const submission = await submitPhoto({
      title,
      caption: caption?.trim()?.length ? caption.trim() : undefined,
      albumId: showAlbumSelection ? (albumId ?? null) : null,
      photo,
    });

    if (submission) {
      setSuccessMessage(formatSuccessMessage(submission, contextName));
      onSubmitted?.(submission);
      resetForm();
    }
  });

  return (
    <Box component="section">
      <Typography variant="h5" gutterBottom>
        Submit a Photo for Review
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Upload a photo to share with {contextName}. Your submission will appear once a moderator
        approves it.
      </Typography>

      <Stack component="form" spacing={3} onSubmit={onSubmit} noValidate>
        <TextField
          label="Title"
          placeholder="Describe your photo"
          fullWidth
          inputProps={{ maxLength: 50 }}
          error={Boolean(errors.title)}
          helperText={errors.title?.message ?? '50 characters maximum'}
          {...register('title')}
          onFocus={clearStatus}
        />

        <TextField
          label="Caption"
          placeholder="Add more details (optional)"
          fullWidth
          multiline
          minRows={2}
          inputProps={{ maxLength: 255 }}
          error={Boolean(errors.caption)}
          helperText={errors.caption?.message ?? '255 characters maximum'}
          {...register('caption')}
          onFocus={clearStatus}
        />

        {showAlbumSelection && (
          <FormControl fullWidth error={Boolean(errors.albumId)}>
            <InputLabel id="photo-submission-album-label">Album</InputLabel>
            <Controller
              name="albumId"
              control={control}
              render={({ field }) => (
                <Select
                  labelId="photo-submission-album-label"
                  label="Album"
                  value={field.value ?? ''}
                  onChange={(event) => {
                    clearStatus();
                    field.onChange(event.target.value === '' ? null : event.target.value);
                  }}
                >
                  {albumOptions.map((option) => (
                    <MenuItem key={option.id ?? 'default'} value={option.id ?? ''}>
                      {option.title}
                    </MenuItem>
                  ))}
                </Select>
              )}
            />
            <FormHelperText>
              {errors.albumId?.message ?? 'Choose where the photo should appear'}
            </FormHelperText>
          </FormControl>
        )}

        <Controller
          name="photo"
          control={control}
          render={({ field: { value: _value, onChange, ...field } }) => (
            <Box>
              <Button
                variant="outlined"
                component="label"
                startIcon={selectedFile ? <PhotoCameraIcon /> : <CloudUploadIcon />}
                disabled={isProcessing}
              >
                {selectedFile ? 'Change Photo' : 'Choose Photo'}
                <input
                  {...field}
                  hidden
                  type="file"
                  accept="image/*"
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null;
                    setSelectedFile(file);
                    clearStatus();
                    onChange(file);
                  }}
                  data-testid="photo-input"
                />
              </Button>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {selectedFile ? selectedFile.name : 'GIF, JPG, JPEG, PNG, or BMP up to 10MB'}
              </Typography>
              {errors.photo?.message && (
                <FormHelperText error sx={{ mt: 1 }}>
                  {errors.photo.message}
                </FormHelperText>
              )}
            </Box>
          )}
        />

        {(error || successMessage) && (
          <Alert severity={error ? 'error' : 'success'} onClose={clearStatus} sx={{ mt: 1 }}>
            {error ?? successMessage}
          </Alert>
        )}

        <Box display="flex" justifyContent="flex-end" alignItems="center" gap={2}>
          {isProcessing && <CircularProgress size={24} />}
          <Button type="submit" variant="contained" disabled={isProcessing}>
            Submit Photo
          </Button>
        </Box>
      </Stack>
    </Box>
  );
};

export default PhotoSubmissionForm;
