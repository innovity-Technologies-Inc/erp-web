import { createFileRoute } from '@tanstack/react-router'
import { BudgetHeadListPage } from '@/modules/procurement'

export const Route = createFileRoute('/_authenticated/procurement/budgets/heads')({
  component: BudgetHeadListPage,
})
