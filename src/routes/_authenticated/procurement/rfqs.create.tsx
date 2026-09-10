import { createFileRoute } from '@tanstack/react-router'
import { RFQCreatePage } from '@/modules/procurement'

export const Route = createFileRoute('/_authenticated/procurement/rfqs/create')({
  component: RFQCreatePage,
})
