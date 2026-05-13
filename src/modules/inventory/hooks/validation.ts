import { z } from 'zod'

export const termSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  status: z.union([z.number(), z.boolean(), z.string()]).optional().default(1),
})

export type TermFormValues = z.infer<typeof termSchema>
