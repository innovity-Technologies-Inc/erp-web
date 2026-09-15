import { createFileRoute } from '@tanstack/react-router'
import { GRNListPage } from '@/modules/procurement'

export const Route = createFileRoute('/_authenticated/procurement/grns/')({
  component: GRNListPage,
})
