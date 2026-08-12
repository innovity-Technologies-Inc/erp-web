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

export const currencySchema = z.object({
  currency_name: z.string().min(1, 'Currency Name is required'),
  icon: z.string().min(1, 'Currency Symbol is required'),
})

export type CurrencyFormValues = z.infer<typeof currencySchema>

export const printSettingSchema = z.object({
  header: z.string().min(1, 'Header is required'),
  footer: z.string().min(1, 'Footer is required'),
})

export type PrintSettingFormValues = z.infer<typeof printSettingSchema>

export const emailConfigSchema = z.object({
  protocol: z.string().min(1, 'Protocol is required'),
  smtp_host: z.string().min(1, 'SMTP Host is required'),
  smtp_port: z.any().optional(),
  smtp_user: z.string().min(1, 'Sender Mail is required'),
  smtp_pass: z.string().min(1, 'Password is required'),
  mailtype: z.string().min(1, 'Mail Type is required'),
  isinvoice: z.any().optional(),
  isservice: z.any().optional(),
  isquotation: z.any().optional(),
})

export type EmailConfigFormValues = z.infer<typeof emailConfigSchema>
