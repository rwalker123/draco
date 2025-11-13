import { z } from 'zod';
import { bigintToStringSchema } from './standardSchema.js';
import { isoDateTimeSchema } from './date.js';

const optionalBigintQueryParam = z.preprocess((value) => {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const raw = Array.isArray(value) ? value[0] : value;

  if (raw === undefined || raw === null || raw === '') {
    return null;
  }

  if (typeof raw === 'bigint') {
    return raw.toString();
  }

  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return Math.trunc(raw).toString();
  }

  if (typeof raw === 'string') {
    const trimmed = raw.trim();

    if (!trimmed) {
      return null;
    }

    try {
      BigInt(trimmed);
      return trimmed;
    } catch {
      return trimmed;
    }
  }

  return raw;
}, bigintToStringSchema.nullable());

export const PhotoGalleryPhotoSchema = z
  .object({
    id: bigintToStringSchema,
    submissionId: bigintToStringSchema,
    accountId: bigintToStringSchema,
    teamId: bigintToStringSchema.nullable(),
    albumId: bigintToStringSchema.nullable(),
    albumTitle: z
      .string()
      .trim()
      .min(1)
      .max(255)
      .openapi({ description: 'Display title for the album containing the photo' }),
    title: z
      .string()
      .trim()
      .min(1)
      .max(255)
      .openapi({ description: 'Title assigned to the approved gallery photo' }),
    caption: z
      .string()
      .trim()
      .max(255)
      .nullable()
      .openapi({ description: 'Optional caption describing the gallery photo' }),
    submittedAt: isoDateTimeSchema
      .nullable()
      .openapi({ description: 'Timestamp when the source submission was created' }),
    originalUrl: z
      .string()
      .trim()
      .min(1)
      .openapi({ description: 'Relative URL to the original gallery asset' }),
    primaryUrl: z
      .string()
      .trim()
      .min(1)
      .openapi({ description: 'Relative URL to the primary sized gallery asset' }),
    thumbnailUrl: z
      .string()
      .trim()
      .min(1)
      .openapi({ description: 'Relative URL to the thumbnail gallery asset' }),
  })
  .openapi({
    title: 'PhotoGalleryPhoto',
    description: 'Approved gallery photo ready for display in the account UI',
  });

export const PhotoGalleryAlbumSchema = z
  .object({
    id: bigintToStringSchema.nullable(),
    accountId: bigintToStringSchema,
    title: z
      .string()
      .trim()
      .min(1)
      .max(255)
      .openapi({ description: 'Album title used for grouping gallery photos' }),
    teamId: bigintToStringSchema
      .nullable()
      .openapi({ description: 'Team identifier associated with the album when applicable' }),
    photoCount: z
      .number()
      .int()
      .min(0)
      .openapi({ description: 'Total number of photos contained in the album' }),
  })
  .openapi({
    title: 'PhotoGalleryAlbum',
    description: 'Album metadata summarizing gallery contents for filtering',
  });

export const PhotoGalleryListSchema = z
  .object({
    photos: PhotoGalleryPhotoSchema.array(),
    albums: PhotoGalleryAlbumSchema.array(),
  })
  .openapi({
    title: 'PhotoGalleryList',
    description: 'Account photo gallery response including photos and available albums',
  });

export const PhotoGalleryQuerySchema = z
  .object({
    albumId: optionalBigintQueryParam.optional(),
    teamId: optionalBigintQueryParam.optional(),
  })
  .openapi({
    title: 'PhotoGalleryQuery',
    description: 'Optional filters when retrieving the account photo gallery',
  });

const numericIdentifierSchema = z.string().trim().regex(/^\d+$/).openapi({
  description: 'Numeric identifier string representation',
  example: '123',
});

const optionalNumericIdentifierSchema = z
  .union([numericIdentifierSchema, z.null()])
  .optional()
  .openapi({ description: 'Optional numeric identifier that may be null' });

export const CreatePhotoGalleryPhotoSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1)
      .max(50)
      .openapi({ description: 'Title for the approved gallery photo' }),
    caption: z
      .string()
      .trim()
      .max(255)
      .optional()
      .openapi({ description: 'Optional caption describing the gallery photo' }),
    albumId: optionalNumericIdentifierSchema.openapi({
      description: 'Album identifier that groups the photo. Null clears the current album.',
    }),
    photo: z
      .string()
      .openapi({ type: 'string', format: 'binary', description: 'Photo file to upload' }),
  })
  .openapi({
    title: 'CreatePhotoGalleryPhoto',
    description: 'Multipart payload used by administrators to upload a gallery photo',
  });

export const UpdatePhotoGalleryPhotoSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1)
      .max(50)
      .optional()
      .openapi({ description: 'Updated title for the gallery photo' }),
    caption: z
      .string()
      .trim()
      .max(255)
      .nullable()
      .optional()
      .openapi({ description: 'Updated caption for the gallery photo' }),
    albumId: optionalNumericIdentifierSchema.openapi({
      description: 'Album identifier to reassign the photo. Null clears the current album.',
    }),
  })
  .refine(
    (value) =>
      value.title !== undefined || value.caption !== undefined || value.albumId !== undefined,
    { message: 'At least one field must be provided to update the photo' },
  )
  .openapi({
    title: 'UpdatePhotoGalleryPhoto',
    description: 'JSON payload for updating gallery photo metadata',
  });

export const CreatePhotoGalleryAlbumSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1)
      .max(25)
      .openapi({ description: 'Album title used for grouping gallery photos' }),
    teamId: optionalNumericIdentifierSchema.openapi({
      description:
        'Team identifier associated with the album. Null creates an account-level album.',
    }),
    parentAlbumId: optionalNumericIdentifierSchema.openapi({
      description:
        'Identifier of the parent album when nesting albums. Null creates a top-level album.',
    }),
  })
  .openapi({
    title: 'CreatePhotoGalleryAlbum',
    description: 'Payload for administrators to create a gallery album',
  });

export const UpdatePhotoGalleryAlbumSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1)
      .max(25)
      .optional()
      .openapi({ description: 'New title for the gallery album' }),
    teamId: optionalNumericIdentifierSchema.openapi({
      description: 'Updated team association for the album. Null removes the association.',
    }),
    parentAlbumId: optionalNumericIdentifierSchema.openapi({
      description:
        'Updated parent album for the album. Null promotes the album to top-level status.',
    }),
  })
  .refine(
    (value) =>
      value.title !== undefined || value.teamId !== undefined || value.parentAlbumId !== undefined,
    { message: 'At least one field must be provided to update the album' },
  )
  .openapi({
    title: 'UpdatePhotoGalleryAlbum',
    description: 'Payload for updating gallery album metadata',
  });

export const PhotoGalleryAdminAlbumSchema = z
  .object({
    id: bigintToStringSchema,
    accountId: bigintToStringSchema,
    title: z
      .string()
      .trim()
      .min(1)
      .max(25)
      .openapi({ description: 'Album title used for grouping gallery photos' }),
    teamId: bigintToStringSchema
      .nullable()
      .openapi({ description: 'Team identifier associated with the album when applicable' }),
    parentAlbumId: bigintToStringSchema
      .nullable()
      .openapi({ description: 'Identifier of the parent album when the album is nested' }),
    photoCount: z
      .number()
      .int()
      .min(0)
      .openapi({ description: 'Total number of photos contained in the album' }),
  })
  .openapi({
    title: 'PhotoGalleryAdminAlbum',
    description: 'Detailed album metadata for administrative management',
  });

export const PhotoGalleryAdminAlbumListSchema = z
  .object({
    albums: PhotoGalleryAdminAlbumSchema.array(),
  })
  .openapi({
    title: 'PhotoGalleryAdminAlbumList',
    description: 'Collection response of gallery albums for administrative use',
  });

export type PhotoGalleryPhotoType = z.infer<typeof PhotoGalleryPhotoSchema>;
export type PhotoGalleryAlbumType = z.infer<typeof PhotoGalleryAlbumSchema>;
export type PhotoGalleryListType = z.infer<typeof PhotoGalleryListSchema>;
export type PhotoGalleryQueryType = z.infer<typeof PhotoGalleryQuerySchema>;
export type CreatePhotoGalleryPhotoType = z.infer<typeof CreatePhotoGalleryPhotoSchema>;
export type UpdatePhotoGalleryPhotoType = z.infer<typeof UpdatePhotoGalleryPhotoSchema>;
export type CreatePhotoGalleryAlbumType = z.infer<typeof CreatePhotoGalleryAlbumSchema>;
export type UpdatePhotoGalleryAlbumType = z.infer<typeof UpdatePhotoGalleryAlbumSchema>;
export type PhotoGalleryAdminAlbumType = z.infer<typeof PhotoGalleryAdminAlbumSchema>;
export type PhotoGalleryAdminAlbumListType = z.infer<typeof PhotoGalleryAdminAlbumListSchema>;
