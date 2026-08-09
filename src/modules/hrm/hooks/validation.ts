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

export const employeeSchema = z.object({
  first_name: z
    .string()
    .min(1, 'First name is required')
    .max(100, 'First name must not exceed 100 characters'),
  last_name: z
    .string()
    .min(1, 'Last name is required')
    .max(100, 'Last name must not exceed 100 characters'),
  designation: z
    .union([z.number(), z.string()])
    .transform((val) => Number(val))
    .refine((val) => !isNaN(val) && val > 0, 'Designation is required'),
  phone: z
    .string()
    .min(1, 'Phone number is required')
    .max(20, 'Phone must not exceed 20 characters'),
  email: z
    .string()
    .min(1, 'Email address is required')
    .email('Invalid email address'),
  rate_type: z
    .union([z.number(), z.string()])
    .transform((val) => (val === '' || val === undefined ? undefined : Number(val)))
    .refine((val) => val !== undefined && !isNaN(val) && val > 0, 'Rate type is required'),
  hrate: z
    .string()
    .min(1, 'Hour rate / salary is required')
    .max(20, 'Hourly rate/salary must not exceed 20 characters'),
  blood_group: z.string().optional().nullable(),
  address_line_1: z.string().optional().nullable(),
  address_line_2: z.string().optional().nullable(),
  country: z.string().min(1, 'Country is required'),
  city: z.string().min(1, 'City is required'),
  zip: z.string().min(1, 'ZIP code is required'),
  image: z.any().optional().nullable(),
})

export type EmployeeFormValues = z.infer<typeof employeeSchema>

export const attendanceSchema = z.object({
  employee_id: z
    .union([z.number(), z.string()])
    .transform((val) => Number(val))
    .refine((val) => !isNaN(val) && val > 0, 'Employee is required'),
  date: z.string().min(1, 'Date is required'),
  sign_in: z.string().min(1, 'Sign in time is required'),
  sign_out: z.string().optional().nullable(),
}).refine((data) => {
  if (data.sign_out && data.sign_in) {
    const start = new Date(data.sign_in).getTime()
    const end = new Date(data.sign_out).getTime()
    return end > start
  }
  return true;
}, {
  message: "Sign Out time must be greater than Sign In time",
  path: ["sign_out"],
})

export type AttendanceFormValues = z.infer<typeof attendanceSchema>

export const salaryAdvanceSchema = z.object({
  employee_id: z
    .union([z.number(), z.string()])
    .transform((val) => Number(val))
    .refine((val) => !isNaN(val) && val > 0, 'Employee is required'),
  amount: z
    .union([z.number(), z.string()])
    .transform((val) => Number(val))
    .refine((val) => !isNaN(val) && val > 0, 'Amount must be a positive number'),
  salary_month: z.string().optional(),
  salary_month_name: z.string().min(1, 'Month is required'),
  salary_month_year: z.string().min(1, 'Year is required'),
})

export type SalaryAdvanceFormValues = z.infer<typeof salaryAdvanceSchema>
