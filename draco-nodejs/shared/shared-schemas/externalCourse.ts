import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);

export const ExternalCourseSearchResultSchema = z
  .object({
    externalId: z.string(),
    name: z.string(),
    city: z.string().nullable(),
    state: z.string().nullable(),
    country: z.string().nullable(),
    numberOfHoles: z.number().int(),
  })
  .openapi({
    title: 'ExternalCourseSearchResult',
    description: 'Golf course search result from external API',
  });

export const ExternalCourseTeeSchema = z
  .object({
    teeName: z.string(),
    teeColor: z.string(),
    distances: z.array(z.number().int()),
    mensRating: z.number(),
    mensSlope: z.number().int(),
    womansRating: z.number(),
    womansSlope: z.number().int(),
    nineHoleMensRating: z.number().nullable().optional(),
    nineHoleMensSlope: z.number().int().nullable().optional(),
    nineHoleWomansRating: z.number().nullable().optional(),
    nineHoleWomansSlope: z.number().int().nullable().optional(),
  })
  .openapi({
    title: 'ExternalCourseTee',
    description: 'Tee information from external course data',
  });

export const ExternalCourseDetailSchema = z
  .object({
    externalId: z.string(),
    name: z.string(),
    city: z.string().nullable(),
    state: z.string().nullable(),
    country: z.string().nullable(),
    address: z.string().nullable(),
    zip: z.string().nullable(),
    designer: z.string().nullable(),
    yearBuilt: z.number().int().nullable(),
    numberOfHoles: z.number().int(),
    mensPar: z.array(z.number().int()),
    womansPar: z.array(z.number().int()),
    mensHandicap: z.array(z.number().int()),
    womansHandicap: z.array(z.number().int()),
    tees: z.array(ExternalCourseTeeSchema),
  })
  .openapi({
    title: 'ExternalCourseDetail',
    description: 'Detailed course information from external API for import',
  });

export const ExternalCourseSearchQuerySchema = z
  .object({
    query: z.string().min(2).max(100),
  })
  .openapi({
    title: 'ExternalCourseSearchQuery',
    description: 'Search parameters for external course lookup',
  });

export type ExternalCourseSearchResultType = z.infer<typeof ExternalCourseSearchResultSchema>;
export type ExternalCourseTeeType = z.infer<typeof ExternalCourseTeeSchema>;
export type ExternalCourseDetailType = z.infer<typeof ExternalCourseDetailSchema>;
export type ExternalCourseSearchQueryType = z.infer<typeof ExternalCourseSearchQuerySchema>;
