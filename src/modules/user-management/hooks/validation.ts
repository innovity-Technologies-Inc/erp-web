import { z } from 'zod'

export const roleSchema = z.object({
  name: z.string()
    .min(1, 'Role name is required')
    .max(100, 'Role name must be 100 characters or less'),
  organization_id: z.any().optional(),
  company_id: z.any().optional(),
  permissions: z.array(z.number())
    .min(1, 'Please select at least one permission'),
})

export type RoleFormValues = z.infer<typeof roleSchema>
