import { z } from 'zod'

export const termSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  status: z.union([z.number(), z.boolean(), z.string()]).optional().default(1),
})

export type TermFormValues = z.infer<typeof termSchema>

export const contactUsReplySchema = z.object({
  replay_message: z.string().min(1, 'Reply message is required'),
})

export type ContactUsReplyValues = z.infer<typeof contactUsReplySchema>
