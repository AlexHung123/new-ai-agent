import { z } from 'zod';
import {
  MAX_ATTACHED_IMAGES,
  acceptsImageAttachments,
  isChatImageAttachment,
} from './attachedImages';

const messageSchema = z.object({
  messageId: z.string().min(1, 'Message ID is required'),
  chatId: z.string().min(1, 'Chat ID is required'),
  content: z.string(),
});

const chatImageSchema = z.object({
  type: z.literal('image'),
  data: z.string(),
  mimeType: z.string(),
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
  wcmsContentId: z.union([z.number().int(), z.string()]).nullish(),
  wcmsPageIndex: z.union([z.number().int(), z.string()]).nullish(),
  wcmsLang: z.string().nullish(),
  itmsOrigin: z.string().nullish(),
  html: z.string().optional(),
  htmlReady: z.boolean().optional(),
  knowledgeFolder: z.string().optional(),
  images: z.array(chatImageSchema).max(MAX_ATTACHED_IMAGES).optional(),
}).superRefine((body, ctx) => {
  const images = body.images ?? [];
  for (let index = 0; index < images.length; index += 1) {
    if (!isChatImageAttachment(images[index])) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['images', index],
        message:
          'Each image must be valid base64 image data of 10MB or smaller',
      });
    }
  }
  const hasText = body.message.content.trim().length > 0;
  const hasImages =
    acceptsImageAttachments(body.focusMode) &&
    images.length > 0 &&
    images.every(isChatImageAttachment);
  if (!hasText && !hasImages) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['message', 'content'],
      message: 'Message content is required',
    });
  }
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
