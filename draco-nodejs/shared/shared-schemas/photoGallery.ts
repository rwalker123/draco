import { z } from 'zod';
import { bigintToStringSchema } from './standardSchema.js';

const optionalBigintQueryParam = z.preprocess((value) => {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const raw = Array.isArray(value) ? value[0] : value;

  if (raw === undefined || raw === null || raw === '') {
    return null;
  }

  if (typeof raw === 'bigint') {
    return raw;
  }

  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return BigInt(Math.trunc(raw));
  }

  if (typeof raw === 'string') {
    const trimmed = raw.trim();

    if (!trimmed) {
      return null;
    }

    try {
      return BigInt(trimmed);
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
    submittedAt: z
      .string()
      .datetime({ offset: true })
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

export type PhotoGalleryPhotoType = z.infer<typeof PhotoGalleryPhotoSchema>;
export type PhotoGalleryAlbumType = z.infer<typeof PhotoGalleryAlbumSchema>;
export type PhotoGalleryListType = z.infer<typeof PhotoGalleryListSchema>;
export type PhotoGalleryQueryType = z.infer<typeof PhotoGalleryQuerySchema>;
