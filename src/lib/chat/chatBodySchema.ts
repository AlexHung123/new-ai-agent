import { z } from 'zod';

const messageSchema = z.object({
  messageId: z.string().min(1, 'Message ID is required'),
  chatId: z.string().min(1, 'Chat ID is required'),
  content: z.string().min(1, 'Message content is required'),
});

export const chatBodySchema = z.object({
  message: messageSchema,
  userId: z.string().optional(),
  optimizationMode: z.enum(['speed', 'balanced', 'quality'], {
    errorMap: () => ({
      message: 'Optimization mode must be one of: speed, balanced, quality',
    }),
  }),
  focusMode: z.string().min(1, 'Focus mode is required'),
  history: z
    .array(
      z.tuple([z.string(), z.string()], {
        errorMap: () => ({
          message: 'History items must be tuples of two strings',
        }),
      }),
    )
    .optional()
    .default([]),
  systemInstructions: z.string().nullable().optional().default(''),
  sfcExactMatch: z.boolean().optional(),
  sfcTrainingRelated: z.boolean().optional(),
  documentId: z.string().nullish(),
});

export type ChatBody = z.infer<typeof chatBodySchema>;

export function parseChatBody(data: unknown) {
  const result = chatBodySchema.safeParse(data);

  if (!result.success) {
    return {
      success: false as const,
      error: result.error.errors.map((e) => ({
        path: e.path.join('.'),
        message: e.message,
      })),
    };
  }

  return {
    success: true as const,
    data: result.data,
  };
}
