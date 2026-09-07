import { createFileRoute } from '@tanstack/react-router'
import { BudgetCategoryListPage } from '@/modules/procurement'

export const Route = createFileRoute('/_authenticated/procurement/budgets/categories')({
  component: BudgetCategoryListPage,
})
