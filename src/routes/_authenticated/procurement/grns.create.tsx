import { createFileRoute } from '@tanstack/react-router'
import { GRNCreatePage } from '@/modules/procurement'

export const Route = createFileRoute('/_authenticated/procurement/grns/create')({
  component: GRNCreatePage,
})
