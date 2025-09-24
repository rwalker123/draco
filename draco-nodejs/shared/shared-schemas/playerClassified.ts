import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { PaginationSchema } from './paging.js';

extendZodWithOpenApi(z);

const bigintToStringSchema = z.bigint().transform((value) => value.toString());

const preprocessSingleValue = <T>(schema: z.ZodType<T>) =>
  z.preprocess((value) => {
    if (Array.isArray(value)) {
      return value[0];
    }

    return value;
  }, schema);

const trimToUndefined = (value: unknown) => {
  if (value === undefined || value === null) {
    return undefined;
  }

  const stringValue = String(value).trim();

  return stringValue.length === 0 ? undefined : stringValue;
};

export const PlayerClassifiedSortBySchema = z.enum(['dateCreated', 'relevance']);
export type PlayerClassifiedSortByType = z.infer<typeof PlayerClassifiedSortBySchema>;

export const PlayerClassifiedSortOrderSchema = z.enum(['asc', 'desc']);
export type PlayerClassifiedSortOrderType = z.infer<typeof PlayerClassifiedSortOrderSchema>;

export const PlayerClassifiedSearchQuerySchema = z
  .object({
    page: preprocessSingleValue(z.coerce.number().int().min(1)).default(1),
    limit: preprocessSingleValue(z.coerce.number().int().min(1).max(100)).default(20),
    sortBy: preprocessSingleValue(PlayerClassifiedSortBySchema.catch('dateCreated')).default('dateCreated'),
    sortOrder: preprocessSingleValue(PlayerClassifiedSortOrderSchema.catch('desc')).default('desc'),
    searchQuery: preprocessSingleValue(
      z
        .string()
        .transform((val) => val.trim())
        .min(1)
        .max(200)
        .optional(),
    )
      .transform(trimToUndefined)
      .optional(),
  })
  .openapi({
    title: 'PlayerClassifiedSearchQuery',
    description: 'Query parameters used to paginate and filter player classified listings',
  });

export type PlayerClassifiedSearchQueryType = z.infer<typeof PlayerClassifiedSearchQuerySchema>;

const ClassifiedAccountSchema = z.object({
  id: z.string(),
  name: z.string(),
});

const ClassifiedCreatorSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  photoUrl: z.string(),
});

export const PlayersWantedClassifiedSchema = z
  .object({
    id: z.string(),
    accountId: z.string(),
    dateCreated: z.string().nullable(),
    createdByContactId: z.string(),
    teamEventName: z.string(),
    description: z.string(),
    positionsNeeded: z.string(),
    creator: ClassifiedCreatorSchema,
    account: ClassifiedAccountSchema,
  })
  .openapi({
    title: 'PlayersWantedClassified',
    description: 'Players Wanted classified listing',
  });

export type PlayersWantedClassifiedType = z.infer<typeof PlayersWantedClassifiedSchema>;

