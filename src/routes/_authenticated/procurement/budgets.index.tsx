import { createFileRoute } from '@tanstack/react-router'
import { BudgetListPage } from '@/modules/procurement'

export const Route = createFileRoute('/_authenticated/procurement/budgets/')({
  component: BudgetListPage,
})
