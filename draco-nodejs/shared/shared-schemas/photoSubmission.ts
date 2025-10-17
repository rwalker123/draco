import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { bigintToStringSchema } from './standardSchema.js';

extendZodWithOpenApi(z);

export const PhotoSubmissionStatusSchema = z
  .enum(['Pending', 'Approved', 'Denied'])
  .openapi({ description: 'Moderation status for a photo submission' });

export const PhotoSubmissionAssetsSchema = z
  .object({
    originalFilePath: z
      .string()
      .trim()
      .min(1)
      .openapi({ description: 'Relative path to the uploaded original asset' }),
    primaryImagePath: z
      .string()
      .trim()
      .min(1)
      .openapi({ description: 'Relative path to the generated primary image asset' }),
    thumbnailImagePath: z
      .string()
      .trim()
      .min(1)
      .openapi({ description: 'Relative path to the generated thumbnail image asset' }),
    originalFileName: z
      .string()
      .trim()
      .min(1)
      .max(255)
      .openapi({ description: 'Original filename supplied by the submitter' }),
  })
  .openapi({ description: 'Asset information tracked for a staged photo submission' });

export const PhotoSubmissionMetadataSchema = z
  .object({
    id: bigintToStringSchema,
    accountId: bigintToStringSchema,
    teamId: bigintToStringSchema
      .nullable()
      .openapi({ description: 'Identifier for the associated team, if any' }),
    albumId: bigintToStringSchema
      .nullable()
      .openapi({ description: 'Identifier for the destination album, if any' }),
    submitterContactId: bigintToStringSchema,
    moderatedByContactId: bigintToStringSchema
      .nullable()
      .openapi({ description: 'Moderator contact responsible for the decision' }),
    approvedPhotoId: bigintToStringSchema
      .nullable()
      .openapi({ description: 'Approved gallery photo identifier when promoted' }),
    title: z
      .string()
      .trim()
      .min(1)
      .max(50)
      .openapi({ description: 'Title supplied for the submission' }),
    caption: z
      .string()
      .trim()
      .max(255)
      .nullable()
      .openapi({ description: 'Optional caption supplied for the submission' }),
    status: PhotoSubmissionStatusSchema,
    denialReason: z
      .string()
      .trim()
      .max(255)
      .nullable()
      .openapi({ description: 'Moderator supplied reason for denial' }),
    submittedAt: z
      .string()
      .trim()
      .openapi({ description: 'ISO timestamp when the submission was created' }),
    updatedAt: z
      .string()
      .trim()
      .openapi({ description: 'ISO timestamp when the submission was last updated' }),
    moderatedAt: z
      .string()
      .trim()
      .nullable()
      .openapi({ description: 'ISO timestamp when the submission was moderated' }),
  })
  .openapi({ description: 'Metadata tracked for a photo submission' });

export const PhotoSubmissionRecordSchema = PhotoSubmissionMetadataSchema.merge(
  PhotoSubmissionAssetsSchema,
).openapi({
  title: 'PhotoSubmission',
  description: 'Photo submission record with metadata and staged assets',
});

export const PhotoSubmissionContactInfoSchema = z
  .object({
    id: bigintToStringSchema,
    firstName: z
      .string()
      .trim()
      .openapi({ description: 'Contact first name' }),
    lastName: z
      .string()
      .trim()
      .openapi({ description: 'Contact last name' }),
    email: z
      .string()
      .trim()
      .email()
      .nullable()
      .optional()
      .openapi({ description: 'Contact email address, if available' }),
  })
  .openapi({ description: 'Contact information associated with a photo submission' });

export const PhotoSubmissionAlbumInfoSchema = z
  .object({
    id: bigintToStringSchema,
    title: z
      .string()
      .trim()
      .min(1)
      .openapi({ description: 'Album title' }),
    teamId: bigintToStringSchema
      .nullable()
      .openapi({ description: 'Team identifier the album belongs to, when applicable' }),
  })
  .openapi({ description: 'Album information linked to a photo submission' });

export const PhotoSubmissionApprovedPhotoSchema = z
  .object({
    id: bigintToStringSchema,
    title: z
      .string()
      .trim()
      .min(1)
      .openapi({ description: 'Approved photo title' }),
    albumId: bigintToStringSchema
      .nullable()
      .openapi({ description: 'Album identifier for the approved photo, if any' }),
  })
  .openapi({ description: 'Photo gallery entry created from an approved submission' });

