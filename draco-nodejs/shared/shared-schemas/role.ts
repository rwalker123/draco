import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { bigintToStringSchema, nameSchema } from './standardSchema.js';

extendZodWithOpenApi(z);

export const BaseRoleSchema = z.object({
  roleId: z.string().trim().max(50),
  roleName: nameSchema.optional(),
});

export const RoleSchema = BaseRoleSchema.extend({
  roleData: bigintToStringSchema,
  contextName: z.string().trim().max(50).optional(),
});

export const RoleCheckSchema = z.object({
  userId: z.string().trim().max(50),
  roleId: z.string().trim().max(50),
  hasRole: z.boolean(),
  roleLevel: z.string().trim().max(50).optional(),
  context: bigintToStringSchema.optional(),
});

// Contact roles sub-interface for reusability
export const ContactRoleSchema = RoleSchema.extend({
  id: bigintToStringSchema,
});

export const RoleMetadataSchema = z.object({
  version: z.string().trim().max(20),
  timestamp: z.string().trim().max(50).nullable(),
  hierarchy: z.record(z.string(), z.array(z.string())),
  permissions: z.record(
    z.string(),
    z.object({
      roleId: z.string(),
      permissions: z.array(z.string().trim().max(100)),
      context: z.string(),
    }),
  ),
});

export type RoleType = z.infer<typeof RoleSchema>;
export type BaseRoleType = z.infer<typeof BaseRoleSchema>;
export type RoleCheckType = z.infer<typeof RoleCheckSchema>;
export type RoleMetadataSchemaType = z.infer<typeof RoleMetadataSchema>;
