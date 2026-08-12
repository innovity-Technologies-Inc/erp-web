import { z } from 'zod'

export const organizationSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(1, 'Phone is required'),
  address: z.string().min(1, 'Address is required'),
  expire_at: z.string().nullable().optional().or(z.literal('')),
  status: z.number().or(z.string()).transform((val) => Number(val)),
})

export type OrganizationFormValues = z.infer<typeof organizationSchema>
export const companySchema = z.object({
  organization_id: z.any().optional(),
  company_name: z.string().min(1, 'Company Name is required'),
  mobile: z.string().min(1, 'Mobile is required'),
  email: z.string().email('Invalid email address'),
  website: z.string().nullable().optional().or(z.literal('')),
  address: z.string().min(1, 'Address is required'),
  vat_no: z.string().nullable().optional().or(z.literal('')),
  cr_no: z.string().nullable().optional().or(z.literal('')),
  status: z.any().optional(),
})

export type CompanyFormValues = z.infer<typeof companySchema>
