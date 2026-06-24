import { createFileRoute } from '@tanstack/react-router'
import { FinancialYearPage } from '@/modules/account/views/financial-year/FinancialYearPage'

export const Route = createFileRoute('/_authenticated/account/financial-year')({
  component: FinancialYearPage,
})
