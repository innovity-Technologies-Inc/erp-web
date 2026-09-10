import { createFileRoute } from '@tanstack/react-router'
import { RFQEditPage } from '@/modules/procurement'

export const Route = createFileRoute('/_authenticated/procurement/rfqs/edit/$id')({
  component: RFQEditPage,
})
