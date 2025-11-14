import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
const numericIdentifierSchema = z
  .string()
  .trim()
  .regex(/^\d+$/, 'Value must be a numeric identifier')
  .openapi({ pattern: '^\\d+$', example: '12345' });

extendZodWithOpenApi(z);

export const WELCOME_MESSAGE_CAPTION_MAX_LENGTH = 50;

export const WelcomeMessageScopeSchema = z
  .enum(['account', 'team'])
  .openapi({ description: 'Scope where the welcome message is visible.' });

export const UpsertWelcomeMessageSchema = z
  .object({
    caption: z
      .string()
      .trim()
      .min(1, 'Caption is required')
      .max(
        WELCOME_MESSAGE_CAPTION_MAX_LENGTH,
        `Caption must be ${WELCOME_MESSAGE_CAPTION_MAX_LENGTH} characters or fewer`,
      ),
    order: z.number().int('Order must be an integer').min(0, 'Order must be zero or greater'),
    bodyHtml: z.string().trim().min(1, 'Body content is required'),
  })
  .openapi({
    title: 'UpsertWelcomeMessage',
    description: 'Payload to create or update a welcome information card.',
  });

export const WelcomeMessageSchema = UpsertWelcomeMessageSchema.extend({
  id: numericIdentifierSchema,
  accountId: numericIdentifierSchema,
  teamId: numericIdentifierSchema.optional(),
  isTeamScoped: z.boolean().openapi({
    description: 'Indicates whether the welcome message is scoped to a specific team.',
  }),
  scope: WelcomeMessageScopeSchema,
}).openapi({
  title: 'WelcomeMessage',
  description: 'Welcome information card for an account or team.',
});

export const WelcomeMessageListSchema = z
  .object({
    welcomeMessages: WelcomeMessageSchema.array(),
  })
  .openapi({
    title: 'WelcomeMessageList',
    description: 'Collection wrapper for welcome information cards.',
  });

export type UpsertWelcomeMessageType = z.infer<typeof UpsertWelcomeMessageSchema>;
export type WelcomeMessageType = z.infer<typeof WelcomeMessageSchema>;
export type WelcomeMessageListType = z.infer<typeof WelcomeMessageListSchema>;
