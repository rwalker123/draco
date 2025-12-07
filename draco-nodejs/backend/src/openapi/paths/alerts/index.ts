import type { ParameterObject } from 'openapi3-ts/oas30';
import { RegisterContext } from '../../openapiTypes.js';

const PATH_PREFIX = '/api/alerts';

export default ({ registry, schemaRefs }: RegisterContext) => {
  const {
    AlertListSchemaRef,
    AlertSchemaRef,
    UpsertAlertSchemaRef,
    AuthenticationErrorSchemaRef,
    AuthorizationErrorSchemaRef,
    ValidationErrorSchemaRef,
    NotFoundErrorSchemaRef,
    InternalServerErrorSchemaRef,
  } = schemaRefs;

  const alertIdParameter: ParameterObject = {
    name: 'alertId',
    in: 'path' as const,
    required: true,
    schema: { type: 'string', format: 'number' },
  };

  registry.registerPath({
    method: 'get',
    path: PATH_PREFIX,
    summary: 'List active alerts',
    description: 'Public endpoint returning active system alerts for all accounts.',
    operationId: 'listActiveAlerts',
    tags: ['Alerts'],
    responses: {
      200: {
        description: 'Active alerts currently visible to users.',
        content: { 'application/json': { schema: AlertListSchemaRef } },
      },
      500: {
        description: 'Unexpected error while retrieving alerts.',
        content: { 'application/json': { schema: InternalServerErrorSchemaRef } },
      },
    },
  });

  registry.registerPath({
    method: 'get',
    path: `${PATH_PREFIX}/all`,
    summary: 'List all alerts',
    description: 'Administrator-only listing of all alerts, regardless of active status.',
    operationId: 'listAllAlerts',
    tags: ['Alerts'],
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: 'All alerts ordered by recency.',
        content: { 'application/json': { schema: AlertListSchemaRef } },
      },
      401: {
        description: 'Authentication required.',
        content: { 'application/json': { schema: AuthenticationErrorSchemaRef } },
      },
      403: {
        description: 'Administrator role required.',
        content: { 'application/json': { schema: AuthorizationErrorSchemaRef } },
      },
      500: {
        description: 'Unexpected error while retrieving alerts.',
        content: { 'application/json': { schema: InternalServerErrorSchemaRef } },
      },
    },
  });

  registry.registerPath({
    method: 'get',
    path: `${PATH_PREFIX}/{alertId}`,
    summary: 'Get alert by ID',
    description: 'Administrator-only retrieval of a specific alert.',
    operationId: 'getAlert',
    tags: ['Alerts'],
    security: [{ bearerAuth: [] }],
    parameters: [alertIdParameter],
    responses: {
      200: {
        description: 'Alert details.',
        content: { 'application/json': { schema: AlertSchemaRef } },
      },
      401: {
        description: 'Authentication required.',
        content: { 'application/json': { schema: AuthenticationErrorSchemaRef } },
      },
      403: {
        description: 'Administrator role required.',
        content: { 'application/json': { schema: AuthorizationErrorSchemaRef } },
      },
      404: {
        description: 'Alert not found.',
        content: { 'application/json': { schema: NotFoundErrorSchemaRef } },
      },
      500: {
        description: 'Unexpected error while retrieving the alert.',
        content: { 'application/json': { schema: InternalServerErrorSchemaRef } },
      },
    },
  });

  registry.registerPath({
    method: 'post',
    path: PATH_PREFIX,
    summary: 'Create alert',
    description: 'Create a new system-wide alert message. Administrator only.',
    operationId: 'createAlert',
    tags: ['Alerts'],
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: UpsertAlertSchemaRef,
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Alert created successfully.',
        content: { 'application/json': { schema: AlertSchemaRef } },
      },
      400: {
        description: 'Invalid alert payload.',
        content: { 'application/json': { schema: ValidationErrorSchemaRef } },
      },
      401: {
        description: 'Authentication required.',
        content: { 'application/json': { schema: AuthenticationErrorSchemaRef } },
      },
      403: {
        description: 'Administrator role required.',
        content: { 'application/json': { schema: AuthorizationErrorSchemaRef } },
      },
      500: {
        description: 'Unexpected error while creating the alert.',
        content: { 'application/json': { schema: InternalServerErrorSchemaRef } },
      },
    },
  });

  registry.registerPath({
    method: 'put',
    path: `${PATH_PREFIX}/{alertId}`,
    summary: 'Update alert',
    description: 'Update an existing alert message. Administrator only.',
    operationId: 'updateAlert',
    tags: ['Alerts'],
    security: [{ bearerAuth: [] }],
    parameters: [alertIdParameter],
    request: {
      body: {
        content: {
          'application/json': {
            schema: UpsertAlertSchemaRef,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Updated alert details.',
        content: { 'application/json': { schema: AlertSchemaRef } },
      },
      400: {
        description: 'Invalid alert payload.',
        content: { 'application/json': { schema: ValidationErrorSchemaRef } },
      },
      401: {
        description: 'Authentication required.',
        content: { 'application/json': { schema: AuthenticationErrorSchemaRef } },
      },
      403: {
        description: 'Administrator role required.',
        content: { 'application/json': { schema: AuthorizationErrorSchemaRef } },
      },
      404: {
        description: 'Alert not found.',
        content: { 'application/json': { schema: NotFoundErrorSchemaRef } },
      },
      500: {
        description: 'Unexpected error while updating the alert.',
        content: { 'application/json': { schema: InternalServerErrorSchemaRef } },
      },
    },
  });

  registry.registerPath({
    method: 'delete',
    path: `${PATH_PREFIX}/{alertId}`,
    summary: 'Delete alert',
    description: 'Remove an alert. Administrator only.',
    operationId: 'deleteAlert',
    tags: ['Alerts'],
    security: [{ bearerAuth: [] }],
    parameters: [alertIdParameter],
    responses: {
      204: {
        description: 'Alert deleted successfully.',
      },
      401: {
        description: 'Authentication required.',
        content: { 'application/json': { schema: AuthenticationErrorSchemaRef } },
      },
      403: {
        description: 'Administrator role required.',
        content: { 'application/json': { schema: AuthorizationErrorSchemaRef } },
      },
      404: {
        description: 'Alert not found.',
        content: { 'application/json': { schema: NotFoundErrorSchemaRef } },
      },
      500: {
        description: 'Unexpected error while deleting the alert.',
        content: { 'application/json': { schema: InternalServerErrorSchemaRef } },
      },
    },
  });
};
