import { z } from 'zod'

export const designationSchema = z.object({
  designation: z
    .string()
    .min(1, 'Designation name is required')
    .max(100, 'Designation name must not exceed 100 characters'),
  details: z.string().optional().nullable(),
  status: z
    .union([z.number(), z.boolean(), z.string()])
    .transform((val) => {
      if (typeof val === 'boolean') return val ? 1 : 0
      return Number(val)
    })
    .default(1),
})

export type DesignationFormValues = z.infer<typeof designationSchema>
