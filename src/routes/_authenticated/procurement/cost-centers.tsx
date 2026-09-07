import { createFileRoute } from '@tanstack/react-router'
import { CostCenterListPage } from '@/modules/procurement'

export const Route = createFileRoute('/_authenticated/procurement/cost-centers')({
  component: CostCenterListPage,
})
