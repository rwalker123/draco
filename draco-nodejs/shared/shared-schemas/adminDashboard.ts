import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);

export const AdminDashboardAccountMetricsSchema = z
  .object({
    userCount: z.number().int().nonnegative(),
    recentCommunicationsCount: z.number().int().nonnegative(),
    socialPlatformsConnected: z.number().int().nonnegative(),
    sponsorCount: z.number().int().nonnegative(),
    memberBusinessCount: z.number().int().nonnegative(),
  })
  .openapi({
    title: 'AdminDashboardAccountMetrics',
    description: 'Account-related metrics for the admin dashboard',
  });

export const AdminDashboardSeasonMetricsSchema = z
  .object({
    currentSeasonName: z.string().nullable(),
    fieldCount: z.number().int().nonnegative(),
    umpireCount: z.number().int().nonnegative(),
    upcomingWorkouts: z.number().int().nonnegative(),
  })
  .openapi({
    title: 'AdminDashboardSeasonMetrics',
    description: 'Season-related metrics for the admin dashboard',
  });

export const AdminDashboardCommunityMetricsSchema = z
  .object({
    specialAnnouncementsCount: z.number().int().nonnegative(),
    activePollsCount: z.number().int().nonnegative(),
    surveysEnabled: z.boolean(),
    hallOfFameMembersCount: z.number().int().nonnegative(),
    pendingPhotosCount: z.number().int().nonnegative(),
  })
  .openapi({
    title: 'AdminDashboardCommunityMetrics',
    description: 'Community engagement metrics for the admin dashboard',
  });

export const AdminDashboardContentMetricsSchema = z
  .object({
    faqCount: z.number().int().nonnegative(),
    handoutCount: z.number().int().nonnegative(),
    infoMessageCount: z.number().int().nonnegative(),
  })
  .openapi({
    title: 'AdminDashboardContentMetrics',
    description: 'Content-related metrics for the admin dashboard',
  });

export const AdminDashboardSummarySchema = z
  .object({
    account: AdminDashboardAccountMetricsSchema,
    season: AdminDashboardSeasonMetricsSchema,
    community: AdminDashboardCommunityMetricsSchema,
    content: AdminDashboardContentMetricsSchema,
  })
  .openapi({
    title: 'AdminDashboardSummary',
    description: 'Aggregated metrics summary for the admin dashboard',
  });

export type AdminDashboardSummaryType = z.infer<typeof AdminDashboardSummarySchema>;
export type AdminDashboardAccountMetricsType = z.infer<typeof AdminDashboardAccountMetricsSchema>;
export type AdminDashboardSeasonMetricsType = z.infer<typeof AdminDashboardSeasonMetricsSchema>;
export type AdminDashboardCommunityMetricsType = z.infer<
  typeof AdminDashboardCommunityMetricsSchema
>;
export type AdminDashboardContentMetricsType = z.infer<typeof AdminDashboardContentMetricsSchema>;
