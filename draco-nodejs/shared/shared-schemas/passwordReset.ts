import { z } from 'zod';
import { SignInUserNameSchema } from './contact.js';

export const PasswordResetRequestSchema = z.object({
  email: SignInUserNameSchema,
  accountId: z.string().trim().optional(),
});

export type PasswordResetRequestType = z.infer<typeof PasswordResetRequestSchema>;
