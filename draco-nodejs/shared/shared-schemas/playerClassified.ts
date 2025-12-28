import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { PaginationSchema } from './paging.js';
import { bigintToStringSchema, trimToUndefined, birthDateSchema } from './standardSchema.js';

extendZodWithOpenApi(z);

export const PlayerClassifiedSortBySchema = z.enum(['dateCreated', 'relevance']);

export const PlayerClassifiedSortOrderSchema = z.enum(['asc', 'desc']);

export const PlayerClassifiedSearchQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    sortBy: PlayerClassifiedSortBySchema.default('dateCreated'),
    sortOrder: PlayerClassifiedSortOrderSchema.default('desc'),
    searchQuery: z.string().max(200).transform(trimToUndefined).optional(),
  })
  .openapi({
    title: 'PlayerClassifiedSearchQuery',
    description: 'Query parameters used to paginate and filter player classified listings',
  });

const ClassifiedAccountSchema = z.object({
  id: bigintToStringSchema,
  name: z.string(),
});

const ClassifiedCreatorSchema = z.object({
  id: bigintToStringSchema,
  firstName: z.string(),
  lastName: z.string(),
  photoUrl: z.string(),
});

export const PlayersWantedClassifiedSchema = z
  .object({
    id: bigintToStringSchema,
    accountId: z.string(),
    dateCreated: z.string().nullable(),
    createdByContactId: z.string(),
    teamEventName: z.string(),
    description: z.string(),
    positionsNeeded: z.string(),
    notifyOptOut: z.boolean(),
    creator: ClassifiedCreatorSchema,
    account: ClassifiedAccountSchema,
  })
  .openapi({
    title: 'PlayersWantedClassified',
    description: 'Players Wanted classified listing',
  });

export const TeamsWantedPublicClassifiedSchema = z
  .object({
    id: bigintToStringSchema,
    accountId: z.string(),
    dateCreated: z.string().nullable(),
    name: z.string(),
    experience: z.string(),
    positionsPlayed: z.string(),
    age: z.number().nullable(),
    account: ClassifiedAccountSchema,
  })
  .openapi({
    title: 'TeamsWantedPublicClassified',
    description: 'Teams Wanted classified listing for public display without contact information',
  });

export const TeamsWantedOwnerClassifiedSchema = z
  .object({
    id: bigintToStringSchema,
    accountId: z.string(),
    dateCreated: z.string().nullable(),
    name: z.string(),
    email: z.string(),
    phone: z.string(),
    experience: z.string(),
    positionsPlayed: z.string(),
    birthDate: z.string().nullable(),
    age: z.number().nullable(),
    notifyOptOut: z.boolean(),
    account: ClassifiedAccountSchema,
  })
  .openapi({
    title: 'TeamsWantedOwnerClassified',
    description: 'Teams Wanted classified listing for the owner including contact information',
  });

const PlayerClassifiedPaginationSchema = PaginationSchema.extend({
  totalPages: z.number(),
}).openapi({
  title: 'PlayerClassifiedPagination',
  description: 'Pagination metadata for player classified listings',
});

const PlayerClassifiedFilterSchema = z
  .object({
    type: z.enum(['players', 'teams', 'all']),
    positions: z.array(z.string()),
    experience: z.array(z.string()),
    dateRange: z.object({
      from: z.string().nullable(),
      to: z.string().nullable(),
    }),
    searchQuery: z.string().nullable(),
  })
  .openapi({
    title: 'PlayerClassifiedFilters',
    description: 'Filters applied to a player classified search request',
  });

export const PlayersWantedClassifiedPagedSchema = z
  .object({
    data: PlayersWantedClassifiedSchema.array(),
    total: z.number(),
    pagination: PlayerClassifiedPaginationSchema,
    filters: PlayerClassifiedFilterSchema,
  })
  .openapi({
    title: 'PlayersWantedClassifiedList',
    description: 'Paginated Players Wanted classified listings',
  });

export const TeamsWantedPublicClassifiedPagedSchema = z
  .object({
    data: TeamsWantedPublicClassifiedSchema.array(),
    total: z.number(),
    pagination: PlayerClassifiedPaginationSchema,
    filters: PlayerClassifiedFilterSchema,
  })
  .openapi({
    title: 'TeamsWantedPublicClassifiedPaged',
    description: 'Paginated Teams Wanted classified listings for public display',
  });

const nonEmptyString = z.string().trim().min(1);

export const UpsertPlayersWantedClassifiedSchema = z
  .object({
    id: bigintToStringSchema.optional(),
    teamEventName: nonEmptyString.max(50),
    description: z.string().trim().min(1).max(2000),
    positionsNeeded: nonEmptyString.max(255),
    notifyOptOut: z.boolean().optional().default(false),
  })
  .openapi({
    title: 'UpsertPlayersWantedClassifiedRequest',
    description: 'Request body for creating or updating a Players Wanted classified',
  });

const emailSchema = z.email().trim().max(320);
const phoneSchema = z.string().trim().min(1).max(50);
const experienceSchema = z.string().trim().min(1).max(2000);
const positionsSchema = z.string().trim().min(1).max(255);

