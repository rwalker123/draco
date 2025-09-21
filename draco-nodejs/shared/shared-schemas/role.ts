import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);

export const BaseRoleSchema = z.object({
  roleId: z.string().trim().max(50),
  roleName: z.string().trim().max(50).optional(),
});

export const RoleSchema = BaseRoleSchema.extend({
  roleData: z.bigint().transform((val) => val.toString()),
  contextName: z.string().trim().max(50).optional(),
});

export const RoleCheckResultSchema = z.object({
  accountId: z.bigint().transform((val) => val.toString()),
  userId: z.string().trim().max(50),
  roleId: z.string().trim().max(50),
  hasRole: z.boolean(),
  roleLevel: z.string().trim().max(50).optional(),
  context: z
    .bigint()
    .transform((val) => val.toString())
    .optional(),
});

// Contact roles sub-interface for reusability
export const ContactRoleSchema = RoleSchema.extend({
  id: z.bigint().transform((val) => val.toString()),
});

export type RoleType = z.infer<typeof RoleSchema>;
export type BaseRoleType = z.infer<typeof BaseRoleSchema>;
export type RoleCheckResultType = z.infer<typeof RoleCheckResultSchema>;
