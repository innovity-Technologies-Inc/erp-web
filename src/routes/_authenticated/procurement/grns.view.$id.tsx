import { createFileRoute } from '@tanstack/react-router'
import { GRNViewPage } from '@/modules/procurement'

export const Route = createFileRoute('/_authenticated/procurement/grns/view/$id')({
  component: GRNViewPage,
})
