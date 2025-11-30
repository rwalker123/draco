import { RegisterContext } from '../../openapiTypes.js';
import { ACCOUNT_SETTING_KEYS, DiscordFeatureSyncFeatureEnum } from '@draco/shared-schemas';

export const registerAccountsEndpoints = ({ registry, schemaRefs }: RegisterContext) => {
  const {
    AccountAffiliationSchemaRef,
    AccountDetailsQuerySchemaRef,
    AccountDomainLookupHeadersSchemaRef,
    AccountHeaderSchemaRef,
    AccountNameSchemaRef,
    AccountSchemaRef,
    AccountSearchQuerySchemaRef,
    AccountTypeSchemaRef,
    AccountUrlSchemaRef,
    AccountWithSeasonsSchemaRef,
    AccountBlueskySettingsSchemaRef,
    AccountInstagramSettingsSchemaRef,
    AccountTwitterSettingsSchemaRef,
    AccountTwitterOAuthStartSchemaRef,
    AccountTwitterAuthorizationUrlSchemaRef,
    AccountSettingsStateListSchemaRef,
    AccountSettingStateSchemaRef,
    AccountSettingUpdateRequestSchemaRef,
    AuthenticationErrorSchemaRef,
    AuthorizationErrorSchemaRef,
    CreateAccountSchemaRef,
    CreateAccountUrlSchemaRef,
    InternalServerErrorSchemaRef,
    NotFoundErrorSchemaRef,
    ValidationErrorSchemaRef,
    ConflictErrorSchemaRef,
    AutomaticRoleHoldersSchemaRef,
    TeamSeasonSchemaRef,
    FieldSchemaRef,
    FieldsSchemaRef,
    UpsertFieldSchemaRef,
    UmpiresSchemaRef,
    PagingSchemaRef,
    PhotoSubmissionSchemaRef,
    PhotoSubmissionDetailSchemaRef,
    PhotoSubmissionListSchemaRef,
    CreatePhotoSubmissionFormSchemaRef,
    DenyPhotoSubmissionRequestSchemaRef,
    CreatePhotoGalleryPhotoSchemaRef,
    UpdatePhotoGalleryPhotoSchemaRef,
    CreatePhotoGalleryAlbumSchemaRef,
    UpdatePhotoGalleryAlbumSchemaRef,
    PhotoGalleryPhotoSchemaRef,
    PhotoGalleryAdminAlbumListSchemaRef,
    PhotoGalleryAdminAlbumSchemaRef,
    PhotoGalleryListSchemaRef,
    PhotoGalleryQuerySchemaRef,
    DiscordAccountConfigSchemaRef,
    DiscordAccountConfigUpdateSchemaRef,
    DiscordRoleMappingSchemaRef,
    DiscordRoleMappingListSchemaRef,
    DiscordRoleMappingUpdateSchemaRef,
    DiscordChannelMappingSchemaRef,
    DiscordChannelMappingListSchemaRef,
    DiscordChannelMappingCreateSchemaRef,
    DiscordGuildChannelSchemaRef,
    DiscordOAuthStartResponseSchemaRef,
    DiscordLinkStatusSchemaRef,
    DiscordFeatureSyncStatusSchemaRef,
    DiscordFeatureSyncUpdateSchemaRef,
    DiscordTeamForumListSchemaRef,
    DiscordTeamForumQuerySchemaRef,
    DiscordTeamForumRepairResultSchemaRef,
    DiscordTeamForumRemoveRequestSchemaRef,
    SocialFeedItemSchemaRef,
    SocialFeedListSchemaRef,
    SocialFeedQuerySchemaRef,
  } = schemaRefs;

  const TweetCreateSchemaRef = SocialFeedItemSchemaRef.pick({ content: true });
  const TweetListQuerySchemaRef = SocialFeedQuerySchemaRef.pick({ limit: true });
  const BlueskyPostCreateSchemaRef = SocialFeedItemSchemaRef.pick({ content: true });
  const BlueskyListQuerySchemaRef = SocialFeedQuerySchemaRef.pick({ limit: true });

  // GET /api/accounts/search
  registry.registerPath({
    method: 'get',
    path: '/api/accounts/search',
    operationId: 'searchAccounts',
    summary: 'Search accounts',
    description: 'Public search for accounts by name or type',
    tags: ['Accounts'],
    request: {
      query: AccountSearchQuerySchemaRef,
    },
    responses: {
      200: {
        description: 'Accounts matching the search query',
        content: {
          'application/json': {
            schema: AccountTypeSchemaRef.array(),
          },
        },
      },
      400: {
        description: 'Validation error',
        content: {
          'application/json': {
            schema: ValidationErrorSchemaRef,
          },
        },
      },
      500: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: InternalServerErrorSchemaRef,
          },
        },
      },
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/settings/public',
    operationId: 'getAccountSettingsPublic',
    summary: 'List public account feature settings',
    description:
      'Returns metadata and current values for account-level feature toggles without requiring authentication.',
    tags: ['Accounts'],
    parameters: [
      {
        name: 'accountId',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'number' },
      },
    ],
    responses: {
      200: {
        description: 'Account settings with metadata.',
        content: {
          'application/json': { schema: AccountSettingsStateListSchemaRef },
        },
      },
      404: {
        description: 'Account not found.',
        content: {
          'application/json': { schema: NotFoundErrorSchemaRef },
        },
      },
      500: {
        description: 'Unexpected server error while retrieving account settings.',
        content: {
          'application/json': { schema: InternalServerErrorSchemaRef },
        },
      },
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/photo-gallery/photos',
    operationId: 'listAccountGalleryPhotosAdmin',
    summary: 'List gallery photos for administration',
    description:
      'Returns approved gallery photos for administrative management, including optional filters by album or team. Requires photo management permissions.',
    tags: ['Photo Gallery'],
    security: [{ bearerAuth: [] }],
    parameters: [
      {
        name: 'accountId',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'number' },
      },
    ],
    request: {
      query: PhotoGalleryQuerySchemaRef,
    },
    responses: {
      200: {
        description: 'Gallery photos available for administrative management.',
        content: {
          'application/json': { schema: PhotoGalleryListSchemaRef },
        },
      },
      400: {
        description: 'Validation error',
        content: {
          'application/json': { schema: ValidationErrorSchemaRef },
        },
      },
      401: { description: 'Authentication required.' },
      403: { description: 'Insufficient permissions to manage gallery photos.' },
      500: {
        description: 'Unexpected server error while retrieving gallery photos.',
        content: {
          'application/json': { schema: InternalServerErrorSchemaRef },
        },
      },
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/api/accounts/{accountId}/photo-gallery/photos',
    operationId: 'createAccountGalleryPhoto',
    summary: 'Upload a gallery photo as an administrator',
    description:
      'Uploads a new gallery photo directly into the approved gallery. Requires photo management permissions.',
    tags: ['Photo Gallery'],
    security: [{ bearerAuth: [] }],
    parameters: [
      {
        name: 'accountId',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'number' },
      },
    ],
    request: {
      body: {
        content: {
          'multipart/form-data': {
            schema: CreatePhotoGalleryPhotoSchemaRef,
            encoding: {
              photo: { contentType: 'image/*' },
            },
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Gallery photo created.',
        content: {
          'application/json': { schema: PhotoGalleryPhotoSchemaRef },
        },
      },
      400: {
        description: 'Validation error',
        content: {
          'application/json': { schema: ValidationErrorSchemaRef },
        },
      },
      401: { description: 'Authentication required.' },
      403: { description: 'Insufficient permissions to manage gallery photos.' },
      500: {
        description: 'Unexpected server error while creating the gallery photo.',
        content: {
          'application/json': { schema: InternalServerErrorSchemaRef },
        },
      },
    },
  });

  registry.registerPath({
    method: 'patch',
    path: '/api/accounts/{accountId}/photo-gallery/photos/{photoId}',
    operationId: 'updateAccountGalleryPhoto',
    summary: 'Update gallery photo metadata',
    description:
      'Updates the title, caption, or album assignment for an approved gallery photo. Requires photo management permissions.',
    tags: ['Photo Gallery'],
    security: [{ bearerAuth: [] }],
    parameters: [
      {
        name: 'accountId',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'number' },
      },
      {
        name: 'photoId',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'number' },
      },
    ],
    request: {
      body: {
        content: {
          'application/json': {
            schema: UpdatePhotoGalleryPhotoSchemaRef,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Updated gallery photo metadata.',
        content: {
          'application/json': { schema: PhotoGalleryPhotoSchemaRef },
        },
      },
      400: {
        description: 'Validation error',
        content: {
          'application/json': { schema: ValidationErrorSchemaRef },
        },
      },
      401: { description: 'Authentication required.' },
      403: { description: 'Insufficient permissions to manage gallery photos.' },
      404: { description: 'Gallery photo not found.' },
      500: {
        description: 'Unexpected server error while updating the gallery photo.',
        content: {
          'application/json': { schema: InternalServerErrorSchemaRef },
        },
      },
    },
  });

  registry.registerPath({
    method: 'delete',
    path: '/api/accounts/{accountId}/photo-gallery/photos/{photoId}',
    operationId: 'deleteAccountGalleryPhoto',
    summary: 'Delete a gallery photo',
    description:
      'Removes an approved gallery photo and associated assets. Requires photo management permissions.',
    tags: ['Photo Gallery'],
    security: [{ bearerAuth: [] }],
    parameters: [
      {
        name: 'accountId',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'number' },
      },
      {
        name: 'photoId',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'number' },
      },
    ],
    responses: {
      204: { description: 'Gallery photo deleted.' },
      401: { description: 'Authentication required.' },
      403: { description: 'Insufficient permissions to manage gallery photos.' },
      404: { description: 'Gallery photo not found.' },
      500: {
        description: 'Unexpected server error while deleting the gallery photo.',
        content: {
          'application/json': { schema: InternalServerErrorSchemaRef },
        },
      },
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/photo-gallery/albums',
    operationId: 'listAccountGalleryAlbumsAdmin',
    summary: 'List gallery albums for administration',
    description:
      'Retrieves gallery albums with parent and team associations for administrative management. Requires photo management permissions.',
    tags: ['Photo Gallery'],
    security: [{ bearerAuth: [] }],
    parameters: [
      {
        name: 'accountId',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'number' },
      },
    ],
    responses: {
      200: {
        description: 'Gallery albums available for administrative management.',
        content: {
          'application/json': { schema: PhotoGalleryAdminAlbumListSchemaRef },
        },
      },
      401: { description: 'Authentication required.' },
      403: { description: 'Insufficient permissions to manage gallery albums.' },
      500: {
        description: 'Unexpected server error while retrieving gallery albums.',
        content: {
          'application/json': { schema: InternalServerErrorSchemaRef },
        },
      },
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/api/accounts/{accountId}/photo-gallery/albums',
    operationId: 'createAccountGalleryAlbum',
    summary: 'Create a gallery album',
    description:
      'Creates a gallery album available for assigning approved photos. Requires photo management permissions.',
    tags: ['Photo Gallery'],
    security: [{ bearerAuth: [] }],
    parameters: [
      {
        name: 'accountId',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'number' },
      },
    ],
    request: {
      body: {
        content: {
          'application/json': {
            schema: CreatePhotoGalleryAlbumSchemaRef,
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Gallery album created.',
        content: {
          'application/json': { schema: PhotoGalleryAdminAlbumSchemaRef },
        },
      },
      400: {
        description: 'Validation error',
        content: {
          'application/json': { schema: ValidationErrorSchemaRef },
        },
      },
      401: { description: 'Authentication required.' },
      403: { description: 'Insufficient permissions to manage gallery albums.' },
      409: { description: 'Album title conflicts with an existing album.' },
      500: {
        description: 'Unexpected server error while creating the gallery album.',
        content: {
          'application/json': { schema: InternalServerErrorSchemaRef },
        },
      },
    },
  });

  registry.registerPath({
    method: 'patch',
    path: '/api/accounts/{accountId}/photo-gallery/albums/{albumId}',
    operationId: 'updateAccountGalleryAlbum',
    summary: 'Update gallery album metadata',
    description:
      'Updates the title, team association, or parent album for a gallery album. Requires photo management permissions.',
    tags: ['Photo Gallery'],
    security: [{ bearerAuth: [] }],
    parameters: [
      {
        name: 'accountId',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'number' },
      },
      {
        name: 'albumId',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'number' },
      },
    ],
    request: {
      body: {
        content: {
          'application/json': {
            schema: UpdatePhotoGalleryAlbumSchemaRef,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Gallery album updated.',
        content: {
          'application/json': { schema: PhotoGalleryAdminAlbumSchemaRef },
        },
      },
      400: {
        description: 'Validation error',
        content: {
          'application/json': { schema: ValidationErrorSchemaRef },
        },
      },
      401: { description: 'Authentication required.' },
      403: { description: 'Insufficient permissions to manage gallery albums.' },
      404: { description: 'Gallery album not found.' },
      409: { description: 'Album title conflicts with an existing album.' },
      500: {
        description: 'Unexpected server error while updating the gallery album.',
        content: {
          'application/json': { schema: InternalServerErrorSchemaRef },
        },
      },
    },
  });

  registry.registerPath({
    method: 'delete',
    path: '/api/accounts/{accountId}/photo-gallery/albums/{albumId}',
    operationId: 'deleteAccountGalleryAlbum',
    summary: 'Delete a gallery album',
    description:
      'Deletes a gallery album. If the album contains photos, the request may be rejected depending on business rules. Requires photo management permissions.',
    tags: ['Photo Gallery'],
    security: [{ bearerAuth: [] }],
    parameters: [
      {
        name: 'accountId',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'number' },
      },
      {
        name: 'albumId',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'number' },
      },
    ],
    responses: {
      204: { description: 'Gallery album deleted.' },
      401: { description: 'Authentication required.' },
      403: { description: 'Insufficient permissions to manage gallery albums.' },
      404: { description: 'Gallery album not found.' },
      409: { description: 'Album cannot be deleted while it contains photos.' },
      500: {
        description: 'Unexpected server error while deleting the gallery album.',
        content: {
          'application/json': { schema: InternalServerErrorSchemaRef },
        },
      },
    },
  });

  // GET /api/accounts/by-domain
  registry.registerPath({
    method: 'get',
    path: '/api/accounts/by-domain',
    operationId: 'getAccountByDomain',
    summary: 'Get account by domain',
    description: 'Public lookup of an account by inbound request host domain.',
    tags: ['Accounts'],
    request: {
      headers: AccountDomainLookupHeadersSchemaRef,
    },
    responses: {
      200: {
        description: 'Account matching the provided domain',
        content: {
          'application/json': {
            schema: AccountSchemaRef,
          },
        },
      },
      400: {
        description: 'Validation error',
        content: {
          'application/json': {
            schema: ValidationErrorSchemaRef,
          },
        },
      },
      404: {
        description: 'Account not found for the provided domain',
        content: {
          'application/json': {
            schema: NotFoundErrorSchemaRef,
          },
        },
      },
      500: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: InternalServerErrorSchemaRef,
          },
        },
      },
    },
  });

  // GET /api/accounts/{accountId}
  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}',
    operationId: 'getAccountById',
    summary: 'Get account by ID',
    description: 'Retrieve account details and optional current season information.',
    tags: ['Accounts'],
    parameters: [
      {
        name: 'accountId',
        in: 'path',
        required: true,
        schema: {
          type: 'string',
          format: 'number',
        },
      },
    ],
    request: {
      query: AccountDetailsQuerySchemaRef,
    },
    responses: {
      200: {
        description: 'Account details',
        content: {
          'application/json': {
            schema: AccountWithSeasonsSchemaRef,
          },
        },
      },
      400: {
        description: 'Validation error',
        content: {
          'application/json': {
            schema: ValidationErrorSchemaRef,
          },
        },
      },
      404: {
        description: 'Account not found',
        content: {
          'application/json': {
            schema: NotFoundErrorSchemaRef,
          },
        },
      },
      500: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: InternalServerErrorSchemaRef,
          },
        },
      },
    },
  });

  // POST /api/accounts
  registry.registerPath({
    method: 'post',
    path: '/api/accounts',
    operationId: 'createAccount',
    summary: 'Create account',
    description: 'Create a new account. Administrator access required.',
    tags: ['Accounts'],
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: CreateAccountSchemaRef,
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Account created',
        content: {
          'application/json': {
            schema: AccountSchemaRef,
          },
        },
      },
      400: {
        description: 'Validation error',
        content: {
          'application/json': {
            schema: ValidationErrorSchemaRef,
          },
        },
      },
      401: {
        description: 'Authentication required',
        content: {
          'application/json': {
            schema: AuthenticationErrorSchemaRef,
          },
        },
      },
      403: {
        description: 'Forbidden',
        content: {
          'application/json': {
            schema: AuthorizationErrorSchemaRef,
          },
        },
      },
      500: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: InternalServerErrorSchemaRef,
          },
        },
      },
    },
  });

  // PUT /api/accounts/{accountId}
  registry.registerPath({
    method: 'put',
    path: '/api/accounts/{accountId}',
    operationId: 'updateAccount',
    summary: 'Update account',
    description: 'Update account details. Account administrators or global administrators only.',
    tags: ['Accounts'],
    security: [{ bearerAuth: [] }],
    parameters: [
      {
        name: 'accountId',
        in: 'path',
        required: true,
        schema: {
          type: 'string',
          format: 'number',
        },
      },
    ],
    request: {
      body: {
        content: {
          'application/json': {
            schema: CreateAccountSchemaRef.partial(),
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Account updated',
        content: {
          'application/json': {
            schema: AccountSchemaRef,
          },
        },
      },
      400: {
        description: 'Validation error',
        content: {
          'application/json': {
            schema: ValidationErrorSchemaRef,
          },
        },
      },
      401: {
        description: 'Authentication required',
        content: {
          'application/json': {
            schema: AuthenticationErrorSchemaRef,
          },
        },
      },
      403: {
        description: 'Forbidden',
        content: {
          'application/json': {
            schema: AuthorizationErrorSchemaRef,
          },
        },
      },
      404: {
        description: 'Account not found',
        content: {
          'application/json': {
            schema: NotFoundErrorSchemaRef,
          },
        },
      },
      500: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: InternalServerErrorSchemaRef,
          },
        },
      },
    },
  });

  // DELETE /api/accounts/{accountId}
  registry.registerPath({
    method: 'delete',
    path: '/api/accounts/{accountId}',
    operationId: 'deleteAccount',
    summary: 'Delete account',
    description: 'Delete an account. Administrator access required.',
    tags: ['Accounts'],
    security: [{ bearerAuth: [] }],
    parameters: [
      {
        name: 'accountId',
        in: 'path',
        required: true,
        schema: {
          type: 'string',
          format: 'number',
        },
      },
    ],
    responses: {
      204: {
        description: 'Account deleted',
      },
      401: {
        description: 'Authentication required',
        content: {
          'application/json': {
            schema: AuthenticationErrorSchemaRef,
          },
        },
      },
      403: {
        description: 'Forbidden',
        content: {
          'application/json': {
            schema: AuthorizationErrorSchemaRef,
          },
        },
      },
      404: {
        description: 'Account not found',
        content: {
          'application/json': {
            schema: NotFoundErrorSchemaRef,
          },
        },
      },
      500: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: InternalServerErrorSchemaRef,
          },
        },
      },
    },
  });

  // GET /api/accounts/{accountId}/name
  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/name',
    operationId: 'getAccountName',
    summary: 'Get account name',
    description: 'Retrieve the display name for an account.',
    tags: ['Accounts'],
    parameters: [
      {
        name: 'accountId',
        in: 'path',
        required: true,
        schema: {
          type: 'string',
          format: 'number',
        },
      },
    ],
    responses: {
      200: {
        description: 'Account name',
        content: {
          'application/json': {
            schema: AccountNameSchemaRef,
          },
        },
      },
      404: {
        description: 'Account not found',
        content: {
          'application/json': {
            schema: NotFoundErrorSchemaRef,
          },
        },
      },
      500: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: InternalServerErrorSchemaRef,
          },
        },
      },
    },
  });

  // GET /api/accounts/{accountId}/header
  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/header',
    operationId: 'getAccountHeader',
    summary: 'Get account header',
    description: 'Retrieve account name and branding assets.',
    tags: ['Accounts'],
    parameters: [
      {
        name: 'accountId',
        in: 'path',
        required: true,
        schema: {
          type: 'string',
          format: 'number',
        },
      },
    ],
    responses: {
      200: {
        description: 'Account header information',
        content: {
          'application/json': {
            schema: AccountHeaderSchemaRef,
          },
        },
      },
      404: {
        description: 'Account not found',
        content: {
          'application/json': {
            schema: NotFoundErrorSchemaRef,
          },
        },
      },
      500: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: InternalServerErrorSchemaRef,
          },
        },
      },
    },
  });

  // GET /api/accounts/types
  registry.registerPath({
    method: 'get',
    path: '/api/accounts/types',
    operationId: 'getAccountTypes',
    summary: 'List account types',
    description: 'Retrieve the list of available account types.',
    tags: ['Accounts'],
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: 'Account types list',
        content: {
          'application/json': {
            schema: AccountSchemaRef.array(),
          },
        },
      },
      401: {
        description: 'Authentication required',
        content: {
          'application/json': {
            schema: AuthenticationErrorSchemaRef,
          },
        },
      },
      500: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: InternalServerErrorSchemaRef,
          },
        },
      },
    },
  });

  // GET /api/accounts/affiliations
  registry.registerPath({
    method: 'get',
    path: '/api/accounts/affiliations',
    operationId: 'getAccountAffiliations',
    summary: 'List account affiliations',
    description: 'Retrieve the list of available account affiliations.',
    tags: ['Accounts'],
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: 'Account affiliations list',
        content: {
          'application/json': {
            schema: AccountAffiliationSchemaRef.array(),
          },
        },
      },
      401: {
        description: 'Authentication required',
        content: {
          'application/json': {
            schema: AuthenticationErrorSchemaRef,
          },
        },
      },
      500: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: InternalServerErrorSchemaRef,
          },
        },
      },
    },
  });

  // PUT /api/accounts/{accountId}/twitter
  registry.registerPath({
    method: 'put',
    path: '/api/accounts/{accountId}/twitter',
    operationId: 'updateAccountTwitterSettings',
    summary: 'Update account Twitter settings',
    description: 'Update the Twitter integration settings for an account.',
    tags: ['Accounts'],
    security: [{ bearerAuth: [] }],
    parameters: [
      {
        name: 'accountId',
        in: 'path',
        required: true,
        schema: {
          type: 'string',
          format: 'number',
        },
      },
    ],
    request: {
      body: {
        content: {
          'application/json': {
            schema: AccountTwitterSettingsSchemaRef,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Updated account details',
        content: {
          'application/json': {
            schema: AccountSchemaRef,
          },
        },
      },
      400: {
        description: 'Validation error',
        content: {
          'application/json': {
            schema: ValidationErrorSchemaRef,
          },
        },
      },
      401: {
        description: 'Authentication required',
        content: {
          'application/json': {
            schema: AuthenticationErrorSchemaRef,
          },
        },
      },
      403: {
        description: 'Forbidden',
        content: {
          'application/json': {
            schema: AuthorizationErrorSchemaRef,
          },
        },
      },
      404: {
        description: 'Account not found',
        content: {
          'application/json': {
            schema: NotFoundErrorSchemaRef,
          },
        },
      },
      500: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: InternalServerErrorSchemaRef,
          },
        },
      },
    },
  });

  // PUT /api/accounts/{accountId}/instagram
  registry.registerPath({
    method: 'put',
    path: '/api/accounts/{accountId}/instagram',
    operationId: 'updateAccountInstagramSettings',
    summary: 'Update account Instagram settings',
    description: 'Update the Instagram integration settings for an account.',
    tags: ['Accounts'],
    security: [{ bearerAuth: [] }],
    parameters: [
      {
        name: 'accountId',
        in: 'path',
        required: true,
        schema: {
          type: 'string',
          format: 'number',
        },
      },
    ],
    request: {
      body: {
        content: {
          'application/json': {
            schema: AccountInstagramSettingsSchemaRef,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Updated account details',
        content: {
          'application/json': {
            schema: AccountSchemaRef,
          },
        },
      },
      400: {
        description: 'Validation error',
        content: {
          'application/json': {
            schema: ValidationErrorSchemaRef,
          },
        },
      },
      401: {
        description: 'Authentication required',
        content: {
          'application/json': {
            schema: AuthenticationErrorSchemaRef,
          },
        },
      },
      403: {
        description: 'Forbidden',
        content: {
          'application/json': {
            schema: AuthorizationErrorSchemaRef,
          },
        },
      },
      404: {
        description: 'Account not found',
        content: {
          'application/json': {
            schema: NotFoundErrorSchemaRef,
          },
        },
      },
      500: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: InternalServerErrorSchemaRef,
          },
        },
      },
    },
  });

  // POST /api/accounts/{accountId}/twitter/oauth/url
  registry.registerPath({
    method: 'post',
    path: '/api/accounts/{accountId}/twitter/oauth/url',
    operationId: 'createTwitterAuthorizationUrl',
    summary: 'Create Twitter OAuth authorization URL',
    description:
      'Generate a Twitter OAuth URL for user-context posting using configured client credentials.',
    tags: ['Accounts'],
    security: [{ bearerAuth: [] }],
    parameters: [
      {
        name: 'accountId',
        in: 'path',
        required: true,
        schema: {
          type: 'string',
          format: 'number',
        },
      },
    ],
    request: {
      body: {
        content: {
          'application/json': {
            schema: AccountTwitterOAuthStartSchemaRef,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Authorization URL generated successfully',
        content: {
          'application/json': {
            schema: AccountTwitterAuthorizationUrlSchemaRef,
          },
        },
      },
      400: {
        description: 'Validation error',
        content: {
          'application/json': {
            schema: ValidationErrorSchemaRef,
          },
        },
      },
      401: {
        description: 'Authentication required',
        content: {
          'application/json': {
            schema: AuthenticationErrorSchemaRef,
          },
        },
      },
      403: {
        description: 'Forbidden',
        content: {
          'application/json': {
            schema: AuthorizationErrorSchemaRef,
          },
        },
      },
      404: {
        description: 'Account not found',
        content: {
          'application/json': {
            schema: NotFoundErrorSchemaRef,
          },
        },
      },
      500: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: InternalServerErrorSchemaRef,
          },
        },
      },
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/twitter/recent',
    operationId: 'listAccountRecentTweets',
    summary: 'Fetch recent tweets for an account',
    description:
      'Fetches recent tweets using the stored Twitter credentials for the requested account.',
    tags: ['Accounts'],
    security: [{ bearerAuth: [] }],
    parameters: [
      {
        name: 'accountId',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'number' },
      },
    ],
    request: {
      query: TweetListQuerySchemaRef,
    },
    responses: {
      200: {
        description: 'Recent tweets for the account',
        content: {
          'application/json': {
            schema: SocialFeedListSchemaRef,
          },
        },
      },
      400: {
        description: 'Validation error',
        content: {
          'application/json': {
            schema: ValidationErrorSchemaRef,
          },
        },
      },
      401: {
        description: 'Authentication required',
        content: {
          'application/json': {
            schema: AuthenticationErrorSchemaRef,
          },
        },
      },
      403: {
        description: 'Insufficient permissions',
        content: {
          'application/json': {
            schema: AuthorizationErrorSchemaRef,
          },
        },
      },
      404: {
        description: 'Account not found',
        content: {
          'application/json': {
            schema: NotFoundErrorSchemaRef,
          },
        },
      },
      500: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: InternalServerErrorSchemaRef,
          },
        },
      },
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/api/accounts/{accountId}/twitter/tweets',
    operationId: 'postAccountTweet',
    summary: 'Create a tweet for an account',
    description: 'Creates a tweet using the stored Twitter credentials for the requested account.',
    tags: ['Accounts'],
    security: [{ bearerAuth: [] }],
    parameters: [
      {
        name: 'accountId',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'number' },
      },
    ],
    request: {
      body: {
        content: {
          'application/json': {
            schema: TweetCreateSchemaRef,
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Tweet created successfully',
        content: {
          'application/json': {
            schema: SocialFeedItemSchemaRef,
          },
        },
      },
      400: {
        description: 'Validation error',
        content: {
          'application/json': {
            schema: ValidationErrorSchemaRef,
          },
        },
      },
      401: {
        description: 'Authentication required',
        content: {
          'application/json': {
            schema: AuthenticationErrorSchemaRef,
          },
        },
      },
      403: {
        description: 'Insufficient permissions',
        content: {
          'application/json': {
            schema: AuthorizationErrorSchemaRef,
          },
        },
      },
      404: {
        description: 'Account not found',
        content: {
          'application/json': {
            schema: NotFoundErrorSchemaRef,
          },
        },
      },
      500: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: InternalServerErrorSchemaRef,
          },
        },
      },
    },
  });

  registry.registerPath({
    method: 'put',
    path: '/api/accounts/{accountId}/bluesky',
    operationId: 'updateAccountBlueskySettings',
    summary: 'Update account Bluesky settings',
    description: 'Update the Bluesky integration settings for an account.',
    tags: ['Accounts'],
    security: [{ bearerAuth: [] }],
    parameters: [
      {
        name: 'accountId',
        in: 'path',
        required: true,
        schema: {
          type: 'string',
          format: 'number',
        },
      },
    ],
    request: {
      body: {
        content: {
          'application/json': {
            schema: AccountBlueskySettingsSchemaRef,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Updated account details',
        content: {
          'application/json': {
            schema: AccountSchemaRef,
          },
        },
      },
      400: {
        description: 'Validation error',
        content: {
          'application/json': {
            schema: ValidationErrorSchemaRef,
          },
        },
      },
      401: {
        description: 'Authentication required',
        content: {
          'application/json': {
            schema: AuthenticationErrorSchemaRef,
          },
        },
      },
      403: {
        description: 'Forbidden',
        content: {
          'application/json': {
            schema: AuthorizationErrorSchemaRef,
          },
        },
      },
      404: {
        description: 'Account not found',
        content: {
          'application/json': {
            schema: NotFoundErrorSchemaRef,
          },
        },
      },
      500: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: InternalServerErrorSchemaRef,
          },
        },
      },
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/bluesky/recent',
    operationId: 'listAccountRecentBlueskyPosts',
    summary: 'Fetch recent Bluesky posts for an account',
    description:
      'Fetches recent Bluesky posts using the stored credentials for the requested account.',
    tags: ['Accounts'],
    security: [{ bearerAuth: [] }],
    parameters: [
      {
        name: 'accountId',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'number' },
      },
    ],
    request: {
      query: BlueskyListQuerySchemaRef,
    },
    responses: {
      200: {
        description: 'Recent Bluesky posts for the account',
        content: {
          'application/json': {
            schema: SocialFeedListSchemaRef,
          },
        },
      },
      400: {
        description: 'Validation error',
        content: {
          'application/json': {
            schema: ValidationErrorSchemaRef,
          },
        },
      },
      401: {
        description: 'Authentication required',
        content: {
          'application/json': {
            schema: AuthenticationErrorSchemaRef,
          },
        },
      },
      403: {
        description: 'Insufficient permissions',
        content: {
          'application/json': {
            schema: AuthorizationErrorSchemaRef,
          },
        },
      },
      404: {
        description: 'Account not found',
        content: {
          'application/json': {
            schema: NotFoundErrorSchemaRef,
          },
        },
      },
      500: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: InternalServerErrorSchemaRef,
          },
        },
      },
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/api/accounts/{accountId}/bluesky/posts',
    operationId: 'postAccountBlueskyUpdate',
    summary: 'Create a Bluesky post for an account',
    description: 'Creates a Bluesky post using the stored credentials for the requested account.',
    tags: ['Accounts'],
    security: [{ bearerAuth: [] }],
    parameters: [
      {
        name: 'accountId',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'number' },
      },
    ],
    request: {
      body: {
        content: {
          'application/json': {
            schema: BlueskyPostCreateSchemaRef,
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Post created successfully',
        content: {
          'application/json': {
            schema: SocialFeedItemSchemaRef,
          },
        },
      },
      400: {
        description: 'Validation error',
        content: {
          'application/json': {
            schema: ValidationErrorSchemaRef,
          },
        },
      },
      401: {
        description: 'Authentication required',
        content: {
          'application/json': {
            schema: AuthenticationErrorSchemaRef,
          },
        },
      },
      403: {
        description: 'Insufficient permissions',
        content: {
          'application/json': {
            schema: AuthorizationErrorSchemaRef,
          },
        },
      },
      404: {
        description: 'Account not found',
        content: {
          'application/json': {
            schema: NotFoundErrorSchemaRef,
          },
        },
      },
      500: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: InternalServerErrorSchemaRef,
          },
        },
      },
    },
  });

  // GET /api/accounts/{accountId}/urls
  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/urls',
    operationId: 'getAccountUrls',
    summary: 'List account URLs',
    description: 'Retrieve all configured URLs for the specified account.',
    tags: ['Accounts'],
    security: [{ bearerAuth: [] }],
    parameters: [
      {
        name: 'accountId',
        in: 'path',
        required: true,
        schema: {
          type: 'string',
          format: 'number',
        },
      },
    ],
    responses: {
      200: {
        description: 'Account URLs',
        content: {
          'application/json': {
            schema: AccountUrlSchemaRef.array(),
          },
        },
      },
      401: {
        description: 'Authentication required',
        content: {
          'application/json': {
            schema: AuthenticationErrorSchemaRef,
          },
        },
      },
      403: {
        description: 'Forbidden',
        content: {
          'application/json': {
            schema: AuthorizationErrorSchemaRef,
          },
        },
      },
      404: {
        description: 'Account not found',
        content: {
          'application/json': {
            schema: NotFoundErrorSchemaRef,
          },
        },
      },
      500: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: InternalServerErrorSchemaRef,
          },
        },
      },
    },
  });

  // POST /api/accounts/{accountId}/urls
  registry.registerPath({
    method: 'post',
    path: '/api/accounts/{accountId}/urls',
    operationId: 'createAccountUrl',
    summary: 'Create account URL',
    description: 'Add a new URL to the specified account.',
    tags: ['Accounts'],
    security: [{ bearerAuth: [] }],
    parameters: [
      {
        name: 'accountId',
        in: 'path',
        required: true,
        schema: {
          type: 'string',
          format: 'number',
        },
      },
    ],
    request: {
      body: {
        content: {
          'application/json': {
            schema: CreateAccountUrlSchemaRef,
          },
        },
      },
    },
    responses: {
      201: {
        description: 'URL created',
        content: {
          'application/json': {
            schema: AccountUrlSchemaRef,
          },
        },
      },
      400: {
        description: 'Validation error',
        content: {
          'application/json': {
            schema: ValidationErrorSchemaRef,
          },
        },
      },
      401: {
        description: 'Authentication required',
        content: {
          'application/json': {
            schema: AuthenticationErrorSchemaRef,
          },
        },
      },
      403: {
        description: 'Forbidden',
        content: {
          'application/json': {
            schema: AuthorizationErrorSchemaRef,
          },
        },
      },
      404: {
        description: 'Account not found',
        content: {
          'application/json': {
            schema: NotFoundErrorSchemaRef,
          },
        },
      },
      409: {
        description: 'URL already exists for this account',
        content: {
          'application/json': {
            schema: ConflictErrorSchemaRef,
          },
        },
      },
      500: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: InternalServerErrorSchemaRef,
          },
        },
      },
    },
  });

  // PUT /api/accounts/{accountId}/urls/{urlId}
  registry.registerPath({
    method: 'put',
    path: '/api/accounts/{accountId}/urls/{urlId}',
    operationId: 'updateAccountUrl',
    summary: 'Update account URL',
    description: 'Update an existing account URL.',
    tags: ['Accounts'],
    security: [{ bearerAuth: [] }],
    parameters: [
      {
        name: 'accountId',
        in: 'path',
        required: true,
        schema: {
          type: 'string',
          format: 'number',
        },
      },
      {
        name: 'urlId',
        in: 'path',
        required: true,
        schema: {
          type: 'string',
          format: 'number',
        },
      },
    ],
    request: {
      body: {
        content: {
          'application/json': {
            schema: CreateAccountUrlSchemaRef,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Updated account URL',
        content: {
          'application/json': {
            schema: AccountUrlSchemaRef,
          },
        },
      },
      400: {
        description: 'Validation error',
        content: {
          'application/json': {
            schema: ValidationErrorSchemaRef,
          },
        },
      },
      401: {
        description: 'Authentication required',
        content: {
          'application/json': {
            schema: AuthenticationErrorSchemaRef,
          },
        },
      },
      403: {
        description: 'Forbidden',
        content: {
          'application/json': {
            schema: AuthorizationErrorSchemaRef,
          },
        },
      },
      404: {
        description: 'Account or URL not found',
        content: {
          'application/json': {
            schema: NotFoundErrorSchemaRef,
          },
        },
      },
      409: {
        description: 'URL already exists for this account',
        content: {
          'application/json': {
            schema: ConflictErrorSchemaRef,
          },
        },
      },
      500: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: InternalServerErrorSchemaRef,
          },
        },
      },
    },
  });

  // DELETE /api/accounts/{accountId}/urls/{urlId}
  registry.registerPath({
    method: 'delete',
    path: '/api/accounts/{accountId}/urls/{urlId}',
    operationId: 'deleteAccountUrl',
    summary: 'Delete account URL',
    description: 'Remove a URL from the specified account.',
    tags: ['Accounts'],
    security: [{ bearerAuth: [] }],
    parameters: [
      {
        name: 'accountId',
        in: 'path',
        required: true,
        schema: {
          type: 'string',
          format: 'number',
        },
      },
      {
        name: 'urlId',
        in: 'path',
        required: true,
        schema: {
          type: 'string',
          format: 'number',
        },
      },
    ],
    responses: {
      204: {
        description: 'URL deleted',
      },
      401: {
        description: 'Authentication required',
        content: {
          'application/json': {
            schema: AuthenticationErrorSchemaRef,
          },
        },
      },
      403: {
        description: 'Forbidden',
        content: {
          'application/json': {
            schema: AuthorizationErrorSchemaRef,
          },
        },
      },
      404: {
        description: 'Account or URL not found',
        content: {
          'application/json': {
            schema: NotFoundErrorSchemaRef,
          },
        },
      },
      500: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: InternalServerErrorSchemaRef,
          },
        },
      },
    },
  });

  // GET /api/accounts/my-accounts
  registry.registerPath({
    method: 'get',
    path: '/api/accounts/my-accounts',
    operationId: 'getMyAccounts',
    summary: "Get the authenticated user's accounts",
    description: 'Returns the accounts associated with the logged-in user via account membership.',
    tags: ['Accounts'],
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: 'Accounts accessible to the authenticated user',
        content: {
          'application/json': {
            schema: AccountSchemaRef.array(),
          },
        },
      },
      401: {
        description: 'Authentication required',
        content: {
          'application/json': {
            schema: AuthenticationErrorSchemaRef,
          },
        },
      },
      500: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: InternalServerErrorSchemaRef,
          },
        },
      },
    },
  });

  // GET /api/accounts/managed
  registry.registerPath({
    method: 'get',
    path: '/api/accounts/managed',
    operationId: 'getManagedAccounts',
    summary: 'Get accounts managed by the authenticated user',
    description:
      'Returns accounts where the user holds AccountAdmin privileges or is a global Administrator.',
    tags: ['Accounts'],
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: 'Accounts managed by the authenticated user',
        content: {
          'application/json': {
            schema: AccountSchemaRef.array(),
          },
        },
      },
      401: {
        description: 'Authentication required',
        content: {
          'application/json': {
            schema: AuthenticationErrorSchemaRef,
          },
        },
      },
      500: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: InternalServerErrorSchemaRef,
          },
        },
      },
    },
  });

  /**
   * GET /api/accounts/:accountId/automatic-role-holders
   * Get automatic role holders (Account Owner and Team Managers) for the current season
   */
  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/automatic-role-holders',
    description:
      'Get automatic role holders (Account Owner and Team Managers) for the current season',
    operationId: 'getAutomaticRoleHolders',
    security: [{ bearerAuth: [] }],
    tags: ['Accounts'],
    parameters: [
      {
        name: 'accountId',
        in: 'path',
        required: true,
        schema: {
          type: 'string',
          format: 'number',
        },
      },
    ],
    responses: {
      200: {
        description: 'List of automatic role holders',
        content: {
          'application/json': {
            schema: AutomaticRoleHoldersSchemaRef,
          },
        },
      },
      404: {
        description: 'Account not found',
        content: {
          'application/json': {
            schema: NotFoundErrorSchemaRef,
          },
        },
      },
    },
  });

  /**
   * GET /api/accounts/:accountId/user-teams
   * Get teams the current user belongs to for the given account
   */
  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/user-teams',
    description: 'Get teams that the authenticated user is associated with for this account.',
    operationId: 'getAccountUserTeams',
    security: [{ bearerAuth: [] }],
    tags: ['Accounts'],
    parameters: [
      {
        name: 'accountId',
        in: 'path',
        required: true,
        schema: {
          type: 'string',
          format: 'number',
        },
      },
    ],
    responses: {
      200: {
        description: 'Teams for the authenticated user within the account',
        content: {
          'application/json': {
            schema: TeamSeasonSchemaRef.array(),
          },
        },
      },
      401: {
        description: 'Authentication required',
        content: {
          'application/json': {
            schema: AuthenticationErrorSchemaRef,
          },
        },
      },
      403: {
        description: 'Access denied for this account',
        content: {
          'application/json': {
            schema: AuthorizationErrorSchemaRef,
          },
        },
      },
      404: {
        description: 'Current season or user teams not found',
        content: {
          'application/json': {
            schema: NotFoundErrorSchemaRef,
          },
        },
      },
      500: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: InternalServerErrorSchemaRef,
          },
        },
      },
    },
  });

  /**
   * DELETE /api/accounts/:accountId/teams/:teamId
   * Delete a team definition when it is no longer used.
   */
  registry.registerPath({
    method: 'delete',
    path: '/api/accounts/{accountId}/teams/{teamId}',
    operationId: 'deleteAccountTeam',
    summary: 'Delete team definition',
    description: 'Deletes a team definition when it is no longer associated with any seasons.',
    tags: ['Accounts'],
    security: [{ bearerAuth: [] }],
    parameters: [
      {
        name: 'accountId',
        in: 'path',
        required: true,
        schema: {
          type: 'string',
          format: 'number',
        },
      },
      {
        name: 'teamId',
        in: 'path',
        required: true,
        schema: {
          type: 'string',
          format: 'number',
        },
      },
    ],
    responses: {
      204: {
        description: 'Team definition deleted',
      },
      401: {
        description: 'Authentication required',
        content: {
          'application/json': {
            schema: AuthenticationErrorSchemaRef,
          },
        },
      },
      403: {
        description: 'Account administrator role required',
        content: {
          'application/json': {
            schema: AuthorizationErrorSchemaRef,
          },
        },
      },
      404: {
        description: 'Team not found for the account',
        content: {
          'application/json': {
            schema: NotFoundErrorSchemaRef,
          },
        },
      },
      409: {
        description: 'Team is still assigned to one or more seasons',
        content: {
          'application/json': {
            schema: ConflictErrorSchemaRef,
          },
        },
      },
      500: {
        description: 'Unexpected server error while deleting the team',
        content: {
          'application/json': {
            schema: InternalServerErrorSchemaRef,
          },
        },
      },
    },
  });

  /**
   * GET /api/accounts/:accountId/fields
   * List fields for an account (public)
   */
  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/fields',
    description: 'List fields configured for the account. This endpoint is public.',
    operationId: 'listAccountFields',
    tags: ['Accounts'],
    parameters: [
      {
        name: 'accountId',
        in: 'path',
        required: true,
        schema: {
          type: 'string',
          format: 'number',
        },
      },
    ],
    request: {
      query: PagingSchemaRef,
    },
    responses: {
      200: {
        description: 'Paginated list of fields for the account',
        content: {
          'application/json': {
            schema: FieldsSchemaRef,
          },
        },
      },
      400: {
        description: 'Invalid paging parameters',
        content: {
          'application/json': {
            schema: ValidationErrorSchemaRef,
          },
        },
      },
      500: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: InternalServerErrorSchemaRef,
          },
        },
      },
    },
  });

  /**
   * POST /api/accounts/:accountId/fields
   * Create a new field for an account
   */
  registry.registerPath({
    method: 'post',
    path: '/api/accounts/{accountId}/fields',
    description: 'Create a new field for the account.',
    operationId: 'createAccountField',
    security: [{ bearerAuth: [] }],
    tags: ['Accounts'],
    parameters: [
      {
        name: 'accountId',
        in: 'path',
        required: true,
        schema: {
          type: 'string',
          format: 'number',
        },
      },
    ],
    request: {
      body: {
        content: {
          'application/json': {
            schema: UpsertFieldSchemaRef,
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Field created successfully',
        content: {
          'application/json': {
            schema: FieldSchemaRef,
          },
        },
      },
      400: {
        description: 'Validation error creating the field',
        content: {
          'application/json': {
            schema: ValidationErrorSchemaRef,
          },
        },
      },
      401: {
        description: 'Authentication required',
        content: {
          'application/json': {
            schema: AuthenticationErrorSchemaRef,
          },
        },
      },
      403: {
        description: 'Permission denied to manage fields for this account',
        content: {
          'application/json': {
            schema: AuthorizationErrorSchemaRef,
          },
        },
      },
      500: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: InternalServerErrorSchemaRef,
          },
        },
      },
    },
  });

  /**
   * PUT /api/accounts/:accountId/fields/:fieldId
   * Update a field for the account
   */
  registry.registerPath({
    method: 'put',
    path: '/api/accounts/{accountId}/fields/{fieldId}',
    description: 'Update an existing field for the account.',
    operationId: 'updateAccountField',
    security: [{ bearerAuth: [] }],
    tags: ['Accounts'],
    parameters: [
      {
        name: 'accountId',
        in: 'path',
        required: true,
        schema: {
          type: 'string',
          format: 'number',
        },
      },
      {
        name: 'fieldId',
        in: 'path',
        required: true,
        schema: {
          type: 'string',
          format: 'number',
        },
      },
    ],
    request: {
      body: {
        content: {
          'application/json': {
            schema: UpsertFieldSchemaRef,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Updated field details',
        content: {
          'application/json': {
            schema: FieldSchemaRef,
          },
        },
      },
      400: {
        description: 'Validation error updating the field',
        content: {
          'application/json': {
            schema: ValidationErrorSchemaRef,
          },
        },
      },
      401: {
        description: 'Authentication required',
        content: {
          'application/json': {
            schema: AuthenticationErrorSchemaRef,
          },
        },
      },
      403: {
        description: 'Permission denied to manage fields for this account',
        content: {
          'application/json': {
            schema: AuthorizationErrorSchemaRef,
          },
        },
      },
      404: {
        description: 'Field not found',
        content: {
          'application/json': {
            schema: NotFoundErrorSchemaRef,
          },
        },
      },
      500: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: InternalServerErrorSchemaRef,
          },
        },
      },
    },
  });

  /**
   * DELETE /api/accounts/:accountId/fields/:fieldId
   * Delete a field for the account
   */
  registry.registerPath({
    method: 'delete',
    path: '/api/accounts/{accountId}/fields/{fieldId}',
    description: 'Delete an existing field from the account.',
    operationId: 'deleteAccountField',
    security: [{ bearerAuth: [] }],
    tags: ['Accounts'],
    parameters: [
      {
        name: 'accountId',
        in: 'path',
        required: true,
        schema: {
          type: 'string',
          format: 'number',
        },
      },
      {
        name: 'fieldId',
        in: 'path',
        required: true,
        schema: {
          type: 'string',
          format: 'number',
        },
      },
    ],
    responses: {
      200: {
        description: 'Deleted field details',
        content: {
          'application/json': {
            schema: FieldSchemaRef,
          },
        },
      },
      400: {
        description: 'Cannot delete field due to dependencies',
        content: {
          'application/json': {
            schema: ValidationErrorSchemaRef,
          },
        },
      },
      401: {
        description: 'Authentication required',
        content: {
          'application/json': {
            schema: AuthenticationErrorSchemaRef,
          },
        },
      },
      403: {
        description: 'Permission denied to manage fields for this account',
        content: {
          'application/json': {
            schema: AuthorizationErrorSchemaRef,
          },
        },
      },
      404: {
        description: 'Field not found',
        content: {
          'application/json': {
            schema: NotFoundErrorSchemaRef,
          },
        },
      },
      500: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: InternalServerErrorSchemaRef,
          },
        },
      },
    },
  });

  /**
   * GET /api/accounts/:accountId/umpires
   * List umpires for an account
   */
  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/umpires',
    description: 'List umpires configured for the account.',
    operationId: 'listAccountUmpires',
    security: [{ bearerAuth: [] }],
    tags: ['Accounts'],
    parameters: [
      {
        name: 'accountId',
        in: 'path',
        required: true,
        schema: {
          type: 'string',
          format: 'number',
        },
      },
    ],
    request: {
      query: PagingSchemaRef,
    },
    responses: {
      200: {
        description: 'Paginated list of umpires for the account',
        content: {
          'application/json': {
            schema: UmpiresSchemaRef,
          },
        },
      },
      400: {
        description: 'Invalid paging parameters',
        content: {
          'application/json': {
            schema: ValidationErrorSchemaRef,
          },
        },
      },
      401: {
        description: 'Authentication required',
        content: {
          'application/json': {
            schema: AuthenticationErrorSchemaRef,
          },
        },
      },
      403: {
        description: 'Permission denied to manage umpires for this account',
        content: {
          'application/json': {
            schema: AuthorizationErrorSchemaRef,
          },
        },
      },
      500: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: InternalServerErrorSchemaRef,
          },
        },
      },
    },
  });

  /**
   * POST /api/accounts/:accountId/logo
   *
   * Account logo upload endpoint
   * Accepts a multipart/form-data request with a 'logo' file field.
   * Requires 'account.manage' permission.
   */
  registry.registerPath({
    method: 'post',
    path: '/api/accounts/{accountId}/logo',
    operationId: 'uploadAccountLogo',
    summary: 'Upload account logo',
    description: 'Uploads a logo for the specified account.',
    tags: ['Accounts'],
    security: [{ bearerAuth: [] }],
    parameters: [
      {
        name: 'accountId',
        in: 'path',
        required: true,
        schema: {
          type: 'string',
          format: 'number',
        },
      },
    ],
    requestBody: {
      content: {
        'multipart/form-data': {
          schema: {
            type: 'object',
            properties: {
              logo: {
                type: 'string',
                format: 'binary',
              },
            },
            required: ['logo'],
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Logo uploaded successfully',
        content: {
          'application/json': {
            schema: {
              type: 'string',
              format: 'uri',
            },
          },
        },
      },
      400: {
        description: 'Invalid request',
        content: {
          'application/json': {
            schema: ValidationErrorSchemaRef,
          },
        },
      },
      401: {
        description: 'Authentication required',
        content: {
          'application/json': {
            schema: AuthenticationErrorSchemaRef,
          },
        },
      },
      403: {
        description: 'Permission denied',
        content: {
          'application/json': {
            schema: AuthorizationErrorSchemaRef,
          },
        },
      },
      404: {
        description: 'Account not found',
        content: {
          'application/json': {
            schema: NotFoundErrorSchemaRef,
          },
        },
      },
      500: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: InternalServerErrorSchemaRef,
          },
        },
      },
    },
  });

  /**
   * GET /api/accounts/:accountId/logo
   *
   * Account logo retrieval endpoint
   * Requires 'account.manage' permission.
   */
  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/logo',
    operationId: 'getAccountLogo',
    summary: 'Get account logo',
    description: 'Retrieves the logo for the specified account.',
    tags: ['Accounts'],
    security: [{ bearerAuth: [] }],
    parameters: [
      {
        name: 'accountId',
        in: 'path',
        required: true,
        schema: {
          type: 'string',
          format: 'number',
        },
      },
    ],
    responses: {
      200: {
        description: 'Logo retrieved successfully',
        content: {
          'image/png': {
            schema: {
              type: 'string',
              format: 'binary',
            },
          },
        },
      },
      404: {
        description: 'Account not found',
        content: {
          'application/json': {
            schema: NotFoundErrorSchemaRef,
          },
        },
      },
    },
  });

  /**
   * DELETE /api/accounts/:accountId/logo
   *
   * Account logo deletion endpoint
   * Requires 'account.manage' permission.
   * Note: This action is irreversible. Ensure the user understands the implications of this action.
   */
  registry.registerPath({
    method: 'delete',
    path: '/api/accounts/{accountId}/logo',
    operationId: 'deleteAccountLogo',
    summary: 'Delete account logo',
    description: 'Deletes the logo for the specified account.',
    tags: ['Accounts'],
    security: [{ bearerAuth: [] }],
    parameters: [
      {
        name: 'accountId',
        in: 'path',
        required: true,
        schema: {
          type: 'string',
          format: 'number',
        },
      },
    ],
    responses: {
      204: {
        description: 'Logo deleted successfully',
      },
      404: {
        description: 'Account not found',
        content: {
          'application/json': {
            schema: NotFoundErrorSchemaRef,
          },
        },
      },
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/photo-gallery',
    operationId: 'getAccountPhotoGallery',
    summary: 'Retrieve the account photo gallery',
    description:
      'Returns approved gallery photos for the account along with aggregated album metadata. This endpoint is publicly accessible.',
    tags: ['Photo Gallery'],
    parameters: [
      {
        name: 'accountId',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'number' },
      },
    ],
    request: {
      query: PhotoGalleryQuerySchemaRef,
    },
    responses: {
      200: {
        description: 'Account photo gallery.',
        content: {
          'application/json': { schema: PhotoGalleryListSchemaRef },
        },
      },
      400: {
        description: 'Validation error',
        content: {
          'application/json': { schema: ValidationErrorSchemaRef },
        },
      },
      500: {
        description: 'Unexpected server error while retrieving the gallery.',
        content: {
          'application/json': { schema: InternalServerErrorSchemaRef },
        },
      },
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/api/accounts/{accountId}/photo-submissions',
    operationId: 'createAccountPhotoSubmission',
    summary: 'Submit a photo for account moderation',
    description:
      'Stages an uploaded photo for account-level moderation. Requires an authenticated contact with photo submission permissions.',
    tags: ['Photo Submissions'],
    security: [{ bearerAuth: [] }],
    parameters: [
      {
        name: 'accountId',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'number' },
      },
    ],
    request: {
      body: {
        content: {
          'multipart/form-data': {
            schema: CreatePhotoSubmissionFormSchemaRef,
            encoding: {
              photo: { contentType: 'image/*' },
            },
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Photo submission created.',
        content: {
          'application/json': { schema: PhotoSubmissionSchemaRef },
        },
      },
      400: {
        description: 'Validation error',
        content: {
          'application/json': { schema: ValidationErrorSchemaRef },
        },
      },
      401: { description: 'Authentication required.' },
      403: { description: 'Insufficient permissions to submit photos.' },
      500: {
        description: 'Unexpected server error while staging the submission.',
        content: {
          'application/json': { schema: InternalServerErrorSchemaRef },
        },
      },
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/photo-submissions/pending',
    operationId: 'listPendingAccountPhotoSubmissions',
    summary: 'List pending account photo submissions',
    description: 'Retrieves photo submissions awaiting moderation for the specified account.',
    tags: ['Photo Submissions'],
    security: [{ bearerAuth: [] }],
    parameters: [
      {
        name: 'accountId',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'number' },
      },
    ],
    responses: {
      200: {
        description: 'Pending photo submissions.',
        content: {
          'application/json': { schema: PhotoSubmissionListSchemaRef },
        },
      },
      401: { description: 'Authentication required.' },
      403: { description: 'Insufficient permissions to review photo submissions.' },
      500: {
        description: 'Unexpected server error while retrieving submissions.',
        content: {
          'application/json': { schema: InternalServerErrorSchemaRef },
        },
      },
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/api/accounts/{accountId}/photo-submissions/{submissionId}/approve',
    operationId: 'approveAccountPhotoSubmission',
    summary: 'Approve an account photo submission',
    description: 'Promotes a pending photo submission into the gallery and removes staged assets.',
    tags: ['Photo Submissions'],
    security: [{ bearerAuth: [] }],
    parameters: [
      {
        name: 'accountId',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'number' },
      },
      {
        name: 'submissionId',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'number' },
      },
    ],
    responses: {
      200: {
        description: 'Submission approved.',
        content: {
          'application/json': { schema: PhotoSubmissionDetailSchemaRef },
        },
      },
      400: {
        description: 'Validation error',
        content: {
          'application/json': { schema: ValidationErrorSchemaRef },
        },
      },
      401: { description: 'Authentication required.' },
      403: { description: 'Insufficient permissions to moderate photo submissions.' },
      404: {
        description: 'Submission not found.',
        content: {
          'application/json': { schema: NotFoundErrorSchemaRef },
        },
      },
      500: {
        description: 'Unexpected server error while approving the submission.',
        content: {
          'application/json': { schema: InternalServerErrorSchemaRef },
        },
      },
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/api/accounts/{accountId}/photo-submissions/{submissionId}/deny',
    operationId: 'denyAccountPhotoSubmission',
    summary: 'Deny an account photo submission',
    description: 'Denies a pending photo submission and removes any staged assets.',
    tags: ['Photo Submissions'],
    security: [{ bearerAuth: [] }],
    parameters: [
      {
        name: 'accountId',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'number' },
      },
      {
        name: 'submissionId',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'number' },
      },
    ],
    request: {
      body: {
        content: {
          'application/json': {
            schema: DenyPhotoSubmissionRequestSchemaRef,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Submission denied.',
        content: {
          'application/json': { schema: PhotoSubmissionDetailSchemaRef },
        },
      },
      400: {
        description: 'Validation error',
        content: {
          'application/json': { schema: ValidationErrorSchemaRef },
        },
      },
      401: { description: 'Authentication required.' },
      403: { description: 'Insufficient permissions to moderate photo submissions.' },
      404: {
        description: 'Submission not found.',
        content: {
          'application/json': { schema: NotFoundErrorSchemaRef },
        },
      },
      500: {
        description: 'Unexpected server error while denying the submission.',
        content: {
          'application/json': { schema: InternalServerErrorSchemaRef },
        },
      },
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/settings',
    operationId: 'getAccountSettings',
    summary: 'List account feature settings',
    description: 'Returns metadata and current values for account-level feature toggles.',
    tags: ['Accounts'],
    security: [{ bearerAuth: [] }],
    parameters: [
      {
        name: 'accountId',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'number' },
      },
    ],
    responses: {
      200: {
        description: 'Account settings with metadata.',
        content: {
          'application/json': { schema: AccountSettingsStateListSchemaRef },
        },
      },
      401: {
        description: 'Authentication required.',
        content: {
          'application/json': { schema: AuthenticationErrorSchemaRef },
        },
      },
      403: {
        description: 'Insufficient permissions to manage account settings.',
        content: {
          'application/json': { schema: AuthorizationErrorSchemaRef },
        },
      },
      404: {
        description: 'Account not found.',
        content: {
          'application/json': { schema: NotFoundErrorSchemaRef },
        },
      },
      500: {
        description: 'Unexpected server error while retrieving account settings.',
        content: {
          'application/json': { schema: InternalServerErrorSchemaRef },
        },
      },
    },
  });

  registry.registerPath({
    method: 'put',
    path: '/api/accounts/{accountId}/settings/{settingKey}',
    operationId: 'updateAccountSetting',
    summary: 'Update an account feature setting',
    description:
      'Updates a single account-level feature toggle and returns the refreshed settings payload.',
    tags: ['Accounts'],
    security: [{ bearerAuth: [] }],
    parameters: [
      {
        name: 'accountId',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'number' },
      },
      {
        name: 'settingKey',
        in: 'path',
        required: true,
        schema: {
          type: 'string',
          enum: [...ACCOUNT_SETTING_KEYS],
        },
      },
    ],
    request: {
      body: {
        content: {
          'application/json': {
            schema: AccountSettingUpdateRequestSchemaRef,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Updated setting state.',
        content: {
          'application/json': { schema: AccountSettingStateSchemaRef },
        },
      },
      400: {
        description: 'Validation error.',
        content: {
          'application/json': { schema: ValidationErrorSchemaRef },
        },
      },
      401: {
        description: 'Authentication required.',
        content: {
          'application/json': { schema: AuthenticationErrorSchemaRef },
        },
      },
      403: {
        description: 'Insufficient permissions to manage account settings.',
        content: {
          'application/json': { schema: AuthorizationErrorSchemaRef },
        },
      },
      404: {
        description: 'Account or setting not found.',
        content: {
          'application/json': { schema: NotFoundErrorSchemaRef },
        },
      },
      409: {
        description: 'Conflicting requirements prevent enabling the setting.',
        content: {
          'application/json': { schema: ConflictErrorSchemaRef },
        },
      },
      500: {
        description: 'Unexpected server error while updating the setting.',
        content: {
          'application/json': { schema: InternalServerErrorSchemaRef },
        },
      },
    },
  });

  // Discord integration endpoints
  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/discord/config',
    operationId: 'getAccountDiscordConfig',
    summary: 'Get Discord configuration for an account',
    description: 'Returns the saved Discord guild configuration for the specified account.',
    tags: ['Discord'],
    security: [{ bearerAuth: [] }],
    parameters: [
      {
        name: 'accountId',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'number' },
      },
    ],
    responses: {
      200: {
        description: 'Discord configuration for the account.',
        content: { 'application/json': { schema: DiscordAccountConfigSchemaRef } },
      },
      401: { description: 'Authentication required.' },
      403: { description: 'Insufficient permissions to manage Discord settings.' },
      404: {
        description: 'Account not found.',
        content: { 'application/json': { schema: NotFoundErrorSchemaRef } },
      },
    },
  });

  registry.registerPath({
    method: 'put',
    path: '/api/accounts/{accountId}/discord/config',
    operationId: 'updateAccountDiscordConfig',
    summary: 'Update Discord configuration for an account',
    description: 'Creates or updates the Discord guild metadata for the specified account.',
    tags: ['Discord'],
    security: [{ bearerAuth: [] }],
    parameters: [
      {
        name: 'accountId',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'number' },
      },
    ],
    request: {
      body: {
        required: true,
        content: {
          'application/json': { schema: DiscordAccountConfigUpdateSchemaRef },
        },
      },
    },
    responses: {
      200: {
        description: 'Updated Discord configuration.',
        content: { 'application/json': { schema: DiscordAccountConfigSchemaRef } },
      },
      400: {
        description: 'Validation error',
        content: { 'application/json': { schema: ValidationErrorSchemaRef } },
      },
      401: { description: 'Authentication required.' },
      403: { description: 'Insufficient permissions to manage Discord settings.' },
      404: {
        description: 'Account not found.',
        content: { 'application/json': { schema: NotFoundErrorSchemaRef } },
      },
    },
  });

  registry.registerPath({
    method: 'delete',
    path: '/api/accounts/{accountId}/discord/config',
    operationId: 'deleteAccountDiscordConfig',
    summary: 'Remove Discord configuration for an account',
    description: 'Disconnects the configured Discord guild and clears related mappings.',
    tags: ['Discord'],
    security: [{ bearerAuth: [] }],
    parameters: [
      {
        name: 'accountId',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'number' },
      },
    ],
    responses: {
      200: {
        description: 'Updated Discord configuration after removal.',
        content: { 'application/json': { schema: DiscordAccountConfigSchemaRef } },
      },
      401: { description: 'Authentication required.' },
      403: { description: 'Insufficient permissions to manage Discord settings.' },
      404: {
        description: 'Account not found.',
        content: { 'application/json': { schema: NotFoundErrorSchemaRef } },
      },
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/discord/link-status',
    operationId: 'getAccountDiscordLinkStatus',
    summary: 'Get the authenticated contact’s Discord link status',
    description: 'Returns whether the current user has linked their Discord identity.',
    tags: ['Discord'],
    security: [{ bearerAuth: [] }],
    parameters: [
      {
        name: 'accountId',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'number' },
      },
    ],
    responses: {
      200: {
        description: 'Link status for the authenticated user.',
        content: { 'application/json': { schema: DiscordLinkStatusSchemaRef } },
      },
      401: { description: 'Authentication required.' },
      403: { description: 'Account access denied.' },
      404: {
        description: 'Account not found.',
        content: { 'application/json': { schema: NotFoundErrorSchemaRef } },
      },
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/api/accounts/{accountId}/discord/link/start',
    operationId: 'startAccountDiscordLink',
    summary: 'Begin the Discord user linking flow',
    description: 'Starts the OAuth flow for the current user to link their Discord account.',
    tags: ['Discord'],
    security: [{ bearerAuth: [] }],
    parameters: [
      {
        name: 'accountId',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'number' },
      },
    ],
    responses: {
      201: {
        description: 'OAuth start payload for the linking flow.',
        content: { 'application/json': { schema: DiscordOAuthStartResponseSchemaRef } },
      },
      401: { description: 'Authentication required.' },
      403: { description: 'Account access denied.' },
      404: {
        description: 'Account not found.',
        content: { 'application/json': { schema: NotFoundErrorSchemaRef } },
      },
    },
  });

  registry.registerPath({
    method: 'delete',
    path: '/api/accounts/{accountId}/discord/link',
    operationId: 'deleteAccountDiscordLink',
    summary: 'Unlink the authenticated contact’s Discord account',
    description: 'Removes the stored Discord tokens for the current user.',
    tags: ['Discord'],
    security: [{ bearerAuth: [] }],
    parameters: [
      {
        name: 'accountId',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'number' },
      },
    ],
    responses: {
      200: {
        description: 'Updated link status after unlinking.',
        content: { 'application/json': { schema: DiscordLinkStatusSchemaRef } },
      },
      401: { description: 'Authentication required.' },
      403: { description: 'Account access denied.' },
      404: {
        description: 'Account not found.',
        content: { 'application/json': { schema: NotFoundErrorSchemaRef } },
      },
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/api/accounts/{accountId}/discord/install/start',
    operationId: 'startAccountDiscordInstall',
    summary: 'Begin the Discord bot installation flow',
    description: 'Starts the OAuth flow to install the Draco Discord bot for an account.',
    tags: ['Discord'],
    security: [{ bearerAuth: [] }],
    parameters: [
      {
        name: 'accountId',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'number' },
      },
    ],
    responses: {
      201: {
        description: 'OAuth start payload for installing the Discord bot.',
        content: { 'application/json': { schema: DiscordOAuthStartResponseSchemaRef } },
      },
      401: { description: 'Authentication required.' },
      403: { description: 'Insufficient permissions to manage Discord settings.' },
      404: {
        description: 'Account not found.',
        content: { 'application/json': { schema: NotFoundErrorSchemaRef } },
      },
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/discord/role-mappings',
    operationId: 'listAccountDiscordRoleMappings',
    summary: 'List Discord role mappings for an account',
    description: 'Returns the configured Discord role-to-permission mappings for the account.',
    tags: ['Discord'],
    security: [{ bearerAuth: [] }],
    parameters: [
      {
        name: 'accountId',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'number' },
      },
    ],
    responses: {
      200: {
        description: 'Discord role mappings.',
        content: { 'application/json': { schema: DiscordRoleMappingListSchemaRef } },
      },
      401: { description: 'Authentication required.' },
      403: { description: 'Insufficient permissions to manage Discord settings.' },
      404: {
        description: 'Account not found.',
        content: { 'application/json': { schema: NotFoundErrorSchemaRef } },
      },
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/api/accounts/{accountId}/discord/role-mappings',
    operationId: 'createAccountDiscordRoleMapping',
    summary: 'Create a Discord role mapping',
    description: 'Adds a new Discord role mapping for the specified account.',
    tags: ['Discord'],
    security: [{ bearerAuth: [] }],
    parameters: [
      {
        name: 'accountId',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'number' },
      },
    ],
    request: {
      body: {
        required: true,
        content: { 'application/json': { schema: DiscordRoleMappingUpdateSchemaRef } },
      },
    },
    responses: {
      201: {
        description: 'Created Discord role mapping.',
        content: { 'application/json': { schema: DiscordRoleMappingSchemaRef } },
      },
      400: {
        description: 'Validation error.',
        content: { 'application/json': { schema: ValidationErrorSchemaRef } },
      },
      401: { description: 'Authentication required.' },
      403: { description: 'Insufficient permissions to manage Discord settings.' },
      404: {
        description: 'Account not found.',
        content: { 'application/json': { schema: NotFoundErrorSchemaRef } },
      },
      409: {
        description: 'Conflict error.',
        content: { 'application/json': { schema: ConflictErrorSchemaRef } },
      },
    },
  });

  registry.registerPath({
    method: 'put',
    path: '/api/accounts/{accountId}/discord/role-mappings/{roleMappingId}',
    operationId: 'updateAccountDiscordRoleMapping',
    summary: 'Update a Discord role mapping',
    description: 'Updates an existing Discord role mapping for the specified account.',
    tags: ['Discord'],
    security: [{ bearerAuth: [] }],
    parameters: [
      {
        name: 'accountId',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'number' },
      },
      {
        name: 'roleMappingId',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'number' },
      },
    ],
    request: {
      body: {
        required: true,
        content: { 'application/json': { schema: DiscordRoleMappingUpdateSchemaRef } },
      },
    },
    responses: {
      200: {
        description: 'Updated Discord role mapping.',
        content: { 'application/json': { schema: DiscordRoleMappingSchemaRef } },
      },
      400: {
        description: 'Validation error.',
        content: { 'application/json': { schema: ValidationErrorSchemaRef } },
      },
      401: { description: 'Authentication required.' },
      403: { description: 'Insufficient permissions to manage Discord settings.' },
      404: {
        description: 'Account or role mapping not found.',
        content: { 'application/json': { schema: NotFoundErrorSchemaRef } },
      },
      409: {
        description: 'Conflict error.',
        content: { 'application/json': { schema: ConflictErrorSchemaRef } },
      },
    },
  });

  registry.registerPath({
    method: 'delete',
    path: '/api/accounts/{accountId}/discord/role-mappings/{roleMappingId}',
    operationId: 'deleteAccountDiscordRoleMapping',
    summary: 'Delete a Discord role mapping',
    description: 'Removes a Discord role mapping from the specified account.',
    tags: ['Discord'],
    security: [{ bearerAuth: [] }],
    parameters: [
      {
        name: 'accountId',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'number' },
      },
      {
        name: 'roleMappingId',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'number' },
      },
    ],
    responses: {
      204: { description: 'Role mapping deleted.' },
      401: { description: 'Authentication required.' },
      403: { description: 'Insufficient permissions to manage Discord settings.' },
      404: {
        description: 'Account or role mapping not found.',
        content: { 'application/json': { schema: NotFoundErrorSchemaRef } },
      },
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/discord/channel-mappings',
    operationId: 'listAccountDiscordChannelMappings',
    summary: 'List Discord channel mappings for an account',
    description: 'Returns the Discord channel ingestion mappings configured for the account.',
    tags: ['Discord'],
    security: [{ bearerAuth: [] }],
    parameters: [
      {
        name: 'accountId',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'number' },
      },
    ],
    responses: {
      200: {
        description: 'Discord channel mappings.',
        content: { 'application/json': { schema: DiscordChannelMappingListSchemaRef } },
      },
      401: { description: 'Authentication required.' },
      403: { description: 'Insufficient permissions to manage Discord settings.' },
      404: {
        description: 'Account not found.',
        content: { 'application/json': { schema: NotFoundErrorSchemaRef } },
      },
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/api/accounts/{accountId}/discord/channel-mappings',
    operationId: 'createAccountDiscordChannelMapping',
    summary: 'Create a Discord channel mapping',
    description: 'Creates a new Discord channel ingestion mapping.',
    tags: ['Discord'],
    security: [{ bearerAuth: [] }],
    parameters: [
      {
        name: 'accountId',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'number' },
      },
    ],
    request: {
      body: {
        required: true,
        content: { 'application/json': { schema: DiscordChannelMappingCreateSchemaRef } },
      },
    },
    responses: {
      201: {
        description: 'Created Discord channel mapping.',
        content: { 'application/json': { schema: DiscordChannelMappingSchemaRef } },
      },
      400: {
        description: 'Validation error.',
        content: { 'application/json': { schema: ValidationErrorSchemaRef } },
      },
      401: { description: 'Authentication required.' },
      403: { description: 'Insufficient permissions to manage Discord settings.' },
      404: {
        description: 'Account not found.',
        content: { 'application/json': { schema: NotFoundErrorSchemaRef } },
      },
      409: {
        description: 'Conflict error.',
        content: { 'application/json': { schema: ConflictErrorSchemaRef } },
      },
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/discord/team-forums',
    operationId: 'listAccountDiscordTeamForums',
    summary: 'List Discord team forums for the current season',
    description: 'Returns metadata about the Discord forums provisioned for each team season.',
    tags: ['Discord'],
    security: [{ bearerAuth: [] }],
    parameters: [
      {
        name: 'accountId',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'number' },
      },
    ],
    request: {
      query: DiscordTeamForumQuerySchemaRef,
    },
    responses: {
      200: {
        description: 'Discord team forums.',
        content: { 'application/json': { schema: DiscordTeamForumListSchemaRef } },
      },
      401: { description: 'Authentication required.' },
      403: { description: 'Insufficient permissions to manage Discord settings.' },
      404: {
        description: 'Account not found.',
        content: { 'application/json': { schema: NotFoundErrorSchemaRef } },
      },
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/api/accounts/{accountId}/discord/team-forums/repair',
    operationId: 'repairAccountDiscordTeamForums',
    summary: 'Repair Discord team forums',
    description:
      'Triggers synchronization of Discord forums for every team season, recreating missing channels or mappings as needed.',
    tags: ['Discord'],
    security: [{ bearerAuth: [] }],
    parameters: [
      {
        name: 'accountId',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'number' },
      },
    ],
    responses: {
      200: {
        description: 'Repair summary.',
        content: {
          'application/json': { schema: DiscordTeamForumRepairResultSchemaRef },
        },
      },
      401: { description: 'Authentication required.' },
      403: { description: 'Insufficient permissions to manage Discord settings.' },
      404: {
        description: 'Account not found.',
        content: { 'application/json': { schema: NotFoundErrorSchemaRef } },
      },
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/api/accounts/{accountId}/discord/team-forums/remove-team',
    operationId: 'removeAccountDiscordTeamForum',
    summary: 'Remove a Discord team forum',
    description:
      'Deletes the Discord team forum channel and revokes memberships for the specified team in the current season.',
    tags: ['Discord'],
    security: [{ bearerAuth: [] }],
    parameters: [
      {
        name: 'accountId',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'number' },
      },
    ],
    request: {
      body: {
        content: {
          'application/json': { schema: DiscordTeamForumRemoveRequestSchemaRef },
        },
      },
    },
    responses: {
      200: {
        description: 'Removal completed.',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: { message: { type: 'string' } },
            },
          },
        },
      },
      401: { description: 'Authentication required.' },
      403: { description: 'Insufficient permissions to manage Discord settings.' },
      404: {
        description: 'Account or team forum not found.',
        content: { 'application/json': { schema: NotFoundErrorSchemaRef } },
      },
    },
  });

  registry.registerPath({
    method: 'delete',
    path: '/api/accounts/{accountId}/discord/channel-mappings/{mappingId}',
    operationId: 'deleteAccountDiscordChannelMapping',
    summary: 'Delete a Discord channel mapping',
    description: 'Removes a Discord channel ingestion mapping.',
    tags: ['Discord'],
    security: [{ bearerAuth: [] }],
    parameters: [
      {
        name: 'accountId',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'number' },
      },
      {
        name: 'mappingId',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'number' },
      },
    ],
    responses: {
      204: { description: 'Channel mapping deleted.' },
      401: { description: 'Authentication required.' },
      403: { description: 'Insufficient permissions to manage Discord settings.' },
      404: {
        description: 'Account or channel mapping not found.',
        content: { 'application/json': { schema: NotFoundErrorSchemaRef } },
      },
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/discord/available-channels',
    operationId: 'listAccountDiscordAvailableChannels',
    summary: 'List channels available within the configured Discord guild',
    description: 'Returns text and announcement channels exposed by the Draco bot.',
    tags: ['Discord'],
    security: [{ bearerAuth: [] }],
    parameters: [
      {
        name: 'accountId',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'number' },
      },
    ],
    responses: {
      200: {
        description: 'Discord channels in the guild.',
        content: { 'application/json': { schema: DiscordGuildChannelSchemaRef.array() } },
      },
      401: { description: 'Authentication required.' },
      403: { description: 'Account access denied.' },
      404: {
        description: 'Account not found.',
        content: { 'application/json': { schema: NotFoundErrorSchemaRef } },
      },
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/api/accounts/{accountId}/discord/feature-sync/{feature}',
    operationId: 'getAccountDiscordFeatureSync',
    summary: 'Get Discord sync settings for a feature',
    description: 'Returns the sync status for a feature such as announcements.',
    tags: ['Discord'],
    security: [{ bearerAuth: [] }],
    parameters: [
      {
        name: 'accountId',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'number' },
      },
      {
        name: 'feature',
        in: 'path',
        required: true,
        schema: {
          type: 'string',
          enum: DiscordFeatureSyncFeatureEnum.options,
        },
      },
    ],
    responses: {
      200: {
        description: 'Discord sync status for the feature.',
        content: { 'application/json': { schema: DiscordFeatureSyncStatusSchemaRef } },
      },
      401: { description: 'Authentication required.' },
      403: { description: 'Insufficient permissions to manage Discord communications.' },
      404: {
        description: 'Account not found.',
        content: { 'application/json': { schema: NotFoundErrorSchemaRef } },
      },
    },
  });

  registry.registerPath({
    method: 'put',
    path: '/api/accounts/{accountId}/discord/feature-sync/{feature}',
    operationId: 'updateAccountDiscordFeatureSync',
    summary: 'Update Discord sync settings for a feature',
    description: 'Enables or disables Discord syncing for a supported feature.',
    tags: ['Discord'],
    security: [{ bearerAuth: [] }],
    parameters: [
      {
        name: 'accountId',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'number' },
      },
      {
        name: 'feature',
        in: 'path',
        required: true,
        schema: {
          type: 'string',
          enum: DiscordFeatureSyncFeatureEnum.options,
        },
      },
    ],
    request: {
      body: {
        required: true,
        content: { 'application/json': { schema: DiscordFeatureSyncUpdateSchemaRef } },
      },
    },
    responses: {
      200: {
        description: 'Updated Discord sync status.',
        content: { 'application/json': { schema: DiscordFeatureSyncStatusSchemaRef } },
      },
      400: {
        description: 'Validation error.',
        content: { 'application/json': { schema: ValidationErrorSchemaRef } },
      },
      401: { description: 'Authentication required.' },
      403: { description: 'Insufficient permissions to manage Discord communications.' },
      404: {
        description: 'Account not found.',
        content: { 'application/json': { schema: NotFoundErrorSchemaRef } },
      },
    },
  });
};

export default registerAccountsEndpoints;
