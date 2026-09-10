import { createFileRoute } from '@tanstack/react-router'
import { RFQListPage } from '@/modules/procurement'

export const Route = createFileRoute('/_authenticated/procurement/rfqs/')({
  component: RFQListPage,
})