export const TeamsWantedPublicClassifiedSchema = z
  .object({
    id: z.string(),
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

export type TeamsWantedPublicClassifiedType = z.infer<typeof TeamsWantedPublicClassifiedSchema>;

export const TeamsWantedOwnerClassifiedSchema = z
  .object({
    id: z.string(),
    accountId: z.string(),
    dateCreated: z.string().nullable(),
    name: z.string(),
    email: z.string(),
    phone: z.string(),
    experience: z.string(),
    positionsPlayed: z.string(),
    birthDate: z.string().nullable(),
    account: ClassifiedAccountSchema,
  })
  .openapi({
    title: 'TeamsWantedOwnerClassified',
    description: 'Teams Wanted classified listing for the owner including contact information',
  });

export type TeamsWantedOwnerClassifiedType = z.infer<typeof TeamsWantedOwnerClassifiedSchema>;

const PlayerClassifiedPaginationSchema = PaginationSchema.extend({
  totalPages: z.number(),
})
  .openapi({
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

export const PlayersWantedClassifiedListSchema = z
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

export type PlayersWantedClassifiedListType = z.infer<typeof PlayersWantedClassifiedListSchema>;

export const TeamsWantedPublicClassifiedListSchema = z
  .object({
    data: TeamsWantedPublicClassifiedSchema.array(),
    total: z.number(),
    pagination: PlayerClassifiedPaginationSchema,
    filters: PlayerClassifiedFilterSchema,
  })
  .openapi({
    title: 'TeamsWantedPublicClassifiedList',
    description: 'Paginated Teams Wanted classified listings for public display',
  });

export type TeamsWantedPublicClassifiedListType = z.infer<typeof TeamsWantedPublicClassifiedListSchema>;

const nonEmptyString = z.string().trim().min(1);

export const CreatePlayersWantedClassifiedSchema = z
  .object({
    teamEventName: nonEmptyString.max(50),
    description: z.string().trim().min(1).max(2000),
    positionsNeeded: nonEmptyString.max(255),
  })
  .openapi({
    title: 'CreatePlayersWantedClassifiedRequest',
    description: 'Request body for creating a Players Wanted classified',
  });

export type CreatePlayersWantedClassifiedType = z.infer<typeof CreatePlayersWantedClassifiedSchema>;

export const UpdatePlayersWantedClassifiedSchema = z
  .object({
    teamEventName: z.string().trim().min(1).max(50).optional(),
    description: z.string().trim().min(1).max(2000).optional(),
    positionsNeeded: z.string().trim().min(1).max(255).optional(),
  })
  .openapi({
    title: 'UpdatePlayersWantedClassifiedRequest',
    description: 'Request body for updating a Players Wanted classified',
  });

export type UpdatePlayersWantedClassifiedType = z.infer<typeof UpdatePlayersWantedClassifiedSchema>;

const emailSchema = z.string().trim().email().max(320);
const phoneSchema = z.string().trim().min(1).max(50);
const experienceSchema = z.string().trim().min(1).max(255);
const positionsSchema = z.string().trim().min(1).max(255);

const birthDateSchema = z
  .string()
  .trim()
  .refine(
    (value) => value === '' || /^\d{4}-\d{2}-\d{2}$/.test(value),
    'Birth date must be empty or formatted as YYYY-MM-DD',
  );

export const CreateTeamsWantedClassifiedSchema = z
  .object({
    name: nonEmptyString.max(50),
    email: emailSchema,
    phone: phoneSchema,
    experience: experienceSchema,
    positionsPlayed: positionsSchema,
    birthDate: birthDateSchema.optional().default(''),
  })
  .openapi({
    title: 'CreateTeamsWantedClassifiedRequest',
    description: 'Request body for creating a Teams Wanted classified',
  });

export type CreateTeamsWantedClassifiedType = z.infer<typeof CreateTeamsWantedClassifiedSchema>;

export const UpdateTeamsWantedClassifiedSchema = z
  .object({
    accessCode: z.string().trim().min(10).max(1000).optional(),
    name: z.string().trim().min(1).max(50).optional(),
    email: emailSchema.optional(),
    phone: phoneSchema.optional(),
    experience: experienceSchema.optional(),
    positionsPlayed: positionsSchema.optional(),
    birthDate: birthDateSchema.optional(),
  })
  .openapi({
    title: 'UpdateTeamsWantedClassifiedRequest',
    description: 'Request body for updating a Teams Wanted classified',
  });

export type UpdateTeamsWantedClassifiedType = z.infer<typeof UpdateTeamsWantedClassifiedSchema>;

export const TeamsWantedAccessCodeSchema = z
  .object({
    accessCode: preprocessSingleValue(z.string().trim().min(10).max(1000)),
  })
  .openapi({
    title: 'TeamsWantedAccessCode',
    description: 'Access code used to authenticate Teams Wanted classified actions',
  });

export type TeamsWantedAccessCodeType = z.infer<typeof TeamsWantedAccessCodeSchema>;

export const TeamsWantedContactQuerySchema = z
  .object({
    accessCode: preprocessSingleValue(z.string().trim().min(10).max(1000)).optional(),
  })
  .openapi({
    title: 'TeamsWantedContactQuery',
    description: 'Query parameters used to request Teams Wanted contact information',
  });

export type TeamsWantedContactQueryType = z.infer<typeof TeamsWantedContactQuerySchema>;

export const TeamsWantedContactInfoSchema = z
  .object({
    email: z.string(),
    phone: z.string(),
    birthDate: z.string().nullable(),
  })
  .openapi({
    title: 'TeamsWantedContactInfo',
    description: 'Contact information for a Teams Wanted classified',
  });

export type TeamsWantedContactInfoType = z.infer<typeof TeamsWantedContactInfoSchema>;

export const ContactPlayersWantedCreatorSchema = z
  .object({
    senderName: nonEmptyString.max(100),
    senderEmail: z.string().trim().email().max(320),
    message: z.string().trim().min(1).max(5000),
  })
  .openapi({
    title: 'ContactPlayersWantedCreatorRequest',
    description: 'Request body for contacting a Players Wanted classified creator',
  });

export type ContactPlayersWantedCreatorType = z.infer<typeof ContactPlayersWantedCreatorSchema>;

export const BaseballPositionSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    category: z.enum(['pitching', 'infield', 'outfield', 'catching', 'utility']),
    abbreviation: z.string(),
  })
  .openapi({
    title: 'BaseballPosition',
    description: 'Baseball position metadata used in player classifieds',
  });

export type BaseballPositionType = z.infer<typeof BaseballPositionSchema>;

export const ExperienceLevelSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    yearsRequired: z.number(),
    skillLevel: z.enum(['beginner', 'intermediate', 'advanced', 'expert']),
  })
  .openapi({
    title: 'ExperienceLevel',
    description: 'Experience level metadata used in player classifieds',
  });

export type ExperienceLevelType = z.infer<typeof ExperienceLevelSchema>;

export const TeamsWantedOwnerClassifiedListSchema = z
  .object({
    data: TeamsWantedOwnerClassifiedSchema.array(),
    total: z.number(),
    pagination: PlayerClassifiedPaginationSchema,
    filters: PlayerClassifiedFilterSchema,
  })
  .openapi({
    title: 'TeamsWantedOwnerClassifiedList',
    description: 'Paginated Teams Wanted classified listings including contact information',
  });

export type TeamsWantedOwnerClassifiedListType = z.infer<typeof TeamsWantedOwnerClassifiedListSchema>;

export const ClassifiedIdentifierSchema = z
  .object({
    accountId: bigintToStringSchema,
    classifiedId: bigintToStringSchema,
  })
  .openapi({
    title: 'PlayerClassifiedIdentifier',
    description: 'Identifier payload for player classified resources',
  });

export type ClassifiedIdentifierType = z.infer<typeof ClassifiedIdentifierSchema>;
