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

export const userSchema = z.object({
  first_name: z.string().min(1, 'First name is required').max(255),
  last_name: z.string().min(1, 'Last name is required').max(255),
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  mobile: z.string().min(1, 'Phone number is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip_code: z.string().optional(),
  user_type: z.string().min(1, 'User type is required'),
  is_demo_user: z.number().optional().default(0),
  organization_id: z.any().optional(),
  company_id: z.any().optional(),
  roles: z.array(z.any()).min(1, 'At least one role must be selected'),
  image: z.any().optional(),
})

export type UserFormValues = z.infer<typeof userSchema>