export const UpsertTeamsWantedClassifiedSchema = z
  .object({
    accessCode: z.string().trim().min(10).max(1000).optional(),
    name: nonEmptyString.max(50),
    email: emailSchema,
    phone: phoneSchema,
    experience: experienceSchema,
    positionsPlayed: positionsSchema,
    birthDate: birthDateSchema.optional().default(''),
    notifyOptOut: z.boolean().optional().default(false),
  })
  .openapi({
    title: 'UpsertTeamsWantedClassifiedRequest',
    description: 'Request body for creating or updating a Teams Wanted classified',
  });

export const TeamsWantedAccessCodeSchema = z
  .object({
    accessCode: z.string().trim().min(10).max(1000),
  })
  .openapi({
    title: 'TeamsWantedAccessCode',
    description: 'Access code used to authenticate Teams Wanted classified actions',
  });

export const TeamsWantedContactQuerySchema = z
  .object({
    accessCode: z.string().trim().min(10).max(1000).optional(),
  })
  .openapi({
    title: 'TeamsWantedContactQuery',
    description: 'Query parameters used to request Teams Wanted contact information',
  });

export const TeamsWantedContactInfoSchema = z
  .object({
    email: z.email().trim().max(320),
    phone: z.string().trim().min(1).max(50),
    birthDate: birthDateSchema,
    notifyOptOut: z.boolean(),
  })
  .openapi({
    title: 'TeamsWantedContactInfo',
    description: 'Contact information for a Teams Wanted classified',
  });

export const ContactPlayersWantedCreatorSchema = z
  .object({
    senderName: nonEmptyString.max(100),
    senderEmail: z.email().trim().max(320),
    message: z.string().trim().min(1).max(5000),
  })
  .openapi({
    title: 'ContactPlayersWantedCreatorRequest',
    description: 'Request body for contacting a Players Wanted classified creator',
  });

export const BaseballPositionSchema = z
  .object({
    id: bigintToStringSchema,
    name: z.string(),
    category: z.enum(['pitching', 'infield', 'outfield', 'catching', 'utility']),
    abbreviation: z.string(),
  })
  .openapi({
    title: 'BaseballPosition',
    description: 'Baseball position metadata used in player classifieds',
  });

export const ExperienceLevelSchema = z
  .object({
    id: bigintToStringSchema,
    name: z.string(),
    description: z.string(),
    yearsRequired: z.number(),
    skillLevel: z.enum(['beginner', 'intermediate', 'advanced', 'expert']),
  })
  .openapi({
    title: 'ExperienceLevel',
    description: 'Experience level metadata used in player classifieds',
  });

export const TeamsWantedOwnerClassifiedPagedSchema = z
  .object({
    data: TeamsWantedOwnerClassifiedSchema.array(),
    total: z.number(),
    pagination: PlayerClassifiedPaginationSchema,
    filters: PlayerClassifiedFilterSchema,
  })
  .openapi({
    title: 'TeamsWantedOwnerClassifiedPaged',
    description: 'Paginated Teams Wanted classified including contact information',
  });

export const ClassifiedIdentifierSchema = z
  .object({
    accountId: bigintToStringSchema,
    classifiedId: bigintToStringSchema,
  })
  .openapi({
    title: 'PlayerClassifiedIdentifier',
    description: 'Identifier payload for player classified resources',
  });

export type PlayerClassifiedSortByType = z.infer<typeof PlayerClassifiedSortBySchema>;
export type PlayerClassifiedSortOrderType = z.infer<typeof PlayerClassifiedSortOrderSchema>;
export type PlayerClassifiedSearchQueryType = z.infer<typeof PlayerClassifiedSearchQuerySchema>;
export type PlayersWantedClassifiedType = z.infer<typeof PlayersWantedClassifiedSchema>;
export type TeamsWantedPublicClassifiedType = z.infer<typeof TeamsWantedPublicClassifiedSchema>;
export type TeamsWantedOwnerClassifiedType = z.infer<typeof TeamsWantedOwnerClassifiedSchema>;
export type PlayersWantedClassifiedPagedType = z.infer<typeof PlayersWantedClassifiedPagedSchema>;
export type TeamsWantedPublicClassifiedPagedType = z.infer<
  typeof TeamsWantedPublicClassifiedPagedSchema
>;
export type UpsertPlayersWantedClassifiedType = z.infer<typeof UpsertPlayersWantedClassifiedSchema>;
export type UpsertTeamsWantedClassifiedType = z.infer<typeof UpsertTeamsWantedClassifiedSchema>;
export type TeamsWantedAccessCodeType = z.infer<typeof TeamsWantedAccessCodeSchema>;
export type TeamsWantedContactQueryType = z.infer<typeof TeamsWantedContactQuerySchema>;
export type TeamsWantedContactInfoType = z.infer<typeof TeamsWantedContactInfoSchema>;
export type ContactPlayersWantedCreatorType = z.infer<typeof ContactPlayersWantedCreatorSchema>;
export type BaseballPositionType = z.infer<typeof BaseballPositionSchema>;
export type ExperienceLevelType = z.infer<typeof ExperienceLevelSchema>;
export type TeamsWantedOwnerClassifiedPagedType = z.infer<
  typeof TeamsWantedOwnerClassifiedPagedSchema
>;
export type ClassifiedIdentifierType = z.infer<typeof ClassifiedIdentifierSchema>;
