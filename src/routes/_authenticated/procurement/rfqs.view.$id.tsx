import { createFileRoute } from '@tanstack/react-router'
import { RFQViewPage } from '@/modules/procurement'

export const Route = createFileRoute('/_authenticated/procurement/rfqs/view/$id')({
  component: RFQViewPage,
})
