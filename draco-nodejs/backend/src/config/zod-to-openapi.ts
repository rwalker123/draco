import { OpenAPIRegistry, OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';
import { UserSchema, CreateUserSchema } from '@draco/shared-schemas';

const registry = new OpenAPIRegistry();

const UserSchemaRef = registry.register('User', UserSchema);
const CreateUserSchemaRef = registry.register('CreateUser', CreateUserSchema);
registry.registerComponent('securitySchemes', 'bearerAuth', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
});

// GET
registry.registerPath({
  method: 'get',
  path: '/api/users/{id}',
  description: 'Retrieve a user by their unique ID',
  summary: 'Get a user by ID',
  tags: ['Users'],
  parameters: [
    {
      name: 'id',
      in: 'path',
      required: true,
      schema: {
        type: 'string',
        format: 'uuid',
      },
    },
  ],
  responses: {
    200: {
      description: 'User found',
      content: {
        'application/json': {
          schema: UserSchemaRef,
        },
      },
    },
  },
});

// POST
registry.registerPath({
  method: 'post',
  path: '/api/users',
  description: 'Create a new user in the system',
  summary: 'Create a new user',
  security: [{ bearerAuth: [] }],
  tags: ['Users'],
  request: {
    body: {
      content: {
        'application/json': {
          schema: CreateUserSchemaRef,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'User created',
      content: {
        'application/json': {
          schema: UserSchemaRef,
        },
      },
    },
  },
});

const generator = new OpenApiGeneratorV3(registry.definitions);

export const openApiDoc = generator.generateDocument({
  openapi: '3.0.0',
  info: {
    title: 'Draco API',
    version: '1.0.0',
  },
  servers: [
    {
      url: 'https://localhost:3001',
    },
  ],
});
