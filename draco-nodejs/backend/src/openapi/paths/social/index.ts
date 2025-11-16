import type { ParameterObject } from 'openapi3-ts/oas30';
import { RegisterContext } from '../../openapiTypes.js';

const BASE_PATH = '/api/accounts/{accountId}/seasons/{seasonId}/social';

export default ({ registry, schemaRefs }: RegisterContext) => {
  const {
    AuthenticationErrorSchemaRef,
    AuthorizationErrorSchemaRef,
    ValidationErrorSchemaRef,
    NotFoundErrorSchemaRef,
    InternalServerErrorSchemaRef,
    SocialFeedListSchemaRef,
    SocialFeedQuerySchemaRef,
    SocialVideoListSchemaRef,
    SocialVideoQuerySchemaRef,
    CommunityMessageListSchemaRef,
    CommunityMessageQuerySchemaRef,
    CommunityChannelListSchemaRef,
    CommunityChannelQuerySchemaRef,
    LiveEventListSchemaRef,
    LiveEventSchemaRef,
    LiveEventQuerySchemaRef,
    LiveEventCreateSchemaRef,
    LiveEventUpdateSchemaRef,
  } = schemaRefs;

  const accountIdParameter: ParameterObject = {
    name: 'accountId',
    in: 'path',
    required: true,
    schema: { type: 'string', format: 'number' },
  };

  const seasonIdParameter: ParameterObject = {
    name: 'seasonId',
    in: 'path',
    required: true,
    schema: { type: 'string', format: 'number' },
  };

  const liveEventIdParameter: ParameterObject = {
    name: 'liveEventId',
    in: 'path',
    required: true,
    schema: { type: 'string', format: 'number' },
  };

  registry.registerPath({
    method: 'get',
    path: `${BASE_PATH}/feed`,
    summary: 'List social feed items',
    description: 'Retrieve normalized social media posts for the specified account and season.',
    operationId: 'listSocialFeed',
    tags: ['Social'],
    security: [{ bearerAuth: [] }],
    parameters: [accountIdParameter, seasonIdParameter],
    request: {
      query: SocialFeedQuerySchemaRef,
    },
    responses: {
      200: {
        description: 'Social feed items.',
        content: { 'application/json': { schema: SocialFeedListSchemaRef } },
      },
      400: {
        description: 'Invalid feed query parameters.',
        content: { 'application/json': { schema: ValidationErrorSchemaRef } },
      },
      401: {
        description: 'Authentication required.',
        content: { 'application/json': { schema: AuthenticationErrorSchemaRef } },
      },
      403: {
        description: 'User does not have access to this account.',
        content: { 'application/json': { schema: AuthorizationErrorSchemaRef } },
      },
      500: {
        description: 'Unexpected error retrieving feed items.',
        content: { 'application/json': { schema: InternalServerErrorSchemaRef } },
      },
    },
  });

  registry.registerPath({
    method: 'get',
    path: `${BASE_PATH}/videos`,
    summary: 'List social videos',
    description: 'Retrieve video content linked to the account.',
    operationId: 'listSocialVideos',
    tags: ['Social'],
    security: [{ bearerAuth: [] }],
    parameters: [accountIdParameter, seasonIdParameter],
    request: {
      query: SocialVideoQuerySchemaRef,
    },
    responses: {
      200: {
        description: 'Video entries from connected platforms.',
        content: { 'application/json': { schema: SocialVideoListSchemaRef } },
      },
      400: {
        description: 'Invalid video query parameters.',
        content: { 'application/json': { schema: ValidationErrorSchemaRef } },
      },
      401: {
        description: 'Authentication required.',
        content: { 'application/json': { schema: AuthenticationErrorSchemaRef } },
      },
      403: {
        description: 'User does not have access to this account.',
        content: { 'application/json': { schema: AuthorizationErrorSchemaRef } },
      },
      500: {
        description: 'Unexpected error retrieving videos.',
        content: { 'application/json': { schema: InternalServerErrorSchemaRef } },
      },
    },
  });

  registry.registerPath({
    method: 'get',
    path: `${BASE_PATH}/community-messages`,
    summary: 'List community messages',
    description: 'Retrieve recent Discord messages mirrored for the account.',
    operationId: 'listCommunityMessages',
    tags: ['Social'],
    security: [{ bearerAuth: [] }],
    parameters: [accountIdParameter, seasonIdParameter],
    request: {
      query: CommunityMessageQuerySchemaRef,
    },
    responses: {
      200: {
        description: 'Community chat previews.',
        content: { 'application/json': { schema: CommunityMessageListSchemaRef } },
      },
      400: {
        description: 'Invalid message query parameters.',
        content: { 'application/json': { schema: ValidationErrorSchemaRef } },
      },
      401: {
        description: 'Authentication required.',
        content: { 'application/json': { schema: AuthenticationErrorSchemaRef } },
      },
      403: {
        description: 'User does not have access to this account.',
        content: { 'application/json': { schema: AuthorizationErrorSchemaRef } },
      },
      500: {
        description: 'Unexpected error retrieving community messages.',
        content: { 'application/json': { schema: InternalServerErrorSchemaRef } },
      },
    },
  });

  registry.registerPath({
    method: 'get',
    path: `${BASE_PATH}/community-channels`,
    summary: 'List mapped community channels',
    description: 'Retrieve Discord channels mapped to this account/season for community chat.',
    operationId: 'listSocialCommunityChannels',
    tags: ['Social'],
    security: [{ bearerAuth: [] }],
    parameters: [accountIdParameter, seasonIdParameter],
    request: {
      query: CommunityChannelQuerySchemaRef,
    },
    responses: {
      200: {
        description: 'Mapped community channels.',
        content: { 'application/json': { schema: CommunityChannelListSchemaRef } },
      },
      401: {
        description: 'Authentication required.',
        content: { 'application/json': { schema: AuthenticationErrorSchemaRef } },
      },
      403: {
        description: 'User does not have access to this account.',
        content: { 'application/json': { schema: AuthorizationErrorSchemaRef } },
      },
      500: {
        description: 'Unexpected error retrieving mapped channels.',
        content: { 'application/json': { schema: InternalServerErrorSchemaRef } },
      },
    },
  });

  registry.registerPath({
    method: 'get',
    path: `${BASE_PATH}/live-events`,
    summary: 'List live events',
    description: 'Retrieve upcoming or historical livestream events for the account.',
    operationId: 'listLiveEvents',
    tags: ['Social'],
    security: [{ bearerAuth: [] }],
    parameters: [accountIdParameter, seasonIdParameter],
    request: {
      query: LiveEventQuerySchemaRef,
    },
    responses: {
      200: {
        description: 'Live event metadata.',
        content: { 'application/json': { schema: LiveEventListSchemaRef } },
      },
      400: {
        description: 'Invalid live event filters.',
        content: { 'application/json': { schema: ValidationErrorSchemaRef } },
      },
      401: {
        description: 'Authentication required.',
        content: { 'application/json': { schema: AuthenticationErrorSchemaRef } },
      },
      403: {
        description: 'User does not have access to this account.',
        content: { 'application/json': { schema: AuthorizationErrorSchemaRef } },
      },
      500: {
        description: 'Unexpected error retrieving live events.',
        content: { 'application/json': { schema: InternalServerErrorSchemaRef } },
      },
    },
  });

  registry.registerPath({
    method: 'get',
    path: `${BASE_PATH}/live-events/{liveEventId}`,
    summary: 'Get live event',
    description: 'Retrieve details for a specific live event.',
    operationId: 'getLiveEvent',
    tags: ['Social'],
    security: [{ bearerAuth: [] }],
    parameters: [accountIdParameter, seasonIdParameter, liveEventIdParameter],
    responses: {
      200: {
        description: 'Live event details.',
        content: { 'application/json': { schema: LiveEventSchemaRef } },
      },
      401: {
        description: 'Authentication required.',
        content: { 'application/json': { schema: AuthenticationErrorSchemaRef } },
      },
      403: {
        description: 'User does not have access to this account.',
        content: { 'application/json': { schema: AuthorizationErrorSchemaRef } },
      },
      404: {
        description: 'Live event not found.',
        content: { 'application/json': { schema: NotFoundErrorSchemaRef } },
      },
      500: {
        description: 'Unexpected error retrieving the live event.',
        content: { 'application/json': { schema: InternalServerErrorSchemaRef } },
      },
    },
  });

  registry.registerPath({
    method: 'post',
    path: `${BASE_PATH}/live-events`,
    summary: 'Create live event',
    description: 'Create livestream metadata for the account.',
    operationId: 'createLiveEvent',
    tags: ['Social'],
    security: [{ bearerAuth: [] }],
    parameters: [accountIdParameter, seasonIdParameter],
    request: {
      body: {
        content: {
          'application/json': { schema: LiveEventCreateSchemaRef },
        },
      },
    },
    responses: {
      201: {
        description: 'Live event created.',
        content: { 'application/json': { schema: LiveEventSchemaRef } },
      },
      400: {
        description: 'Invalid live event payload.',
        content: { 'application/json': { schema: ValidationErrorSchemaRef } },
      },
      401: {
        description: 'Authentication required.',
        content: { 'application/json': { schema: AuthenticationErrorSchemaRef } },
      },
      403: {
        description: 'User lacks permission to manage live events.',
        content: { 'application/json': { schema: AuthorizationErrorSchemaRef } },
      },
      404: {
        description: 'Referenced league season or event not found.',
        content: { 'application/json': { schema: NotFoundErrorSchemaRef } },
      },
      500: {
        description: 'Unexpected error creating the live event.',
        content: { 'application/json': { schema: InternalServerErrorSchemaRef } },
      },
    },
  });

  registry.registerPath({
    method: 'patch',
    path: `${BASE_PATH}/live-events/{liveEventId}`,
    summary: 'Update live event',
    description: 'Update livestream metadata.',
    operationId: 'updateLiveEvent',
    tags: ['Social'],
    security: [{ bearerAuth: [] }],
    parameters: [accountIdParameter, seasonIdParameter, liveEventIdParameter],
    request: {
      body: {
        content: {
          'application/json': { schema: LiveEventUpdateSchemaRef },
        },
      },
    },
    responses: {
      200: {
        description: 'Updated live event.',
        content: { 'application/json': { schema: LiveEventSchemaRef } },
      },
      400: {
        description: 'Invalid live event payload.',
        content: { 'application/json': { schema: ValidationErrorSchemaRef } },
      },
      401: {
        description: 'Authentication required.',
        content: { 'application/json': { schema: AuthenticationErrorSchemaRef } },
      },
      403: {
        description: 'User lacks permission to manage live events.',
        content: { 'application/json': { schema: AuthorizationErrorSchemaRef } },
      },
      404: {
        description: 'Live event not found.',
        content: { 'application/json': { schema: NotFoundErrorSchemaRef } },
      },
      500: {
        description: 'Unexpected error updating the live event.',
        content: { 'application/json': { schema: InternalServerErrorSchemaRef } },
      },
    },
  });

  registry.registerPath({
    method: 'delete',
    path: `${BASE_PATH}/live-events/{liveEventId}`,
    summary: 'Delete live event metadata',
    description: 'Remove livestream metadata for the account.',
    operationId: 'deleteLiveEvent',
    tags: ['Social'],
    security: [{ bearerAuth: [] }],
    parameters: [accountIdParameter, seasonIdParameter, liveEventIdParameter],
    responses: {
      204: {
        description: 'Live event deleted.',
      },
      401: {
        description: 'Authentication required.',
        content: { 'application/json': { schema: AuthenticationErrorSchemaRef } },
      },
      403: {
        description: 'User lacks permission to manage live events.',
        content: { 'application/json': { schema: AuthorizationErrorSchemaRef } },
      },
      404: {
        description: 'Live event not found.',
        content: { 'application/json': { schema: NotFoundErrorSchemaRef } },
      },
      500: {
        description: 'Unexpected error deleting the live event.',
        content: { 'application/json': { schema: InternalServerErrorSchemaRef } },
      },
    },
  });
};
