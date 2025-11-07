import type { ParameterObject } from 'openapi3-ts/oas30';
import { RegisterContext } from '../../openapiTypes.js';

const PATH_PREFIX = '/api/accounts/{accountId}';
const TEAM_PATH_PREFIX = `${PATH_PREFIX}/teams/{teamId}`;

export default ({ registry, schemaRefs }: RegisterContext) => {
  const {
    AnnouncementListSchemaRef,
    AnnouncementSchemaRef,
    AnnouncementSummaryListSchemaRef,
    UpsertAnnouncementSchemaRef,
    AuthenticationErrorSchemaRef,
    AuthorizationErrorSchemaRef,
    ValidationErrorSchemaRef,
    NotFoundErrorSchemaRef,
    InternalServerErrorSchemaRef,
  } = schemaRefs;

  const accountIdParameter: ParameterObject = {
    name: 'accountId',
    in: 'path' as const,
    required: true,
    schema: { type: 'string', format: 'number' } as const,
  };

  const teamIdParameter: ParameterObject = {
    name: 'teamId',
    in: 'path' as const,
    required: true,
    schema: { type: 'string', format: 'number' } as const,
  };

  const announcementIdParameter: ParameterObject = {
    name: 'announcementId',
    in: 'path' as const,
    required: true,
    schema: { type: 'string', format: 'number' } as const,
  };

  const summaryQueryParameters: ParameterObject[] = [
    {
      name: 'limit',
      in: 'query' as const,
      required: false,
      schema: { type: 'integer', minimum: 1, maximum: 25 },
      description: 'Maximum number of announcement summaries to return (default 10).',
    },
    {
      name: 'includeSpecialOnly',
      in: 'query' as const,
      required: false,
      schema: { type: 'boolean' },
      description: 'When true, only announcements marked as special are included.',
    },
  ];

  registry.registerPath({
    method: 'get',
    path: `${PATH_PREFIX}/announcements/titles`,
    summary: 'List account announcement summaries',
    description:
      'Retrieve announcement metadata (id, title, publish date, and special flag) for an account.',
    operationId: 'listAccountAnnouncementSummaries',
    tags: ['Announcements'],
    parameters: [accountIdParameter, ...summaryQueryParameters],
    responses: {
      200: {
        description: 'Announcement summaries for the specified account.',
        content: { 'application/json': { schema: AnnouncementSummaryListSchemaRef } },
      },
      500: {
        description: 'Unexpected error while retrieving announcement summaries.',
        content: { 'application/json': { schema: InternalServerErrorSchemaRef } },
      },
    },
  });

  registry.registerPath({
    method: 'get',
    path: `${PATH_PREFIX}/announcements`,
    summary: 'List account announcements',
    description: 'Retrieve public announcements for an account.',
    operationId: 'listAccountAnnouncements',
    tags: ['Announcements'],
    parameters: [accountIdParameter],
    responses: {
      200: {
        description: 'Announcements published for the account.',
        content: { 'application/json': { schema: AnnouncementListSchemaRef } },
      },
      500: {
        description: 'Unexpected error while retrieving announcements.',
        content: { 'application/json': { schema: InternalServerErrorSchemaRef } },
      },
    },
  });

  registry.registerPath({
    method: 'get',
    path: `${PATH_PREFIX}/announcements/{announcementId}`,
    summary: 'Get account announcement',
    description: 'Retrieve a single announcement for the specified account.',
    operationId: 'getAccountAnnouncement',
    tags: ['Announcements'],
    parameters: [accountIdParameter, announcementIdParameter],
    responses: {
      200: {
        description: 'Announcement details.',
        content: { 'application/json': { schema: AnnouncementSchemaRef } },
      },
      404: {
        description: 'Announcement not found.',
        content: { 'application/json': { schema: NotFoundErrorSchemaRef } },
      },
      500: {
        description: 'Unexpected error fetching the announcement.',
        content: { 'application/json': { schema: InternalServerErrorSchemaRef } },
      },
    },
  });

  registry.registerPath({
    method: 'post',
    path: `${PATH_PREFIX}/announcements`,
    summary: 'Create account announcement',
    description: 'Create a new announcement for an account. Requires communications permission.',
    operationId: 'createAccountAnnouncement',
    tags: ['Announcements'],
    security: [{ bearerAuth: [] }],
    parameters: [accountIdParameter],
    request: {
      body: {
        content: {
          'application/json': {
            schema: UpsertAnnouncementSchemaRef,
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Announcement created.',
        content: { 'application/json': { schema: AnnouncementSchemaRef } },
      },
      400: {
        description: 'Invalid announcement payload.',
        content: { 'application/json': { schema: ValidationErrorSchemaRef } },
      },
      401: {
        description: 'Authentication required.',
        content: { 'application/json': { schema: AuthenticationErrorSchemaRef } },
      },
      403: {
        description: 'Insufficient permission to manage announcements.',
        content: { 'application/json': { schema: AuthorizationErrorSchemaRef } },
      },
      500: {
        description: 'Unexpected error creating the announcement.',
        content: { 'application/json': { schema: InternalServerErrorSchemaRef } },
      },
    },
  });

  registry.registerPath({
    method: 'put',
    path: `${PATH_PREFIX}/announcements/{announcementId}`,
    summary: 'Update account announcement',
    description: 'Update an existing account announcement.',
    operationId: 'updateAccountAnnouncement',
    tags: ['Announcements'],
    security: [{ bearerAuth: [] }],
    parameters: [accountIdParameter, announcementIdParameter],
    request: {
      body: {
        content: {
          'application/json': {
            schema: UpsertAnnouncementSchemaRef,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Updated announcement details.',
        content: { 'application/json': { schema: AnnouncementSchemaRef } },
      },
      400: {
        description: 'Invalid announcement payload.',
        content: { 'application/json': { schema: ValidationErrorSchemaRef } },
      },
      401: {
        description: 'Authentication required.',
        content: { 'application/json': { schema: AuthenticationErrorSchemaRef } },
      },
      403: {
        description: 'Insufficient permission to manage announcements.',
        content: { 'application/json': { schema: AuthorizationErrorSchemaRef } },
      },
      404: {
        description: 'Announcement not found.',
        content: { 'application/json': { schema: NotFoundErrorSchemaRef } },
      },
      500: {
        description: 'Unexpected error updating the announcement.',
        content: { 'application/json': { schema: InternalServerErrorSchemaRef } },
      },
    },
  });

  registry.registerPath({
    method: 'delete',
    path: `${PATH_PREFIX}/announcements/{announcementId}`,
    summary: 'Delete account announcement',
    description: 'Delete an account announcement.',
    operationId: 'deleteAccountAnnouncement',
    tags: ['Announcements'],
    security: [{ bearerAuth: [] }],
    parameters: [accountIdParameter, announcementIdParameter],
    responses: {
      204: {
        description: 'Announcement deleted.',
      },
      401: {
        description: 'Authentication required.',
        content: { 'application/json': { schema: AuthenticationErrorSchemaRef } },
      },
      403: {
        description: 'Insufficient permission to manage announcements.',
        content: { 'application/json': { schema: AuthorizationErrorSchemaRef } },
      },
      404: {
        description: 'Announcement not found.',
        content: { 'application/json': { schema: NotFoundErrorSchemaRef } },
      },
      500: {
        description: 'Unexpected error deleting the announcement.',
        content: { 'application/json': { schema: InternalServerErrorSchemaRef } },
      },
    },
  });

  registry.registerPath({
    method: 'get',
    path: `${TEAM_PATH_PREFIX}/announcements/titles`,
    summary: 'List team announcement summaries',
    description:
      'Retrieve announcement metadata (id, title, publish date, and special flag) for a team.',
    operationId: 'listTeamAnnouncementSummaries',
    tags: ['Announcements'],
    parameters: [accountIdParameter, teamIdParameter, ...summaryQueryParameters],
    responses: {
      200: {
        description: 'Team announcement summaries for the specified account.',
        content: { 'application/json': { schema: AnnouncementSummaryListSchemaRef } },
      },
      404: {
        description: 'Team not found for the account.',
        content: { 'application/json': { schema: NotFoundErrorSchemaRef } },
      },
      500: {
        description: 'Unexpected error retrieving team announcement summaries.',
        content: { 'application/json': { schema: InternalServerErrorSchemaRef } },
      },
    },
  });

  registry.registerPath({
    method: 'get',
    path: `${TEAM_PATH_PREFIX}/announcements`,
    summary: 'List team announcements',
    description:
      'Retrieve announcements for a team within an account. Accessible publicly to view current postings.',
    operationId: 'listTeamAnnouncements',
    tags: ['Announcements'],
    parameters: [accountIdParameter, teamIdParameter],
    responses: {
      200: {
        description: 'Team announcements for the specified account.',
        content: { 'application/json': { schema: AnnouncementListSchemaRef } },
      },
      404: {
        description: 'Team not found for the account.',
        content: { 'application/json': { schema: NotFoundErrorSchemaRef } },
      },
      500: {
        description: 'Unexpected error retrieving team announcements.',
        content: { 'application/json': { schema: InternalServerErrorSchemaRef } },
      },
    },
  });

  registry.registerPath({
    method: 'get',
    path: `${TEAM_PATH_PREFIX}/announcements/{announcementId}`,
    summary: 'Get team announcement',
    description: 'Retrieve an individual team announcement for public display.',
    operationId: 'getTeamAnnouncement',
    tags: ['Announcements'],
    parameters: [accountIdParameter, teamIdParameter, announcementIdParameter],
    responses: {
      200: {
        description: 'Team announcement.',
        content: { 'application/json': { schema: AnnouncementSchemaRef } },
      },
      404: {
        description: 'Team announcement not found for the account.',
        content: { 'application/json': { schema: NotFoundErrorSchemaRef } },
      },
      500: {
        description: 'Unexpected error retrieving the team announcement.',
        content: { 'application/json': { schema: InternalServerErrorSchemaRef } },
      },
    },
  });

  registry.registerPath({
    method: 'post',
    path: `${TEAM_PATH_PREFIX}/announcements`,
    summary: 'Create team announcement',
    description: 'Create a new team announcement. Requires team management permission.',
    operationId: 'createTeamAnnouncement',
    tags: ['Announcements'],
    security: [{ bearerAuth: [] }],
    parameters: [accountIdParameter, teamIdParameter],
    request: {
      body: {
        content: {
          'application/json': {
            schema: UpsertAnnouncementSchemaRef,
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Team announcement created.',
        content: { 'application/json': { schema: AnnouncementSchemaRef } },
      },
      400: {
        description: 'Invalid announcement payload.',
        content: { 'application/json': { schema: ValidationErrorSchemaRef } },
      },
      401: {
        description: 'Authentication required.',
        content: { 'application/json': { schema: AuthenticationErrorSchemaRef } },
      },
      403: {
        description: 'Insufficient permission to manage team announcements.',
        content: { 'application/json': { schema: AuthorizationErrorSchemaRef } },
      },
      404: {
        description: 'Team not found for the account.',
        content: { 'application/json': { schema: NotFoundErrorSchemaRef } },
      },
      500: {
        description: 'Unexpected error creating the team announcement.',
        content: { 'application/json': { schema: InternalServerErrorSchemaRef } },
      },
    },
  });

  registry.registerPath({
    method: 'put',
    path: `${TEAM_PATH_PREFIX}/announcements/{announcementId}`,
    summary: 'Update team announcement',
    description: 'Update the content of a team announcement.',
    operationId: 'updateTeamAnnouncement',
    tags: ['Announcements'],
    security: [{ bearerAuth: [] }],
    parameters: [accountIdParameter, teamIdParameter, announcementIdParameter],
    request: {
      body: {
        content: {
          'application/json': {
            schema: UpsertAnnouncementSchemaRef,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Updated team announcement.',
        content: { 'application/json': { schema: AnnouncementSchemaRef } },
      },
      400: {
        description: 'Invalid announcement payload.',
        content: { 'application/json': { schema: ValidationErrorSchemaRef } },
      },
      401: {
        description: 'Authentication required.',
        content: { 'application/json': { schema: AuthenticationErrorSchemaRef } },
      },
      403: {
        description: 'Insufficient permission to manage team announcements.',
        content: { 'application/json': { schema: AuthorizationErrorSchemaRef } },
      },
      404: {
        description: 'Team announcement not found for the account.',
        content: { 'application/json': { schema: NotFoundErrorSchemaRef } },
      },
      500: {
        description: 'Unexpected error updating the team announcement.',
        content: { 'application/json': { schema: InternalServerErrorSchemaRef } },
      },
    },
  });

  registry.registerPath({
    method: 'delete',
    path: `${TEAM_PATH_PREFIX}/announcements/{announcementId}`,
    summary: 'Delete team announcement',
    description: 'Delete a team announcement.',
    operationId: 'deleteTeamAnnouncement',
    tags: ['Announcements'],
    security: [{ bearerAuth: [] }],
    parameters: [accountIdParameter, teamIdParameter, announcementIdParameter],
    responses: {
      204: {
        description: 'Team announcement deleted.',
      },
      401: {
        description: 'Authentication required.',
        content: { 'application/json': { schema: AuthenticationErrorSchemaRef } },
      },
      403: {
        description: 'Insufficient permission to manage team announcements.',
        content: { 'application/json': { schema: AuthorizationErrorSchemaRef } },
      },
      404: {
        description: 'Team announcement not found for the account.',
        content: { 'application/json': { schema: NotFoundErrorSchemaRef } },
      },
      500: {
        description: 'Unexpected error deleting the team announcement.',
        content: { 'application/json': { schema: InternalServerErrorSchemaRef } },
      },
    },
  });
};
