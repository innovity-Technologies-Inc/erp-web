export interface Designation {
  id: number
  uuid: string
  designation: string
  details: string | null
  status: number // 1 for active, 0 for inactive
  created_at?: string
  updated_at?: string
}

export interface DesignationFilters {
  draw?: number
  start?: number
  length?: number
  search?: { value: string }
  status?: string
  start_date?: string
  end_date?: string
}

export interface CreateDesignationDto {
  designation: string
  details?: string | null
  status?: number
}

export interface UpdateDesignationDto {
  id: number
  designation: string
  details?: string | null
  status?: number
}

export interface Employee {
  id: number
  uuid: string
  name: string
  designation: string
  phone: string
  email: string
  image: string
  created_at: string
}

export interface EmployeeFilters {
  draw?: number
  start?: number
  length?: number
  search?: { value: string }
  start_date?: string
  end_date?: string
}

export interface Attendance {
  id: number
  uuid: string
  employee_name: string
  employee_id: number
  date: string
  sign_in: string
  sign_out: string | null
  stay_time: string | null
}

export interface AttendanceFilters {
  draw?: number
  start?: number
  length?: number
  search?: { value: string }
  employee_id?: string
  fromDate?: string
  toDate?: string
}

export interface CreateAttendanceDto {
  employee_id: string | number
  date: string
  sign_in: string
  sign_out?: string | null
}

export interface UpdateAttendanceDto {
  id: number
  employee_id: string | number
  date: string
  sign_in: string
  sign_out?: string | null
}

export interface SalaryAdvance {
  id: number
  uuid: string
  employee_id: number
  employee_name: string
  amount: number | string
  release_amount: number | string
  salary_month: string
  created_at: string
}

export interface SalaryAdvanceFilters {
  draw?: number
  start?: number
  length?: number
  search?: { value: string }
}

export interface CreateSalaryAdvanceDto {
  employee_id: string | number
  amount: number | string
  salary_month: string
}

export interface UpdateSalaryAdvanceDto {
  id: number
  employee_id: string | number
  amount: number | string
  salary_month: string
}

export interface SalarySheet {
  id: number
  name: string
  gdate: string
  start_date: string
  end_date: string
  approved: number
  approved_date: string | null
  generated_by_name: string | null
  approved_by_name: string | null
}

export interface SalarySheetFilters {
  draw?: number
  start?: number
  length?: number
  search?: { value: string }
  month?: string
  start_date?: string
  end_date?: string
}

export interface GenerateSalarySheetDto {
  name: string
}

export interface SalaryChartItem {
  id: number
  employee_name: string
  basic: number
  total_benefit: number
  transport: number
  gross_salary: number
  income_tax: number
  soc_sec_npf_tax: number
  employer_contribution: number
  loan_deduct: number
  salary_advance: number
  total_deductions: number
  net_salary: number
}

export interface SalaryChartResponse {
  status: boolean
  sheet: {
    id: number
    name: string
    gdate: string
    start_date: string
    end_date: string
    approved: number
    approved_date: string | null
    generated_by_name: string | null
    approved_by_name: string | null
  }
  charts: SalaryChartItem[]
  setting: {
    logo: string
    currency: string
  }
  company: {
    company_name: string
    address: string
    mobile: string
    email: string
  }
}

export interface SalaryApprovalSummary {
  gross_salary: number
  net_salary: number
  loans: number
  salary_advance: number
  state_income_tax: number
  employee_npf_contribution: number
  employer_npf_contribution: number
  icf_amount: number
  total_npf_contribution: number
}

export interface AccountOption {
  value: string
  label: string
}

export interface SalaryApprovalInfoResponse {
  status: boolean
  sheet: {
    id: number
    name: string
    approved: number
    approved_date: string | null
    approved_by_name: string | null
  }
  currency: string
  summary: SalaryApprovalSummary
  payment_natures: AccountOption[]
  bank_payment_natures: AccountOption[]
}

export interface ApproveSalaryDto {
  ssg_id: number
  payment_nature: string
  amount: number
  tax_payment_nature?: string
  tax_amount?: number
  npf_payment_nature?: string
  npf_amount?: number
  iicf_payment_nature?: string
  iicf_amount?: number
  net_renumeration: number
  employee_npf_contribution: number
  employer_npf_contribution: number
  icf_amount: number
  state_income_tax: number
  month_year: string
}