export const PhotoSubmissionDetailSchema = PhotoSubmissionRecordSchema.extend({
  accountName: z
    .string()
    .trim()
    .openapi({ description: 'Display name of the owning account' }),
  album: PhotoSubmissionAlbumInfoSchema.nullable(),
  approvedPhoto: PhotoSubmissionApprovedPhotoSchema.nullable(),
  submitter: PhotoSubmissionContactInfoSchema.nullable(),
  moderator: PhotoSubmissionContactInfoSchema.nullable(),
}).openapi({
  title: 'PhotoSubmissionDetail',
  description: 'Detailed view of a photo submission including related entities',
});

export const PhotoSubmissionListSchema = z
  .object({
    submissions: PhotoSubmissionDetailSchema.array(),
  })
  .openapi({
    title: 'PhotoSubmissionList',
    description: 'Collection response containing pending photo submissions',
  });

export const CreatePhotoSubmissionInputSchema = z
  .object({
    accountId: bigintToStringSchema,
    submitterContactId: bigintToStringSchema,
    title: z.string().trim().min(1).max(50),
    caption: z.string().trim().max(255).nullable().optional(),
    albumId: bigintToStringSchema.nullable().optional(),
    teamId: bigintToStringSchema.nullable().optional(),
    originalFileName: z.string().trim().min(1).max(255),
    storageKey: z.string().trim().optional(),
  })
  .openapi({
    description: 'Input required to stage a photo submission within the service layer',
  });

export const ApprovePhotoSubmissionInputSchema = z
  .object({
    accountId: bigintToStringSchema,
    submissionId: bigintToStringSchema,
    moderatorContactId: bigintToStringSchema,
    approvedPhotoId: bigintToStringSchema,
  })
  .openapi({
    description: 'Input required to approve a pending photo submission',
  });

export const DenyPhotoSubmissionInputSchema = z
  .object({
    accountId: bigintToStringSchema,
    submissionId: bigintToStringSchema,
    moderatorContactId: bigintToStringSchema,
    denialReason: z.string().trim().min(1).max(255),
  })
  .openapi({
    description: 'Input required to deny a pending photo submission',
  });

export const DenyPhotoSubmissionRequestSchema = z
  .object({
    denialReason: z
      .string()
      .trim()
      .min(1)
      .max(255)
      .openapi({ description: 'Reason provided by the moderator when denying a submission' }),
  })
  .openapi({
    title: 'DenyPhotoSubmissionRequest',
    description: 'Request payload for denying a photo submission via the API',
  });

export const CreatePhotoSubmissionFormSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1)
      .max(50)
      .openapi({ description: 'Title for the uploaded photo submission' }),
    caption: z
      .string()
      .trim()
      .max(255)
      .optional()
      .openapi({ description: 'Optional caption for the photo submission' }),
    albumId: z
      .string()
      .trim()
      .regex(/^\d+$/)
      .optional()
      .openapi({ description: 'Album identifier selected for the submission' }),
    photo: z
      .string()
      .openapi({ type: 'string', format: 'binary', description: 'Photo file to upload' }),
  })
  .openapi({
    title: 'CreatePhotoSubmissionForm',
    description: 'Multipart form payload for submitting a staged photo',
  });

export type PhotoSubmissionStatusType = z.infer<typeof PhotoSubmissionStatusSchema>;
export type PhotoSubmissionAssetsType = z.infer<typeof PhotoSubmissionAssetsSchema>;
export type PhotoSubmissionMetadataType = z.infer<typeof PhotoSubmissionMetadataSchema>;
export type PhotoSubmissionRecordType = z.infer<typeof PhotoSubmissionRecordSchema>;
export type PhotoSubmissionContactInfoType = z.infer<typeof PhotoSubmissionContactInfoSchema>;
export type PhotoSubmissionAlbumInfoType = z.infer<typeof PhotoSubmissionAlbumInfoSchema>;
export type PhotoSubmissionApprovedPhotoType = z.infer<typeof PhotoSubmissionApprovedPhotoSchema>;
export type PhotoSubmissionDetailType = z.infer<typeof PhotoSubmissionDetailSchema>;
export type PhotoSubmissionListType = z.infer<typeof PhotoSubmissionListSchema>;
export type CreatePhotoSubmissionInputType = z.infer<typeof CreatePhotoSubmissionInputSchema>;
export type ApprovePhotoSubmissionInputType = z.infer<typeof ApprovePhotoSubmissionInputSchema>;
export type DenyPhotoSubmissionInputType = z.infer<typeof DenyPhotoSubmissionInputSchema>;
export type DenyPhotoSubmissionRequestType = z.infer<typeof DenyPhotoSubmissionRequestSchema>;
export type CreatePhotoSubmissionFormType = z.infer<typeof CreatePhotoSubmissionFormSchema>;
